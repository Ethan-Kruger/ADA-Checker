import { describe, it, expect } from 'vitest'

interface Issue {
  ruleId: string
  severity: 'critical' | 'serious' | 'moderate' | 'minor'
  element: string
  message: string
  remediation: string
  wcag: string
}

interface CheckResult {
  score: number
  violations: Issue[]
  summary: { total: number; critical: number; serious: number; moderate: number; minor: number }
  level: string
}

const eng = globalThis as unknown as { checkAccessibility(html: string, level?: string): CheckResult }
const run = (html: string, level = 'AA') => eng.checkAccessibility(html, level)
const has = (html: string, rule: string) => run(html).violations.some(v => v.ruleId === rule)

// Minimal clean HTML — passes all Level A + AA checks
const page = (content = '') =>
  `<html lang="en"><head><title>T</title></head><body>` +
  `<a href="#m">Skip to main content</a><nav><a href="/">Home</a></nav>` +
  `<main id="m"><h1>Title</h1>${content}</main></body></html>`

// ── Score (AA level) ─────────────────────────────────────────────────────────

describe('score at AA level', () => {
  it('perfect HTML scores 100', () => {
    expect(run(page()).score).toBe(100)
  })

  it('result level is AA', () => {
    expect(run(page()).level).toBe('AA')
  })
})

// ── landmark-main-missing ────────────────────────────────────────────────────

describe('landmark-main-missing', () => {
  it('flags page with no main landmark', () => {
    const html = `<html lang="en"><head><title>T</title></head><body>` +
      `<a href="#m">Skip to main content</a><nav><a href="/">H</a></nav>` +
      `<h1>Title</h1></body></html>`
    expect(has(html, 'landmark-main-missing')).toBe(true)
  })

  it('passes page with main element', () => {
    expect(has(page(), 'landmark-main-missing')).toBe(false)
  })

  it('passes page with role="main"', () => {
    const html = `<html lang="en"><head><title>T</title></head><body>` +
      `<a href="#m">Skip to main content</a><nav><a href="/">H</a></nav>` +
      `<div role="main"><h1>Title</h1></div></body></html>`
    expect(has(html, 'landmark-main-missing')).toBe(false)
  })
})

// ── landmark-nav-missing ─────────────────────────────────────────────────────

describe('landmark-nav-missing', () => {
  it('flags page with no nav landmark', () => {
    const html = `<html lang="en"><head><title>T</title></head><body>` +
      `<a href="#m">Skip to main content</a>` +
      `<main id="m"><h1>Title</h1></main></body></html>`
    expect(has(html, 'landmark-nav-missing')).toBe(true)
  })

  it('passes page with nav element', () => {
    expect(has(page(), 'landmark-nav-missing')).toBe(false)
  })

  it('passes page with role="navigation"', () => {
    const html = `<html lang="en"><head><title>T</title></head><body>` +
      `<a href="#m">Skip to main content</a>` +
      `<div role="navigation"><a href="/">Home</a></div>` +
      `<main id="m"><h1>Title</h1></main></body></html>`
    expect(has(html, 'landmark-nav-missing')).toBe(false)
  })
})

// ── media-autoplay ───────────────────────────────────────────────────────────

describe('media-autoplay', () => {
  it('flags video with autoplay and no muted', () => {
    expect(has(page('<video autoplay src="x.mp4"></video>'), 'media-autoplay')).toBe(true)
  })

  it('flags audio with autoplay and no muted', () => {
    expect(has(page('<audio autoplay src="x.mp3"></audio>'), 'media-autoplay')).toBe(true)
  })

  it('passes video with autoplay + muted', () => {
    expect(has(page('<video autoplay muted src="x.mp4"></video>'), 'media-autoplay')).toBe(false)
  })

  it('passes video without autoplay', () => {
    expect(has(page('<video src="x.mp4" controls></video>'), 'media-autoplay')).toBe(false)
  })
})

// ── meta-refresh ─────────────────────────────────────────────────────────────

describe('meta-refresh', () => {
  it('flags meta refresh with positive timeout', () => {
    const html = `<html lang="en"><head><title>T</title>` +
      `<meta http-equiv="refresh" content="30"></head><body>` +
      `<a href="#m">Skip to main content</a><nav><a href="/">H</a></nav>` +
      `<main id="m"><h1>Title</h1></main></body></html>`
    expect(has(html, 'meta-refresh')).toBe(true)
  })

  it('passes meta refresh with 0 (instant redirect)', () => {
    const html = `<html lang="en"><head><title>T</title>` +
      `<meta http-equiv="refresh" content="0;url=/new"></head><body>` +
      `<a href="#m">Skip to main content</a><nav><a href="/">H</a></nav>` +
      `<main id="m"><h1>Title</h1></main></body></html>`
    expect(has(html, 'meta-refresh')).toBe(false)
  })

  it('passes page with no meta refresh', () => {
    expect(has(page(), 'meta-refresh')).toBe(false)
  })
})

// ── error-no-suggestion ──────────────────────────────────────────────────────

describe('error-no-suggestion', () => {
  it('flags aria-invalid field with no aria-describedby', () => {
    expect(has(page('<input aria-label="Email" aria-invalid="true">'), 'error-no-suggestion')).toBe(true)
  })

  it('flags aria-invalid field whose aria-describedby points at empty element', () => {
    const html = page('<p id="err"></p><input aria-label="Email" aria-invalid="true" aria-describedby="err">')
    expect(has(html, 'error-no-suggestion')).toBe(true)
  })

  it('passes aria-invalid field with descriptive error element', () => {
    const html = page(
      '<p id="err">Please enter a valid email address.</p>' +
      '<input aria-label="Email" aria-invalid="true" aria-describedby="err">'
    )
    expect(has(html, 'error-no-suggestion')).toBe(false)
  })

  it('passes valid field (no aria-invalid)', () => {
    expect(has(page('<input aria-label="Email">'), 'error-no-suggestion')).toBe(false)
  })
})
