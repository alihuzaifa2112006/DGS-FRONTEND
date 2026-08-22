import { NextResponse, type NextRequest } from 'next/server'
import { ZodError, type ZodType } from 'zod'
import { connectDb } from '@/lib/db/mongoose'
import { readAuth } from '@/lib/auth/current-user'
import { verifyCsrf } from '@/lib/auth/csrf'
import { rateLimit, rateLimitHeaders, type RateLimitRule } from '@/lib/http/rate-limit'
import { ApiError, clientIp, fail, userAgent } from '@/lib/http/response'
import { fieldErrors } from '@/lib/validation/schemas'
import type { UserDoc } from '@/lib/db/models/User'
import type { AccessClaims } from '@/lib/auth/jwt'
import { env } from '@/lib/env'

export interface RouteContext<TBody> {
  req: NextRequest
  body: TBody
  ip: string
  ua: string
  user: UserDoc | null
  claims: AccessClaims | null
  /** Lets a handler tell "never signed in" apart from "access token aged out". */
  authState: 'anonymous' | 'expired' | 'authenticated'
  params: Record<string, string>
}

interface RouteOptions<TBody> {
  /** `required` 401s anonymous callers; `optional` just leaves `user` null. */
  auth?: 'required' | 'optional'
  /** Parsed and validated before the handler runs. */
  body?: ZodType<TBody>
  rateLimit?: {
    rule: RateLimitRule
    /** Namespaces the counter so two endpoints do not share one budget. */
    scope: string
    /** Per-user when signed in, per-IP otherwise. */
    by?: 'ip' | 'user' | 'both'
  }
  /** Defaults to true for anything that is not a GET or HEAD. */
  csrf?: boolean
}

type Handler<TBody> = (ctx: RouteContext<TBody>) => Promise<NextResponse> | NextResponse

/**
 * Wraps a route handler with the things every endpoint needs and none of
 * them should re-implement: database connection, rate limiting, CSRF,
 * authentication, body validation, and a single error funnel.
 */
export function withRoute<TBody = undefined>(
  options: RouteOptions<TBody>,
  handler: Handler<TBody>,
) {
  return async (
    req: NextRequest,
    routeCtx?: { params?: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const ip = clientIp(req)
    const ua = userAgent(req)
    const isRead = req.method === 'GET' || req.method === 'HEAD'

    try {
      // --- CSRF (writes only) ---------------------------------------
      if (!isRead && options.csrf !== false) {
        const csrf = verifyCsrf(req)
        if (!csrf.ok) return fail('CSRF_FAILED', csrf.reason)
      }

      await connectDb()

      // --- Authentication -------------------------------------------
      const auth = await readAuth(req)
      if (options.auth === 'required') {
        if (auth.state === 'expired') {
          return fail('TOKEN_EXPIRED', 'Your session expired.')
        }
        if (auth.state !== 'authenticated') {
          return fail('UNAUTHORIZED', 'Sign in to continue.')
        }
      }
      const user = auth.state === 'authenticated' ? auth.user : null
      const claims = auth.state === 'authenticated' ? auth.claims : null

      // --- Rate limit ------------------------------------------------
      let rlHeaders: Record<string, string> = {}
      if (options.rateLimit) {
        const by = options.rateLimit.by ?? 'ip'
        const subject =
          by === 'user' && user
            ? `u:${user._id.toString()}`
            : by === 'both' && user
              ? `u:${user._id.toString()}|ip:${ip}`
              : `ip:${ip}`
        const result = await rateLimit(
          `${options.rateLimit.scope}:${subject}`,
          options.rateLimit.rule,
        )
        rlHeaders = rateLimitHeaders(result)
        if (!result.allowed) {
          return fail('RATE_LIMITED', `Too many requests. Try again in ${result.retryAfter}s.`, {
            headers: rlHeaders,
          })
        }
      }

      // --- Body ------------------------------------------------------
      let body = undefined as TBody
      if (options.body) {
        const contentType = req.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) {
          return fail('UNSUPPORTED_MEDIA_TYPE', 'Send this request as application/json.')
        }
        let raw: unknown
        try {
          raw = await req.json()
        } catch {
          return fail('BAD_REQUEST', 'Request body is not valid JSON.')
        }
        body = options.body.parse(raw)
      }

      const params = routeCtx?.params ? await routeCtx.params : {}
      const res = await handler({ req, body, ip, ua, user, claims, authState: auth.state, params })
      for (const [k, v] of Object.entries(rlHeaders)) res.headers.set(k, v)
      return res
    } catch (err) {
      return toErrorResponse(err, req)
    }
  }
}

function toErrorResponse(err: unknown, req: NextRequest): NextResponse {
  if (err instanceof ZodError) {
    return fail('VALIDATION_FAILED', 'Please check the highlighted fields.', {
      fields: fieldErrors(err),
    })
  }
  if (err instanceof ApiError) {
    return fail(err.code, err.message, { fields: err.fields, headers: err.headers })
  }

  // Mongo duplicate key — only reachable via the unique index on email.
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return fail('CONFLICT', 'That value is already in use.')
  }

  const isDbDown =
    err instanceof Error &&
    /MongooseServerSelectionError|ECONNREFUSED|ETIMEDOUT|querySrv/i.test(err.message)

  console.error(`[api] ${req.method} ${req.nextUrl.pathname} —`, err)

  if (isDbDown) {
    return fail('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.')
  }

  // Never leak stack traces or driver messages to the client in production.
  return fail(
    'SERVER_ERROR',
    env.isDev && err instanceof Error ? err.message : 'Something went wrong. Please try again.',
  )
}
