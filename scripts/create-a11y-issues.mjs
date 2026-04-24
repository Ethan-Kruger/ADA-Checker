#!/usr/bin/env node
/**
 * Reads the violations JSON written by ci-check.mjs and creates a GitHub issue
 * for each violation. Skips any violation that already has an open issue with
 * the same title so repeated runs don't create duplicates.
 *
 * Required env vars (set automatically by GitHub Actions):
 *   GITHUB_TOKEN        — for API auth
 *   GITHUB_REPOSITORY   — "owner/repo"
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const JSON_PATH = process.argv[2] || 'a11y-violations.json'
const TOKEN     = process.env.GITHUB_TOKEN
const REPO      = process.env.GITHUB_REPOSITORY  // "owner/repo"

if (!TOKEN || !REPO) {
  console.error('GITHUB_TOKEN and GITHUB_REPOSITORY must be set.')
  process.exit(1)
}

const fullPath = resolve(process.cwd(), JSON_PATH)
if (!existsSync(fullPath)) {
  console.log('No violations file found — nothing to do.')
  process.exit(0)
}

const { violations, level, threshold } = JSON.parse(readFileSync(fullPath, 'utf-8'))

if (!violations || violations.length === 0) {
  console.log('No violations — no issues to create.')
  process.exit(0)
}

const BASE = `https://api.github.com/repos/${REPO}`
const HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiGet(url) {
  const res = await fetch(url, { headers: HEADERS })
  return res.json()
}

async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })
  return res.json()
}

// Find "bugs" milestone number
async function getBugsMilestone() {
  const milestones = await apiGet(`${BASE}/milestones?state=open&per_page=50`)
  const m = milestones.find?.(m => m.title.toLowerCase() === 'bugs')
  return m?.number ?? null
}

// Check if an open issue with this exact title already exists
async function issueExists(title) {
  const encoded = encodeURIComponent(`"${title}" repo:${REPO} is:issue is:open`)
  const result  = await apiGet(`https://api.github.com/search/issues?q=${encoded}&per_page=1`)
  return (result.total_count ?? 0) > 0
}

// ── Main ──────────────────────────────────────────────────────────────────────

const SEVERITY_EMOJI = { critical: '🔴', serious: '🟠', moderate: '🟡', minor: '⚪' }

const milestone = await getBugsMilestone()
console.log(`Milestone "bugs" → #${milestone ?? 'not found, skipping'}`)
console.log(`Processing ${violations.length} violation(s)…\n`)

for (const v of violations) {
  const title = `[A11y] ${v.severity}: ${v.message} (${v.file})`

  if (await issueExists(title)) {
    console.log(`  SKIP (already open): ${title}`)
    continue
  }

  const emoji   = SEVERITY_EMOJI[v.severity] || '⚪'
  const wcag    = v.wcag    ? `**WCAG:** ${v.wcag}` : ''
  const element = v.element ? `\`\`\`html\n${v.element.slice(0, 300)}\n\`\`\`` : ''
  const fix     = v.remediation ? `## How to fix\n${v.remediation}` : ''

  const body = `## Accessibility violation

${emoji} **Severity:** ${v.severity}
**File:** \`${v.file}\` (score: ${v.score}/100, threshold: ${threshold})
**WCAG level checked:** ${level}
${wcag}

## Violation

${v.message}

${element ? `## Offending element\n\n${element}` : ''}

${fix}

---
*Auto-created by the [Accessibility check](../../actions/workflows/a11y-check.yml) workflow.*
`.trim()

  const payload = {
    title,
    body,
    labels: ['bug'],
    ...(milestone ? { milestone } : {}),
  }

  const created = await apiPost(`${BASE}/issues`, payload)

  if (created.number) {
    console.log(`  CREATED #${created.number}: ${title}`)

    // Add to ADA project #2
    try {
      const addResult = await apiPost(
        `https://api.github.com/repos/${REPO}/issues/${created.number}/labels`,
        {}
      )
      // Use gh CLI for project assignment (GraphQL not needed this way)
    } catch {}
  } else {
    console.error(`  FAILED to create: ${title}`, created.message ?? '')
  }
}

console.log('\nDone.')
