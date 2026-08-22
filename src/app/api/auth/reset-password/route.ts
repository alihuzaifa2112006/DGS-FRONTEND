import { User, toPublicUser } from '@/lib/db/models/User'
import { PasswordReset } from '@/lib/db/models/PasswordReset'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { hashPassword, hashToken, verifyPassword } from '@/lib/auth/password'
import { revokeAllForUser } from '@/lib/auth/tokens'
import { establishSession } from '@/lib/auth/establish-session'
import { invalidateUser } from '@/lib/auth/current-user'
import { withRoute } from '@/lib/http/route'
import { ok, ApiError } from '@/lib/http/response'
import { RULES } from '@/lib/http/rate-limit'
import { resetPasswordSchema } from '@/lib/validation/schemas'
import type { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = z.infer<typeof resetPasswordSchema>

/**
 * POST /api/auth/reset-password — consume a reset link and set a new password.
 *
 * Whoever holds a valid link controls the account, so this has to assume
 * the old password is compromised: every existing session is revoked and
 * `tokenVersion` is bumped, which invalidates access tokens already in
 * flight. The browser doing the reset is then signed in fresh.
 */
export const POST = withRoute<Body>(
  {
    body: resetPasswordSchema,
    rateLimit: { rule: RULES.resetPassword, scope: 'reset' },
  },
  async ({ body, ip, ua }) => {
    const invalid = new ApiError(
      'BAD_REQUEST',
      'This reset link is invalid or has expired. Request a new one.',
      { token: 'This reset link is invalid or has expired.' },
    )

    // Claim atomically so a link cannot be redeemed twice by parallel requests.
    const record = await PasswordReset.findOneAndUpdate(
      { tokenHash: hashToken(body.token), usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { returnDocument: 'before' },
    )
    if (!record) throw invalid

    const user = await User.findById(record.userId).select('+passwordHash')
    if (!user || user.status !== 'active') throw invalid

    if (await verifyPassword(body.password, user.passwordHash)) {
      throw new ApiError('VALIDATION_FAILED', 'Please check the highlighted fields.', {
        password: 'That is already your current password. Choose a different one.',
      })
    }

    user.passwordHash = await hashPassword(body.password)
    user.passwordChangedAt = new Date()
    user.tokenVersion += 1
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.lastLoginAt = new Date()
    await user.save()

    invalidateUser(user._id.toString())
    await revokeAllForUser(user._id.toString(), 'password_reset')

    const res = ok({ user: toPublicUser(user.toObject()) })
    await establishSession(res, user, { ip, userAgent: ua, remember: false })

    await AuditLog.create({
      userId: user._id,
      email: user.email,
      action: 'password.reset_completed',
      ip,
      userAgent: ua,
    }).catch(() => {})

    return res
  },
)
