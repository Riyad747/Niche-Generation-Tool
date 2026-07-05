# 02 — Database Design

PostgreSQL + Prisma + **pgvector** (semantic similarity) + **Postgres FTS** (keyword search).

## 1. Entity map (ERD)

```
User ─┬─< Project ─┬─< ResearchSession ─┬─< Niche ──< Niche (self, parent_id)   [niche tree]
      │            │                     │      └─< Opportunity ─┬─< Keyword
      │            │                     │                        ├─< Prompt ──< PromptVariation
      │            │                     │                        ├─< Title
      │            │                     │                        ├─1 ComplianceCheck
      │            │                     │                        └─1 ApprovalPrediction
      │            │                     └─< ImageAnalysis ──< Opportunity (generated)
      │            │
      │            ├─< PortfolioUpload ──< PortfolioAsset ──> Niche (matched)
      │            │                  └─< PortfolioGap
      │            ├─< Watchlist ──< WatchlistSnapshot   [time series of scores]
      │            └─< Report
      │
      ├─< AiUsage        (token/cost ledger)
      └─< UsageQuota     (plan limits & counters)

Trend  (global, shared)  ──< TrendPoint            [time series per term/source]
Taxonomy (global seed niche tree, reusable across users)
```

Legend: `─<` = one-to-many, `─1` = one-to-one, `(self)` = self-referential.

## 2. Design decisions

- **Ownership everywhere.** Every user-scoped table has `userId`; most also carry `projectId`.
  Repositories always filter by `userId` — hard multitenant isolation.
- **Niche is self-referential** (`parentId`) to store the recursive tree; `path` (ltree-style
  materialized string) + `depth` make subtree queries and breadcrumb rendering cheap.
- **Scores are denormalized onto Niche & Opportunity** as `Int` (0–100) columns for fast sort/
  filter, with a JSON `scoreBreakdown` for provenance (inputs, model, cached-signal timestamps).
- **Opportunity is the sellable unit.** A Niche can yield one primary Opportunity plus asset-idea
  Opportunities (PNG/Vector/Illustration). Keywords/prompts/titles hang off Opportunity.
- **pgvector on Niche, Opportunity, ImageAnalysis, PortfolioAsset** (`embedding vector(1536)` for
  `text-embedding-3-large` truncated, or `vector(3072)` full) powers saturation/similarity and
  "find related niches". IVFFlat or HNSW index depending on volume.
- **FTS** via a generated `tsvector` column + GIN index on niche/opportunity text for fast keyword
  lookup that complements semantic search (hybrid retrieval).
- **Time series** (`TrendPoint`, `WatchlistSnapshot`) are append-only; aggregate via SQL windows.
- **Trends & Taxonomy are global** (not per-user) so expensive external signals are fetched once
  and shared, then personalized at scoring time.
- **Enums** for status, platform, tool, risk level, growth state — indexed and type-safe.
- **AI cost ledger** (`AiUsage`) makes per-session and per-user cost/quota auditable.

## 3. Indexing plan

| Table | Index | Reason |
|-------|-------|--------|
| Niche | `(researchSessionId, opportunityScore DESC)` | Ranked tree/list |
| Niche | `(parentId)`, `(path)` | Subtree traversal |
| Niche | GIN on `searchVector` | FTS |
| Niche | IVFFlat/HNSW on `embedding` | Similarity/saturation |
| Opportunity | `(projectId, window, opportunityScore DESC)` | Mode 2 leaderboards |
| Opportunity | `(userId, createdAt DESC)` | History |
| TrendPoint | `(trendId, capturedAt)` | Time-series scans |
| WatchlistSnapshot | `(watchlistId, capturedAt)` | Change detection |
| PortfolioAsset | `(uploadId, nicheId)` | Gap analysis joins |
| AiUsage | `(userId, createdAt)` | Cost reporting |
| All owned tables | `(userId)` | Tenant scoping |

## 4. Score storage convention

Each scored row stores:
- 8 integer sub-scores (`demandScore`, `competitionScore`, `trendScore`, `seasonalityScore`,
  `aiCompatScore`, `vectorCompatScore`, `commercialSafetyScore`, `approvalProbabilityScore`) — 0–100.
- `opportunityScore` (0–100, normalized) — the unified rank key.
- `scoreBreakdown Json` — `{ inputs, weights, signalTimestamps, model, version }` for explainability
  and cache invalidation. Scoring `version` lets us re-score when formulas change.

## 5. pgvector & FTS setup (migration preamble)

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- fuzzy keyword matching
-- tsvector columns are generated in Prisma via Unsupported + raw migration:
-- ALTER TABLE "Niche" ADD COLUMN "searchVector" tsvector
--   GENERATED ALWAYS AS (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))) STORED;
-- CREATE INDEX niche_search_idx ON "Niche" USING GIN ("searchVector");
-- CREATE INDEX niche_embedding_idx ON "Niche" USING hnsw ("embedding" vector_cosine_ops);
```

> Prisma models the vector/tsvector columns as `Unsupported(...)`; the actual DDL for indexes and
> generated columns lives in a hand-written migration (`prisma/migrations/**`). See schema notes.

## 6. Retention & lifecycle

- Research sessions & niches: kept indefinitely (user portfolio memory), soft-deletable.
- Trend snapshots: rolling 24 months, older rows downsampled.
- AI cost ledger: 13 months (billing).
- Uploaded images/CSVs: raw file in object storage (Vercel Blob / S3) with signed URLs; DB stores
  metadata + analysis only.

See [prisma/schema.prisma](../prisma/schema.prisma) for the concrete models.
