import type { NextRequest } from 'next/server'
import { connectDb } from '@/lib/db/mongoose'
import { User, type UserDoc } from '@/lib/db/models/User'
import { verifyAccessToken, type AccessClaims } from '@/lib/auth/jwt'
import { cached, cacheDelete, userCacheKey } from '@/lib/http/cache'
import { COOKIE } from '@/lib/env'

/**
 * Short, deliberately. The access token carries a `ver` claim that must
 * match the stored `tokenVersion`, which is how a password change kills
 * live tokens — so this lookup cannot be skipped, only cached briefly.
 * A revocation therefore takes effect within this many seconds on any
 * container that already has the user warm.
 */
const USER_TTL_SECONDS = 15

export type AuthState =
  | { state: 'anonymous' }
  | { state: 'expired' }
  | { state: 'authenticated'; user: UserDoc; claims: AccessClaims }

export async function readAuth(req: NextRequest): Promise<AuthState> {
  const token = req.cookies.get(COOKIE.access)?.value
  if (!token) return { state: 'anonymous' }

  const verified = await verifyAccessToken(token)
  if (!verified.ok) {
    // "expired" is kept distinct from "anonymous" so the client knows to try
    // a refresh rather than bouncing the user to the login screen.
    return verified.reason === 'expired' ? { state: 'expired' } : { state: 'anonymous' }
  }

  const user = await loadUser(verified.claims.sub)
  if (!user) return { state: 'anonymous' }
  if (user.status !== 'active') return { state: 'anonymous' }
  if (user.tokenVersion !== verified.claims.ver) return { state: 'expired' }

  return { state: 'authenticated', user, claims: verified.claims }
}

export async function loadUser(userId: string): Promise<UserDoc | null> {
  return cached(userCacheKey(userId), USER_TTL_SECONDS, async () => {
    await connectDb()
    return User.findById(userId).lean<UserDoc | null>()
  })
}

/** Call after any write that changes what `/api/auth/me` would return. */
export function invalidateUser(userId: string) {
  cacheDelete(userCacheKey(userId))
}
