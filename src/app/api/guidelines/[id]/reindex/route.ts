import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { chunkDocumentPages, generateEmbeddings } from "@/lib/brandshield/server/vector-rag";
import { appendAuditLog } from "@/lib/brandshield/server/engine";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "admin");

    const { id } = await params;
    const doc = await db.guidelineDocument.findUnique({
      where: { id },
      include: { chunks: true },
    });

    if (!doc || doc.orgId !== user.orgId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!doc.content || doc.content.trim().length === 0) {
      return NextResponse.json({ error: "Cannot reindex a document with no content" }, { status: 400 });
    }

    // Set status to processing
    await db.guidelineDocument.update({
      where: { id },
      data: { status: "processing", errorMessage: null },
    });

    try {
      // Chunk document text. If pageCount > 1, attempt splitting by common page breaks or chunk linearly
      const pages = [{ pageNumber: 1, text: doc.content, headings: [] }];
      const rawChunks = chunkDocumentPages(pages);

      if (rawChunks.length === 0) {
        throw new Error("No readable text chunks could be produced for this document.");
      }

      const textsToEmbed = rawChunks.map((c) => c.text);
      const embeddingResult = await generateEmbeddings(textsToEmbed);

      await db.$transaction(async (tx) => {
        await tx.knowledgeChunk.deleteMany({
          where: { documentId: id },
        });

        for (let i = 0; i < rawChunks.length; i += 50) {
          const batch = rawChunks.slice(i, i + 50);
          await tx.knowledgeChunk.createMany({
            data: batch.map((c, batchIdx) => {
              const overallIdx = i + batchIdx;
              const vec = embeddingResult?.embeddings[overallIdx] ?? null;
              return {
                documentId: id,
                orgId: doc.orgId,
                chunkIndex: c.chunkIndex,
                pageNumber: c.pageNumber,
                text: c.text,
                ruleTag: c.ruleTag,
                keywords: c.keywords,
                embedding: vec ? JSON.stringify(vec) : null,
                embeddingModel: vec ? embeddingResult?.model : null,
                embeddingDim: vec ? embeddingResult?.dimensions : null,
              };
            }),
          });
        }

        await tx.guidelineDocument.update({
          where: { id },
          data: {
            status: "indexed",
            chunkCount: rawChunks.length,
            errorMessage: null,
          },
        });
      });

      await appendAuditLog({
        orgId: doc.orgId,
        submissionId: null,
        actorId: user.id,
        action: "DOCUMENT_REINDEXED",
        details: {
          documentId: id,
          title: doc.title,
          chunks: rawChunks.length,
          hasEmbeddings: embeddingResult !== null,
        },
      });

      return NextResponse.json({ ok: true, chunkCount: rawChunks.length });
    } catch (reindexErr) {
      const errorMsg = reindexErr instanceof Error ? reindexErr.message : String(reindexErr);
      await db.guidelineDocument.update({
        where: { id },
        data: { status: "failed", errorMessage: errorMsg },
      });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (e) {
    return jsonError(e);
  }
}

