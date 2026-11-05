import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/brandshield/server/auth";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import { jsonError } from "@/lib/brandshield/server/json";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const finding = await db.finding.findUnique({ where: { id }, include: { submission: true } });
    if (!finding || finding.submission.orgId !== user.orgId) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }
    const sub = finding.submission;
    if (sub.authorId !== user.id && user.role !== "admin" && user.role !== "reviewer") {
      throw new HttpError(403, "Only the author or reviewers can resolve findings");
    }
    const { suggestion } = (await req.json()) as { suggestion?: string | null };

    // If a rewrite suggestion is supplied for a text submission, apply it to the copy
    let contentUpdated = false;
    let newContent = sub.content;
    if (suggestion && suggestion.trim() && sub.contentType === "text" && finding.flaggedText && sub.content.includes(finding.flaggedText)) {
      newContent = sub.content.replace(finding.flaggedText, suggestion.trim());
      contentUpdated = true;
    }

    await db.finding.update({
      where: { id },
      data: { status: "resolved", resolvedAt: new Date() },
    });
    if (contentUpdated) {
      const nextVersion = sub.currentVersion + 1;
      await db.submission.update({
        where: { id: sub.id },
        data: { content: newContent, currentVersion: nextVersion, complianceScore: null },
      });
      await db.revision.create({
        data: {
          submissionId: sub.id,
          version: nextVersion,
          content: newContent,
          changeSummary: `Fixed: ${finding.flaggedText.slice(0, 60)}${finding.flaggedText.length > 60 ? "…" : ""}`,
          authorId: user.id,
        },
      });
    }
    await appendAuditLog({
      orgId: user.orgId,
      submissionId: sub.id,
      actorId: user.id,
      action: "FINDING_RESOLVED",
      details: { findingId: id, flagged: finding.flaggedText.slice(0, 80), appliedSuggestion: contentUpdated ? suggestion : null },
    });
    const updatedSubmission = await db.submission.findUnique({ where: { id: sub.id } });
    return NextResponse.json({ ok: true, contentUpdated, submission: updatedSubmission });
  } catch (e) {
    return jsonError(e);
  }
}
