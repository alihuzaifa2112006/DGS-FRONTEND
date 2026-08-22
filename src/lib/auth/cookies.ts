import type { NextResponse } from 'next/server'
import { COOKIE, env } from '@/lib/env'

/**
 * Auth cookies. Everything except the CSRF token is httpOnly, so page
 * scripts (and anything injected into them) cannot read the session.
 */
const baseCookie = {
  httpOnly: true,
  secure: env.isProd,
  // Lax, not Strict: a user following a link back from their email client
  // should land signed in. Combined with the CSRF token + Origin check,
  // this is safe against cross-site writes.
  sameSite: 'lax' as const,
  path: '/',
}

export function setAccessCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE.access, token, { ...baseCookie, maxAge: env.ACCESS_TOKEN_TTL })
}

export function setRefreshCookie(res: NextResponse, token: string, maxAgeSeconds: number) {
  res.cookies.set(COOKIE.refresh, token, {
    ...baseCookie,
    // Scoped as tightly as the refresh endpoints allow, so the long-lived
    // credential is not attached to every request for a CSS file.
    path: '/api/auth',
    maxAge: maxAgeSeconds,
  })
  // Same lifetime, no secret in it — see COOKIE.hint.
  res.cookies.set(COOKIE.hint, '1', { ...baseCookie, maxAge: maxAgeSeconds })
}

/** Readable by JS on purpose — the client echoes it back in a header. */
export function setCsrfCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE.csrf, token, {
    httpOnly: false,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: env.REFRESH_TOKEN_TTL,
  })
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(COOKIE.access, '', { ...baseCookie, maxAge: 0 })
  res.cookies.set(COOKIE.refresh, '', { ...baseCookie, path: '/api/auth', maxAge: 0 })
  res.cookies.set(COOKIE.hint, '', { ...baseCookie, maxAge: 0 })
  res.cookies.set(COOKIE.csrf, '', { httpOnly: false, secure: env.isProd, sameSite: 'lax', path: '/', maxAge: 0 })
}
