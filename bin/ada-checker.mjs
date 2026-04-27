#!/usr/bin/env node
/**
 * ada-checker CLI
 *
 * Usage:
 *   npx ada-checker <url|file> [url|file ...] [options]
 *   npx ada-checker https://example.com --level AA --threshold 90
 *   npx ada-checker ./dist/index.html --json report.json
 *
 * Options:
 *   --level A|AA|AAA    WCAG level (default: AA)
 *   --threshold N       Minimum passing score 0-100 (default: 80)
 *   --json <path>       Write results JSON to file
 *
 * Exit codes:
 *   0  All targets passed
 *   1  One or more targets failed
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loadChecker } from '../scripts/load-checker.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  grey:   '\x1b[90m',
}
const SEVERITY_COLOR = {
  critical: C.red, serious: C.yellow, moderate: C.cyan, minor: C.grey,
}

// ── Args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
${C.bold}ada-checker${C.reset} — WCAG accessibility checker

  ${C.bold}Usage${C.reset}
    npx ada-checker <url|file> [url|file ...]

  ${C.bold}Options${C.reset}
    --level A|AA|AAA    WCAG level to check (default: AA)
    --threshold N       Minimum score to pass (default: 80)
    --json <path>       Write JSON report to file
    --help              Show this message

  ${C.bold}Examples${C.reset}
    npx ada-checker https://example.com
    npx ada-checker ./dist/index.html --level AA --threshold 90
    npx ada-checker https://example.com --json report.json
`)
  process.exit(0)
}

function getFlag(name, fallback) {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const level     = getFlag('--level', 'AA').toUpperCase()
const threshold = Number(getFlag('--threshold', '80'))
const jsonOut   = getFlag('--json', null)

if (!['A', 'AA', 'AAA'].includes(level)) {
  console.error(`${C.red}Error:${C.reset} --level must be A, AA, or AAA`)
  process.exit(1)
}

// Collect positional args (not flags or flag values)
const flagNames = new Set(['--level', '--threshold', '--json'])
const targets = args.filter((a, i) =>
  !a.startsWith('--') && !flagNames.has(args[i - 1])
)

if (targets.length === 0) {
  console.error(`${C.red}Error:${C.reset} provide at least one URL or file path`)
  process.exit(1)
}

// ── Load checker ──────────────────────────────────────────────────────────────
// Resolve checker.js relative to this file so it works when installed via npx
const checkerPath = resolve(__dirname, '../public/js/checker.js')
if (!existsSync(checkerPath)) {
  console.error(`${C.red}Error:${C.reset} checker.js not found at ${checkerPath}`)
  process.exit(1)
}
const checkAccessibility = loadChecker(checkerPath)

// ── Fetch or read each target ─────────────────────────────────────────────────
async function getHtml(target) {
  if (/^https?:\/\//i.test(target)) {
    const res = await fetch(target)
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return { label: target, html: await res.text() }
  }
  const abs = resolve(process.cwd(), target)
  if (!existsSync(abs)) throw new Error(`File not found: ${abs}`)
  return { label: target, html: readFileSync(abs, 'utf-8') }
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log(`\n${C.bold}ADA Accessibility Checker${C.reset}`)
console.log(`Level: WCAG ${level}   Threshold: ${threshold}/100\n`)
console.log('─'.repeat(72))

let anyFailed = false
const allViolations = []

for (const target of targets) {
  let label, html
  try {
    ;({ label, html } = await getHtml(target))
  } catch (e) {
    console.error(`\n${C.red}[ERROR]${C.reset} ${target}: ${e.message}`)
    anyFailed = true
    continue
  }

  const result  = checkAccessibility(html, level)
  const { score, violations, summary } = result
  const passed  = score >= threshold
  if (!passed) anyFailed = true

  for (const v of violations) allViolations.push({ target: label, score, ...v })

  const scoreColor = passed ? C.green : C.red
  const badge      = passed ? 'PASS' : 'FAIL'

  console.log(`\n${C.bold}${label}${C.reset}`)
  console.log(`  Score: ${scoreColor}${score}/100 [${badge}]${C.reset}`)

  if (violations.length === 0) {
    console.log(`  ${C.green}No violations${C.reset}`)
  } else {
    console.log(
      `  Violations: ` +
      `${summary.critical || 0} critical, ` +
      `${summary.serious  || 0} serious, ` +
      `${summary.moderate || 0} moderate, ` +
      `${summary.minor    || 0} minor`
    )
    for (const v of violations) {
      const col = SEVERITY_COLOR[v.severity] || ''
      console.log(`  ${col}[${v.severity}]${C.reset} ${v.message}`)
      if (v.element) console.log(`           ${C.grey}${v.element.slice(0, 100)}${C.reset}`)
    }
  }
}

console.log('\n' + '─'.repeat(72))

if (jsonOut) {
  writeFileSync(
    resolve(process.cwd(), jsonOut),
    JSON.stringify({ level, threshold, passed: !anyFailed, violations: allViolations }, null, 2)
  )
  console.log(`\nReport written to ${jsonOut}`)
}

if (anyFailed) {
  console.error(`\n${C.red}${C.bold}FAILED${C.reset} — one or more targets scored below ${threshold}.\n`)
  process.exit(1)
} else {
  console.log(`\n${C.green}${C.bold}PASSED${C.reset} — all targets scored ${threshold} or above.\n`)
  process.exit(0)
}
