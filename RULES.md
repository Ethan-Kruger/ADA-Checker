# ADA Checker — WCAG Rule Reference

All rules checked by the engine in `public/js/checker.js`. Each entry lists the rule ID emitted in violation results, the WCAG level required to run it, the severity penalty, the governing WCAG criterion, and a minimal HTML example that triggers the violation.

---

## Level A — always checked (22 rules)

### Image alt text

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `img-alt-missing` | critical | 1.1.1 Non-text Content |
| `img-alt-generic` | moderate | 1.1.1 Non-text Content |

**`img-alt-missing`** — `<img>` element has no `alt` attribute.
```html
<!-- violation -->
<img src="hero.png">

<!-- pass -->
<img src="hero.png" alt="A smiling team photo">
<img src="divider.png" alt="">  <!-- decorative — empty alt is correct -->
```

**`img-alt-generic`** — `alt` value is a filename or a generic word like `image`, `photo`, `icon`.
```html
<!-- violation -->
<img src="dog.png" alt="photo.png">
<img src="dog.png" alt="image">

<!-- pass -->
<img src="dog.png" alt="Golden retriever running on a beach">
```

---

### Form labels

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `form-label-missing` | critical | 3.3.2 Labels or Instructions |
| `form-label-placeholder-only` | serious | 3.3.2 Labels or Instructions |

**`form-label-missing`** — Input, textarea, or select has no associated label and no `aria-label`, `aria-labelledby`, or `title`.
```html
<!-- violation -->
<input type="text">

<!-- pass -->
<label for="name">Full name</label>
<input id="name" type="text">
```

**`form-label-placeholder-only`** — Input uses only `placeholder` as its label (placeholder disappears on focus).
```html
<!-- violation -->
<input type="email" placeholder="Enter your email">

<!-- pass -->
<input type="email" aria-label="Email address" placeholder="Enter your email">
```

---

### Link text

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `link-empty` | critical | 2.4.4 Link Purpose |
| `link-vague` | serious | 2.4.4 Link Purpose |

**`link-empty`** — Anchor has no accessible name (no text, `aria-label`, or `aria-labelledby`).
```html
<!-- violation -->
<a href="/report"></a>
<a href="/report"><img src="icon.png"></a>  <!-- image with no alt -->

<!-- pass -->
<a href="/report">Download annual report</a>
<a href="/report" aria-label="Download annual report"></a>
```

**`link-vague`** — Link text is a generic phrase: *click here*, *here*, *read more*, *more*, *learn more*, *link*, *details*, *this*, *download*, *continue*, *go*.
```html
<!-- violation -->
<a href="/report">click here</a>
<a href="/report">read more</a>

<!-- pass -->
<a href="/report">Read the 2024 annual report</a>
```

---

### Page title

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `page-title-missing` | moderate | 2.4.2 Page Titled |

**`page-title-missing`** — `<title>` element is absent or empty.
```html
<!-- violation -->
<html><head></head><body>…</body></html>

<!-- pass -->
<html><head><title>Dashboard — ADA Checker</title></head>…</html>
```

---

### Heading hierarchy

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `heading-no-h1` | moderate | 1.3.1 Info and Relationships |
| `heading-skip` | moderate | 1.3.1 Info and Relationships |
| `heading-empty` | moderate | 1.3.1 Info and Relationships |

**`heading-no-h1`** — Page has no `<h1>`.
```html
<!-- violation -->
<h2>Section</h2>

<!-- pass -->
<h1>Main heading</h1>
<h2>Section</h2>
```

**`heading-skip`** — Heading level jumps by more than one (e.g. `h1` → `h3`).
```html
<!-- violation -->
<h1>Title</h1>
<h3>Sub-section</h3>  <!-- skips h2 -->

<!-- pass -->
<h1>Title</h1>
<h2>Section</h2>
<h3>Sub-section</h3>
```

**`heading-empty`** — Heading element contains no text.
```html
<!-- violation -->
<h2></h2>

<!-- pass -->
<h2>Features</h2>
```

---

### Language

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `html-lang-missing` | moderate | 3.1.1 Language of Page |

