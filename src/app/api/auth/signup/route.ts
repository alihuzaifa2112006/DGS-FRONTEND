import { User, toPublicUser } from '@/lib/db/models/User'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { hashPassword } from '@/lib/auth/password'
import { establishSession } from '@/lib/auth/establish-session'
import { withRoute } from '@/lib/http/route'
import { ok, ApiError } from '@/lib/http/response'
import { RULES } from '@/lib/http/rate-limit'
import { signupSchema, type SignupInput } from '@/lib/validation/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST /api/auth/signup — create an account and sign the browser in. */
export const POST = withRoute<SignupInput>(
  {
    body: signupSchema,
    rateLimit: { rule: RULES.signup, scope: 'signup' },
  },
  async ({ body, ip, ua }) => {
    const existing = await User.findOne({ email: body.email }).select('_id').lean()
    if (existing) {
      // There is no email-verification step in this product, so a generic
      // "check your inbox" would strand the user. We accept that this
      // confirms the address exists; the login limiter is what protects it.
      throw new ApiError('CONFLICT', 'An account with that email already exists.', {
        email: 'An account with that email already exists.',
      })
    }

    const passwordHash = await hashPassword(body.password)

    const user = await User.create({
      name: body.name,
      email: body.email,
      org: body.org || undefined,
      passwordHash,
      lastLoginAt: new Date(),
      passwordChangedAt: new Date(),
    })

    const res = ok({ user: toPublicUser(user.toObject()) }, { status: 201 })
    await establishSession(res, user, { ip, userAgent: ua, remember: true })

    await AuditLog.create({
      userId: user._id,
      email: user.email,
      action: 'user.signup',
      ip,
      userAgent: ua,
    }).catch(() => {})

    return res
  },
)
