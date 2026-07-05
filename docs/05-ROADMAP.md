# 05 — Roadmap, Implementation Plan, Testing, Deployment, Scaling

## Phased roadmap

Estimates assume 1–2 engineers. Each phase ends shippable.

### Phase 0 — Foundation (week 1)
- Scaffold Next.js + TS + Tailwind + shadcn; `@/*` alias; ESLint/Prettier.
- Prisma + Postgres (Neon/Supabase) + pgvector extension; apply `schema.prisma`; raw migration for
  vector/tsvector indexes; `seed.ts` (taxonomy + demo user).
- Clerk auth + `(auth)` routes + `requireUser()`; Clerk webhook → `User` upsert.
- Redis (Upstash) client; base `AiClient` (Anthropic + OpenAI) with zod JSON mode, retries, cost log.
- App shell: Sidebar, Topbar, ModeSwitcher, ProjectSwitcher; React Query + Zustand providers.
- CI (lint, typecheck, unit tests) on GitHub Actions.
**Exit:** authed empty dashboard, DB migrated, AI client returns a validated JSON completion.

### Phase 1 — Mode 1 Deep Niche Expansion (weeks 2–3) ← core value
- `NicheExpansionService` (Claude structured tree) + recursive expand endpoint.
- Deterministic score cores for AI-Compat, Vectorization, Seasonality, Compliance.
- `ScoringService` + `opportunity-score.ts` unified score; persist niches + breakdowns.
- Job queue (QStash) + `nicheExpansion` processor + progress via Redis; SSE/poll.
- Niche Explorer UI: NicheTree, NicheDetailPanel, ScoreRadar/ScoreBreakdown, ranked table.
- Keyword + Title + Prompt engines wired to niche detail; 50 PNG / 50 Vector / 50 Illustration ideas.
**Exit:** enter "Healthcare" → scored, ranked, expandable tree + generated ideas/keywords/titles.

### Phase 2 — Engines depth + Mode 2 Discovery (weeks 4–5)
- Connectors: Google Trends, Pinterest, Reddit, stock result-count scrapers (cached, rate-limited).
- Trend Engine + Saturation Engine + Market Gap Detector with real signals.
- Approval Predictor + Content Factory Planner.
- Mode 2 Opportunity Explorer: day/week/month leaderboards; cron `trendRefresh`/`saturationRefresh`.
- Prompt Validator + Compliance gating in the pipeline.
**Exit:** "Find Opportunities" returns ranked, windowed, real-signal opportunities.

### Phase 3 — Mode 3 Image + Mode 4 Portfolio (weeks 6–7)
- Vercel Blob uploads (signed); `image-analysis` job (Claude vision) → style/palette/scores.
- Mode 3: 50 niches / 100 prompt variations / 100 keywords / 50 titles + portfolio expansion.
- CSV parser (Adobe/Shutterstock schemas) → `PortfolioAsset` + embeddings.
- Mode 4: gap detection vs portfolio embeddings; Next 50/100/500 plan generator.
**Exit:** upload image → opportunities; upload CSV → gaps + asset plan.

### Phase 4 — Copilot, Watchlist, Reports (week 8)
- Copilot chat (streaming, tool-calling into services); example intents from spec.
- Watchlist + snapshot cron + change detection + alerts.
- Report generator (daily/weekly/monthly/opportunity/trend/portfolio) + export (PDF/CSV).

### Phase 5 — Hardening & launch (week 9+)
- Quotas/billing (Stripe via Clerk), plan gating, observability dashboards, E2E suite,
  perf passes (query/index tuning, cache hit-rate), security review, load test.

---

## Step-by-step task list (Phase 0–1, the buildable core)

1. `pnpm create next-app` (TS, App Router, Tailwind, ESLint); add shadcn, path alias.
2. Add Prisma; paste `schema.prisma`; `prisma db push`; write raw migration for pgvector/tsvector
   indexes; implement Prisma singleton `lib/db/client.ts`.
3. `seed.ts`: insert `Taxonomy` from a starter niche map; a demo `User`/`Project`.
4. Clerk: wrap root layout, add sign-in/up, `middleware.ts`, `requireUser()`, `/api/webhooks/clerk`.
5. Upstash Redis client + cache-aside helper + sliding-window rate limiter.
6. `AiClient` interface; Anthropic + OpenAI impls; `model-policy.ts`; zod JSON helper; `AiUsage` log.
7. Repositories: `nicheRepo`, `opportunityRepo`, `sessionRepo` (only place importing Prisma).
8. Engines (pure cores + tests): `ai-compat`, `vectorization`, `opportunity-score`, `compliance`.
9. `NicheExpansionService`: Claude prompt → validated niche-tree JSON; recursion with depth/breadth
   caps + concurrency limit.
