/**
 * Shared checker loader — used by both ci-check.mjs and the CLI bin.
 * Loads checker.js into Node via happy-dom and returns checkAccessibility().
 *
 * @param {string} checkerPath  Absolute path to checker.js
 */
import { readFileSync } from 'fs'
import { Window } from 'happy-dom'

export function loadChecker(checkerPath) {
  const win    = new Window({ url: 'https://localhost' })
  const _store = {}

  globalThis.window      = {}
  globalThis.document    = win.document
  globalThis.DOMParser   = win.DOMParser
  globalThis.CSS         = win.CSS
  globalThis.CustomEvent = class CustomEvent { constructor() {} }
  globalThis.localStorage = {
    getItem:    (k)    => Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null,
    setItem:    (k, v) => { _store[k] = String(v) },
    removeItem: (k)    => { delete _store[k] },
  }

  const prev = globalThis.console
  globalThis.console = { log: () => {}, warn: () => {}, error: () => {}, info: () => {} }
  ;(0, eval)(readFileSync(checkerPath, 'utf-8'))
  globalThis.console = prev

  const fn = globalThis.window?.checkAccessibility
  if (typeof fn !== 'function') {
    throw new Error(`checkAccessibility not found in ${checkerPath}`)
  }
  return fn
}
