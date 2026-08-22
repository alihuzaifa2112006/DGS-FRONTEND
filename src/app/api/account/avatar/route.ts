import { User, toPublicUser, type UserDoc } from '@/lib/db/models/User'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { invalidateUser } from '@/lib/auth/current-user'
import { randomToken } from '@/lib/auth/password'
import { withRoute } from '@/lib/http/route'
import { ok, ApiError } from '@/lib/http/response'
import { RULES } from '@/lib/http/rate-limit'
import { sniffImage } from '@/lib/http/image'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/account/avatar — upload a profile picture (multipart/form-data,
 * field name `file`).
 *
 * The bytes live in the user document. That keeps the deploy free of an
 * object-store dependency, which is the right trade at avatar sizes; if
 * these ever get large, this is the one route to move to S3 or Vercel Blob.
 */
export const POST = withRoute(
  {
    auth: 'required',
    rateLimit: { rule: RULES.avatarUpload, scope: 'avatar', by: 'user' },
  },
  async ({ req, user, ip, ua }) => {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      throw new ApiError('UNSUPPORTED_MEDIA_TYPE', 'Upload the image as multipart/form-data.')
    }

    // Reject on the declared length before buffering, so an oversized body
    // is not read into memory just to be thrown away.
    const declared = Number(req.headers.get('content-length') ?? 0)
    if (declared && declared > env.MAX_AVATAR_BYTES * 1.2) {
      throw new ApiError('PAYLOAD_TOO_LARGE', `Keep the image under ${mb(env.MAX_AVATAR_BYTES)}.`)
    }

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      throw new ApiError('BAD_REQUEST', 'That upload could not be read.')
    }

    const file = form.get('file')
    if (!file || typeof file === 'string') {
      throw new ApiError('BAD_REQUEST', 'Choose an image to upload.', {
        file: 'Choose an image to upload.',
      })
    }

    if (file.size === 0) {
      throw new ApiError('BAD_REQUEST', 'That file is empty.', { file: 'That file is empty.' })
    }
    if (file.size > env.MAX_AVATAR_BYTES) {
      throw new ApiError('PAYLOAD_TOO_LARGE', `Keep the image under ${mb(env.MAX_AVATAR_BYTES)}.`, {
        file: `Keep the image under ${mb(env.MAX_AVATAR_BYTES)}.`,
      })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Trust the bytes, not the browser's Content-Type.
    const sniffed = sniffImage(buffer)
    if (!sniffed) {
      throw new ApiError('UNSUPPORTED_MEDIA_TYPE', 'Upload a PNG, JPEG, WebP or GIF image.', {
        file: 'Upload a PNG, JPEG, WebP or GIF image.',
      })
    }

    const version = randomToken(6)

    const updated = await User.findByIdAndUpdate(
      user!._id,
      {
        $set: {
          avatar: {
            data: buffer,
            contentType: sniffed.contentType,
            version,
            updatedAt: new Date(),
          },
          avatarVersion: version,
        },
      },
      { new: true },
    ).lean<UserDoc | null>()

    if (!updated) throw new ApiError('NOT_FOUND', 'Account not found.')

    invalidateUser(user!._id.toString())

    await AuditLog.create({
      userId: user!._id,
      action: 'avatar.update',
      ip,
      userAgent: ua,
      meta: { bytes: buffer.length, type: sniffed.contentType, width: sniffed.width, height: sniffed.height },
    }).catch(() => {})

    return ok({ user: toPublicUser(updated) })
  },
)

/** DELETE /api/account/avatar — fall back to initials. */
export const DELETE = withRoute(
  {
    auth: 'required',
    rateLimit: { rule: RULES.avatarUpload, scope: 'avatar', by: 'user' },
  },
  async ({ user, ip, ua }) => {
    const updated = await User.findByIdAndUpdate(
      user!._id,
      { $unset: { avatar: '' }, $set: { avatarVersion: null } },
      { new: true },
    ).lean<UserDoc | null>()

    if (!updated) throw new ApiError('NOT_FOUND', 'Account not found.')

    invalidateUser(user!._id.toString())

    await AuditLog.create({
      userId: user!._id,
      action: 'avatar.delete',
      ip,
      userAgent: ua,
    }).catch(() => {})

    return ok({ user: toPublicUser(updated) })
  },
)

const mb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`