10. `ScoringService.scoreNiche()` → 8 sub-scores + unified score + breakdown; bulk persist.
11. Queue abstraction + `nicheExpansion` processor + progress writes; `/api/jobs/nicheExpansion`.
12. Route handlers: `POST /api/research/sessions` (enqueue 202), `GET /api/research/sessions/:id`,
    `GET .../niches`, `POST /api/niches/:id/expand` — each `requireUser` + zod.
13. React Query hooks: `useCreateResearchSession`, `useResearchSession` (poll), `useNiches`.
14. UI: research input, `NicheTree`, `NicheDetailPanel`, `ScoreRadar`, `ScoreBreakdown`, ranked table,
    progressive rendering with Suspense.
15. Keyword/Title/Prompt engines + endpoints + niche-detail tabs; idea generation (50/50/50).
16. Unit + integration tests for the pipeline; seed a golden "Healthcare" fixture.

---

## API contract (envelope & conventions)
- Auth: Clerk session on every `/api` route; ownership checks in repositories.
- Validation: zod at the route boundary; reject with `422 { error: { code, message, details } }`.
- Async work: `202 { id, status, location }`; client polls `GET :id` or subscribes SSE.
- Pagination: cursor (`?cursor=&limit=`); list responses `{ data, nextCursor }`.
- Errors: consistent `{ error: { code, message, details? } }`; never leak stack traces.
- Rate limits: per-user, per-route-class; `429` with `Retry-After`.

---

## Testing strategy
| Layer | Tool | What |
|-------|------|------|
| Engines (pure) | Vitest | Fixture inputs → expected 0–100 scores; formula regression via snapshots |
| Services | Vitest + stubbed AiClient/connectors | Orchestration, batching, error paths, idempotency |
| Repositories/API | Vitest + ephemeral Postgres (Testcontainers/Neon branch) | Ownership scoping, pagination, validation |
| AI prompts | Golden-file evals | Structured-output conformance & drift checks on model upgrades |
| E2E | Playwright | Each mode's happy path: seed → research → scored tree → ideas |
| Load | k6 | Discovery leaderboards + concurrent research jobs |

Principles: AI and connectors are injected interfaces → deterministic unit tests; a nightly eval job
guards against model/prompt drift; every engine formula change ships with updated fixtures in the diff.

---

## Deployment strategy (Vercel)
- **Vercel** hosts the Next.js app + Route Handlers (serverless/edge). **Neon/Supabase** Postgres
  (+pgvector). **Upstash** Redis + **QStash** for jobs/cron (serverless-native, no always-on worker).
- Env via Vercel project settings; `.env.example` documents all keys (Clerk, DB, Redis, QStash,
  ANTHROPIC_API_KEY, OPENAI_API_KEY, Blob token).
- Migrations: `prisma migrate deploy` in the build/release step; preview deploys use Neon branches.
- Cron (Vercel Cron → QStash): trend refresh (6h), saturation refresh (6h), watchlist scan (daily),
  reports (daily/weekly/monthly).
- Blob storage: Vercel Blob (or S3) for uploaded images/CSVs; DB stores metadata + signed URLs.
- Rollout: PR → preview (isolated DB branch) → main → production; DB changes are
  expand-migrate-contract to stay backward compatible.

---

## Scaling strategy
- **Cost & latency:** aggressive Redis memoization of AI outputs (`ai:{engine}:{inputHash}`), shared
  global Trend/Saturation caches, batched embeddings, model routing (cheap OpenAI for bulk, Claude
  for reasoning). Track cost per session via `AiUsage`.
- **Throughput:** move from QStash to **BullMQ + dedicated worker(s)** (the `worker/` service) when
  research volume grows; concurrency caps per user to protect API quotas.
- **DB:** read replicas for leaderboards/reports; partition time-series (`TrendPoint`,
  `WatchlistSnapshot`) by month; tune pgvector (IVFFlat→HNSW) as vector count grows; connection
  pooling (PgBouncer/Neon pooler) for serverless.
- **Search:** hybrid retrieval (FTS + pgvector) with pre-filtering; cache hot leaderboard queries.
- **Multi-tenant fairness:** per-plan quotas + rate limits; heavy jobs isolated so one user can't
  starve others.
- **Resilience:** idempotent, resumable jobs; circuit breakers on connectors; graceful degradation to
  AI-estimated signals when an external source is down (flagged in `scoreBreakdown`).
