import { AuditLog } from '@/lib/db/models/AuditLog'
import { listSessions, revokeAllForUser } from '@/lib/auth/tokens'
import { withRoute } from '@/lib/http/route'
import { ok } from '@/lib/http/response'
import { RULES } from '@/lib/http/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/auth/sessions — devices currently signed in to this account. */
export const GET = withRoute(
  {
    auth: 'required',
    rateLimit: { rule: RULES.read, scope: 'sessions', by: 'user' },
  },
  async ({ user, claims }) => {
    const sessions = await listSessions(user!._id.toString(), claims?.fam)
    // Never cached: the whole point is to show what is live right now.
    return ok({ sessions }, { headers: { 'Cache-Control': 'no-store' } })
  },
)

/**
 * DELETE /api/auth/sessions — sign out everywhere else.
 *
 * The calling device is deliberately spared, so the user is not logged out
 * of the screen they just clicked the button on.
 */
export const DELETE = withRoute(
  { auth: 'required' },
  async ({ user, claims, ip, ua }) => {
    const revoked = await revokeAllForUser(user!._id.toString(), 'user_revoked_all', claims?.fam)

    await AuditLog.create({
      userId: user!._id,
      action: 'user.logout_all',
      ip,
      userAgent: ua,
      meta: { revoked },
    }).catch(() => {})

    return ok({ revoked })
  },
)
