import type { NextResponse } from 'next/server'
import { signAccessToken } from '@/lib/auth/jwt'
import { issueRefreshToken } from '@/lib/auth/tokens'
import { setAccessCookie, setCsrfCookie, setRefreshCookie } from '@/lib/auth/cookies'
import { newCsrfToken } from '@/lib/auth/csrf'
import type { UserDoc } from '@/lib/db/models/User'

/**
 * Everything that has to happen for a browser to become "signed in":
 * a fresh token family, an access token, and the three cookies.
 * Shared by signup, login and reset-password so they cannot drift apart.
 */
export async function establishSession(
  res: NextResponse,
  user: Pick<UserDoc, '_id' | 'email' | 'tokenVersion'>,
  ctx: { ip?: string; userAgent?: string; remember?: boolean },
): Promise<void> {
  const userId = user._id.toString()

  const refresh = await issueRefreshToken({
    userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    remember: ctx.remember,
  })

  const accessToken = await signAccessToken({
    userId,
    email: user.email,
    tokenVersion: user.tokenVersion,
    family: refresh.family,
  })

  setAccessCookie(res, accessToken)
  setRefreshCookie(res, refresh.raw, refresh.maxAge)
  setCsrfCookie(res, newCsrfToken())
}
