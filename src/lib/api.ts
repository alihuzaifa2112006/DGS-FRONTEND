/* ------------------------------------------------------------------
   The browser's single door to the API.

   Handles the three things every call needs and no screen should have to
   remember: the CSRF header, cookie credentials, and transparently
   refreshing an expired access token before retrying.
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
  | 'NETWORK'

export class ApiClientError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }

  /** The message to show under a specific input, if the server named one. */
  fieldError(name: string): string | undefined {
    return this.fields?.[name]
  }
}

interface Envelope<T> {
  ok: boolean
  data?: T
  error?: { code: ApiErrorCode; message: string; fields?: Record<string, string> }
}

const CSRF_COOKIE = 'dgs_csrf'
const CSRF_HEADER = 'x-csrf-token'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]!) : null
}

/** Fetches a CSRF token if this browser does not have one yet. */
async function ensureCsrf(): Promise<string | null> {
  const existing = readCookie(CSRF_COOKIE)
  if (existing) return existing
  try {
    await fetch('/api/auth/csrf', { credentials: 'same-origin' })
  } catch {
    return null
  }
  return readCookie(CSRF_COOKIE)
}

/* ---------------- refresh, single-flight ---------------- */

let refreshInFlight: Promise<boolean> | null = null

/**
 * Several components can hit a 401 in the same tick (dashboard widgets all
 * mounting at once). Without this gate each would POST its own refresh, and
 * because refresh tokens rotate, the later ones would look like token reuse
 * and nuke the session.
 */
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** Serialised as JSON unless it is already FormData. */
  body?: unknown
  /** Internal — stops a refreshed request from recursing. */
  _retried?: boolean
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, _retried, headers, ...rest } = options
  const method = (rest.method ?? (body === undefined ? 'GET' : 'POST')).toUpperCase()
  const isWrite = method !== 'GET' && method !== 'HEAD'
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const finalHeaders = new Headers(headers)
  if (isWrite) {
    const token = await ensureCsrf()
    if (token) finalHeaders.set(CSRF_HEADER, token)
  }
  // FormData sets its own multipart boundary — never override it.
  if (body !== undefined && !isFormData) finalHeaders.set('Content-Type', 'application/json')

  let res: Response
  try {
    res = await fetch(path, {
      ...rest,
      method,
      headers: finalHeaders,
      credentials: 'same-origin',
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    })
  } catch {
    throw new ApiClientError('NETWORK', 'Could not reach the server. Check your connection.')
  }

  if (res.status === 304) return undefined as T

  let payload: Envelope<T> | null = null
  if (res.status !== 204) {
    try {
      payload = (await res.json()) as Envelope<T>
    } catch {
      payload = null
    }
  }

  if (res.ok) return (payload?.data ?? undefined) as T

  const code = payload?.error?.code ?? 'SERVER_ERROR'

  // One transparent retry: refresh the access token, then replay the call.
  if (code === 'TOKEN_EXPIRED' && !_retried) {
    const refreshed = await refreshSession()
    if (refreshed) return api<T>(path, { ...options, _retried: true })
  }

  throw new ApiClientError(
    code,
    payload?.error?.message ?? `Request failed (${res.status}).`,
    payload?.error?.fields,
    res.status,
  )
}

export const apiGet = <T>(path: string, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'GET' })

export const apiPost = <T>(path: string, body?: unknown, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'POST', body })

export const apiPatch = <T>(path: string, body?: unknown, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'PATCH', body })

export const apiDelete = <T>(path: string, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'DELETE' })
