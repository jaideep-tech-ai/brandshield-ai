import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireUser, requireRole } from "@/lib/brandshield/server/auth";
import { chunkDocument } from "@/lib/brandshield/server/engine";
import { jsonError } from "@/lib/brandshield/server/json";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const docs = await db.guidelineDocument.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(docs);
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "admin");
    const body = (await req.json()) as { title?: string; docType?: string; content?: string; sourceName?: string };
    if (!body.title?.trim() || !body.content?.trim() || !body.docType) {
      return NextResponse.json({ error: "title, docType and content are required" }, { status: 400 });
    }
    const chunks = chunkDocument(body.content);
    const doc = await db.guidelineDocument.create({
      data: {
        orgId: user.orgId,
        title: body.title.trim(),
        docType: body.docType,
        content: body.content,
        sourceName: body.sourceName ?? null,
        chunkCount: chunks.length,
        chunks: {
          create: chunks.map((c) => ({
            orgId: user.orgId,
            chunkIndex: c.chunkIndex,
            text: c.text,
            ruleTag: c.ruleTag,
            keywords: c.keywords,
          })),
        },
      },
    });
    return NextResponse.json(doc);
  } catch (e) {
    return jsonError(e);
  }
}
