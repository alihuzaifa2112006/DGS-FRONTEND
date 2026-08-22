import { connectDb } from '@/lib/db/mongoose'
import { RateLimitHit } from '@/lib/db/models/RateLimitHit'

export interface RateLimitRule {
  /** Requests allowed inside the window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  /** Seconds until the caller may retry. Only meaningful when blocked. */
  retryAfter: number
  resetAt: number
}

/* ------------------------------------------------------------------
   Sliding-window rate limiter backed by MongoDB, so the budget is
   shared across every serverless instance rather than per-container.

   A short in-process memo of already-blocked keys short-circuits the
   database round-trip while someone is hammering an endpoint — the
   common case we most want to be cheap.
   ------------------------------------------------------------------ */

const blockedUntil = new Map<string, number>()

function sweepMemo(now: number) {
  if (blockedUntil.size < 512) return
  for (const [k, until] of blockedUntil) if (until <= now) blockedUntil.delete(k)
}

export async function rateLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const now = Date.now()
  const windowMs = rule.windowSeconds * 1000

  const memo = blockedUntil.get(key)
  if (memo && memo > now) {
    return {
      allowed: false,
      limit: rule.limit,
      remaining: 0,
      retryAfter: Math.ceil((memo - now) / 1000),
      resetAt: memo,
    }
  }

  try {
    await connectDb()
    const windowStart = now - windowMs

    const existing = await RateLimitHit.findById(key).select('hits').lean()
    const inWindow = (existing?.hits ?? []).filter((t) => t > windowStart)

    if (inWindow.length >= rule.limit) {
      // Deliberately NOT recorded. If a rejected request counted as a hit,
      // the window would slide forward on every retry and a client polling
      // the endpoint could never get back in — which would also make the
      // "try again in Ns" we return a lie.
      const resetAt = (inWindow[0] ?? now) + windowMs
      const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000))
      blockedUntil.set(key, resetAt)
      sweepMemo(now)
      return { allowed: false, limit: rule.limit, remaining: 0, retryAfter, resetAt }
    }

    // Only successful admissions are recorded. `$slice` caps the array so it
    // cannot grow without bound.
    await RateLimitHit.updateOne(
      { _id: key },
      {
        $push: { hits: { $each: [now], $slice: -rule.limit } },
        $set: { expiresAt: new Date(now + windowMs) },
      },
      { upsert: true },
    )

    return {
      allowed: true,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - inWindow.length - 1),
      retryAfter: 0,
      resetAt: (inWindow[0] ?? now) + windowMs,
    }
  } catch {
    // The limiter must never be the reason a request fails. If Mongo is
    // unreachable the request is about to fail on its own merits anyway.
    return { allowed: true, limit: rule.limit, remaining: rule.limit, retryAfter: 0, resetAt: now + windowMs }
  }
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  const h: Record<string, string> = {
    'RateLimit-Limit': String(r.limit),
    'RateLimit-Remaining': String(r.remaining),
    'RateLimit-Reset': String(Math.max(0, Math.ceil((r.resetAt - Date.now()) / 1000))),
  }
  if (!r.allowed) h['Retry-After'] = String(r.retryAfter)
  return h
}

/** Named budgets, so limits live in one place instead of scattered through routes. */
export const RULES = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  signup: { limit: 5, windowSeconds: 60 * 60 },
  forgotPassword: { limit: 5, windowSeconds: 60 * 60 },
  resetPassword: { limit: 10, windowSeconds: 60 * 60 },
  changePassword: { limit: 10, windowSeconds: 60 * 60 },
  refresh: { limit: 60, windowSeconds: 15 * 60 },
  avatarUpload: { limit: 15, windowSeconds: 60 * 60 },
  profileUpdate: { limit: 40, windowSeconds: 15 * 60 },
  read: { limit: 300, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>
