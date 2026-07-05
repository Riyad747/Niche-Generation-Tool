# 07 — Setup: From Zero to Running

This is a **web app**. You run it locally in your browser first, then deploy it to Vercel so
anyone can use it. No `.exe`, no install for end users — they just visit a URL and sign in.

```
Your PC (dev)                Cloud services (free tiers)         Live app
localhost:3000  ───────────▶ Neon (Postgres) · Clerk (login)  ──▶ your-app.vercel.app
  npm run dev                Anthropic + OpenAI (AI)              (any browser / phone)
                             Upstash (optional cache/jobs)
```

You need accounts for a few services. All have free tiers big enough to test.

---

## Step 1 — Prerequisites
- **Node.js 20+** (you have v24 ✓) and **npm** (✓)
- A code editor (VS Code)

## Step 2 — Create the service accounts (≈15 min, all free to start)

| Service | What it's for | Get the keys from |
|---------|---------------|-------------------|
| **Neon** (neon.tech) | PostgreSQL database + pgvector | Dashboard → Connection string |
| **Clerk** (clerk.com) | User sign-up / login | API Keys → Publishable + Secret |
| **Anthropic** (console.anthropic.com) | Claude (the main AI) | API Keys |
| **OpenAI** (platform.openai.com) | Embeddings | API Keys |
| **Upstash** (upstash.com) | Redis cache + QStash jobs — **optional**, app runs without it | Redis → REST URL + token |

> Skip Upstash for now — the app falls back to an in-memory cache and runs jobs inline in dev.

### Enable pgvector on Neon
In the Neon SQL editor run once: `CREATE EXTENSION IF NOT EXISTS vector;`
(Prisma also declares it, but enabling it up front avoids a first-migration hiccup.)

## Step 3 — Fill in your environment
Copy the template and paste your keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local`. Minimum to boot:
- `DATABASE_URL` (Neon — use the **pooled** connection string)
- `DIRECT_URL` (Neon — the **direct** connection string, for migrations)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`

## Step 4 — Create the database tables & seed
```bash
npm run db:push       # creates all tables from prisma/schema.prisma
npm run db:seed       # loads the starter niche taxonomy
```
Then apply the vector/full-text indexes Prisma can't express (paste into Neon SQL editor):
`prisma/sql/001_vector_fts.sql`

## Step 5 — Run it
```bash
npm run dev
```
Open **http://localhost:3000**, click **Get started**, create an account (Clerk), and you're in.
Try **Niche Explorer → type "Healthcare" → Research**. First run may take a minute (many AI calls).

---

## Step 6 — Deploy so others can use it (Vercel)
1. Push this folder to a GitHub repo.
2. On vercel.com → **New Project** → import the repo.
3. Add the same env vars from `.env.local` in Vercel → Project → Settings → Environment Variables.
4. Deploy. You get `https://your-app.vercel.app`.
5. In Clerk, add that domain to allowed origins; add a webhook to
   `https://your-app.vercel.app/api/webhooks/clerk` (event: user.*) and put its secret in
   `CLERK_WEBHOOK_SECRET`.
6. (Optional) Add Upstash env vars to enable durable caching + background jobs at scale.

Cron jobs (`vercel.json`) and function limits deploy automatically.

---

## Costs to expect (rough)
- Neon / Clerk / Upstash: **free tiers** cover early testing.
- AI: you pay Anthropic + OpenAI per use. A single "Healthcare" research run scores dozens of niches
  → a few cents to a couple dollars depending on depth. Watch spend in **Settings → AI usage**
  (tracked per user via the `AiUsage` ledger) and via plan quotas in `src/config/plans.ts`.

## Troubleshooting
- **"Invalid environment variables" on boot** → a required key in `.env.local` is missing/empty.
- **`db:push` fails** → check `DATABASE_URL`; ensure `?sslmode=require` is present.
- **Login page blank** → Clerk publishable key wrong or domain not allowed in Clerk.
- **Research stuck at low %** → an AI key is invalid, or you hit an AI rate limit; check the terminal
  logs (structured JSON lines).
