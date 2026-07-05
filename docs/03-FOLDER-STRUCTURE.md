# 03 — Folder Structure

Single Next.js app (App Router) with a clean domain layer. Monorepo-ready but starts as one app.

```
ai-microstock-platform/
├─ README.md
├─ package.json
├─ pnpm-lock.yaml
├─ next.config.mjs
├─ tsconfig.json
├─ tailwind.config.ts
├─ postcss.config.mjs
├─ components.json                 # shadcn config
├─ .env.example
├─ .eslintrc.json
├─ vitest.config.ts
├─ playwright.config.ts
│
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts                       # taxonomy + demo data
│  └─ migrations/                   # includes raw SQL for pgvector/FTS indexes
│
├─ public/
│
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                 # root layout, Clerk provider, React Query provider
│  │  ├─ globals.css
│  │  ├─ (marketing)/               # public landing, pricing
│  │  │  ├─ page.tsx
│  │  │  └─ pricing/page.tsx
│  │  ├─ (auth)/
│  │  │  ├─ sign-in/[[...sign-in]]/page.tsx
│  │  │  └─ sign-up/[[...sign-up]]/page.tsx
│  │  ├─ (dashboard)/               # authed app shell
│  │  │  ├─ layout.tsx              # Sidebar + Topbar + ModeSwitcher
│  │  │  ├─ overview/page.tsx       # Overview Dashboard
│  │  │  ├─ niches/                 # Niche Explorer (Mode 1)
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ [sessionId]/page.tsx
│  │  │  ├─ opportunities/page.tsx  # Opportunity Explorer (Mode 2)
│  │  │  ├─ trends/page.tsx         # Trend Explorer
│  │  │  ├─ image/page.tsx          # Image Analyzer (Mode 3)
│  │  │  ├─ prompts/page.tsx        # Prompt Generator
│  │  │  ├─ portfolio/page.tsx      # Portfolio Analyzer (Mode 4)
│  │  │  ├─ watchlist/page.tsx
│  │  │  ├─ reports/page.tsx
│  │  │  ├─ copilot/page.tsx        # AI Copilot chat
│  │  │  └─ settings/page.tsx
│  │  └─ api/
│  │     ├─ webhooks/clerk/route.ts
│  │     ├─ projects/route.ts
│  │     ├─ projects/[id]/route.ts
│  │     ├─ research/sessions/route.ts
│  │     ├─ research/sessions/[id]/route.ts
│  │     ├─ research/sessions/[id]/niches/route.ts
│  │     ├─ niches/[id]/expand/route.ts
│  │     ├─ opportunities/route.ts
│  │     ├─ opportunities/[id]/route.ts
│  │     ├─ images/analyze/route.ts
│  │     ├─ images/[id]/route.ts
│  │     ├─ portfolio/uploads/route.ts
│  │     ├─ portfolio/[id]/gaps/route.ts
│  │     ├─ portfolio/[id]/plan/route.ts
│  │     ├─ prompts/generate/route.ts
│  │     ├─ prompts/validate/route.ts
│  │     ├─ keywords/generate/route.ts
│  │     ├─ titles/generate/route.ts
│  │     ├─ compliance/check/route.ts
│  │     ├─ approval/predict/route.ts
│  │     ├─ watchlists/route.ts
│  │     ├─ watchlists/[id]/route.ts
│  │     ├─ reports/route.ts
│  │     ├─ reports/[id]/route.ts
│  │     ├─ copilot/chat/route.ts
│  │     └─ jobs/[type]/route.ts    # QStash callback endpoints (worker on Vercel)
│  │
│  ├─ components/                   # see 01-ARCHITECTURE §5.3
│  │  ├─ ui/                        # shadcn primitives
│  │  ├─ charts/  scores/  niche/  opportunity/  prompt/
│  │  ├─ image/   portfolio/  copilot/  layout/
│  │
│  ├─ lib/
│  │  ├─ db/
│  │  │  ├─ client.ts               # PrismaClient singleton
│  │  │  └─ repositories/           # nicheRepo, opportunityRepo, trendRepo, ...
│  │  ├─ ai/
│  │  │  ├─ client.ts               # AiClient interface
│  │  │  ├─ anthropic.ts            # Claude impl
│  │  │  ├─ openai.ts               # OpenAI impl (embeddings + cheap tasks)
│  │  │  ├─ model-policy.ts         # per-engine model routing
│  │  │  └─ prompts/                # prompt templates per engine
│  │  ├─ engines/                   # the 12 engines (pure + AI-assisted)
│  │  │  ├─ ai-compat.ts
│  │  │  ├─ vectorization.ts
│  │  │  ├─ saturation.ts
│  │  │  ├─ trend.ts
│  │  │  ├─ gap-detector.ts
│  │  │  ├─ content-factory.ts
│  │  │  ├─ prompt-generator.ts
│  │  │  ├─ prompt-validator.ts
│  │  │  ├─ compliance.ts
│  │  │  ├─ approval-predictor.ts
│  │  │  ├─ keyword.ts
│  │  │  ├─ title.ts
│  │  │  └─ opportunity-score.ts    # unified scoring formula
│  │  ├─ services/                  # orchestration
│  │  │  ├─ niche-expansion.service.ts
│  │  │  ├─ scoring.service.ts
│  │  │  ├─ discovery.service.ts
│  │  │  ├─ image-analysis.service.ts
│  │  │  ├─ portfolio.service.ts
│  │  │  ├─ watchlist.service.ts
│  │  │  ├─ report.service.ts
│  │  │  ├─ copilot.service.ts
│  │  │  └─ quota.service.ts
│  │  ├─ connectors/                # external data
│  │  │  ├─ google-trends.ts
│  │  │  ├─ pinterest.ts
│  │  │  ├─ reddit.ts
│  │  │  ├─ stock-search.ts         # Adobe/Shutterstock/Freepik result counts
│  │  │  └─ types.ts
│  │  ├─ jobs/
│  │  │  ├─ queue.ts                # QStash/BullMQ abstraction
│  │  │  └─ processors/             # nicheExpansion, imageAnalysis, ...
│  │  ├─ cache/redis.ts
│  │  ├─ auth/                      # Clerk helpers, requireUser()
│  │  ├─ validation/                # zod schemas per route
│  │  ├─ search/                    # hybrid FTS + pgvector helpers
│  │  ├─ flags.ts
│  │  └─ utils/                     # normalization, scoring math, csv parse
│  │
│  ├─ stores/                       # Zustand stores (ui, filters, project, copilot)
│  ├─ hooks/                        # React Query hooks (useResearchSession, useOpportunities…)
│  ├─ types/                        # shared TS types & DTOs
│  └─ config/                       # constants: platforms, tools, weights
│
├─ worker/                          # optional standalone BullMQ worker (scale-out)
│  └─ index.ts
│
├─ tests/
│  ├─ unit/                         # engines & services (Vitest)
│  ├─ integration/                  # API routes + test DB
│  └─ e2e/                          # Playwright flows per mode
│
└─ .github/workflows/ci.yml
```

## Conventions
- **Path alias** `@/*` → `src/*`.
- One repository per aggregate; only repositories import Prisma.
- Engines export pure functions + an interface; AI-assisted parts injected so tests can stub AI.
- Route handlers: `requireUser()` → `zod.parse()` → `service.call()` → typed response.
- Zustand stores never hold server data; React Query hooks own all fetching.
