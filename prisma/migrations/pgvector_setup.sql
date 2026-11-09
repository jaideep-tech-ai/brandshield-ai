-- ─── Supabase PostgreSQL pgvector Migration ──────────────────────────────────
-- BrandShield AI: Feature 2 - Dynamic Vector-RAG Ingestion Engine
-- Target: Supabase / PostgreSQL with pgvector extension enabled.

-- Step 1: Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add native 1536-dimensional vector column
ALTER TABLE "KnowledgeChunk" 
ADD COLUMN IF NOT EXISTS "embedding_vector" vector(1536);

-- Step 3: Create HNSW index for sub-5ms cosine similarity search
CREATE INDEX IF NOT EXISTS "knowledge_chunk_vector_hnsw_idx" 
ON "KnowledgeChunk" 
USING hnsw ("embedding_vector" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Step 4: Multi-tenant isolated vector search procedure
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
    query_embedding vector(1536),
    match_threshold double precision,
    match_count integer,
    filter_org_id text
)
RETURNS TABLE (
    id text,
    "documentId" text,
    "orgId" text,
    "chunkIndex" integer,
    "pageNumber" integer,
    text text,
    "ruleTag" text,
    keywords text,
    similarity double precision
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc."documentId",
        kc."orgId",
        kc."chunkIndex",
        kc."pageNumber",
        kc.text,
        kc."ruleTag",
        kc.keywords,
        1 - (kc.embedding_vector <=> query_embedding) AS similarity
    FROM "KnowledgeChunk" kc
    WHERE kc."orgId" = filter_org_id
      AND kc.embedding_vector IS NOT NULL
      AND 1 - (kc.embedding_vector <=> query_embedding) > match_threshold
    ORDER BY kc.embedding_vector <=> query_embedding
    LIMIT match_count;
END;
$$;

