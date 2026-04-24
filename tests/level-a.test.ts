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
const run = (html: string, level = 'A') => eng.checkAccessibility(html, level)
const has = (html: string, rule: string, level = 'A') =>
  run(html, level).violations.some(v => v.ruleId === rule)

// Minimal clean HTML — passes all Level A checks (score 100)
const page = (content = '') =>
  `<html lang="en"><head><title>T</title></head><body>` +
  `<a href="#m">Skip to main content</a><nav><a href="/">Home</a></nav>` +
  `<main id="m"><h1>Title</h1>${content}</main></body></html>`

// ── Score ────────────────────────────────────────────────────────────────────

describe('score', () => {
  it('perfect HTML scores 100', () => {
    expect(run(page()).score).toBe(100)
  })

  it('one critical violation subtracts 20', () => {
    expect(run(page('<img src="x.png">')).score).toBe(80)
  })

  it('result includes level', () => {
    expect(run(page()).level).toBe('A')
  })
})

// ── img-alt-missing ──────────────────────────────────────────────────────────

describe('img-alt-missing', () => {
  it('flags image with no alt attribute', () => {
    expect(has(page('<img src="dog.png">'), 'img-alt-missing')).toBe(true)
  })

  it('passes image with descriptive alt', () => {
    expect(has(page('<img src="dog.png" alt="A golden retriever">'), 'img-alt-missing')).toBe(false)
  })

  it('passes decorative image with empty alt', () => {
    expect(has(page('<img src="divider.png" alt="">'), 'img-alt-missing')).toBe(false)
  })

  it('violation is severity critical', () => {
    const v = run(page('<img src="x.png">')).violations.find(x => x.ruleId === 'img-alt-missing')
    expect(v?.severity).toBe('critical')
  })
})

// ── img-alt-generic ──────────────────────────────────────────────────────────

describe('img-alt-generic', () => {
  it('flags generic word as alt', () => {
    expect(has(page('<img src="x.png" alt="image">'), 'img-alt-generic')).toBe(true)
  })

  it('flags filename as alt', () => {
    expect(has(page('<img src="x.png" alt="photo.jpg">'), 'img-alt-generic')).toBe(true)
  })

  it('passes descriptive alt', () => {
    expect(has(page('<img src="x.png" alt="Two engineers pair-programming">'), 'img-alt-generic')).toBe(false)
  })
})

// ── form-label-missing ───────────────────────────────────────────────────────

describe('form-label-missing', () => {
  it('flags input with no label or aria attributes', () => {
    expect(has(page('<input type="text">'), 'form-label-missing')).toBe(true)
  })

  it('passes input with aria-label', () => {
    expect(has(page('<input type="text" aria-label="Full name">'), 'form-label-missing')).toBe(false)
  })

  it('passes input linked to label element', () => {
    const html = page('<label for="nm">Name</label><input id="nm" type="text">')
    expect(has(html, 'form-label-missing')).toBe(false)
  })

  it('passes hidden input', () => {
    expect(has(page('<input type="hidden" name="csrf">'), 'form-label-missing')).toBe(false)
  })
})

// ── form-label-placeholder-only ──────────────────────────────────────────────

describe('form-label-placeholder-only', () => {
  it('flags input with placeholder but no label', () => {
    expect(has(page('<input type="text" placeholder="Enter name">'), 'form-label-placeholder-only')).toBe(true)
  })

  it('passes input with both aria-label and placeholder', () => {
    const html = page('<input type="text" aria-label="Name" placeholder="Enter name">')
    expect(has(html, 'form-label-placeholder-only')).toBe(false)
  })
})

// ── link-empty ───────────────────────────────────────────────────────────────

describe('link-empty', () => {
  it('flags anchor with no text', () => {
    expect(has(page('<a href="/page"></a>'), 'link-empty')).toBe(true)
  })

  it('passes anchor with descriptive text', () => {
    expect(has(page('<a href="/about">About our team</a>'), 'link-empty')).toBe(false)
  })

  it('passes anchor with aria-label', () => {
    expect(has(page('<a href="/icon" aria-label="Go to dashboard"></a>'), 'link-empty')).toBe(false)
  })
})

// ── link-vague ───────────────────────────────────────────────────────────────

