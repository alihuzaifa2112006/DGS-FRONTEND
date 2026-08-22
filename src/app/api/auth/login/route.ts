import { User, toPublicUser, type UserDoc } from '@/lib/db/models/User'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { verifyPassword, fakeVerify, needsRehash, hashPassword } from '@/lib/auth/password'
import { establishSession } from '@/lib/auth/establish-session'
import { invalidateUser } from '@/lib/auth/current-user'
import { withRoute } from '@/lib/http/route'
import { ok, ApiError } from '@/lib/http/response'
import { RULES } from '@/lib/http/rate-limit'
import { loginSchema, type LoginInput } from '@/lib/validation/schemas'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login
 *
 * Two limits stack here. The route-level limiter caps attempts per IP;
 * the per-account counter below caps attempts against one email no matter
 * how many addresses they come from, which is what stops a slow
 * distributed guess against a single user.
 */
export const POST = withRoute<LoginInput>(
  {
    body: loginSchema,
    rateLimit: { rule: RULES.login, scope: 'login' },
  },
  async ({ body, ip, ua }) => {
    const user = await User.findOne({ email: body.email }).select('+passwordHash')

    if (!user) {
      // Spend the same CPU as a real verify so response time does not
      // reveal whether the address is registered.
      await fakeVerify()
      throw new ApiError('UNAUTHORIZED', 'Email or password is incorrect.')
    }

    if (user.status !== 'active') {
      throw new ApiError('FORBIDDEN', 'This account has been suspended. Contact support.')
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      throw new ApiError(
        'ACCOUNT_LOCKED',
        `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      )
    }

    const valid = await verifyPassword(body.password, user.passwordHash)

    if (!valid) {
      await registerFailure(user, ip, ua)
      throw new ApiError('UNAUTHORIZED', 'Email or password is incorrect.')
    }

    // Transparently upgrade hashes made with older scrypt parameters.
    if (needsRehash(user.passwordHash)) {
      user.passwordHash = await hashPassword(body.password)
    }

    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.lastLoginAt = new Date()
    await user.save()
    invalidateUser(user._id.toString())

    const res = ok({ user: toPublicUser(user.toObject()) })
    await establishSession(res, user, { ip, userAgent: ua, remember: body.remember })

    await AuditLog.create({
      userId: user._id,
      email: user.email,
      action: 'user.login',
      ip,
      userAgent: ua,
    }).catch(() => {})

    return res
  },
)

async function registerFailure(user: UserDoc & { save: () => Promise<unknown> }, ip: string, ua: string) {
  user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1

  const locked = user.failedLoginAttempts >= env.MAX_LOGIN_ATTEMPTS
  if (locked) {
    user.lockedUntil = new Date(Date.now() + env.LOGIN_LOCK_SECONDS * 1000)
    user.failedLoginAttempts = 0
  }

  await user.save()
  invalidateUser(user._id.toString())

  await AuditLog.create({
    userId: user._id,
    email: user.email,
    action: locked ? 'user.login_locked' : 'user.login_failed',
    ip,
    userAgent: ua,
  }).catch(() => {})
}
