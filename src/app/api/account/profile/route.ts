import { User, toPublicUser, type UserDoc } from '@/lib/db/models/User'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { invalidateUser } from '@/lib/auth/current-user'
import { withRoute } from '@/lib/http/route'
import { ok, ApiError } from '@/lib/http/response'
import { withEtag } from '@/lib/http/cache'
import { RULES } from '@/lib/http/rate-limit'
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validation/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/account/profile — the signed-in user's editable fields. */
export const GET = withRoute(
  {
    auth: 'required',
    rateLimit: { rule: RULES.read, scope: 'profile-read', by: 'user' },
  },
  async ({ req, user }) => withEtag(req, { user: toPublicUser(user!) }),
)

/**
 * PATCH /api/account/profile — update name, company, role, timezone.
 *
 * Email is intentionally not editable here. Changing the address that
 * receives password-reset links is an account-takeover step, so it needs
 * a verification flow of its own rather than riding along with the
 * display-name form.
 */
export const PATCH = withRoute<UpdateProfileInput>(
  {
    auth: 'required',
    body: updateProfileSchema,
    rateLimit: { rule: RULES.profileUpdate, scope: 'profile-write', by: 'user' },
  },
  async ({ body, user, ip, ua }) => {
    const update: Partial<Pick<UserDoc, 'name' | 'org' | 'role'>> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.org !== undefined) update.org = body.org
    if (body.role !== undefined) update.role = body.role

    const updated = await User.findByIdAndUpdate(
      user!._id,
      { $set: update },
      { new: true, runValidators: true },
    ).lean<UserDoc | null>()

    if (!updated) throw new ApiError('NOT_FOUND', 'Account not found.')

    invalidateUser(user!._id.toString())

    await AuditLog.create({
      userId: user!._id,
      action: 'profile.update',
      ip,
      userAgent: ua,
      meta: { fields: Object.keys(update) },
    }).catch(() => {})

    return ok({ user: toPublicUser(updated) })
  },
)
