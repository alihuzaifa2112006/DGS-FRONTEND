import { User } from '@/lib/db/models/User'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { revokeAllForUser } from '@/lib/auth/tokens'
import { establishSession } from '@/lib/auth/establish-session'
import { invalidateUser } from '@/lib/auth/current-user'
import { withRoute } from '@/lib/http/route'
import { ok, ApiError } from '@/lib/http/response'
import { RULES } from '@/lib/http/rate-limit'
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validation/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/account/password — change the password from Settings.
 *
 * Re-checks the current password even though the caller is already signed
 * in: without it, a borrowed laptop or an XSS foothold turns into
 * permanent account ownership.
 */
export const POST = withRoute<ChangePasswordInput>(
  {
    auth: 'required',
    body: changePasswordSchema,
    rateLimit: { rule: RULES.changePassword, scope: 'change-password', by: 'user' },
  },
  async ({ body, user, ip, ua }) => {
    const fresh = await User.findById(user!._id).select('+passwordHash')
    if (!fresh) throw new ApiError('NOT_FOUND', 'Account not found.')

    const valid = await verifyPassword(body.currentPassword, fresh.passwordHash)
    if (!valid) {
      await AuditLog.create({
        userId: fresh._id,
        action: 'user.login_failed',
        ip,
        userAgent: ua,
        meta: { at: 'change-password' },
      }).catch(() => {})

      throw new ApiError('VALIDATION_FAILED', 'Please check the highlighted fields.', {
        currentPassword: 'That is not your current password.',
      })
    }

    fresh.passwordHash = await hashPassword(body.newPassword)
    fresh.passwordChangedAt = new Date()

    // Bumping the version invalidates access tokens already issued, so
    // other devices lose access within seconds rather than at expiry.
    if (body.signOutOthers) fresh.tokenVersion += 1

    await fresh.save()
    invalidateUser(fresh._id.toString())

    const res = ok({
      changed: true,
      signedOutOthers: Boolean(body.signOutOthers),
    })

    if (body.signOutOthers) {
      await revokeAllForUser(fresh._id.toString(), 'password_change')
      // The version bump just invalidated this device's own tokens too —
      // re-issue so the user is not logged out of the page they are on.
      await establishSession(res, fresh, { ip, userAgent: ua, remember: true })
    }

    await AuditLog.create({
      userId: fresh._id,
      action: 'password.change',
      ip,
      userAgent: ua,
      meta: { signedOutOthers: Boolean(body.signOutOthers) },
    }).catch(() => {})

    return res
  },
)