**`html-lang-missing`** — `<html>` element has no `lang` attribute.
```html
<!-- violation -->
<html><head>…</head><body>…</body></html>

<!-- pass -->
<html lang="en"><head>…</head><body>…</body></html>
```

---

### ARIA

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `aria-role-invalid` | serious | 4.1.2 Name, Role, Value |
| `aria-labelledby-missing` | serious | 4.1.2 Name, Role, Value |
| `aria-hidden-focusable` | critical | 4.1.2 Name, Role, Value |

**`aria-role-invalid`** — `role` attribute value is not a valid WAI-ARIA role.
```html
<!-- violation -->
<div role="foobar">…</div>

<!-- pass -->
<div role="button">…</div>
```

**`aria-labelledby-missing`** — `aria-labelledby` references an ID that does not exist in the document.
```html
<!-- violation -->
<input aria-labelledby="ghost-id">

<!-- pass -->
<span id="field-label">Email</span>
<input aria-labelledby="field-label">
```

**`aria-hidden-focusable`** — An element with `aria-hidden="true"` contains or is itself a focusable element.
```html
<!-- violation -->
<div aria-hidden="true">
  <button>Close</button>
</div>

<!-- pass -->
<div aria-hidden="true">
  <span>Decorative text</span>
</div>
```

---

### Tables

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `table-no-headers` | serious | 1.3.1 Info and Relationships |
| `table-th-no-scope` | moderate | 1.3.1 Info and Relationships |
| `table-no-caption` | minor | 1.3.1 Info and Relationships |

**`table-no-headers`** — Data table has no `<th>` elements.
```html
<!-- violation -->
<table><tr><td>Alice</td><td>90</td></tr></table>

<!-- pass -->
<table>
  <tr><th scope="col">Name</th><th scope="col">Score</th></tr>
  <tr><td>Alice</td><td>90</td></tr>
</table>
```

**`table-th-no-scope`** — `<th>` element is missing the `scope` attribute (`col`, `row`, `colgroup`, `rowgroup`).
```html
<!-- violation -->
<th>Name</th>

<!-- pass -->
<th scope="col">Name</th>
```

**`table-no-caption`** — Table has no `<caption>` to describe its purpose.
```html
<!-- violation -->
<table><tr><th scope="col">Name</th></tr></table>

<!-- pass -->
<table>
  <caption>Q1 test scores</caption>
  <tr><th scope="col">Name</th></tr>
</table>
```

---

### Buttons

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `button-no-name` | critical | 4.1.2 Name, Role, Value |

**`button-no-name`** — `<button>` or element with `role="button"` has no accessible name.
```html
<!-- violation -->
<button></button>
<button><svg>…</svg></button>  <!-- SVG with no aria-label -->

<!-- pass -->
<button>Submit form</button>
<button aria-label="Close dialog"><svg aria-hidden="true">…</svg></button>
```

---

### Skip navigation

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `skip-link-missing` | minor | 2.4.1 Bypass Blocks |

**`skip-link-missing`** — No skip link found among the first five anchors on the page (looks for an `href` starting with `#` and text containing "skip").
```html
<!-- violation — no skip link before main nav -->
<nav>…</nav>
<main>…</main>

<!-- pass -->
<a href="#main-content">Skip to main content</a>
<nav>…</nav>
<main id="main-content">…</main>
```

---

### Iframes

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `iframe-no-title` | serious | 4.1.2 Name, Role, Value |

**`iframe-no-title`** — `<iframe>` is missing a `title` attribute describing its content.
```html
<!-- violation -->
<iframe src="https://maps.example.com/embed"></iframe>

<!-- pass -->
<iframe src="https://maps.example.com/embed" title="Office location map"></iframe>
```

---

### Image inputs

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `input-image-no-alt` | critical | 1.1.1 Non-text Content |

**`input-image-no-alt`** — `<input type="image">` has no `alt` attribute.
```html
<!-- violation -->
<input type="image" src="submit-btn.png">

<!-- pass -->
<input type="image" src="submit-btn.png" alt="Submit form">
```

---

### Duplicate IDs

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `duplicate-id` | serious | 4.1.1 Parsing |

