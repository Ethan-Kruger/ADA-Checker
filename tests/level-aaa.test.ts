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
const run = (html: string, level = 'AAA') => eng.checkAccessibility(html, level)
const has = (html: string, rule: string) => run(html).violations.some(v => v.ruleId === rule)

// Minimal clean HTML — passes all Level A + AA + AAA checks
const page = (content = '') =>
  `<html lang="en"><head><title>T</title></head><body>` +
  `<a href="#m">Skip to main content</a><nav><a href="/">Home</a></nav>` +
  `<main id="m"><h1>Title</h1>${content}</main></body></html>`

// ── Score (AAA level) ────────────────────────────────────────────────────────

describe('score at AAA level', () => {
  it('perfect HTML scores 100', () => {
    expect(run(page()).score).toBe(100)
  })

  it('result level is AAA', () => {
    expect(run(page()).level).toBe('AAA')
  })
})

// ── abbr-no-title ────────────────────────────────────────────────────────────

describe('abbr-no-title', () => {
  it('flags abbr with no title attribute', () => {
    expect(has(page('<abbr>HTML</abbr>'), 'abbr-no-title')).toBe(true)
  })

  it('flags abbr with empty title', () => {
    expect(has(page('<abbr title="">HTML</abbr>'), 'abbr-no-title')).toBe(true)
  })

  it('passes abbr with title expansion', () => {
    expect(has(page('<abbr title="HyperText Markup Language">HTML</abbr>'), 'abbr-no-title')).toBe(false)
  })

  it('violation is severity minor', () => {
    const v = run(page('<abbr>CSS</abbr>')).violations.find(x => x.ruleId === 'abbr-no-title')
    expect(v?.severity).toBe('minor')
  })
})

// ── duplicate-link-text ──────────────────────────────────────────────────────

describe('duplicate-link-text', () => {
  it('flags identical link text pointing to different hrefs', () => {
    const html = page('<a href="/cats">About us</a><a href="/dogs">About us</a>')
    expect(has(html, 'duplicate-link-text')).toBe(true)
  })

  it('passes links with the same text going to the same href', () => {
    const html = page('<a href="/cats">About us</a><a href="/cats">About us</a>')
    expect(has(html, 'duplicate-link-text')).toBe(false)
  })

  it('passes links with unique text', () => {
    const html = page('<a href="/cats">About cats</a><a href="/dogs">About dogs</a>')
    expect(has(html, 'duplicate-link-text')).toBe(false)
  })
})

// ── timed-session ────────────────────────────────────────────────────────────

describe('timed-session', () => {
  it('flags inline script with setTimeout and session/timeout keywords', () => {
    const html = page('<script>setTimeout(function(){ logout(); }, 1800000);</script>')
    expect(has(html, 'timed-session')).toBe(true)
  })

  it('flags inline script with setInterval and expire keyword', () => {
    const html = page('<script>setInterval(checkSession, 60000); /* session expire */</script>')
    expect(has(html, 'timed-session')).toBe(true)
  })

  it('passes inline script with no timing or session logic', () => {
    const html = page('<script>console.log("hello");</script>')
    expect(has(html, 'timed-session')).toBe(false)
  })

  it('passes external script (no inline content)', () => {
    const html = page('<script src="/app.js"></script>')
    expect(has(html, 'timed-session')).toBe(false)
  })
})
