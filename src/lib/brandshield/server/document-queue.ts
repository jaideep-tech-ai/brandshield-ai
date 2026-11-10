import { after } from "next/server";
import { db } from "@/lib/db";
import { parsePdfDocument } from "./pdf-parser";
import { chunkDocumentPages, generateEmbeddings } from "./vector-rag";
import { appendAuditLog } from "./engine";

/**
 * Phase 6: Asynchronous Ingestion & Document Processing Queue.
 *
 * ARCHITECTURAL SPECIFICATIONS:
 * - Decouples lengthy 50+ page PDF extraction and vector embedding generation
 *   from synchronous HTTP request/response loops.
 * - Idempotency & Concurrency: Prevents duplicate workers from processing the same
 *   document simultaneously.
 * - Error Isolation: Corrupted or scanned PDFs update document status to "failed"
 *   with exact diagnostic error messages without crashing the server.
 */

export async function queueDocumentIngestion(
  documentId: string,
  buffer: Buffer
): Promise<void> {
  // Execute asynchronously in background; use Next.js `after` for serverless lifecycle safety
  try {
    after(async () => {
      await processDocumentJob(documentId, buffer);
    });
  } catch {
    // Fallback if called outside a request context (e.g. testing / scripts)
    setImmediate(async () => {
      await processDocumentJob(documentId, buffer);
    });
  }
}

export async function processDocumentJob(
  documentId: string,
  buffer: Buffer
): Promise<{ success: boolean; chunkCount: number; error?: string }> {
  const doc = await db.guidelineDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) {
    console.error(`[DocumentQueue] Document ${documentId} not found.`);
    return { success: false, chunkCount: 0, error: "Document not found." };
  }

  // Idempotency: If already processing within the last 45 seconds, avoid collision
  if (doc.status === "processing" && Date.now() - doc.updatedAt.getTime() < 45000) {
    console.warn(`[DocumentQueue] Document ${documentId} is already processing.`);
    return { success: false, chunkCount: 0, error: "Document is already processing." };
  }

  // Set status to processing
  await db.guidelineDocument.update({
    where: { id: documentId },
    data: { status: "processing", errorMessage: null },
  });

  try {
    // 1. Parse PDF document streams
    const parsed = await parsePdfDocument(buffer);

    // 2. Chunk document pages preserving page numbers & rule anchors
    const rawChunks = chunkDocumentPages(parsed.pages);

    if (rawChunks.length === 0) {
      throw new Error("No readable text chunks could be extracted from this document.");
    }

    // 3. Batch generate 1536-dimensional embeddings
    const textsToEmbed = rawChunks.map((c) => c.text);
    const embeddingResult = await generateEmbeddings(textsToEmbed);

    // 4. Atomic transaction: clear stale chunks & persist new chunks
    await db.$transaction(async (tx) => {
      await tx.knowledgeChunk.deleteMany({
        where: { documentId },
      });

      // Insert chunks in chunks of 50 for database optimization
      for (let i = 0; i < rawChunks.length; i += 50) {
        const batch = rawChunks.slice(i, i + 50);
        await tx.knowledgeChunk.createMany({
          data: batch.map((c, batchIdx) => {
            const overallIdx = i + batchIdx;
            const vec = embeddingResult?.embeddings[overallIdx] ?? null;
            return {
              documentId,
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
        where: { id: documentId },
        data: {
          status: "indexed",
          chunkCount: rawChunks.length,
          pageCount: parsed.totalPages,
          content: parsed.fullText.slice(0, 50000), // Store reference preview
          errorMessage: null,
        },
      });
    });

    await appendAuditLog({
      orgId: doc.orgId,
      submissionId: null,
      actorId: "SYSTEM_RAG_WORKER",
      action: "DOCUMENT_INDEXED",
      details: {
        documentId,
        title: doc.title,
        chunks: rawChunks.length,
        pages: parsed.totalPages,
        hasEmbeddings: embeddingResult !== null,
      },
    });

    console.log(`[DocumentQueue] Successfully indexed ${doc.title} (${rawChunks.length} chunks, ${parsed.totalPages} pages)`);
    return { success: true, chunkCount: rawChunks.length };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[DocumentQueue] Indexing failed for ${doc.title}:`, errorMsg);

    await db.guidelineDocument.update({
      where: { id: documentId },
      data: {
        status: "failed",
        errorMessage: errorMsg,
      },
    });

    await appendAuditLog({
      orgId: doc.orgId,
      submissionId: null,
      actorId: "SYSTEM_RAG_WORKER",
      action: "DOCUMENT_INDEX_FAILED",
      details: { documentId, title: doc.title, error: errorMsg },
    });

    return { success: false, chunkCount: 0, error: errorMsg };
  }
}