**`duplicate-id`** — Two or more elements share the same `id` value, breaking label associations and ARIA references.
```html
<!-- violation -->
<div id="banner">Header</div>
<div id="banner">Footer</div>

<!-- pass -->
<div id="site-header">Header</div>
<div id="site-footer">Footer</div>
```

---

## Level AA — requires Pro plan (5 rules)

### Landmark regions

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `landmark-main-missing` | serious | 1.3.6 Identify Purpose |
| `landmark-nav-missing` | moderate | 2.4.1 Bypass Blocks |

**`landmark-main-missing`** — Page has no `<main>` element or `role="main"`.
```html
<!-- violation -->
<div class="content">…</div>

<!-- pass -->
<main>…</main>
<!-- or -->
<div role="main">…</div>
```

**`landmark-nav-missing`** — Page has no `<nav>` element or `role="navigation"`.
```html
<!-- violation -->
<ul><li><a href="/">Home</a></li></ul>

<!-- pass -->
<nav><ul><li><a href="/">Home</a></li></ul></nav>
```

---

### Autoplay media

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `media-autoplay` | serious | 1.4.2 Audio Control |

**`media-autoplay`** — `<video>` or `<audio>` element has `autoplay` but not `muted`, meaning it will play audio automatically.
```html
<!-- violation -->
<video autoplay src="intro.mp4"></video>

<!-- pass -->
<video autoplay muted src="intro.mp4"></video>
<video src="intro.mp4" controls></video>
```

---

### Meta refresh

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `meta-refresh` | serious | 2.2.1 Timing Adjustable |

**`meta-refresh`** — Page uses `<meta http-equiv="refresh">` with a positive timeout, forcing an automatic reload that disrupts screen reader users.
```html
<!-- violation -->
<meta http-equiv="refresh" content="30">

<!-- pass — remove the tag entirely, or use 0 for an instant redirect -->
<meta http-equiv="refresh" content="0;url=/new-page">
```

---

### Error suggestion

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `error-no-suggestion` | moderate | 3.3.3 Error Suggestion |

**`error-no-suggestion`** — An invalid field (`aria-invalid="true"`) has no `aria-describedby` pointing to an element with error text.
```html
<!-- violation -->
<input type="email" aria-invalid="true">

<!-- pass -->
<p id="email-error">Please enter a valid email address.</p>
<input type="email" aria-invalid="true" aria-describedby="email-error">
```

---

## Level AAA — requires Enterprise plan (3 rules)

### Abbreviations

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `abbr-no-title` | minor | 3.1.4 Abbreviations |

**`abbr-no-title`** — `<abbr>` element has no `title` attribute providing the full expansion.
```html
<!-- violation -->
<abbr>WCAG</abbr>

<!-- pass -->
<abbr title="Web Content Accessibility Guidelines">WCAG</abbr>
```

---

### Duplicate link text

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `duplicate-link-text` | moderate | 2.4.9 Link Purpose — Link Only |

**`duplicate-link-text`** — Two or more links share identical visible text but point to different destinations, making purpose ambiguous out of context.
```html
<!-- violation -->
<a href="/cats">Read more</a>
<a href="/dogs">Read more</a>

<!-- pass -->
<a href="/cats">Read more about cats</a>
<a href="/dogs">Read more about dogs</a>
```

---

### Timed session

| Rule ID | Severity | WCAG |
|---------|----------|------|
| `timed-session` | moderate | 2.2.3 No Timing |

**`timed-session`** — An inline `<script>` (no `src`) contains `setTimeout` or `setInterval` alongside keywords like `session`, `timeout`, `expire`, or `logout`, suggesting a time limit without user control.
```html
<!-- violation -->
<script>
  setTimeout(function () { logout(); }, 1800000);
</script>

<!-- pass — warn the user and allow extension -->
<script src="/session-manager.js"></script>
```

---

## Severity levels and score penalties

| Severity | Score penalty per violation |
|----------|-----------------------------|
| critical | −20 |
| serious  | −10 |
| moderate | −5  |
| minor    | −2  |

Score = max(0, 100 − Σ penalties). A page with no violations scores 100.
