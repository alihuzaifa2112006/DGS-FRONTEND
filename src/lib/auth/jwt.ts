import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { env } from '@/lib/env'

const secret = new TextEncoder().encode(env.AUTH_SECRET)
const ISSUER = 'dgs'
const AUDIENCE = 'dgs:console'

export interface AccessClaims extends JWTPayload {
  /** user id */
  sub: string
  email: string
  /** mirrors User.tokenVersion — lets a password change kill live tokens */
  ver: number
  /** refresh-token family, so we can trace an access token back to its device */
  fam: string
}

export async function signAccessToken(claims: {
  userId: string
  email: string
  tokenVersion: number
  family: string
}): Promise<string> {
  return new SignJWT({ email: claims.email, ver: claims.tokenVersion, fam: claims.family })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL}s`)
    .sign(secret)
}

export type VerifyResult =
  | { ok: true; claims: AccessClaims }
  | { ok: false; reason: 'expired' | 'invalid' }

/**
 * Edge-safe (jose uses WebCrypto), so middleware can gate routes without
 * touching the database.
 */
export async function verifyAccessToken(token: string): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
      clockTolerance: 5,
    })
    if (typeof payload.sub !== 'string' || typeof payload.ver !== 'number') {
      return { ok: false, reason: 'invalid' }
    }
    return { ok: true, claims: payload as AccessClaims }
  } catch (err) {
    const code = (err as { code?: string }).code
    return { ok: false, reason: code === 'ERR_JWT_EXPIRED' ? 'expired' : 'invalid' }
  }
}
