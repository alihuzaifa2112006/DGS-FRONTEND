'use client'

import { useMemo, useSyncExternalStore } from 'react'

const KEY = 'dgs.session'

export interface Session {
  email?: string
  name?: string
  at?: number
}

/* ------------------------------------------------------------------
   Fake auth for the UI build. Swap these three functions for real
   calls (cookie/session endpoint) and every screen keeps working.
   ------------------------------------------------------------------ */

export function getSession(): Session | null {
  return parse(readRaw())
}

export function setSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session))
  emit()
}

export function clearSession() {
  localStorage.removeItem(KEY)
  emit()
}

/**
 * Reads the session in a render-safe way. Server render returns null and React
 * swaps in the real value after hydration — no mismatch, no setState-in-effect.
 */
export function useSession(): Session | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null)
  return useMemo(() => parse(raw), [raw])
}

/* ---------------- internals ---------------- */

const listeners = new Set<() => void>()

function readRaw(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(KEY)
}

function parse(raw: string | null): Session | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // keep other tabs in sync
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}
