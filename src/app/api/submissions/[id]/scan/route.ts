import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole, requireUser, HttpError } from "@/lib/brandshield/server/auth";
import { runPreFlightInspection, appendAuditLog } from "@/lib/brandshield/server/engine";
import { jsonError } from "@/lib/brandshield/server/json";

// Vercel serverless cap for the Hobby plan is 60s; the full pipeline
// (deterministic stage + grounded LLM + vision) typically finishes in ~15s.
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    requireRole(user, "creator", "contractor", "admin", "reviewer");
    const { id } = await params;
    const sub = await db.submission.findUnique({ where: { id } });
    if (!sub || sub.orgId !== user.orgId) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // ── Quota enforcement (Stripe tier sync)
    const subscription = await db.subscription.findUnique({ where: { orgId: user.orgId } });
    if (subscription && subscription.scanLimit !== -1 && subscription.scansUsed >= subscription.scanLimit) {
      throw new HttpError(
        402,
        `Monthly scan quota reached (${subscription.scanLimit}/${subscription.scanLimit} on the ${subscription.tier} plan). Upgrade to keep scanning.`,
        "QUOTA_EXCEEDED",
        subscription.tier === "starter" ? "growth" : "enterprise"
      );
    }

    // ── Two-Stage Hybrid Inspection Pipeline
    const result = await runPreFlightInspection({
      id: sub.id,
      orgId: sub.orgId,
      contentType: sub.contentType,
      content: sub.content,
      imageData: sub.imageData,
      imagePalette: sub.imagePalette,
    });

    if (subscription && subscription.scanLimit !== -1) {
      await db.subscription.update({
        where: { orgId: user.orgId },
        data: { scansUsed: { increment: 1 } },
      });
    } else if (subscription) {
      await db.subscription.update({
        where: { orgId: user.orgId },
        data: { scansUsed: { increment: 1 } },
      });
    }

    await appendAuditLog({
      orgId: user.orgId,
      submissionId: sub.id,
      actorId: user.id,
      action: "SCAN",
      details: { findings: result.findingsCount, score: result.score, submissionTitle: sub.title },
    });

    const [inspection, submission, visualInspection] = await Promise.all([
      db.inspection.findUnique({ where: { id: result.inspectionId } }),
      db.submission.findUnique({ where: { id: sub.id }, include: { findings: true } }),
      db.visualInspection.findFirst({ where: { submissionId: sub.id }, orderBy: { createdAt: "desc" } }),
    ]);

    return NextResponse.json({
      submission,
      inspection: inspection
        ? { ...inspection, stageA: JSON.parse(inspection.stageA), stageB: JSON.parse(inspection.stageB) }
        : null,
      visualInspection: visualInspection
        ? {
            ...visualInspection,
            dominantPalette: JSON.parse(visualInspection.dominantPalette),
            colorFindings: JSON.parse(visualInspection.colorFindings),
            wcagResults: JSON.parse(visualInspection.wcagResults),
          }
        : null,
    });
  } catch (e) {
    return jsonError(e);
  }
}
