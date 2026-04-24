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
- Vitest + happy-dom
- 90 unit tests covering all 30 rule IDs

---

## Up next — v1.0 Stable

- Remove BETA label
- Stabilize public API surface
- Finalize pricing and plan limits
- End-to-end smoke tests for auth and billing flows

---

## Planned

### Developer integrations
- **GitHub Action** — scan HTML in CI, fail PR if score drops below threshold
- **REST API** — authenticated endpoint for external tools to call the rule engine
- **CLI tool** — `npx ada-checker <url>` for local development

### Scanning improvements
- **Authenticated URL scans** — pass cookies/headers to scan pages behind login
- **Sitemap scan** — crawl and check all pages from an XML sitemap
- **Scan scheduling** — run weekly checks on a URL and email the diff

### Reporting
- **Shareable report links** — permalink to a scan result
- **Team dashboards** — aggregate scores across multiple URLs
- **Trend charts** — score over time per URL

### Rules
- **WCAG 2.2** — new criteria added in the 2023 update (focus appearance, dragging, target size)
- **Color contrast for non-text** — UI components, icons, focus indicators
- **Motion / animation** — flag `prefers-reduced-motion` violations

### Integrations
- **Slack / email alerts** — notify when a scheduled scan finds regressions
- **Jira / Linear** — create issues directly from violation cards

---

## Won't do (for now)

- Full automated WCAG AAA compliance (many criteria require human judgment)
- Native mobile app (web-only for now)
- Screenshot / visual diff testing