describe('link-vague', () => {
  it('flags "click here"', () => {
    expect(has(page('<a href="/p">click here</a>'), 'link-vague')).toBe(true)
  })

  it('flags "read more"', () => {
    expect(has(page('<a href="/p">read more</a>'), 'link-vague')).toBe(true)
  })

  it('flags "learn more"', () => {
    expect(has(page('<a href="/p">learn more</a>'), 'link-vague')).toBe(true)
  })

  it('passes descriptive link text', () => {
    expect(has(page('<a href="/p">Read the annual accessibility report</a>'), 'link-vague')).toBe(false)
  })
})

// ── page-title-missing ───────────────────────────────────────────────────────

describe('page-title-missing', () => {
  it('flags page with no title element', () => {
    expect(has('<html lang="en"><head></head><body><h1>X</h1></body></html>', 'page-title-missing')).toBe(true)
  })

  it('flags page with empty title', () => {
    expect(has('<html lang="en"><head><title></title></head><body><h1>X</h1></body></html>', 'page-title-missing')).toBe(true)
  })

  it('passes page with descriptive title', () => {
    expect(has(page(), 'page-title-missing')).toBe(false)
  })
})

// ── heading-no-h1 ────────────────────────────────────────────────────────────

describe('heading-no-h1', () => {
  it('flags page with no h1', () => {
    const html = `<html lang="en"><head><title>T</title></head><body>` +
      `<a href="#m">Skip to main content</a><nav><a href="/">Home</a></nav>` +
      `<main id="m"><h2>Section</h2></main></body></html>`
    expect(has(html, 'heading-no-h1')).toBe(true)
  })

  it('passes page with h1', () => {
    expect(has(page(), 'heading-no-h1')).toBe(false)
  })
})

// ── heading-skip ─────────────────────────────────────────────────────────────

describe('heading-skip', () => {
  it('flags h1 directly followed by h3', () => {
    expect(has(page('<h2>Sub</h2><h4>Skip!</h4>'), 'heading-skip')).toBe(true)
  })

  it('passes sequential headings', () => {
    expect(has(page('<h2>Section</h2><h3>Sub-section</h3>'), 'heading-skip')).toBe(false)
  })
})

// ── heading-empty ────────────────────────────────────────────────────────────

describe('heading-empty', () => {
  it('flags empty h2', () => {
    expect(has(page('<h2></h2>'), 'heading-empty')).toBe(true)
  })

  it('passes h2 with text', () => {
    expect(has(page('<h2>Features</h2>'), 'heading-empty')).toBe(false)
  })
})

// ── html-lang-missing ────────────────────────────────────────────────────────

describe('html-lang-missing', () => {
  it('flags html element with no lang', () => {
    expect(has('<html><head><title>T</title></head><body><h1>X</h1></body></html>', 'html-lang-missing')).toBe(true)
  })

  it('passes html element with lang', () => {
    expect(has(page(), 'html-lang-missing')).toBe(false)
  })
})

// ── aria-role-invalid ────────────────────────────────────────────────────────

describe('aria-role-invalid', () => {
  it('flags unrecognised ARIA role', () => {
    expect(has(page('<div role="foobar">X</div>'), 'aria-role-invalid')).toBe(true)
  })

  it('passes valid ARIA role', () => {
    expect(has(page('<div role="button">Click</div>'), 'aria-role-invalid')).toBe(false)
  })
})

// ── aria-labelledby-missing ──────────────────────────────────────────────────

describe('aria-labelledby-missing', () => {
  it('flags aria-labelledby pointing at nonexistent id', () => {
    expect(has(page('<input aria-labelledby="ghost">'), 'aria-labelledby-missing')).toBe(true)
  })

  it('passes aria-labelledby pointing at existing id', () => {
    const html = page('<span id="lbl">Name</span><input aria-labelledby="lbl">')
    expect(has(html, 'aria-labelledby-missing')).toBe(false)
  })
})

// ── aria-hidden-focusable ────────────────────────────────────────────────────

