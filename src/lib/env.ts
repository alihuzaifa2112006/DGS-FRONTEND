/* ------------------------------------------------------------------
   Environment. Validated once, at first import, so a misconfigured
   deploy fails loudly at boot instead of silently at 3am.
   ------------------------------------------------------------------ */

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `[env] Missing required environment variable ${name}. See .env.example.`,
    )
  }
  return value.trim()
}

function optional(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value.trim() : fallback
}

function int(name: string, value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback
  const n = Number(value)
  if (!Number.isFinite(n)) throw new Error(`[env] ${name} must be a number, got "${value}".`)
  return n
}

const isProd = process.env.NODE_ENV === 'production'

/**
 * Secrets must be long enough that HMAC-SHA256 gets a full-entropy key.
 * In dev we allow a generated fallback so `npm run dev` works on a clean
 * clone; in production a missing secret is fatal.
 */
function secret(name: string, value: string | undefined, devFallback: string): string {
  if (isProd) {
    const v = required(name, value)
    if (v.length < 32) {
      throw new Error(`[env] ${name} must be at least 32 characters (got ${v.length}).`)
    }
    return v
  }
  return optional(value, devFallback)
}

export const env = {
  isProd,
  isDev: !isProd,

  /** MongoDB connection string. */
  MONGODB_URI: isProd
    ? required('MONGODB_URI', process.env.MONGODB_URI)
    : optional(process.env.MONGODB_URI, 'mongodb://127.0.0.1:27017/dgs'),

  MONGODB_DB: optional(process.env.MONGODB_DB, 'dgs'),

  /** Signs short-lived access tokens. */
  AUTH_SECRET: secret(
    'AUTH_SECRET',
    process.env.AUTH_SECRET,
    'dev-only-insecure-auth-secret-change-me-32+',
  ),

  /** Hashes refresh + reset tokens at rest (kept separate from AUTH_SECRET). */
  TOKEN_PEPPER: secret(
    'TOKEN_PEPPER',
    process.env.TOKEN_PEPPER,
    'dev-only-insecure-token-pepper-change-me-32+',
  ),

  /** Canonical origin — used for reset links and CSRF origin checks. */
  APP_URL: optional(
    process.env.APP_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined),
    'http://localhost:3000',
  ).replace(/\/+$/, ''),

  /** Access token lifetime, seconds. Short — refresh covers the rest. */
  ACCESS_TOKEN_TTL: int('ACCESS_TOKEN_TTL', process.env.ACCESS_TOKEN_TTL, 15 * 60),

  /** Refresh token lifetime, seconds. */
  REFRESH_TOKEN_TTL: int('REFRESH_TOKEN_TTL', process.env.REFRESH_TOKEN_TTL, 30 * 24 * 60 * 60),

  /** Refresh lifetime when "keep me signed in" is unchecked. */
  REFRESH_TOKEN_TTL_SHORT: int(
    'REFRESH_TOKEN_TTL_SHORT',
    process.env.REFRESH_TOKEN_TTL_SHORT,
    12 * 60 * 60,
  ),

  /** Password reset link lifetime, seconds. */
  RESET_TOKEN_TTL: int('RESET_TOKEN_TTL', process.env.RESET_TOKEN_TTL, 15 * 60),

  /** Failed logins before the account is temporarily locked. */
  MAX_LOGIN_ATTEMPTS: int('MAX_LOGIN_ATTEMPTS', process.env.MAX_LOGIN_ATTEMPTS, 8),

  /** How long the lock lasts, seconds. */
  LOGIN_LOCK_SECONDS: int('LOGIN_LOCK_SECONDS', process.env.LOGIN_LOCK_SECONDS, 15 * 60),

  /** Largest avatar we accept, bytes. */
  MAX_AVATAR_BYTES: int('MAX_AVATAR_BYTES', process.env.MAX_AVATAR_BYTES, 2 * 1024 * 1024),

  /**
   * The Python advice + PDF service (../python). Optional: when unset the
   * console falls back to built-in advice and disables PDF export, rather
   * than failing.
   */
  PY_SERVICE_URL: optional(process.env.PY_SERVICE_URL, 'http://127.0.0.1:8000').replace(/\/+$/, ''),

  /** Shared secret the Python service checks on every call. */
  PY_INTERNAL_TOKEN: process.env.PY_INTERNAL_TOKEN?.trim() || '',

  /** Optional SMTP-less mail webhook (Resend-style). Unset = log to console. */
  MAIL_FROM: optional(process.env.MAIL_FROM, 'DGS <no-reply@dgs.local>'),
  RESEND_API_KEY: process.env.RESEND_API_KEY?.trim() || '',
} as const

export const COOKIE = {
  access: 'dgs_at',
  refresh: 'dgs_rt',
  csrf: 'dgs_csrf',
  /**
   * Presence flag only — carries no credential. The refresh cookie is
   * path-scoped to /api/auth so middleware (which runs on /app/*) cannot
   * see it; this tells middleware "a session exists, let the client try to
   * refresh" without widening the real token's scope.
   */
  hint: 'dgs_has',
} as const
