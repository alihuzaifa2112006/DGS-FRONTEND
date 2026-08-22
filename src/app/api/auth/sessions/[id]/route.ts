import { Types } from 'mongoose'
import { RefreshToken } from '@/lib/db/models/RefreshToken'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { revokeFamily } from '@/lib/auth/tokens'
import { withRoute } from '@/lib/http/route'
import { ok, ApiError } from '@/lib/http/response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** DELETE /api/auth/sessions/:id — sign one specific device out. */
export const DELETE = withRoute({ auth: 'required' }, async ({ user, params, ip, ua }) => {
  const id = params.id
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError('NOT_FOUND', 'That session no longer exists.')
  }

  // Scoped to the caller's own id, so a guessed session id from another
  // account resolves to nothing rather than revoking someone else's device.
  const record = await RefreshToken.findOne({
    _id: new Types.ObjectId(id),
    userId: user!._id,
  })
    .select('family')
    .lean()

  if (!record) throw new ApiError('NOT_FOUND', 'That session no longer exists.')

  // Revoke the whole family: the row the user clicked is only the newest
  // rotation of that device's session.
  await revokeFamily(record.family, 'user_revoked')

  await AuditLog.create({
    userId: user!._id,
    action: 'session.revoke',
    ip,
    userAgent: ua,
    meta: { family: record.family },
  }).catch(() => {})

  return ok({ revoked: true })
})
