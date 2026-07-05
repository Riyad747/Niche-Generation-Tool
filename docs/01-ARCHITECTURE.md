# 01 — System Architecture

## 1. High-level view

```
                          ┌─────────────────────────────────────────┐
                          │                Browser                    │
                          │  Next.js App Router (RSC + Client)        │
                          │  shadcn/ui · Tailwind · React Query ·     │
                          │  Zustand · Clerk <UserButton>             │
                          └───────────────┬───────────────────────────┘
                                          │ HTTPS (Clerk session JWT)
                          ┌───────────────▼───────────────────────────┐
                          │        Next.js Route Handlers (/api)       │
                          │  - Thin controllers, zod-validated         │
                          │  - Auth guard (Clerk) + rate limit (Redis) │
                          └───────┬───────────────────────┬────────────┘
                                  │                        │
                    ┌─────────────▼─────────┐   ┌──────────▼───────────┐
                    │   Service Layer        │   │  Job Enqueue (Redis) │
                    │  (pure domain logic)   │   │  BullMQ / QStash     │
                    │  engines/, services/   │   └──────────┬───────────┘
                    └───┬─────────┬──────┬───┘              │
                        │         │      │        ┌─────────▼──────────┐
              ┌─────────▼──┐  ┌───▼───┐ ┌▼──────┐ │  Worker (background)│
              │ Prisma /   │  │ Redis │ │ AI     │ │  long research runs │
              │ Postgres   │  │ cache │ │ Clients│ │  trend refresh, etc │
              │ + pgvector │  └───────┘ │ Claude │ └─────────┬──────────┘
              └────────────┘            │ OpenAI │           │
                                        └───┬────┘   ┌───────▼────────┐
                                            │        │ External data  │
                                            └───────▶│ connectors     │
                                                     │ Trends/Stock   │
                                                     └────────────────┘
```

### Why this shape
- **Route Handlers stay thin.** All intelligence lives in `lib/services` and `lib/engines`
  so it is unit-testable without HTTP and reusable by both API routes and background workers.
- **Long work is async.** Deep niche expansion (Mode 1) can fan out hundreds of AI calls.
  A synchronous request would time out on Vercel. We enqueue a job, stream progress, and
  persist partial results so the UI can render as scores arrive.
- **Everything is cached.** External signals (trends, saturation counts) and AI outputs are
  expensive and slow. Redis is the first read; Postgres is the durable store.

---

## 2. Request lifecycle (Mode 1 example)

```
POST /api/research/sessions            → create ResearchSession(status=PENDING), enqueue job, 202
      │
      ▼
Worker picks job
  1. NicheExpansionService.expand(seed)        → build niche tree (Claude, structured JSON)
  2. For each niche (batched, concurrency-capped):
       ScoringService.scoreNiche(niche)        → 8 sub-scores (AI + heuristics + cached signals)
       OpportunityService.compute(scores)       → unified Opportunity Score
  3. Persist niches + opportunities (Prisma, bulk)
  4. Embeddings written to pgvector for similarity/saturation
  5. Update ResearchSession(status=COMPLETE, progress=100)
      │
      ▼
Client polls GET /api/research/sessions/:id (or SSE) → renders tree as it fills
```

Progress is written to Redis (`session:{id}:progress`) on every batch so the poll/stream is O(1).

---

## 3. Layer responsibilities

| Layer | Path | Responsibility | Rules |
|-------|------|----------------|-------|
| **Presentation** | `app/(dashboard)/**` | RSC pages, layouts, streaming UI | No business logic; call services via server actions or fetch |
| **API / Controllers** | `app/api/**/route.ts` | Auth, zod validation, rate-limit, shape response | No DB queries inline; delegate to services |
| **Services** | `lib/services/**` | Orchestrate engines + repositories + AI | Pure-ish; deps injected; fully unit-tested |
| **Engines** | `lib/engines/**` | The 12 scoring/analysis engines | Deterministic core + AI-assisted parts behind an interface |
| **Repositories** | `lib/db/repositories/**` | All Prisma access | Only place that imports the Prisma client |
| **AI clients** | `lib/ai/**` | Claude/OpenAI wrappers, prompt templates, retries, JSON-mode | Model-agnostic interface; token accounting |
| **Connectors** | `lib/connectors/**` | External data (Trends, stock counts, Reddit…) | Rate-limited, cached, mockable in tests |
| **Jobs** | `lib/jobs/**` + `worker/` | Queue definitions & processors | Idempotent, resumable |

**Dependency rule:** presentation → services → (engines, repositories, ai, connectors).
Nothing lower ever imports something higher. Repositories never call services.

---

## 4. Backend architecture

### 4.1 AI abstraction (`lib/ai`)
A single `AiClient` interface so any engine can request completions without knowing the vendor.

```ts
interface AiClient {
  json<T>(opts: { system: string; user: string; schema: ZodType<T>; model?: ModelId }): Promise<T>;
  text(opts: { system: string; user: string; model?: ModelId }): Promise<string>;
  embed(texts: string[]): Promise<number[][]>;
}
```
- **Claude** (`claude-opus-4-8` / `claude-sonnet-5`) → reasoning-heavy tasks: niche expansion,
  compliance judgment, approval prediction, prompt generation.
- **OpenAI** → embeddings (`text-embedding-3-large`) for pgvector + cheap high-volume classification.
- **Router policy:** heavy reasoning → Claude Sonnet 5 by default, Opus 4.8 for the hardest
  expansion/synthesis; bulk/cheap → OpenAI. Configurable per-engine in `lib/ai/model-policy.ts`.
- Every call: zod-validated JSON output, exponential-backoff retry, token + cost logged to `ai_usage`.

