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
    if (finding.submission.authorId !== user.id && user.role !== "admin" && user.role !== "reviewer") {
      throw new HttpError(403, "Only the author or reviewers can override findings");
    }
    const { note } = (await req.json()) as { note?: string };
    if (!note?.trim()) {
      throw new HttpError(400, "A justification note is required to override a flagged violation");
    }
    const updated = await db.finding.update({
      where: { id },
      data: { status: "overridden", overrideNote: note.trim(), resolvedAt: new Date() },
    });
    await appendAuditLog({
      orgId: user.orgId,
      submissionId: finding.submissionId,
      actorId: user.id,
      action: "OVERRIDE",
      details: { findingId: id, flagged: finding.flaggedText.slice(0, 80), justification: note.trim() },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return jsonError(e);
  }
}
