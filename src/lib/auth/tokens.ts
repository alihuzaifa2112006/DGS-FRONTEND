import { Types } from 'mongoose'
import { connectDb } from '@/lib/db/mongoose'
import { RefreshToken } from '@/lib/db/models/RefreshToken'
import { AuditLog } from '@/lib/db/models/AuditLog'
import { hashToken, randomToken } from '@/lib/auth/password'
import { env } from '@/lib/env'

export interface IssueContext {
  userId: string
  ip?: string
  userAgent?: string
  remember?: boolean
}

export interface IssuedRefresh {
  raw: string
  family: string
  expiresAt: Date
  maxAge: number
}

/** Starts a new session (a new token family) — called on login and signup. */
export async function issueRefreshToken(ctx: IssueContext): Promise<IssuedRefresh> {
  await connectDb()
  const raw = randomToken(32)
  const family = randomToken(16)
  const ttl = ctx.remember === false ? env.REFRESH_TOKEN_TTL_SHORT : env.REFRESH_TOKEN_TTL
  const expiresAt = new Date(Date.now() + ttl * 1000)

  await RefreshToken.create({
    userId: new Types.ObjectId(ctx.userId),
    tokenHash: hashToken(raw),
    family,
    expiresAt,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    lastUsedAt: new Date(),
  })

  return { raw, family, expiresAt, maxAge: ttl }
}

export type RotateResult =
  | { ok: true; raw: string; family: string; userId: string; expiresAt: Date; maxAge: number }
  | { ok: false; reason: 'invalid' | 'expired' | 'revoked' | 'reused' }

/**
 * Exchanges a refresh token for its successor.
 *
 * Rotation is what makes a stolen refresh token detectable: each token is
 * good exactly once. If a token that was already rotated comes back, either
 * the attacker or the real user is replaying it — we cannot tell which, so
 * we kill the entire family and force a fresh login.
 */
export async function rotateRefreshToken(rawToken: string, ctx: {
  ip?: string
  userAgent?: string
}): Promise<RotateResult> {
  await connectDb()
  const tokenHash = hashToken(rawToken)

  // Atomically claim the token: only the request that flips revokedAt from
  // null wins, so two parallel refreshes cannot both mint a successor.
  const claimed = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'rotated', lastUsedAt: new Date() } },
    { returnDocument: 'before' },
  )

  if (!claimed) {
    // Either it never existed, or it was already used — check which.
    const existing = await RefreshToken.findOne({ tokenHash }).lean()
    if (!existing) return { ok: false, reason: 'invalid' }

    if (existing.revokedReason === 'rotated') {
      await revokeFamily(existing.family, 'reuse_detected')
      await AuditLog.create({
        userId: existing.userId,
        action: 'token.reuse_detected',
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        meta: { family: existing.family },
      }).catch(() => {})
      return { ok: false, reason: 'reused' }
    }
    return { ok: false, reason: 'revoked' }
  }

  if (claimed.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: 'expired' }
  }

  // The successor inherits the original expiry, so a session cannot be
  // extended forever by refreshing — absolute lifetime still applies.
  const raw = randomToken(32)
  const maxAge = Math.max(1, Math.floor((claimed.expiresAt.getTime() - Date.now()) / 1000))

  await RefreshToken.create({
    userId: claimed.userId,
    tokenHash: hashToken(raw),
    family: claimed.family,
    expiresAt: claimed.expiresAt,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    lastUsedAt: new Date(),
  })

  await RefreshToken.updateOne({ _id: claimed._id }, { $set: { replacedByHash: hashToken(raw) } })

  return {
    ok: true,
    raw,
    family: claimed.family,
    userId: claimed.userId.toString(),
    expiresAt: claimed.expiresAt,
    maxAge,
  }
}

export async function revokeToken(rawToken: string, reason = 'logout'): Promise<void> {
  await connectDb()
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
  )
}

export async function revokeFamily(family: string, reason: string): Promise<void> {
  await connectDb()
  await RefreshToken.updateMany(
    { family, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
  )
}

/** Ends every session for a user. Used by "sign out everywhere" and password change. */
export async function revokeAllForUser(userId: string, reason: string, exceptFamily?: string): Promise<number> {
  await connectDb()
  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    revokedAt: null,
  }
  if (exceptFamily) filter.family = { $ne: exceptFamily }
  const res = await RefreshToken.updateMany(filter, {
    $set: { revokedAt: new Date(), revokedReason: reason },
  })
  return res.modifiedCount
}

export interface SessionSummary {
  id: string
  family: string
  current: boolean
  ip: string | null
  userAgent: string | null
  createdAt: string
  lastUsedAt: string
  expiresAt: string
}

/** Active devices, newest first — one row per family, not per rotation. */
export async function listSessions(userId: string, currentFamily?: string): Promise<SessionSummary[]> {
  await connectDb()
  const rows = await RefreshToken.find({
    userId: new Types.ObjectId(userId),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastUsedAt: -1 })
    .limit(50)
    .lean()

  const byFamily = new Map<string, (typeof rows)[number]>()
  for (const r of rows) if (!byFamily.has(r.family)) byFamily.set(r.family, r)

  return [...byFamily.values()].map((r) => ({
    id: r._id.toString(),
    family: r.family,
    current: r.family === currentFamily,
    ip: r.ip ?? null,
    userAgent: r.userAgent ?? null,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
  }))
}
