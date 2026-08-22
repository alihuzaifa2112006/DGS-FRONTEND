import { z } from 'zod'
import { withRoute } from '@/lib/http/route'
import { ok, ApiError } from '@/lib/http/response'
import { assertSafeUrl, sanitiseRequestHeaders } from '@/lib/http/ssrf'
import type { RateLimitRule } from '@/lib/http/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Outbound calls are the expensive, abusable thing here — keep them scarce. */
const PROXY_LIMIT: RateLimitRule = { limit: 60, windowSeconds: 5 * 60 }

const TIMEOUT_MS = 15_000
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024
const MAX_REDIRECTS = 4

const proxySchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).default('GET'),
  url: z.string().trim().min(1, 'Enter a URL.').max(2048),
  headers: z.record(z.string(), z.string()).default({}),
  body: z.string().max(1024 * 1024).optional(),
})

type ProxyInput = z.infer<typeof proxySchema>

export interface ProxyResult {
  status: number
  statusText: string
  /** Milliseconds from request start to body fully read. */
  timeMs: number
  /** Bytes actually received. */
  size: number
  headers: Record<string, string>
  cookies: string[]
  body: string
  /** True when the body was cut off at MAX_RESPONSE_BYTES. */
  truncated: boolean
  /** Every hop, when the origin redirected us. */
  redirects: string[]
  finalUrl: string
  /** Which IPs the hostname resolved to — shown in the console for transparency. */
  resolvedTo: string[]
}

/**
 * POST /api/tools/http — send a request from the server and return the raw
 * response.
 *
 * This is what makes the API Tester real. A browser `fetch` to a third-party
 * host is blocked by CORS unless that host opts in, and it can never show
 * Set-Cookie or other forbidden response headers. Relaying through the server
 * removes both limits — at the cost of turning this route into an SSRF
 * primitive, which is what `assertSafeUrl` exists to prevent.
 */
export const POST = withRoute<ProxyInput>(
  {
    auth: 'required',
    body: proxySchema,
    rateLimit: { rule: PROXY_LIMIT, scope: 'proxy', by: 'user' },
  },
  async ({ body }) => {
    const startedAt = Date.now()

    // Bare host means "assume https". A URL that names some *other* scheme
    // must be rejected, not silently rewritten into an https URL whose
    // hostname is "file".
    let current = body.url
    if (/^[a-z][a-z0-9+.-]*:/i.test(current)) {
      if (!/^https?:/i.test(current)) {
        const reason = 'Only http:// and https:// URLs can be sent.'
        throw new ApiError('BAD_REQUEST', reason, { url: reason })
      }
    } else {
      current = `https://${current}`
    }

    const redirects: string[] = []
    let resolvedTo: string[] = []
    let response: Response | null = null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        // Re-validated on every hop: an allowed public URL is free to
        // redirect to 169.254.169.254, and that must not be followed.
        const verdict = await assertSafeUrl(current)
        if (!verdict.ok) throw new ApiError('BAD_REQUEST', verdict.reason, { url: verdict.reason })
        if (hop === 0) resolvedTo = verdict.addresses

        const headers = sanitiseRequestHeaders(body.headers)
        // Identify ourselves honestly rather than impersonating a browser.
        if (!headers.has('user-agent')) headers.set('user-agent', 'DGS-Console/1.0 (+https://dgs.app)')
        if (!headers.has('accept')) headers.set('accept', '*/*')

        const sendsBody = !['GET', 'HEAD'].includes(body.method)

        let res: Response
        try {
          res = await fetch(current, {
            method: body.method,
            headers,
            body: sendsBody ? body.body : undefined,
            redirect: 'manual',
            signal: controller.signal,
            cache: 'no-store',
          })
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            throw new ApiError('BAD_REQUEST', `The request timed out after ${TIMEOUT_MS / 1000}s.`)
          }
          throw new ApiError(
            'BAD_REQUEST',
            `Could not reach that host. ${(err as Error).message ?? ''}`.trim(),
          )
        }

        const location = res.headers.get('location')
        const isRedirect = res.status >= 300 && res.status < 400 && location

        if (!isRedirect || hop === MAX_REDIRECTS) {
          response = res
          break
        }

        redirects.push(current)
        current = new URL(location, current).toString()
      }

      if (!response) throw new ApiError('BAD_REQUEST', 'Too many redirects.')

      const { text, size, truncated } = await readCapped(response)

      const headers: Record<string, string> = {}
      const cookies: string[] = []
      response.headers.forEach((value, key) => {
        // Set-Cookie is exactly what a security console needs to inspect,
        // and exactly what the browser would have hidden.
        if (key.toLowerCase() === 'set-cookie') cookies.push(value)
        else headers[key] = value
      })
      // Undici merges repeated Set-Cookie into one header; getSetCookie keeps them apart.
      const all = response.headers.getSetCookie?.()
      if (all?.length) {
        cookies.length = 0
        cookies.push(...all)
      }

      const result: ProxyResult = {
        status: response.status,
        statusText: response.statusText,
        timeMs: Date.now() - startedAt,
        size,
        headers,
        cookies,
        body: text,
        truncated,
        redirects,
        finalUrl: response.url || current,
        resolvedTo,
      }

      return ok(result, { headers: { 'Cache-Control': 'no-store' } })
    } finally {
      clearTimeout(timer)
    }
  },
)

/**
 * Reads the body but stops at the cap. `response.text()` would happily pull a
 * multi-gigabyte file into memory and take the process down with it.
 */
async function readCapped(res: Response): Promise<{ text: string; size: number; truncated: boolean }> {
  if (!res.body) return { text: '', size: 0, truncated: false }

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  let truncated = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    size += value.byteLength
    if (size > MAX_RESPONSE_BYTES) {
      chunks.push(value.subarray(0, value.byteLength - (size - MAX_RESPONSE_BYTES)))
      truncated = true
      await reader.cancel()
      break
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0))
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.byteLength
  }

  return {
    // `fatal: false` so binary payloads degrade to replacement characters
    // instead of throwing — the console still shows status, headers and size.
    text: new TextDecoder('utf-8', { fatal: false }).decode(merged),
    size: truncated ? MAX_RESPONSE_BYTES : size,
    truncated,
  }
}
