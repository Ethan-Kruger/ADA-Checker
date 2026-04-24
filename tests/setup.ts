import { readFileSync } from 'fs'
import { resolve } from 'path'

// happy-dom prints DOMException for every iframe it parses directly to process.stderr
// (bypassing console.error). Filter that known noise out.
const _origWrite = process.stderr.write.bind(process.stderr)
;(process.stderr as unknown as { write: (...a: unknown[]) => boolean }).write = (
  chunk: unknown,
  ...rest: unknown[]
): boolean => {
  const text = typeof chunk === 'string' ? chunk : String(chunk)
  if (text.includes('iframe page') && text.includes('loading is disabled')) {
    const cb = rest.find(a => typeof a === 'function') as (() => void) | undefined
    cb?.()
    return true
  }
  return (_origWrite as (...a: unknown[]) => boolean)(chunk, ...rest)
}

// happy-dom's localStorage is incomplete — replace it with a working implementation
const _store: Record<string, string> = {}
;(globalThis as unknown as Record<string, unknown>).localStorage = {
  getItem: (k: string): string | null =>
    Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null,
  setItem: (k: string, v: string): void => { _store[k] = String(v) },
  removeItem: (k: string): void => { delete _store[k] },
  clear: (): void => { Object.keys(_store).forEach(k => delete _store[k]) },
  key: (i: number): string | null => Object.keys(_store)[i] ?? null,
  get length(): number { return Object.keys(_store).length },
}

// Load checker.js — indirect eval runs in global scope (== happy-dom window)
const src = readFileSync(resolve(process.cwd(), 'public/js/checker.js'), 'utf-8')
;(0, eval)(src)
