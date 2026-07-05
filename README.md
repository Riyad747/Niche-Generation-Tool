# AI Microstock Opportunity Intelligence Platform

An AI-powered **opportunity discovery** platform for microstock creators — not a keyword tool.
It fuses demand, competition, trend growth, AI-generatability, vectorization success, approval
probability, and production speed into a single **Opportunity Score**, then tells a creator
exactly *what to make next* and *how to scale it*.

Built for creators using **MidJourney, Flux, ChatGPT, Vectorizer.ai, Adobe Illustrator** who sell
on **Adobe Stock, Shutterstock, Freepik, Creative Market, Envato**.

---

## The 4 Modes

| Mode | Name | Input | Output |
|------|------|-------|--------|
| 1 | Deep Niche Expansion Research | A seed niche (e.g. "Healthcare") | Scored, ranked niche tree + 150 asset ideas + keywords/titles |
| 2 | Market Opportunity Discovery | One click | Top opportunities today / this week / this month |
| 3 | Image-to-Opportunity Analyzer | An uploaded image | Related niches, prompts, keywords, portfolio expansion |
| 4 | Portfolio Gap Discovery | Adobe/Shutterstock CSV | Missing niches + next 50/100/500 assets to create |

## The 12 Engines

Scoring & analysis engines that power every mode. See [docs/04-SCORING-ENGINES.md](docs/04-SCORING-ENGINES.md).

1. AI Compatibility Engine
2. Vectorization Suitability Engine
3. Saturation Engine (heatmaps)
4. Trend Engine
5. Market Gap Detector
6. Content Factory Planner
7. Prompt Generator Engine
8. Prompt Validator
9. Compliance Engine
10. Adobe Approval Predictor
11. Keyword Engine
12. Title Engine

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/01-ARCHITECTURE.md](docs/01-ARCHITECTURE.md) | System, backend, frontend, API & component architecture |
| [docs/02-DATABASE.md](docs/02-DATABASE.md) | Data model, ERD, indexing, pgvector strategy |
| [docs/03-FOLDER-STRUCTURE.md](docs/03-FOLDER-STRUCTURE.md) | Full monorepo folder tree |
| [docs/04-SCORING-ENGINES.md](docs/04-SCORING-ENGINES.md) | Every scoring formula & engine spec |
| [docs/05-ROADMAP.md](docs/05-ROADMAP.md) | Phased roadmap, step-by-step tasks, testing, deploy, scaling |
| [prisma/schema.prisma](prisma/schema.prisma) | Production-ready Prisma schema |

## Tech Stack

**Frontend:** Next.js (App Router) · TypeScript · TailwindCSS · shadcn/ui · React Query · Zustand
**Backend:** Next.js API Routes / Route Handlers · Node.js · TypeScript
**Data:** PostgreSQL · Prisma · pgvector · Postgres FTS
**Auth:** Clerk · **Cache/Queue:** Redis (Upstash) · **AI:** Claude API + OpenAI API
**Deploy:** Vercel

## Getting started (once code lands)

```bash
pnpm install
cp .env.example .env.local        # fill in Clerk, DB, Redis, AI keys
pnpm db:push                      # apply Prisma schema
pnpm db:seed                      # seed taxonomy + demo data
pnpm dev
```

> Status: **Phase 5 complete (hardening) — all planned phases done.** On top of the four modes +
> Copilot/Watchlist/Reports, the app now has: plan-based **quotas** (check-before-spend), per-user
> **rate limiting** on AI routes, structured **request logging** with cost ledger, the **Clerk
> webhook** user-sync, a **health** probe, **security headers**, `vercel.json` (crons + function
> limits), a **CI** workflow (typecheck + tests + build), and a **Playwright** smoke suite.
> Security posture & remaining pre-launch gaps documented in [docs/06-SECURITY.md](docs/06-SECURITY.md).
> **45 unit tests passing, `tsc` clean, `next build` green (34 routes).**
> Recap: P0 foundation · P1 Mode 1 · P2 real signals + Mode 2 · P3 Modes 3 & 4 · P4 Copilot/Watchlist/Reports.
> To run against live services, fill `.env.local` and follow the getting-started steps above.
