import { db } from "@/lib/db";
import { tokenize } from "./engine";

/**
 * Phases 3, 4 & 5: Dynamic Vector-RAG Ingestion, Embeddings & Hybrid Search Engine.
 *
 * ARCHITECTURAL SPECIFICATIONS:
 * - Semantic recursive chunker with token-aware sliding window and rule-tag preservation.
 * - Embeddings generated via OpenAI-compatible endpoint (text-embedding-3-small, 1536-dim).
 * - Real API integration with exponential backoff retries and batching.
 * - Strict Rule: Never uses fake, random, or hardcoded embeddings. Missing credentials
 *   are explicitly reported and fall back to BM25 lexical indexing.
 * - Multi-tenant isolation: All queries enforce `orgId` filtering at the SQL/Prisma layer.
 * - Hybrid Retrieval: Combines dense vector similarity with sparse BM25 scores via
 *   Reciprocal Rank Fusion (RRF).
 */

export interface ChunkMetadata {
  chunkIndex: number;
  pageNumber: number;
  text: string;
  ruleTag: string | null;
  keywords: string;
}

export interface ChunkWithEmbedding extends ChunkMetadata {
  embedding: number[] | null;
  embeddingModel: string | null;
  embeddingDim: number | null;
}

export interface SearchResultPassage {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  ruleTag: string | null;
  text: string;
  score: number;
  matchType: "hybrid" | "vector" | "lexical";
}

// ─── Phase 3: Recursive Semantic Chunker ──────────────────────────────────────

export function chunkDocumentPages(
  pages: { pageNumber: number; text: string; headings: string[] }[],
  targetChars = 1400,
  overlapChars = 200
): ChunkMetadata[] {
  const chunks: ChunkMetadata[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    if (!page.text || page.text.trim().length === 0) continue;

    const lines = page.text.split("\n");
    let buffer: string[] = [];
    let currentRuleTag: string | null = null;
    let currentSize = 0;

    const flushBuffer = () => {
      if (buffer.length === 0) return;
      const text = buffer.join("\n").trim();
      if (text.length > 20) {
        chunks.push({
          chunkIndex: chunkIndex++,
          pageNumber: page.pageNumber,
          text,
          ruleTag: currentRuleTag,
          keywords: tokenize(text).join(" "),
        });
      }

      // Overlap sliding window: retain last few lines if within overlap limit
      const lastLine = buffer[buffer.length - 1];
      if (lastLine && lastLine.length < overlapChars) {
        buffer = [lastLine];
        currentSize = lastLine.length;
      } else {
        buffer = [];
        currentSize = 0;
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect explicit rule anchors: e.g. "RULE CLAIM-01:", "VOICE-02 —", "TM-04."
      const tagMatch = trimmed.match(/^(?:RULE\s+)?([A-Z]{2,6}-\d{1,3})\b/);
      if (tagMatch) currentRuleTag = tagMatch[1];

      // Detect section headings to start clean chunks
      if (/^#{1,3}\s/.test(trimmed) || /^(?:SECTION|CHAPTER)\s+\d+/i.test(trimmed)) {
        flushBuffer();
        buffer = [trimmed];
        currentSize = trimmed.length;
        continue;
      }

      if (currentSize + trimmed.length > targetChars) {
        flushBuffer();
      }

      buffer.push(trimmed);
      currentSize += trimmed.length + 1;
    }

    flushBuffer();
  }

  return chunks;
}

// ─── Phase 4: Embedding Provider & Batch Generation ───────────────────────────

export interface EmbeddingConfig {
  provider: "openai" | "gemini";
  apiKey: string;
  baseUrl: string;
  model: string;
  dimensions: number;
}

export function getEmbeddingConfig(): EmbeddingConfig | null {
  const openAiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.EMBEDDING_API_KEY?.trim() ||
    process.env.ZAI_API_KEY?.trim();

  if (openAiKey) {
    const baseUrl =
      process.env.OPENAI_BASE_URL?.trim() ||
      process.env.EMBEDDING_BASE_URL?.trim() ||
      process.env.ZAI_BASE_URL?.trim() ||
      "https://api.openai.com/v1";
    const model = process.env.EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
    const dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS || "1536", 10);
    return { provider: "openai", apiKey: openAiKey, baseUrl, model, dimensions };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: "models/gemini-embedding-001",
      dimensions: 3072,
    };
  }

  return null;
}

