# 08 — Deploy to Vercel

The repo is committed and deploy-ready (`git log` shows the initial commit). Pick **one** path
below. Both need the same two things from you: a Vercel login and your real API keys.

> ⚠️ **You must set the environment variables in Vercel _before_ the first build** — the app
> validates required env at boot and the build will fail without them (this is intentional, so a
> misconfigured deploy can't ship). The full list is at the bottom.

---

## Path A — Vercel CLI (fastest, no GitHub needed)

```bash
npm i -g vercel          # install the CLI
vercel login             # opens browser, log in / sign up (free)
cd "C:/Users/PC/Documents/Niche tool"
vercel                   # first run: answer prompts, links the project
```
When prompted, accept the detected **Next.js** settings. After it links, add env vars and deploy to
production:
```bash
# add each variable (repeat for every key in the list below)
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
# ...etc...
vercel --prod            # production deploy → gives you https://<name>.vercel.app
```

## Path B — GitHub + Vercel dashboard (best for ongoing deploys)

1. Create an empty repo at github.com (e.g. `microstock-opportunity`). **Don't** add a README.
2. Push:
   ```bash
   cd "C:/Users/PC/Documents/Niche tool"
   git remote add origin https://github.com/<you>/microstock-opportunity.git
   git push -u origin main
   ```
3. Go to **vercel.com → Add New → Project → Import** your repo.
4. In the import screen, expand **Environment Variables** and paste every key from the list below.
5. Click **Deploy**. You get `https://<name>.vercel.app`. Every future `git push` auto-deploys.

---

## After the first deploy — make it actually work

1. **Database tables.** From your machine, with `.env.local` pointing at the same Neon DB:
   ```bash
   npm run db:push
   npm run db:seed
   ```
   Then paste `prisma/sql/001_vector_fts.sql` into the Neon SQL editor (pgvector + FTS indexes).
2. **Clerk production domain.** In Clerk → your instance → add `https://<name>.vercel.app` to allowed
   origins. Create a **webhook** to `https://<name>.vercel.app/api/webhooks/clerk` (events: `user.*`)
   and put its signing secret in the `CLERK_WEBHOOK_SECRET` env var on Vercel, then redeploy.
3. **Smoke test.** Visit the URL → sign up → Niche Explorer → "Healthcare" → Research.
4. **Health check.** `https://<name>.vercel.app/api/health` should return `{"status":"ok"}`.

Cron jobs (`vercel.json` → daily watchlist scan) and per-function timeouts deploy automatically.

---

## Environment variables to set in Vercel

Required (build fails without these):
```
DATABASE_URL                          # Neon pooled connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY     # Clerk
CLERK_SECRET_KEY                      # Clerk
NEXT_PUBLIC_APP_URL                   # https://<name>.vercel.app  (set after you know the URL, then redeploy)
```

> 🔑 **AI keys are NOT required to deploy.** Each user adds their own Anthropic + OpenAI keys in
> **Settings → API keys** after signing in (stored encrypted). Optionally set server-wide fallback
> keys below so users don't have to. AI features (research, image analysis, Copilot) simply prompt
> "add your key in Settings" until a key is present.

Recommended:
```
ANTHROPIC_API_KEY                     # optional server-wide fallback (else users bring their own)
OPENAI_API_KEY                        # optional server-wide fallback
APP_ENCRYPTION_KEY                    # 32+ chars, encrypts stored user keys (else derived from CLERK_SECRET_KEY)
DIRECT_URL                            # Neon direct string (migrations)
CLERK_WEBHOOK_SECRET                  # from the Clerk webhook you create
NEXT_PUBLIC_CLERK_SIGN_IN_URL         # /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL         # /sign-up
```
Optional (durable cache + jobs at scale — app runs without them):
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
QSTASH_TOKEN
QSTASH_CURRENT_SIGNING_KEY
QSTASH_NEXT_SIGNING_KEY
CRON_SECRET                           # protects the cron endpoint
BLOB_READ_WRITE_TOKEN                 # if you wire Vercel Blob for image storage
```

## Common first-deploy failures
- **Build fails: "Invalid environment variables"** → a required var above is missing/empty in Vercel.
- **Build fails on Prisma** → `DATABASE_URL` not set in Vercel env.
- **App loads but login is blank** → Clerk keys wrong, or Vercel domain not allowed in Clerk.
- **Everything 500s at runtime** → you deployed before running `db:push`; the tables don't exist yet.
