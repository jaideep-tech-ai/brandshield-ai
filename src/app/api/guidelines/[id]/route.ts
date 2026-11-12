import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { POST as handleUpload } from "../upload/route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (id === "upload") {
      return NextResponse.json({
        endpoint: "/api/guidelines/upload",
        methods: ["POST"],
        accepts: "multipart/form-data",
      });
    }

    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "upload") {
    return handleUpload(req);
  }
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
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