### 4.2 Caching strategy (Redis)
| Key pattern | TTL | Purpose |
|-------------|-----|---------|
| `trend:{source}:{term}` | 12–24h | Google/Pinterest trend snapshots |
| `saturation:{platform}:{queryHash}` | 6h | Stock result counts / similarity density |
| `ai:{engine}:{inputHash}` | 7–30d | Memoize deterministic AI outputs |
| `ratelimit:{userId}:{route}` | window | Sliding-window rate limiting |
| `session:{id}:progress` | 1h | Live job progress |

Cache-aside everywhere: read Redis → miss → compute/fetch → write Redis + (if durable) Postgres.

### 4.3 Background jobs
- **Queue:** BullMQ on Redis (self-host worker) **or** Upstash QStash (serverless-friendly on Vercel).
  Default to **QStash** for a pure-Vercel deploy; swap to BullMQ + a small worker service at scale.
- **Job types:** `nicheExpansion`, `imageAnalysis`, `portfolioAnalysis`, `trendRefresh` (cron),
  `saturationRefresh` (cron), `watchlistScan` (cron), `reportGeneration`.
- All jobs are **idempotent** (keyed by session id) and **resumable** (persist partial progress).

### 4.4 Rate limiting & quotas
- Per-user sliding window per route class (research/AI-heavy vs read).
- Plan-based monthly quotas (research sessions, image analyses, AI tokens) enforced in a
  `QuotaService` and surfaced in the UI.

---

## 5. Frontend architecture

### 5.1 Rendering model
- **RSC by default** for data-heavy pages (dashboards, explorers) → fetch on the server, stream.
- **Client components** only for interactivity (filters, charts, drag, chat, uploads).
- **Suspense + streaming** so long research renders progressively.

### 5.2 State
| Concern | Tool |
|---------|------|
| Server/cache state (queries, mutations, polling) | **React Query** |
| Ephemeral UI/global client state (filters, active project, sidebar, chat draft) | **Zustand** |
| Auth/session | **Clerk** |
| URL state (shareable filters, tabs) | `nuqs` / search params |

Rule: server data never lives in Zustand; Zustand holds only UI intent. React Query owns
fetching, caching, polling (for job progress), and optimistic updates.

### 5.3 Component architecture
```
components/
  ui/            # shadcn primitives (button, card, dialog, table…)
  charts/        # Recharts wrappers: TrendLine, SaturationHeatmap, ScoreRadar, OpportunityBar
  scores/        # ScoreBadge, ScoreBar, OpportunityScoreCard, ScoreBreakdown
  niche/         # NicheTree, NicheNode, NicheDetailPanel
  opportunity/   # OpportunityCard, OpportunityTable, OpportunityFilters
  prompt/        # PromptCard, PromptPackList, PromptValidatorResult
  image/         # ImageDropzone, ImageAnalysisReport
  portfolio/     # CsvUploader, GapMatrix, AssetPlanList
  copilot/       # ChatPanel, MessageBubble, ToolCallCard
  layout/        # Sidebar, Topbar, ModeSwitcher, ProjectSwitcher
```
Composition pattern: **primitive (ui) → domain (scores/niche/…) → feature panel → page**.
Domain components are presentational; pages/feature-panels own data fetching.

---

## 6. API architecture (surface)

REST-ish Route Handlers, all under `/api`, all Clerk-guarded & zod-validated.
Full contract in [05-ROADMAP.md](05-ROADMAP.md#api-contract). Summary:

```
Auth (Clerk-managed) ······················ webhook: POST /api/webhooks/clerk

Projects        GET/POST            /api/projects
                GET/PATCH/DELETE     /api/projects/:id

Mode 1 Research POST                 /api/research/sessions           (enqueue)
                GET                  /api/research/sessions/:id       (poll/SSE)
                GET                  /api/research/sessions/:id/niches
                POST                 /api/niches/:id/expand           (recursive expand)

Mode 2 Discover GET                  /api/opportunities?window=day|week|month
                GET                  /api/opportunities/:id

Mode 3 Image    POST                 /api/images/analyze              (multipart → enqueue)
                GET                  /api/images/:id

Mode 4 Portfolio POST                /api/portfolio/uploads           (CSV → enqueue)
                 GET                 /api/portfolio/:id/gaps
                 GET                 /api/portfolio/:id/plan?size=50|100|500

Engines         POST                 /api/prompts/generate
                POST                 /api/prompts/validate
                POST                 /api/keywords/generate
                POST                 /api/titles/generate
                POST                 /api/compliance/check
                POST                 /api/approval/predict

Watchlist       GET/POST             /api/watchlists
                DELETE               /api/watchlists/:id
Reports         GET/POST             /api/reports
                GET                  /api/reports/:id
Copilot         POST                 /api/copilot/chat                (streaming, tool-calling)
```

Conventions: cursor pagination, `?window` enums, `202 + Location` for enqueued work,
consistent error envelope `{ error: { code, message, details } }`.

---

## 7. Cross-cutting concerns

- **Observability:** structured logs (pino), request ids, per-engine timing, AI cost per session.
- **Security:** Clerk auth on every route; per-row ownership checks (`userId`); zod on all input;
  signed upload URLs; no secrets client-side; CSV/image size & type validation.
- **Idempotency & resumability** for all jobs.
- **Feature flags** for engines still being tuned (`lib/flags.ts`).
- **Multitenancy:** every domain row carries `userId` (+ optional `projectId`); repositories
  enforce scoping so a user can never read another's data.

See [02-DATABASE.md](02-DATABASE.md) for the data model and [04-SCORING-ENGINES.md](04-SCORING-ENGINES.md)
for how each engine computes its score.
