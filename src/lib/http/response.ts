import { NextResponse } from 'next/server'

/* ------------------------------------------------------------------
   One response envelope for every route, so the client never has to
   guess where the error text lives.

     success →  { ok: true,  data: ... }
     failure →  { ok: false, error: { code, message, fields? } }
   ------------------------------------------------------------------ */

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'ACCOUNT_LOCKED'
  | 'CSRF_FAILED'
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'

const statusFor: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 422,
  UNAUTHORIZED: 401,
  TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  ACCOUNT_LOCKED: 423,
  CSRF_FAILED: 403,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
}

export interface ApiErrorBody {
  ok: false
  error: { code: ApiErrorCode; message: string; fields?: Record<string, string> }
}

export interface ApiOkBody<T> {
  ok: true
  data: T
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiOkBody<T>> {
  return NextResponse.json({ ok: true as const, data }, init)
}

export function fail(
  code: ApiErrorCode,
  message: string,
  extra?: { fields?: Record<string, string>; headers?: HeadersInit },
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { ok: false as const, error: { code, message, ...(extra?.fields ? { fields: extra.fields } : {}) } },
    { status: statusFor[code], headers: extra?.headers },
  )
}

/** Thrown inside handlers; `withRoute` turns it into a `fail(...)`. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
    readonly headers?: HeadersInit,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Best-effort client IP. Trusts the platform's proxy headers. */
export function clientIp(req: Request): string {
  const h = req.headers
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return h.get('x-real-ip') ?? h.get('cf-connecting-ip') ?? '0.0.0.0'
}

export function userAgent(req: Request): string {
  return (req.headers.get('user-agent') ?? 'unknown').slice(0, 400)
}