/**
 * Generate dimensional embeddings for a batch of text strings.
 * Supports OpenAI text-embedding-3-small (1536-dim) and Google Gemini gemini-embedding-001 (3072-dim).
 * Includes exponential backoff retries and batch chunking (max 32 texts/request).
 * Strict: Never returns fake, random, or mock embeddings.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<{ embeddings: (number[] | null)[]; model: string; dimensions: number } | null> {
  const config = getEmbeddingConfig();
  if (!config) {
    console.warn("Embedding credentials not configured (OPENAI_API_KEY / EMBEDDING_API_KEY / GEMINI_API_KEY absent).");
    return null;
  }

  const batchSize = 32;
  const allEmbeddings: (number[] | null)[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    let attempts = 0;
    let batchSuccess = false;

    while (attempts < 3 && !batchSuccess) {
      attempts++;
      try {
        if (config.provider === "gemini") {
          const endpoint = `${config.baseUrl}/models/gemini-embedding-001:batchEmbedContents?key=${config.apiKey}`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requests: batch.map((t) => ({
                model: "models/gemini-embedding-001",
                content: { parts: [{ text: t.slice(0, 8000) }] },
              })),
            }),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error(`Gemini Embedding API returned status ${res.status}: ${errText}`);
          }

          const data = (await res.json()) as {
            embeddings: { values: number[] }[];
          };

          for (const item of data.embeddings || []) {
            allEmbeddings.push(item.values);
          }
          batchSuccess = true;
        } else {
          const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/embeddings`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model,
              input: batch.map((t) => t.slice(0, 8000)), // Limit individual input tokens
            }),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error(`Embedding API returned status ${res.status}: ${errText}`);
          }

          const data = (await res.json()) as {
            data: { embedding: number[]; index: number }[];
          };

          const sorted = data.data.sort((a, b) => a.index - b.index);
          for (const item of sorted) {
            allEmbeddings.push(item.embedding);
          }
          batchSuccess = true;
        }
      } catch (err) {
        console.error(`Embedding generation attempt ${attempts} failed:`, err);
        if (attempts >= 3) {
          // Push nulls for failed batch rather than crashing
          for (let j = 0; j < batch.length; j++) allEmbeddings.push(null);
        } else {
          // Exponential backoff
          await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 500));
        }
      }
    }
  }

  return {
    embeddings: allEmbeddings,
    model: config.model,
    dimensions: config.dimensions,
  };
}

// ─── Phase 5: Vector Similarity & Hybrid RRF Search ───────────────────────────

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Hybrid Semantic Search over Guideline Knowledge Chunks.
 * Combines dense vector similarity with sparse BM25 lexical ranking
 * using Reciprocal Rank Fusion (RRF).
 */
export async function searchKnowledgeHybrid(params: {
  orgId: string;
  query: string;
  documentId?: string;
  limit?: number;
  minSimilarity?: number;
}): Promise<SearchResultPassage[]> {
  const { orgId, query, documentId, limit = 5, minSimilarity = 0.4 } = params;
  if (!query.trim()) return [];

  // 1. Fetch chunks for the organization (strictly isolated by orgId)
  const chunks = await db.knowledgeChunk.findMany({
    where: {
      orgId,
      ...(documentId ? { documentId } : {}),
    },
    include: {
      document: { select: { title: true, docType: true } },
    },
  });

  if (chunks.length === 0) return [];

  // 2. Generate embedding for query (if provider configured)
  const queryEmbeddingRes = await generateEmbeddings([query]);
  const queryVec = queryEmbeddingRes?.embeddings[0] ?? null;

  // 3. Dense Vector Scoring
  const denseScored: { chunkId: string; score: number }[] = [];
  if (queryVec) {
    for (const c of chunks) {
      if (!c.embedding) continue;
      try {
        const vec = JSON.parse(c.embedding) as number[];
        const sim = cosineSimilarity(queryVec, vec);
        if (sim >= minSimilarity) {
          denseScored.push({ chunkId: c.id, score: sim });
        }
      } catch {
        // Skip unparseable embeddings
      }
    }
  }
  denseScored.sort((a, b) => b.score - a.score);

  // 4. Sparse BM25 Lexical Scoring
  const qTokens = tokenize(query);
  const sparseScored: { chunkId: string; score: number }[] = [];

  if (qTokens.length > 0) {
    const df = new Map<string, number>();
    for (const t of new Set(qTokens)) {
      let count = 0;
      for (const c of chunks) if (c.keywords.includes(t)) count++;
      df.set(t, count);
    }

    for (const c of chunks) {
      const cTokens = c.keywords.split(" ");
      const tf = new Map<string, number>();
      for (const t of cTokens) tf.set(t, (tf.get(t) ?? 0) + 1);

      let score = 0;
      for (const qt of qTokens) {
        const f = tf.get(qt) ?? 0;
        if (f === 0) continue;
        const idf = Math.log(1 + chunks.length / (1 + (df.get(qt) ?? 0)));
        score += idf * (f / (f + 1.2));
      }
      if (score > 0) {
        sparseScored.push({ chunkId: c.id, score });
      }
    }
  }
  sparseScored.sort((a, b) => b.score - a.score);

  // 5. Reciprocal Rank Fusion (RRF: k = 60)
  const rrfMap = new Map<string, { rrf: number; matchType: "hybrid" | "vector" | "lexical" }>();

  denseScored.forEach((item, rank) => {
    const rrfScore = 1 / (60 + rank + 1);
    rrfMap.set(item.chunkId, { rrf: rrfScore, matchType: "vector" });
  });

  sparseScored.forEach((item, rank) => {
    const rrfScore = 1 / (60 + rank + 1);
    const existing = rrfMap.get(item.chunkId);
    if (existing) {
      existing.rrf += rrfScore;
      existing.matchType = "hybrid";
    } else {
      rrfMap.set(item.chunkId, { rrf: rrfScore, matchType: "lexical" });
    }
  });

  const rankedChunkIds = [...rrfMap.entries()]
    .sort((a, b) => b[1].rrf - a[1].rrf)
    .slice(0, limit);

  // 6. Map to Passages
  const chunkMap = new Map(chunks.map((c) => [c.id, c]));
  const results: SearchResultPassage[] = [];

  for (const [id, meta] of rankedChunkIds) {
    const chunk = chunkMap.get(id);
    if (!chunk) continue;

    results.push({
      id: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.document.title,
      pageNumber: chunk.pageNumber,
      ruleTag: chunk.ruleTag,
      text: chunk.text,
      score: +meta.rrf.toFixed(4),
      matchType: meta.matchType,
    });
  }

  return results;
}

