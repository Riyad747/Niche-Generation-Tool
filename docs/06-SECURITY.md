# 06 — Security & Hardening Review

Status of the controls in place after Phase 5, and the known gaps to close before a public launch.

## In place

| Area | Control | Where |
|------|---------|-------|
| AuthN | Clerk on every non-public route; `auth.protect()` | [middleware.ts](../src/middleware.ts) |
| AuthZ (multitenancy) | Every domain read/write scoped by `userId` in repositories | `src/lib/db/repositories/**` |
| Input validation | zod at every route boundary; typed error envelope | `src/lib/validation`, [respond.ts](../src/lib/api/respond.ts) |
| Rate limiting | Per-user fixed-window on AI-heavy routes (research/image/copilot) | [rate-limit.ts](../src/lib/cache/rate-limit.ts) |
| Quotas | Plan-based monthly caps, check-before-spend | [quota.service.ts](../src/lib/services/quota.service.ts) |
| Webhook integrity | Clerk Svix signature verification | [webhooks/clerk](../src/app/api/webhooks/clerk/route.ts) |
| Job callbacks | QStash signature verification | [jobs/[type]](../src/app/api/jobs/[type]/route.ts) |
| Cron | `CRON_SECRET` bearer check | [cron/watchlist-scan](../src/app/api/cron/watchlist-scan/route.ts) |
| Upload safety | Image type allowlist + 8MB cap; CSV size bound | [data-url.ts](../src/lib/utils/data-url.ts), route schemas |
| Transport/headers | HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy | [next.config.mjs](../next.config.mjs) |
| Secrets | Server-only env, validated at boot; only `NEXT_PUBLIC_*` reach the client | [env.ts](../src/lib/env.ts) |
| Observability | Structured JSON logs with request id + timing; AI cost ledger per user | [log.ts](../src/lib/log.ts), `AiUsage` |
| Error hygiene | No stack traces leaked; generic 500 body | [respond.ts](../src/lib/api/respond.ts) |

## Known gaps (Phase 5+ / pre-launch)

- **Billing**: quotas are enforced but not yet tied to Stripe; plan changes are manual. Wire Stripe
  (via Clerk billing or direct) + webhook to set `User.plan`.
- **Rate limiter fairness**: fixed-window can allow a 2× burst at window edges. Move to Upstash
  Ratelimit (sliding window) for strict limits; the interface already isolates this.
- **CSP**: no Content-Security-Policy header yet (Clerk + inline styles need a nonce strategy). Add a
  report-only CSP first, then enforce.
- **AI token quota**: `aiTokens` limit is defined but only session/image counts are enforced
  pre-spend; add post-call token accounting against the cap from `AiUsage`.
- **Abuse / prompt-injection**: user text flows into AI prompts. Outputs are zod-validated (bounded
  shape), but add an output content check on Copilot/report summaries before display.
- **PII**: uploaded images/CSVs may contain PII; document retention + add deletion endpoints.
- **Dependency & secret scanning**: enable Dependabot + secret scanning in CI.
- **Pen test / load test**: run k6 against discovery + concurrent research before GA (see
  [05-ROADMAP.md](05-ROADMAP.md#scaling-strategy)).

## Testing posture

- 45 hermetic unit tests (engines, pipeline, portfolio, quota, rate limit) — `npm test`.
- Playwright smoke suite (public surface + auth redirect + health) — `npm run test:e2e`; per-mode
  authenticated flows pending a Clerk test account.
- CI runs typecheck + unit tests + build on every PR ([ci.yml](../.github/workflows/ci.yml)).
