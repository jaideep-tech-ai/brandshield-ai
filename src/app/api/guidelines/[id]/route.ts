import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const doc = await db.guidelineDocument.findUnique({
      where: { id },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });
    if (!doc || doc.orgId !== user.orgId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "admin");
    const { id } = await params;
    const doc = await db.guidelineDocument.findUnique({ where: { id } });
    if (!doc || doc.orgId !== user.orgId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    // Delete cascading chunks and guideline document atomically
    await db.$transaction([
      db.knowledgeChunk.deleteMany({ where: { documentId: id } }),
      db.guidelineDocument.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
