# ADA / Accessibility Rules Roadmap

This document outlines which accessibility rules ADA-Checker aims to cover, their priority, and the planned timeline.

---

## Priority Levels
- **P0 – Must have**: Core rules that make pages basically usable with assistive tech.
- **P1 – Important**: Strongly recommended rules that improve accessibility a lot.
- **P2 – Nice to have**: Additional polish and advanced checks.

---

## Phase 1 – Core semantics and text (P0)
**Goal:** Make sure basic structure and text alternatives are present.
**Target:** Next 2–4 weeks

Planned rules:
- **Headings & structure**
  - Check there is exactly one `<h1>` per page
  - Flag skipped heading levels (e.g. `h1` → `h3`)
- **Images**
  - `<img>` elements must have `alt` attributes
  - Flag obviously empty or placeholder alt text (e.g. `alt="image"`)
- **Links & buttons**
  - Links must have accessible text (no empty `<a>`)
  - `<button>` elements must have visible/accessible text
- **Page language**
  - `<html>` should have a `lang` attribute

Deliverables:
- Implement these checks in ADA-Checker
- Add examples in the docs showing errors and how to fix them

---

## Phase 2 – Forms and focus (P0 / P1)
**Goal:** Make forms and focus handling usable with keyboard and screen readers.
**Target:** 4–8 weeks

Planned rules:
- **Form labels**
  - Form controls (`input`, `select`, `textarea`) must have labels (using `<label for>` or `aria-label`)
- **Required fields**
  - Required fields should be indicated to assistive tech (e.g. `aria-required="true"` or `required`)
- **Focus styles**
  - Interactive elements must have visible focus styles (not removed by CSS)
- **Keyboard accessibility**
  - Flag elements that look like buttons/links but are just `<div>`/`<span>` with click handlers

Deliverables:
- Implement form and focus checks
- Add documentation and examples

---

## Phase 3 – Color and contrast (P1)
**Goal:** Improve readability for low-vision users.
**Target:** 8–12 weeks

Planned rules:
- **Text contrast**
  - Check color contrast ratio for text against its background (AA level where possible)
- **Non-text contrast (stretch goal)**
  - Check contrast for key UI components (buttons, input borders, etc.)

Deliverables:
- Implement basic color contrast checks for text
- Document how ADA-Checker calculates contrast and its limitations

---

## Phase 4 – ARIA and advanced patterns (P1 / P2)
**Goal:** Avoid common ARIA misuse and improve advanced widgets.
**Target:** 12+ weeks

Planned rules:
- **ARIA usage**
  - Warn on invalid `role` values
  - Warn on ARIA attributes that don’t match the element role
- **Landmarks**
  - Encourage use of landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`, etc.)
- **Custom widgets (stretch)**
  - Basic checks for custom modals, menus, and dialogues (ARIA roles and focus management)

Deliverables:
- Implement initial ARIA checks
- Add guidance in docs about when *not* to use ARIA

---

## Tracking and status

For each rule, we’ll track status using GitHub issues:
- **Planned** – described in roadmap but not started
- **In progress** – actively being implemented
- **Done** – implemented and documented

We will:
- Link individual rule issues back to this roadmap
- Update this file as rules are added, removed, or re-prioritized
