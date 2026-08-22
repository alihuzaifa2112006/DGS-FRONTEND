import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'

/* ------------------------------------------------------------------
   Two layers, aimed at different costs.

   1. ETag / 304        — saves bandwidth. The browser still asks, but
                          an unchanged body comes back empty.
   2. In-process TTL    — saves the database round-trip entirely, for
                          reads a warm container repeats constantly
                          (`/api/auth/me` on every page transition).
   ------------------------------------------------------------------ */

export function etagOf(payload: unknown): string {
  const json = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return `W/"${createHash('sha1').update(json).digest('base64url')}"`
}

/**
 * Returns a 304 when the client already holds this exact body.
 * `Vary: Cookie` matters: without it a shared cache could hand one
 * user's profile to the next.
 */
export function withEtag<T>(
  req: Request,
  data: T,
  opts: { maxAge?: number; private?: boolean } = {},
): NextResponse {
  const body = { ok: true as const, data }
  const etag = etagOf(body)
  const cacheControl = opts.private === false
    ? `public, max-age=${opts.maxAge ?? 60}`
    : `private, no-cache, max-age=${opts.maxAge ?? 0}, must-revalidate`

  const headers: Record<string, string> = {
    ETag: etag,
    'Cache-Control': cacheControl,
    Vary: 'Cookie, Accept-Encoding',
  }

  if (req.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers })
  }
  return NextResponse.json(body, { headers })
}

/* ---------------- in-process TTL cache ---------------- */

interface Entry<T> {
  value: T
  expires: number
}

const store = new Map<string, Entry<unknown>>()
const MAX_ENTRIES = 1000

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key)
  if (!hit) return undefined
  if (hit.expires <= Date.now()) {
    store.delete(key)
    return undefined
  }
  // Refresh insertion order so the sweep below evicts genuinely cold keys.
  store.delete(key)
  store.set(key, hit)
  return hit.value as T
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): T {
  if (store.size >= MAX_ENTRIES) {
    // Map preserves insertion order — the first key is the least recently used.
    const oldest = store.keys().next()
    if (!oldest.done) store.delete(oldest.value)
  }
  store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })
  return value
}

export function cacheDelete(key: string) {
  store.delete(key)
}

/** Drops every entry under a prefix — used to invalidate one user's reads. */
export function cacheInvalidatePrefix(prefix: string) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k)
}

export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key)
  if (hit !== undefined) return hit
  return cacheSet(key, await load(), ttlSeconds)
}

export const userCacheKey = (userId: string) => `user:${userId}`
