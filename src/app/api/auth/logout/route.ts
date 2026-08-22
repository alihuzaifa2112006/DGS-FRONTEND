import { type NextRequest, type NextResponse } from 'next/server'
import { connectDb } from '@/lib/db/mongoose'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { revokeToken, revokeAllForUser } from '@/lib/auth/tokens'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { readAuth, invalidateUser } from '@/lib/auth/current-user'
import { verifyCsrf } from '@/lib/auth/csrf'
import { clientIp, fail, ok, userAgent } from '@/lib/http/response'
import { COOKIE } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/logout      — end this device's session.
 * POST /api/auth/logout?all=1 — end every session for the account.
 *
 * Hand-rolled rather than using `withRoute` because logout must succeed
 * even when the access token has already expired: the goal is to clear
 * cookies, and refusing to do that would strand the user signed-in-looking
 * with a dead session.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (!csrf.ok) return fail('CSRF_FAILED', csrf.reason)

  const ip = clientIp(req)
  const ua = userAgent(req)
  const all = req.nextUrl.searchParams.get('all') === '1'

  const res = ok({ loggedOut: true })
  clearAuthCookies(res)

  try {
    await connectDb()
    const raw = req.cookies.get(COOKIE.refresh)?.value
    const auth = await readAuth(req)
    const userId =
      auth.state === 'authenticated' ? auth.user._id.toString() : undefined

    if (all && userId) {
      await revokeAllForUser(userId, 'logout_all')
      invalidateUser(userId)
    } else if (raw) {
      await revokeToken(raw, 'logout')
    }

    if (userId) {
      await AuditLog.create({
        userId,
        action: all ? 'user.logout_all' : 'user.logout',
        ip,
        userAgent: ua,
      }).catch(() => {})
    }
  } catch (err) {
    // The cookies are already cleared on `res`, so the browser is signed
    // out regardless. A stale row in Mongo expires on its own via the TTL
    // index — not worth failing the request over.
    console.error('[api] POST /api/auth/logout —', err)
  }

  return res
}
