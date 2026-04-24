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
- **Screen reader live region** — scan start/end announced to assistive technology

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | Supabase (Postgres + Auth) |
| Payments | Stripe |
| ORM | Prisma |
| Tests | Vitest + happy-dom |
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

## File structure

```
app/
├── page.tsx              — Main checker UI
├── pricing/              — Pricing page
├── settings/             — Settings page
├── profile/              — Profile page
├── api/                  — Next.js API routes (auth, billing, check, stripe)
├── layout.tsx
└── globals.css
components/
├── Nav.tsx               — Site navigation (keyboard accessible, ARIA menu)
├── AuthModal.tsx         — Login / signup modal
├── Banner.tsx            — Pro plan banner
└── Footer.tsx
public/js/
├── checker.js            — WCAG rule engine + checkAccessibility()
├── app.js                — Checker page UI (tabs, gauge, filter, results, export)
├── auth.js               — Auth helpers
├── router.js             — Client-side routing
└── settings.js           — Settings panel logic
tests/
├── setup.ts              — Vitest setup (happy-dom, localStorage, checker.js loader)
├── level-a.test.ts       — 22 Level A rules (58 tests)
├── level-aa.test.ts      — 5 Level AA rules (19 tests)
└── level-aaa.test.ts     — 3 Level AAA rules (13 tests)
lib/                      — Shared server utilities
migrations/               — Prisma migrations
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
npm test          # run once
npm run test:watch  # watch mode
```

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
