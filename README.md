# ADA Checker

A Next.js web app that audits HTML against WCAG 2.1 rules and returns an instant accessibility report.

## What it does

Paste HTML, enter a URL, or run a batch scan and get:

- **Score out of 100** — weighted by violation severity
- **Violation breakdown** — Critical / Serious / Moderate / Minor counts
- **Filterable violation cards** — element, fix guidance, and WCAG reference
- **Check history** — runs saved locally, track improvement over time
- **Color contrast checker** — test foreground/background pairs against WCAG AA/AAA thresholds
- **Export results** *(Pro+)* — PDF, HTML, CSV, TXT, or clipboard
- **Jira / Linear integration** *(Enterprise)* — push violations directly to your tracker
- **REST API** *(Pro+)* — run checks programmatically from your own tools
- **Screen reader live region** — scan start/end announced to assistive technology

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | Supabase (Postgres) |
| Payments | Stripe |
| Tests | Vitest + happy-dom, Playwright (E2E) |
| Deploy | Vercel |

## Rules

30 WCAG 2.1 rules across three levels. See [RULES.md](RULES.md) for the full reference.

| Level | Rules | Plan required |
|---|---|---|
| A | 22 | Free |
| AA | 5 | Pro |
| AAA | 3 | Enterprise |

## Scoring

```
Score = 100 − (critical × 20) − (serious × 10) − (moderate × 5) − (minor × 2)
         floored at 0
```

| Range | Label |
|---|---|
| 80 – 100 | Good |
| 50 – 79 | Fair |
| 0 – 49 | Poor |

## REST API

Pro and Enterprise plans can call the checker programmatically:

```bash
curl https://your-app.vercel.app/api/v1/check \
  -H "Authorization: Bearer ada_sk_…" \
  -H "Content-Type: application/json" \
  -d '{"html":"<img src=test.png>","level":"AA"}'
```

See [docs/api.md](docs/api.md) for the full reference. Generate API keys in **Settings → API Access**.

## File structure

```
app/
├── page.tsx              — Main checker UI
├── pricing/              — Pricing page
├── settings/             — Settings page
├── api/
│   ├── auth/             — Login, signup, logout, me
│   ├── billing/          — Invoices
│   ├── stripe/           — Checkout, webhook, sync-plan
│   ├── integrations/     — Jira and Linear (Enterprise)
│   ├── v1/               — Public REST API (Pro+)
│   │   ├── check/        — POST /api/v1/check
│   │   └── keys/         — GET/POST/DELETE /api/v1/keys
│   └── check/run/        — Internal rate-limit gate
├── layout.tsx
└── globals.css
components/
├── Nav.tsx               — Site navigation
├── AuthModal.tsx         — Login / signup modal
├── AuthGate.tsx          — Auth wall for unauthenticated users
├── Banner.tsx            — Announcement banner
└── Footer.tsx
public/js/
├── checker.js            — WCAG rule engine (runs in browser)
├── app.js                — Checker page UI
├── auth.js               — Auth helpers + plan sync
├── router.js             — Client-side routing
└── settings.js           — Settings panel logic
e2e/
├── auth.spec.ts          — Sign up, log in, log out
├── checker.spec.ts       — Rule engine smoke tests
└── billing.spec.ts       — Stripe flow (opt-in, requires STRIPE_TEST_MODE=true)
tests/
├── level-a.test.ts       — 22 Level A rules
├── level-aa.test.ts      — 5 Level AA rules
└── level-aaa.test.ts     — 3 Level AAA rules
scripts/
├── ci-check.mjs          — CI accessibility gate (used by GitHub Actions)
├── create-a11y-issues.mjs — Auto-create GitHub issues from a11y violations
└── create-e2e-issues.mjs  — Auto-create GitHub issues from E2E failures
lib/
├── auth.ts               — JWT helpers
├── supabase.ts           — Supabase client
├── rateLimit.ts          — Rate limiting (Upstash Redis)
├── stripe.ts             — Stripe client
├── flags.ts              — Feature flags (Vercel)
└── checker-node.ts       — Loads checker.js in Node for server-side API use
supabase/
├── schema.sql            — Database schema
└── migrations/           — SQL migrations
docs/
├── api.md                — REST API reference
└── ada-roadmap.md        — Product roadmap
```

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` and fill in your Supabase and Stripe keys.

## Tests

```bash
npm test            # unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

## CI

Two GitHub Actions workflows run on every push:

| Workflow | What it does |
|---|---|
| `a11y-check.yml` | Scans all HTML files, fails if score < 80, creates GitHub issues for violations |
| `e2e.yml` | Runs Playwright smoke tests, creates GitHub issues for failures |

## Settings

All preferences stored in `localStorage`.

| Setting | Key | Options |
|---|---|---|
| Theme | `ada-theme` | `dark` / `light` |
| Font size | `ada-font-size` | `small` / `medium` / `large` / `xlarge` |
| Font type | `ada-font` | `system` / `lexend` / `atkinson` / `arial` / `verdana` / `comic-sans` |
| WCAG level | `ada-wcag` | `A` / `AA` / `AAA` |
| Check history | `ada-history` | Up to 20 most recent runs |

## License

See [LICENSE](LICENSE).
