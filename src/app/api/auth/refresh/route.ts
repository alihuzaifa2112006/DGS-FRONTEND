import { NextResponse, type NextRequest } from 'next/server'
import { connectDb } from '@/lib/db/mongoose'
import { User, toPublicUser } from '@/lib/db/models/User'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { rotateRefreshToken } from '@/lib/auth/tokens'
import { signAccessToken } from '@/lib/auth/jwt'
import { setAccessCookie, setCsrfCookie, setRefreshCookie, clearAuthCookies } from '@/lib/auth/cookies'
import { newCsrfToken } from '@/lib/auth/csrf'
import { loadUser } from '@/lib/auth/current-user'
import { rateLimit, rateLimitHeaders, RULES } from '@/lib/http/rate-limit'
import { clientIp, fail, ok, userAgent } from '@/lib/http/response'
import { COOKIE } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/refresh — swap the refresh cookie for a new access token.
 *
 * Deliberately not wrapped in `withRoute`: this is the one endpoint that
 * must work while the access token is expired, and it authenticates with
 * the refresh cookie itself rather than with a session. CSRF is covered by
 * the cookie being SameSite=Lax and path-scoped to /api/auth — a
 * cross-site POST cannot read the rotated token out of the response.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req)
  const ua = userAgent(req)

  const limit = await rateLimit(`refresh:ip:${ip}`, RULES.refresh)
  if (!limit.allowed) {
    return fail('RATE_LIMITED', `Too many requests. Try again in ${limit.retryAfter}s.`, {
      headers: rateLimitHeaders(limit),
    })
  }

  const raw = req.cookies.get(COOKIE.refresh)?.value
  if (!raw) return fail('UNAUTHORIZED', 'No active session.')

  try {
    await connectDb()
    const rotated = await rotateRefreshToken(raw, { ip, userAgent: ua })

    if (!rotated.ok) {
      // Reuse means the token was replayed — the family is already revoked
      // by `rotateRefreshToken`. Every failure path clears the cookies so
      // the browser stops retrying with a dead credential.
      const res = fail(
        'UNAUTHORIZED',
        rotated.reason === 'reused'
          ? 'This session was ended for security reasons. Please sign in again.'
          : 'Your session has expired. Please sign in again.',
      )
      clearAuthCookies(res)
      return res
    }

    const user = await loadUser(rotated.userId)
    if (!user || user.status !== 'active') {
      const res = fail('UNAUTHORIZED', 'Your session has expired. Please sign in again.')
      clearAuthCookies(res)
      return res
    }

    const accessToken = await signAccessToken({
      userId: rotated.userId,
      email: user.email,
      tokenVersion: user.tokenVersion,
      family: rotated.family,
    })

    const res = ok({ user: toPublicUser(user) })
    setAccessCookie(res, accessToken)
    setRefreshCookie(res, rotated.raw, rotated.maxAge)
    setCsrfCookie(res, newCsrfToken())

    await AuditLog.create({
      userId: user._id,
      action: 'token.refresh',
      ip,
      userAgent: ua,
    }).catch(() => {})

    return res
  } catch (err) {
    console.error('[api] POST /api/auth/refresh —', err)
    return fail('SERVER_ERROR', 'Something went wrong. Please try again.')
  }
}

/** Kept so a stray GET does not 405 the client into a confusing state. */
export async function GET(): Promise<NextResponse> {
  return fail('BAD_REQUEST', 'Use POST to refresh a session.')
}

// `User` is imported for its side effect of registering the model before
// `loadUser` runs on a cold container.
void User
