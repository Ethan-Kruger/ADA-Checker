# ADA Checker — Roadmap

## Status: BETA

The core product is live. All WCAG 2.1 rules are implemented across Level A, AA, and AAA. The app runs on Next.js with Supabase auth and Stripe billing.

---

## Done

### Core rule engine
- 22 Level A rules (Free)
- 5 Level AA rules (Pro)
- 3 Level AAA rules (Enterprise)
- Score formula: `100 − Σ penalties`, floored at 0
- See [RULES.md](../RULES.md) for the full rule reference

### App
- URL, HTML paste, and batch scan modes
- WCAG level selector (A / AA / AAA)
- Filterable violation cards with fix guidance and WCAG citation
- Score gauge and severity breakdown
- Check history (stored in localStorage, up to 20 runs)
- Color contrast checker (WCAG AA / AAA thresholds)
- Export results — PDF, HTML, CSV, TXT, clipboard *(Pro+)*

### Auth and billing
- Supabase auth (email/password)
- Stripe checkout — Free / Pro / Enterprise plans
- Plan enforcement on AA / AAA rules and export features
- Rate limiting on the check API

### Accessibility
- Full keyboard navigation (WAI-ARIA menu button pattern)
- Focus-visible indicators on all interactive elements
- ARIA live region announces scan start and result
- Semantic landmarks, heading hierarchy, skip link
- Screen reader tested

### Tests
- Vitest + happy-dom — 90 unit tests covering all 30 rule IDs
- Playwright E2E — auth flow, checker smoke tests, billing (opt-in)
- CI creates GitHub issues automatically for test failures

### CI/CD
- GitHub Action: WCAG scan on every push — fails if score < 80, auto-creates issues for violations
- GitHub Action: E2E smoke tests on every push, auto-creates issues for failures
- GitHub Action: moves referenced issues to In Progress on every push

### Developer integrations
- **GitHub Action** — scan HTML in CI, fail if score below threshold (#83)
- **REST API** — `POST /api/v1/check` with Bearer key, plan-aware rate limiting (#84)
- **CLI tool** — `npx ada-checker <url|file>` with `--level`, `--threshold`, `--json` flags (#85)
  - API key management in Settings (generate, list, revoke)
  - Pro: 60 req/hr · Enterprise: 1000 req/hr
  - Full reference in [docs/api.md](api.md)
- **Jira integration** *(Enterprise)* — push violations to Jira as Bug issues (#96)
- **Linear integration** *(Enterprise)* — push violations to Linear (#96)

---

## Up next — v1.0 Stable

- Remove BETA label (#81)
- Stabilize public API surface (#79)
- Finalize pricing and plan limits

---

## Planned

### Scanning improvements
- **Authenticated URL scans** — pass cookies/headers to scan pages behind login (#85)
- **Sitemap scan** — crawl and check all pages from an XML sitemap (#86)
- **Scan scheduling** — run weekly checks on a URL and email the diff (#87)

### Reporting
- **Shareable report links** — permalink to a scan result (#88)
- **Team dashboards** — aggregate scores across multiple URLs (#89)
- **Trend charts** — score over time per URL (#90)

### Rules
- **WCAG 2.2** — new criteria added in the 2023 update (#91)
- **Color contrast for non-text** — UI components, icons, focus indicators (#92)
- **Motion / animation** — flag `prefers-reduced-motion` violations (#93)

### Integrations
- **Slack / email alerts** — notify when a scheduled scan finds regressions (#94)
- ~~**CLI tool** — `npx ada-checker <url>` for local development~~ ✅ Done (#85)

---

## Won't do (for now)

- Full automated WCAG AAA compliance (many criteria require human judgment)
- Native mobile app (web-only for now)
- Screenshot / visual diff testing
