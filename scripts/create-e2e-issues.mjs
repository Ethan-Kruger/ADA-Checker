#!/usr/bin/env node
/**
 * Reads the Playwright JSON report and creates a GitHub issue for each
 * failing test. Skips tests that already have an open issue with the same
 * title so repeated CI runs don't create duplicates.
 *
 * Required env vars (set automatically by GitHub Actions):
 *   GITHUB_TOKEN       — for API auth
 *   GITHUB_REPOSITORY  — "owner/repo"
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const JSON_PATH = process.argv[2] || 'e2e-results.json'
const TOKEN     = process.env.GITHUB_TOKEN
const REPO      = process.env.GITHUB_REPOSITORY

if (!TOKEN || !REPO) {
  console.error('GITHUB_TOKEN and GITHUB_REPOSITORY must be set.')
  process.exit(1)
}

const fullPath = resolve(process.cwd(), JSON_PATH)
if (!existsSync(fullPath)) {
  console.log('No results file found — nothing to do.')
  process.exit(0)
}

const report = JSON.parse(readFileSync(fullPath, 'utf-8'))

// Flatten all specs into individual test results
const failures = []
for (const suite of report.suites ?? []) {
  collectFailures(suite, failures)
}

function collectFailures(suite, out) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const failed = test.results?.some(r => r.status === 'failed' || r.status === 'timedOut')
      if (!failed) continue
      const result = test.results.find(r => r.status === 'failed' || r.status === 'timedOut')
      out.push({
        title:    spec.title,
        fullTitle: `${suite.title} › ${spec.title}`.replace(/\s*›\s*/g, ' › '),
        file:     spec.file,
        error:    result?.error?.message ?? 'Unknown error',
        snippet:  result?.error?.snippet ?? '',
        duration: result?.duration ?? 0,
        status:   result?.status ?? 'failed',
      })
    }
  }
  // Recurse into nested suites
  for (const child of suite.suites ?? []) {
    collectFailures(child, out)
  }
}

if (failures.length === 0) {
  console.log('No test failures — no issues to create.')
  process.exit(0)
}

const BASE    = `https://api.github.com/repos/${REPO}`
const HEADERS = {
  'Authorization':        `Bearer ${TOKEN}`,
  'Accept':               'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type':         'application/json',
}

async function apiGet(url) {
  const res = await fetch(url, { headers: HEADERS })
  return res.json()
}

async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })
  return res.json()
}

async function getBugsMilestone() {
  const milestones = await apiGet(`${BASE}/milestones?state=open&per_page=50`)
  const m = milestones.find?.(m => m.title.toLowerCase() === 'bugs')
  return m?.number ?? null
}

async function issueExists(title) {
  const encoded = encodeURIComponent(`"${title}" repo:${REPO} is:issue is:open`)
  const result  = await apiGet(`https://api.github.com/search/issues?q=${encoded}&per_page=1`)
  return (result.total_count ?? 0) > 0
}

const milestone = await getBugsMilestone()
console.log(`Milestone "bugs" → #${milestone ?? 'not found'}`)
console.log(`Processing ${failures.length} failure(s)…\n`)

for (const f of failures) {
  const issueTitle = `[E2E] ${f.fullTitle}`

  if (await issueExists(issueTitle)) {
    console.log(`  SKIP (already open): ${issueTitle}`)
    continue
  }

  const statusIcon = f.status === 'timedOut' ? '⏱️' : '❌'
  const ms = f.duration ? `${(f.duration / 1000).toFixed(1)}s` : 'n/a'

  const body = `## E2E test failure

${statusIcon} **Status:** ${f.status}
**Test:** \`${f.fullTitle}\`
**File:** \`${f.file}\`
**Duration:** ${ms}

## Error

\`\`\`
${f.error.slice(0, 1000)}
\`\`\`

${f.snippet ? `## Code location\n\n\`\`\`\n${f.snippet.slice(0, 500)}\n\`\`\`` : ''}

---
*Auto-created by the [E2E Tests](../../actions/workflows/e2e.yml) workflow.*
`.trim()

  const created = await apiPost(`${BASE}/issues`, {
    title:  issueTitle,
    body,
    labels: ['bug'],
    ...(milestone ? { milestone } : {}),
  })

  if (created.number) {
    console.log(`  CREATED #${created.number}: ${issueTitle}`)
  } else {
    console.error(`  FAILED to create: ${issueTitle}`, created.message ?? '')
  }
}

console.log('\nDone.')
