#!/usr/bin/env node
/**
 * ADA Checker — CI accessibility gate
 *
 * Usage:
 *   node scripts/ci-check.mjs [--threshold 80] [--level A] [--json out.json] file1.html ...
 *
 * Options:
 *   --threshold N      Minimum passing score 0–100 (default: 80)
 *   --level A|AA|AAA   WCAG level to check against (default: A)
 *   --json <path>      Write violations as JSON to this path (used by CI issue creation)
 *
 * Exit codes:
 *   0  All files meet the threshold
 *   1  One or more files are below the threshold
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { Window } from 'happy-dom'

// Save before any globalThis.console override — used for all script output below
const out = { log: console.log.bind(console), error: console.error.bind(console) }

// ── Parse args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)

function flag(name, fallback) {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : fallback
}

const threshold = Number(flag('--threshold', '80'))
const level     = (flag('--level', 'A')).toUpperCase()
const jsonOut   = flag('--json', null)
const files     = args.filter((a, i) =>
  !a.startsWith('--') &&
  args[i - 1] !== '--threshold' &&
  args[i - 1] !== '--level' &&
  args[i - 1] !== '--json'
)

if (!files.length) {
  out.error('Usage: node scripts/ci-check.mjs [--threshold 80] [--level A] file1.html ...')
  process.exit(1)
}

// ── Load checker.js into a happy-dom window ───────────────────────────────────

const win = new Window({ url: 'https://localhost' })

// Patch globals so checker.js can run in Node's global scope
const _store = {}
globalThis.window      = {}           // checker assigns window.checkAccessibility
globalThis.document    = win.document // UI init code uses getElementById (returns null — ok)
globalThis.DOMParser   = win.DOMParser
globalThis.CSS         = win.CSS      // CSS.escape used in form-label check
globalThis.CustomEvent = class CustomEvent { constructor() {} }
globalThis.localStorage = {
  getItem:    (k)    => Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null,
  setItem:    (k, v) => { _store[k] = String(v) },
  removeItem: (k)    => { delete _store[k] },
}

// Silence checker.js UI-setup noise during eval (getElementById returns null).
// Indirect eval resolves `console` from globalThis; module-level console is unaffected.
globalThis.console = { log: () => {}, warn: () => {}, error: () => {}, info: () => {} }
const checkerSrc = readFileSync(resolve(process.cwd(), 'public/js/checker.js'), 'utf-8')
;(0, eval)(checkerSrc)   // sets globalThis.window.checkAccessibility
globalThis.console = { log: () => {}, warn: () => {}, error: () => {}, info: () => {} }  // keep silenced at runtime too

const checkAccessibility = globalThis.window.checkAccessibility
if (typeof checkAccessibility !== 'function') {
  out.error('ERROR: checkAccessibility not found after loading checker.js')
  process.exit(1)
}

// ── Scan files ────────────────────────────────────────────────────────────────

const SEVERITY_COLOR = { critical: '\x1b[31m', serious: '\x1b[33m', moderate: '\x1b[36m', minor: '\x1b[90m' }
const RESET = '\x1b[0m'
const BOLD  = '\x1b[1m'
const GREEN = '\x1b[32m'
const RED   = '\x1b[31m'

let anyFailed = false
const allViolations = []  // collected for --json output

out.log(`\n${BOLD}ADA Accessibility CI Check${RESET}`)
out.log(`Level: WCAG ${level}   Threshold: ${threshold}/100\n`)
out.log('─'.repeat(72))

for (const file of files) {
  const html   = readFileSync(resolve(process.cwd(), file), 'utf-8')
  const result = checkAccessibility(html, level)
  const { score, violations, summary } = result
  const passed = score >= threshold

  if (!passed) anyFailed = true

  // Collect violations with file context for --json output
  for (const v of violations) {
    allViolations.push({ file, score, ...v })
  }

  const scoreColor = passed ? GREEN : RED
  const label      = passed ? 'PASS' : 'FAIL'

  out.log(`\n${BOLD}${file}${RESET}`)
  out.log(`  Score:  ${scoreColor}${score}/100 [${label}]${RESET}`)

  if (violations.length === 0) {
    out.log(`  ${GREEN}No violations${RESET}`)
  } else {
    out.log(
      `  Violations: ` +
      `${summary.critical || 0} critical, ` +
      `${summary.serious  || 0} serious, ` +
      `${summary.moderate || 0} moderate, ` +
      `${summary.minor    || 0} minor`
    )
    for (const v of violations) {
      const c = SEVERITY_COLOR[v.severity] || ''
      out.log(`  ${c}[${v.severity}]${RESET} ${v.message}`)
      if (v.element) out.log(`           \x1b[90m${v.element.slice(0, 100)}${RESET}`)
    }
  }
}

out.log('\n' + '─'.repeat(72))

// Write JSON output if requested
if (jsonOut) {
  writeFileSync(
    resolve(process.cwd(), jsonOut),
    JSON.stringify({ level, threshold, passed: !anyFailed, violations: allViolations }, null, 2)
  )
  out.log(`\nViolations written to ${jsonOut}`)
}

if (anyFailed) {
  out.error(`\n${RED}${BOLD}FAILED${RESET} — one or more pages scored below ${threshold}.\n`)
  process.exit(1)
} else {
  out.log(`\n${GREEN}${BOLD}PASSED${RESET} — all pages scored ${threshold} or above.\n`)
  process.exit(0)
}
