-- Raw DDL Prisma can't express (Unsupported columns, generated tsvector, vector indexes).
-- Apply after `prisma db push` / `migrate deploy`, or paste into the generated migration's
-- migration.sql. Requires the `vector` and `pg_trgm` extensions (declared in schema.prisma).

-- ── Extensions (also declared via datasource.extensions; safe to repeat) ──────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Full-text search: generated tsvector columns + GIN indexes ────────────────
ALTER TABLE "Niche"
  ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) STORED;
CREATE INDEX IF NOT EXISTS niche_search_idx ON "Niche" USING GIN ("searchVector");

ALTER TABLE "Opportunity"
  ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;
CREATE INDEX IF NOT EXISTS opportunity_search_idx ON "Opportunity" USING GIN ("searchVector");

-- ── pgvector similarity indexes (HNSW, cosine). Build after initial bulk load. ─
-- Start with HNSW for good recall at moderate scale; revisit lists/params as rows grow.
CREATE INDEX IF NOT EXISTS niche_embedding_idx
  ON "Niche" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS opportunity_embedding_idx
  ON "Opportunity" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS image_embedding_idx
  ON "ImageAnalysis" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS portfolio_asset_embedding_idx
  ON "PortfolioAsset" USING hnsw ("embedding" vector_cosine_ops);

-- ── Fuzzy keyword matching (trigram) for niche/keyword autocomplete ───────────
CREATE INDEX IF NOT EXISTS niche_name_trgm_idx ON "Niche" USING GIN (name gin_trgm_ops);
