# ADA Checker

A browser-based accessibility checker that audits HTML against WCAG 2.1 rules — no server, no uploads, no dependencies.

## What it does

Paste any HTML (or enter a URL) and get an instant accessibility report with:

- **Score out of 100** — weighted by violation severity
- **Violation breakdown** — Critical / Serious / Moderate / Minor counts
- **Filterable violation cards** — each with the element, fix guidance, and WCAG reference
- **Check history** — every run is saved locally so you can track improvement over time
- **Loading spinner** — visible feedback while a scan runs, announced to screen readers via `role="status"`
- **Screen reader live region** — announces scan start and end so assistive technology users get the same feedback
- **Color contrast checker** — test foreground/background color pairs against WCAG AA and AAA thresholds, with a live preview and swap button
- **Checker switcher** — dropdown in the editor corner to switch between the ADA scanner and the Color Contrast Checker
- **Export results** *(Pro+)* — download or copy results as PDF, HTML, CSV, TXT, or clipboard copy

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Main checker — paste HTML or enter a URL |
| `pricing.html` | Plan comparison (Free / Pro / Enterprise) |
| `settings.html` | Appearance, profile, WCAG level, check history, and an embedded checker |

## Checks (17 rules, WCAG 2.1)

| # | Rule | Severity |
|---|---|---|
| 1 | Image missing `alt` text | Critical |
| 2 | Generic / filename alt text | Moderate |
| 3 | Form input missing label | Critical |
| 4 | Input uses placeholder only (no label) | Serious |
| 5 | Link has no text | Critical |
| 6 | Vague link text ("click here", "read more", …) | Serious |
| 7 | Page missing `<title>` | Moderate |
| 8 | Missing `<h1>` or skipped heading levels | Moderate |
| 9 | `<html>` missing `lang` attribute | Moderate |
| 10 | Invalid ARIA role / broken `aria-labelledby` reference | Serious |
| 11 | Focusable element hidden with `aria-hidden="true"` | Critical |
| 12 | Table missing `<th>`, `scope`, or `<caption>` | Serious / Moderate |
| 13 | Duplicate IDs on the page | Serious |
| 14 | Button has no accessible name | Critical |
| 15 | No skip-navigation link | Minor |
| 16 | `<iframe>` missing `title` | Serious |
| 17 | `<input type="image">` missing `alt` | Critical |

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

## Settings

All preferences are stored in `localStorage` — nothing is ever sent to a server.

| Setting | Key | Options |
|---|---|---|
| Theme | `ada-theme` | `dark` / `light` |
| Font size | `ada-font-size` | `small` / `medium` / `large` / `xlarge` |
| Font type | `ada-font` | `system` / `lexend` / `atkinson` / `arial` / `verdana` / `comic-sans` |
| WCAG level | `ada-wcag` | `A` / `AA` / `AAA` |
| Check history | `ada-history` | Up to 20 most recent runs |
| Profile name | `ada-profile-name` | Free text |
| Profile email | `ada-profile-email` | Free text |

## File structure

```
docs/
├── index.html          — Checker page
├── pricing.html        — Pricing page
├── settings.html       — Settings page
├── css/
│   ├── styles.css      — Global styles (themes, nav, checker UI)
│   └── settings.css    — Settings page styles
├── js/
│   ├── checker.js      — WCAG checks + checkAccessibility() + history save
│   ├── app.js          — Checker page UI (tabs, gauge, filter, results, export, contrast checker, switcher)
│   ├── settings.js     — Settings panel logic + history rendering
│   └── nav.js          — Hamburger menu + brightness slider
└── images/
    └── logo.svg
```

## Running locally

No build step needed — open any HTML file directly in a browser, or serve the `docs/` folder with any static server:

```bash
# Python
python3 -m http.server 8080 --directory docs

# Node (npx)
npx serve docs
```

Then open `http://localhost:8080`.

## Roadmap

See [docs/ada-roadmap.md](docs/ada-roadmap.md) for the planned rule phases:

- **Phase 1** — Core semantics and text *(done)*
- **Phase 2** — Forms and focus
- **Phase 3** — Color contrast
- **Phase 4** — ARIA and advanced patterns

## License

See [LICENSE](LICENSE).
