import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole, HttpError } from "@/lib/brandshield/server/auth";
import { appendAuditLog, computeSignOffHash } from "@/lib/brandshield/server/engine";
import { jsonError } from "@/lib/brandshield/server/json";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const sub = await db.submission.findUnique({ where: { id } });
    if (!sub || sub.orgId !== user.orgId) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    const { action, note } = (await req.json()) as { action: string; note?: string };

    if (action === "submit_for_review") {
      if (sub.authorId !== user.id && user.role !== "admin") {
        throw new HttpError(403, "Only the author can submit this draft for review");
      }
      if (sub.scanCount === 0) {
        throw new HttpError(400, "Run at least one pre-flight scan before submitting for review");
      }
      const openCritical = await db.finding.count({ where: { submissionId: id, status: "open", severity: "critical" } });
      if (openCritical > 0) {
        throw new HttpError(400, `${openCritical} critical finding(s) must be resolved or justified before review`);
      }
      const updated = await db.submission.update({ where: { id }, data: { status: "in_review" } });
      await appendAuditLog({
        orgId: user.orgId, submissionId: id, actorId: user.id, action: "SUBMITTED_FOR_REVIEW",
        details: { title: sub.title, version: sub.currentVersion, note: note ?? null },
      });
      return NextResponse.json(updated);
    }

    if (action === "request_changes") {
      requireRole(user, "reviewer", "admin");
      if (sub.status !== "in_review") throw new HttpError(400, "Only submissions In Review can receive change requests");
      const updated = await db.submission.update({ where: { id }, data: { status: "changes_requested" } });
      await appendAuditLog({
        orgId: user.orgId, submissionId: id, actorId: user.id, action: "CHANGES_REQUESTED",
        details: { title: sub.title, note: note ?? null },
      });
      return NextResponse.json(updated);
    }

    if (action === "approve") {
      requireRole(user, "reviewer", "admin");
      if (sub.status !== "in_review") throw new HttpError(400, "Only submissions In Review can be approved");
      const now = Date.now();
      const signOffHash = computeSignOffHash(id, sub.content, user.id, now);
      const updated = await db.submission.update({ where: { id }, data: { status: "approved" } });
      // Immutable, hash-chained sign-off + approval entries
      const signOff = await appendAuditLog({
        orgId: user.orgId, submissionId: id, actorId: user.id, action: "SIGN_OFF",
        details: {
          note: note ?? "Final approval granted",
          verifiedContentHash: signOffHash,
          contentVersion: sub.currentVersion,
          reviewer: user.name,
        },
      });
      await appendAuditLog({
        orgId: user.orgId, submissionId: id, actorId: user.id, action: "APPROVAL",
        details: { title: sub.title, note: note ?? null, signOffHash, certificate: true },
      });
      void signOff;
      return NextResponse.json({ ...updated, signOffHash });
    }

    if (action === "reopen") {
      requireRole(user, "reviewer", "admin");
      const updated = await db.submission.update({ where: { id }, data: { status: "draft" } });
      await appendAuditLog({
        orgId: user.orgId, submissionId: id, actorId: user.id, action: "REOPENED",
        details: { title: sub.title, note: note ?? null },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return jsonError(e);
  }
}
