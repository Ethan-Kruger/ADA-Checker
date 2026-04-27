/**
 * Loads checker.js into Node via happy-dom so API routes can run
 * accessibility checks server-side. The module is evaluated once and
 * the resulting function is cached for the lifetime of the process.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Window } from 'happy-dom'

export interface Violation {
  ruleId: string
  severity: 'critical' | 'serious' | 'moderate' | 'minor'
  message: string
  element?: string
  remediation?: string
  wcag?: string
}

export interface Summary {
  total: number
  critical: number
  serious: number
  moderate: number
  minor: number
}

export interface CheckResult {
  score: number
  level: string
  violations: Violation[]
  summary: Summary
}

// Patch and eval checker.js exactly once; store result in module scope.
const _checkFn = ((): (html: string, level: string) => CheckResult => {
  const win  = new Window({ url: 'https://localhost' })
  const store: Record<string, string> = {}
  const g    = globalThis as Record<string, unknown>

  g['document']     = win.document
  g['DOMParser']    = win.DOMParser
  g['CSS']          = win.CSS
  g['CustomEvent']  = class {}
  g['window']       = {} as Record<string, unknown>
  g['localStorage'] = {
    getItem:    (k: string) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    setItem:    (k: string, v: string) => { store[k] = String(v) },
    removeItem: (k: string) => { delete store[k] },
  }

  const prev = g['console']
  g['console'] = { log: () => {}, warn: () => {}, error: () => {}, info: () => {} }
  const src = readFileSync(resolve(process.cwd(), 'public/js/checker.js'), 'utf-8')
  ;(0, eval)(src)
  g['console'] = prev

  const win2 = g['window'] as Record<string, unknown>
  const fn   = win2['checkAccessibility']
  if (typeof fn !== 'function') {
    throw new Error('checkAccessibility not found after loading checker.js')
  }
  return fn as (html: string, level: string) => CheckResult
})()

export function runCheck(html: string, level: string): CheckResult {
  return _checkFn(html, level)
}
