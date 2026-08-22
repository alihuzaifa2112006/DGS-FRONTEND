import { Types } from 'mongoose'
import { User } from '@/lib/db/models/User'
import { PasswordReset } from '@/lib/db/models/PasswordReset'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { hashToken, randomToken } from '@/lib/auth/password'
import { withRoute } from '@/lib/http/route'
import { ok } from '@/lib/http/response'
import { RULES } from '@/lib/http/rate-limit'
import { forgotPasswordSchema } from '@/lib/validation/schemas'
import { sendMail, passwordResetMail } from '@/lib/mail/mailer'
import { env } from '@/lib/env'
import type { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = z.infer<typeof forgotPasswordSchema>

/**
 * POST /api/auth/forgot-password — email a single-use reset link.
 *
 * The response is identical whether or not the address is registered.
 * This endpoint is unauthenticated and trivially scriptable, so telling
 * the truth here would turn it into a free account-enumeration oracle.
 */
export const POST = withRoute<Body>(
  {
    body: forgotPasswordSchema,
    rateLimit: { rule: RULES.forgotPassword, scope: 'forgot' },
  },
  async ({ body, ip, ua }) => {
    const generic = ok({
      sent: true,
      message: 'If that email has an account, a reset link is on its way.',
    })

    const user = await User.findOne({ email: body.email, status: 'active' }).select('_id email').lean()
    if (!user) return generic

    // One live link at a time — requesting a new one invalidates the old.
    await PasswordReset.updateMany(
      { userId: user._id, usedAt: null },
      { $set: { usedAt: new Date() } },
    )

    const raw = randomToken(32)
    await PasswordReset.create({
      userId: new Types.ObjectId(user._id),
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + env.RESET_TOKEN_TTL * 1000),
      ip,
    })

    const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(raw)}`
    await sendMail(passwordResetMail(user.email, link, Math.round(env.RESET_TOKEN_TTL / 60)))

    await AuditLog.create({
      userId: user._id,
      email: user.email,
      action: 'password.reset_requested',
      ip,
      userAgent: ua,
    }).catch(() => {})

    return generic
  },
)
