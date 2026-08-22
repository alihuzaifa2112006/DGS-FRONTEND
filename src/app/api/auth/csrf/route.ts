import { type NextRequest, type NextResponse } from 'next/server'
import { COOKIE } from '@/lib/env'
import { newCsrfToken } from '@/lib/auth/csrf'
import { setCsrfCookie } from '@/lib/auth/cookies'
import { ok } from '@/lib/http/response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/csrf — hand the browser a CSRF token.
 *
 * Sign-in and sign-up are writes too, so the very first form on a fresh
 * browser needs a token before it has a session. Existing tokens are
 * returned as-is: minting a new one on every call would break a second
 * tab mid-submit.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const existing = req.cookies.get(COOKIE.csrf)?.value
  const token = existing || newCsrfToken()

  const res = ok({ csrfToken: token })
  if (!existing) setCsrfCookie(res, token)

  // A cached CSRF token would be handed to the wrong browser.
  res.headers.set('Cache-Control', 'no-store')
  return res
}
