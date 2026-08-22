import { NextResponse, type NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { COOKIE } from '@/lib/env'

/* ------------------------------------------------------------------
   Runs on the edge, before any page renders. Two jobs:

   1. Attach security headers to every response.
   2. Keep signed-out visitors out of /app/*, and signed-in ones out of
      the login screen.

   Deliberately free of database imports — mongoose cannot run here, and
   the JWT alone is enough to answer "is there a plausible session?".
   The authoritative check still happens in each API route.
   ------------------------------------------------------------------ */

const PROTECTED = ['/app']
const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  const accessToken = req.cookies.get(COOKIE.access)?.value
  const hasSessionHint = req.cookies.get(COOKIE.hint)?.value === '1'

  let signedIn = false
  if (accessToken) {
    const result = await verifyAccessToken(accessToken)
    // An expired access token still means a session exists — the client
    // will refresh it. Bouncing to /login here would log people out every
    // fifteen minutes.
    signedIn = result.ok || (result.reason === 'expired' && hasSessionHint)
  } else {
    signedIn = hasSessionHint
  }

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !signedIn) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    // Send them back where they were headed once they sign in.
    if (pathname !== '/app') url.searchParams.set('next', `${pathname}${search}`)
    return harden(NextResponse.redirect(url))
  }

  // A signed-in user landing on /login has nothing to do there.
  // /reset-password is exempt: following a reset link while signed in is valid.
  if (signedIn && AUTH_PAGES.includes(pathname) && pathname !== '/reset-password') {
    const url = req.nextUrl.clone()
    url.pathname = '/app'
    url.search = ''
    return harden(NextResponse.redirect(url))
  }

  return harden(NextResponse.next())
}

/**
 * `unsafe-inline`/`unsafe-eval` on scripts are required by the Next.js dev
 * overlay and by the framework's inline bootstrap. Tightening this to a
 * nonce-based policy is the next step if the CSP needs to be airtight.
 */
function harden(res: NextResponse): NextResponse {
  const h = res.headers
  h.set('X-Content-Type-Options', 'nosniff')
  h.set('X-Frame-Options', 'DENY')
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  h.set('X-DNS-Prefetch-Control', 'off')
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  h.set('Cross-Origin-Opener-Policy', 'same-origin')
  h.set('Cross-Origin-Resource-Policy', 'same-origin')

  if (process.env.NODE_ENV === 'production') {
    h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  h.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      // The API Tester deliberately calls third-party hosts from the browser.
      "connect-src 'self' https: http:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  )

  return res
}

export const config = {
  matcher: [
    /*
     * Everything except Next's own assets and the favicon. API routes are
     * included so they pick up the security headers too.
     */
    '/((?!_next/static|_next/image|favicon.svg|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
