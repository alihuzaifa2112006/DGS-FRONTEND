'use client'

import { useSyncExternalStore } from 'react'
import { apiGet, apiPost, ApiClientError } from '@/lib/api'

/* ------------------------------------------------------------------
   Client-side auth state.

   The session itself lives in httpOnly cookies the browser cannot read —
   this store only mirrors "who is signed in", answered by /api/auth/me.
   Nothing here is trusted by the server; it exists so the UI knows what
   to render.
   ------------------------------------------------------------------ */

export interface AuthUser {
  id: string
  email: string
  name: string
  org: string | null
  role: string
  timezone: string
  plan: 'free' | 'pro' | 'enterprise'
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
}

/* ---------------- store ---------------- */

const SYNC_KEY = 'dgs.auth.ping'

let state: AuthState = { status: 'loading', user: null }
const listeners = new Set<() => void>()

/** Frozen so `useSyncExternalStore` sees a stable reference between renders. */
const SERVER_SNAPSHOT: AuthState = Object.freeze({ status: 'loading', user: null })

function setState(next: AuthState) {
  if (next.status === state.status && next.user?.id === state.user?.id && next.user === state.user) {
    return
  }
  state = next
  listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  if (listeners.size === 1) void bootstrap()

  const onStorage = (e: StorageEvent) => {
    // Another tab signed in or out — re-check rather than trusting the payload.
    if (e.key === SYNC_KEY) void loadUser()
  }
  window.addEventListener('storage', onStorage)

  /**
   * Cookies can change without this tab hearing about it — a sign-in
   * elsewhere, a session restored, a refresh that landed after we had
   * already given up. Re-checking when the tab regains focus is cheap
   * (the response is ETag'd) and stops the UI from being stuck on a
   * stale verdict.
   */
  let lastCheck = 0
  const onFocus = () => {
    const now = Date.now()
    if (now - lastCheck < 5000) return // do not hammer on rapid tab switching
    lastCheck = now
    void loadUser()
  }
  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onFocus()
  })

  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('focus', onFocus)
  }
}

const getSnapshot = () => state
const getServerSnapshot = () => SERVER_SNAPSHOT

/** Tells other tabs something changed. The value only has to differ. */
function pingOtherTabs() {
  try {
    localStorage.setItem(SYNC_KEY, String(Date.now()))
  } catch {
    /* private mode — cross-tab sync is a nicety, not a requirement */
  }
}

/* ---------------- data ---------------- */

let bootstrapped = false

async function bootstrap() {
  if (bootstrapped) return
  bootstrapped = true
  await loadUser()
}

export async function loadUser(): Promise<AuthUser | null> {
  try {
    const data = await apiGet<{ user: AuthUser | null }>('/api/auth/me')
    // A 304 resolves to undefined — the cached body is still accurate.
    if (data === undefined) {
      if (state.status === 'loading') setState({ status: state.user ? 'authenticated' : 'anonymous', user: state.user })
      return state.user
    }
    setState({ status: data.user ? 'authenticated' : 'anonymous', user: data.user })
    return data.user
  } catch (err) {
    if (err instanceof ApiClientError && err.code === 'NETWORK') {
      // Offline is not signed-out. Leave whatever we last knew in place.
      if (state.status === 'loading') setState({ status: 'anonymous', user: null })
      return state.user
    }
    setState({ status: 'anonymous', user: null })
    return null
  }
}

/** Called by the login and signup forms with the user the API returned. */
export function applySession(user: AuthUser) {
  bootstrapped = true
  setState({ status: 'authenticated', user })
  pingOtherTabs()
}

/** Patches the cached user after a profile or avatar save. */
export function updateSessionUser(user: AuthUser) {
  setState({ status: 'authenticated', user })
}

export async function signOut(everywhere = false): Promise<void> {
  try {
    await apiPost(`/api/auth/logout${everywhere ? '?all=1' : ''}`)
  } catch {
    // The cookies are cleared server-side even on a partial failure, and if
    // the request never landed there is nothing useful left to do here.
  }
  setState({ status: 'anonymous', user: null })
  pingOtherTabs()
}

/* ---------------- hooks ---------------- */

/** Full auth state — use when you need to distinguish "loading" from "signed out". */
export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Just the user, or null. Renders as null during SSR and the first paint. */
export function useSession(): AuthUser | null {
  return useAuth().user
}

/** Non-reactive read, for event handlers. */
export function getSession(): AuthUser | null {
  return state.user
}