describe('aria-hidden-focusable', () => {
  it('flags focusable element inside aria-hidden container', () => {
    expect(has(page('<div aria-hidden="true"><button>X</button></div>'), 'aria-hidden-focusable')).toBe(true)
  })

  it('flags aria-hidden on an anchor itself', () => {
    expect(has(page('<a href="/x" aria-hidden="true">link</a>'), 'aria-hidden-focusable')).toBe(true)
  })

  it('passes non-focusable content inside aria-hidden', () => {
    expect(has(page('<div aria-hidden="true"><span>decorative</span></div>'), 'aria-hidden-focusable')).toBe(false)
  })
})

// ── table-no-headers ─────────────────────────────────────────────────────────

describe('table-no-headers', () => {
  it('flags table with no th elements', () => {
    expect(has(page('<table><tr><td>Data</td></tr></table>'), 'table-no-headers')).toBe(true)
  })

  it('passes table with th', () => {
    const html = page('<table><caption>Sales</caption><tr><th scope="col">Month</th></tr><tr><td>Jan</td></tr></table>')
    expect(has(html, 'table-no-headers')).toBe(false)
  })
})

// ── table-th-no-scope ────────────────────────────────────────────────────────

describe('table-th-no-scope', () => {
  it('flags th without scope attribute', () => {
    const html = page('<table><caption>Data</caption><tr><th>Header</th></tr></table>')
    expect(has(html, 'table-th-no-scope')).toBe(true)
  })

  it('passes th with scope attribute', () => {
    const html = page('<table><caption>Sales</caption><tr><th scope="col">Month</th></tr></table>')
    expect(has(html, 'table-th-no-scope')).toBe(false)
  })
})

// ── table-no-caption ─────────────────────────────────────────────────────────

describe('table-no-caption', () => {
  it('flags table without caption', () => {
    const html = page('<table><tr><th scope="col">Col</th></tr></table>')
    expect(has(html, 'table-no-caption')).toBe(true)
  })

  it('passes table with caption', () => {
    const html = page('<table><caption>Sales by month</caption><tr><th scope="col">Month</th></tr></table>')
    expect(has(html, 'table-no-caption')).toBe(false)
  })
})

// ── button-no-name ───────────────────────────────────────────────────────────

describe('button-no-name', () => {
  it('flags button with no accessible name', () => {
    expect(has(page('<button></button>'), 'button-no-name')).toBe(true)
  })

  it('passes button with text', () => {
    expect(has(page('<button>Submit form</button>'), 'button-no-name')).toBe(false)
  })

  it('passes button with aria-label', () => {
    expect(has(page('<button aria-label="Close dialog"></button>'), 'button-no-name')).toBe(false)
  })
})

// ── skip-link-missing ────────────────────────────────────────────────────────

describe('skip-link-missing', () => {
  it('flags page with no skip link', () => {
    const html = '<html lang="en"><head><title>T</title></head><body><main><h1>T</h1></main></body></html>'
    expect(has(html, 'skip-link-missing')).toBe(true)
  })

  it('passes page with skip link as first anchor', () => {
    expect(has(page(), 'skip-link-missing')).toBe(false)
  })
})

// ── iframe-no-title ──────────────────────────────────────────────────────────

describe('iframe-no-title', () => {
  it('flags iframe with no title', () => {
    expect(has(page('<iframe></iframe>'), 'iframe-no-title')).toBe(true)
  })

  it('passes iframe with title', () => {
    expect(has(page('<iframe title="Interactive map"></iframe>'), 'iframe-no-title')).toBe(false)
  })
})

// ── input-image-no-alt ───────────────────────────────────────────────────────

describe('input-image-no-alt', () => {
  it('flags image input with no alt', () => {
    expect(has(page('<input type="image" src="submit.png">'), 'input-image-no-alt')).toBe(true)
  })

  it('passes image input with alt', () => {
    expect(has(page('<input type="image" src="submit.png" alt="Submit form">'), 'input-image-no-alt')).toBe(false)
  })
})

// ── duplicate-id ─────────────────────────────────────────────────────────────

describe('duplicate-id', () => {
  it('flags two elements sharing the same id', () => {
    expect(has(page('<div id="foo">A</div><div id="foo">B</div>'), 'duplicate-id')).toBe(true)
  })

  it('passes elements with unique ids', () => {
    expect(has(page('<div id="foo">A</div><div id="bar">B</div>'), 'duplicate-id')).toBe(false)
  })
})
