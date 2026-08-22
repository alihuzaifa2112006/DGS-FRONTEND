import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { COOKIE, env } from '@/lib/env'
import { randomToken } from '@/lib/auth/password'

export const CSRF_HEADER = 'x-csrf-token'

export function newCsrfToken(): string {
  return randomToken(24)
}

/**
 * Double-submit cookie plus an Origin check.
 *
 * A cross-site attacker can make the browser *send* our cookies, but cannot
 * read the CSRF cookie to copy it into the header, and cannot forge the
 * Origin. Either check alone has gaps (subdomain injection defeats the
 * first, missing Origin headers the second); together they close.
 */
export function verifyCsrf(req: NextRequest): { ok: true } | { ok: false; reason: string } {
  const origin = req.headers.get('origin')
  if (origin) {
    if (!isAllowedOrigin(origin)) return { ok: false, reason: 'Origin not allowed.' }
  } else {
    // No Origin header (older clients, some same-origin form posts) — fall
    // back to Referer when it is present.
    const referer = req.headers.get('referer')
    if (referer) {
      let refOrigin: string
      try {
        refOrigin = new URL(referer).origin
      } catch {
        return { ok: false, reason: 'Malformed Referer.' }
      }
      if (!isAllowedOrigin(refOrigin)) return { ok: false, reason: 'Referer not allowed.' }
    }
  }

  const cookie = req.cookies.get(COOKIE.csrf)?.value
  const header = req.headers.get(CSRF_HEADER)
  if (!cookie || !header) return { ok: false, reason: 'Missing CSRF token.' }
  if (!safeEqual(cookie, header)) return { ok: false, reason: 'CSRF token mismatch.' }
  return { ok: true }
}

function isAllowedOrigin(origin: string): boolean {
  if (origin === env.APP_URL) return true
  // Vercel preview deployments get a generated hostname per commit.
  if (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`) return true
  if (env.isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true
  return false
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}
