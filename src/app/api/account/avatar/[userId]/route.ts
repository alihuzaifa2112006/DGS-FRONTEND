import { NextResponse } from 'next/server'
import { Types } from 'mongoose'
import { User, type UserDoc } from '@/lib/db/models/User'
import { withRoute } from '@/lib/http/route'
import { ApiError } from '@/lib/http/response'
import { RULES } from '@/lib/http/rate-limit'
import { toBytes } from '@/lib/http/image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/account/avatar/:userId — serve a profile picture.
 *
 * Sign-in required: this is an internal console, and an open endpoint
 * keyed by user id would let anyone walk the user table for photos.
 * Same-origin `<img>` requests carry the session cookie, so this is
 * invisible to the UI.
 */
export const GET = withRoute(
  {
    auth: 'required',
    rateLimit: { rule: RULES.read, scope: 'avatar-read', by: 'user' },
  },
  async ({ req, params }) => {
    const { userId } = params
    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError('NOT_FOUND', 'No avatar here.')
    }

    const doc = await User.findById(userId)
      .select('+avatar avatarVersion')
      .lean<Pick<UserDoc, 'avatar' | 'avatarVersion'> | null>()

    if (!doc?.avatar?.data) throw new ApiError('NOT_FOUND', 'No avatar here.')

    const etag = `"${doc.avatar.version}"`
    const headers: Record<string, string> = {
      'Content-Type': doc.avatar.contentType,
      ETag: etag,
      // The URL carries ?v=<version>, so a given URL's bytes never change —
      // safe to cache hard in the browser. `private` keeps it out of shared caches.
      'Cache-Control': 'private, max-age=31536000, immutable',
      'Content-Disposition': 'inline',
      // Belt and braces: if a crafted file ever slipped past the sniffer,
      // the browser must not be allowed to reinterpret it as HTML.
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      Vary: 'Cookie',
    }

    if (req.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304, headers })
    }

    // Not `new Uint8Array(...)` — see toBytes: the driver returns a BSON
    // Binary here, which that constructor turns into an empty array.
    const body = toBytes(doc.avatar.data)
    if (body.byteLength === 0) throw new ApiError('NOT_FOUND', 'No avatar here.')

    return new NextResponse(body, {
      status: 200,
      headers: { ...headers, 'Content-Length': String(body.byteLength) },
    })
  },
)
