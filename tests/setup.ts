import { readFileSync } from 'fs'
import { resolve } from 'path'

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
