import { z } from 'zod'
import { withRoute } from '@/lib/http/route'
import { ok, ApiError } from '@/lib/http/response'
import { assertSafeUrl } from '@/lib/http/ssrf'
import { analyseHeaders, scoreFromFindings, type HeaderCheck } from '@/lib/scan/headers'
import { inspectTls, tlsFindings, type TlsInfo } from '@/lib/scan/tls'
import { gradeFor, type Finding } from '@/lib/security'
import type { RateLimitRule } from '@/lib/http/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Each scan is several outbound requests plus a TLS handshake. Keep it scarce. */
const SCAN_LIMIT: RateLimitRule = { limit: 20, windowSeconds: 10 * 60 }

const TIMEOUT_MS = 15_000

const scanSchema = z.object({
  url: z.string().trim().min(1, 'Enter a URL.').max(2048),
})

type ScanInput = z.infer<typeof scanSchema>

export interface ScanResult {
  url: string
  finalUrl: string
  status: number
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  server: string | null
  poweredBy: string | null
  title: string | null
  redirects: string[]
  headers: Record<string, string>
  cookies: string[]
  tls: TlsInfo | null
  checks: HeaderCheck[]
  findings: Finding[]
  /** Set when a robots.txt or sitemap was found — useful surface, not a finding. */
  discovered: { label: string; url: string }[]
  scannedAt: string
  /**
   * What this scan did NOT look at. Stated explicitly so the score is not
   * mistaken for a full audit.
   */
  notCovered: string[]
}

/**
 * POST /api/tools/scan — audit a site from its URL.
 *
 * Everything here is deterministic: response headers, cookie flags, TLS
 * parameters and certificate dates. No model is involved, so every finding
 * is reproducible and traceable to the evidence field. The reasoning layer
 * (business logic, chained findings, response-body analysis) is separate
 * and not part of this route.
 */
export const POST = withRoute<ScanInput>(
  {
    auth: 'required',
    body: scanSchema,
    rateLimit: { rule: SCAN_LIMIT, scope: 'scan', by: 'user' },
  },
  async ({ body }) => {
    let target = body.url.trim()
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
      if (!/^https?:/i.test(target)) {
        throw new ApiError('BAD_REQUEST', 'Enter an http:// or https:// URL.', {
          url: 'Enter an http:// or https:// URL.',
        })
      }
    } else {
      target = `https://${target}`
    }

    const verdict = await assertSafeUrl(target)
    if (!verdict.ok) throw new ApiError('BAD_REQUEST', verdict.reason, { url: verdict.reason })

    const redirects: string[] = []
    let current = target
    let response: Response | null = null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      for (let hop = 0; hop < 5; hop++) {
        const hopVerdict = await assertSafeUrl(current)
        if (!hopVerdict.ok) throw new ApiError('BAD_REQUEST', hopVerdict.reason)

        let res: Response
        try {
          res = await fetch(current, {
            redirect: 'manual',
            signal: controller.signal,
            cache: 'no-store',
            headers: { 'user-agent': 'DGS-Scanner/1.0 (+https://dgs.app)', accept: 'text/html,*/*' },
          })
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            throw new ApiError('BAD_REQUEST', `The site did not respond within ${TIMEOUT_MS / 1000}s.`)
          }
          throw new ApiError('BAD_REQUEST', 'Could not reach that site.')
        }

        const location = res.headers.get('location')
        if (res.status >= 300 && res.status < 400 && location) {
          redirects.push(current)
          current = new URL(location, current).toString()
          continue
        }
        response = res
        break
      }

      if (!response) throw new ApiError('BAD_REQUEST', 'Too many redirects.')

      const headers: Record<string, string> = {}
      response.headers.forEach((v, k) => {
        if (k.toLowerCase() !== 'set-cookie') headers[k] = v
      })
      const cookies = response.headers.getSetCookie?.() ?? []

      // Only the first 256 KB — we want the <title>, not the whole page.
      const html = await readSome(response, 256 * 1024)
      const title = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim() ?? null

      const finalUrl = new URL(response.url || current)

      // Does plain HTTP redirect to HTTPS, or serve content directly?
      const httpRedirectsToHttps = await checkHttpRedirect(finalUrl.hostname, controller.signal)

      const tls =
        finalUrl.protocol === 'https:'
          ? await inspectTls(finalUrl.hostname, Number(finalUrl.port) || 443)
          : null

      const { findings: headerFindings, checks } = analyseHeaders({
        url: finalUrl.toString(),
        status: response.status,
        headers,
        cookies,
        httpRedirectsToHttps,
      })

      const findings = [...headerFindings, ...tlsFindings(tls, headerFindings.length)]
      const score = scoreFromFindings(findings)

      const discovered = await discoverSurface(finalUrl, controller.signal)

      const result: ScanResult = {
        url: target,
        finalUrl: finalUrl.toString(),
        status: response.status,
        score,
        grade: gradeFor(score),
        server: headers['server'] ?? null,
        poweredBy: headers['x-powered-by'] ?? null,
        title,
        redirects,
        headers,
        cookies,
        tls,
        checks,
        findings,
        discovered,
        scannedAt: new Date().toISOString(),
        notCovered: [
          'Authenticated pages — the scanner does not sign in',
          'Response body and business-logic flaws',
          'Injection, access-control and rate-limit testing',
          'Subdomains and any page other than the URL given',
        ],
      }

      return ok(result, { headers: { 'Cache-Control': 'no-store' } })
    } finally {
      clearTimeout(timer)
    }
  },
)

/**
 * True when http:// redirects to https://, false when it serves content in
 * the clear, null when it simply is not reachable (which is not a finding).
 */
async function checkHttpRedirect(hostname: string, signal: AbortSignal): Promise<boolean | null> {
  try {
    const res = await fetch(`http://${hostname}/`, {
      redirect: 'manual',
      signal,
      cache: 'no-store',
      headers: { 'user-agent': 'DGS-Scanner/1.0 (+https://dgs.app)' },
    })
    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      return new URL(location, `http://${hostname}/`).protocol === 'https:'
    }
    return res.status < 400 ? false : null
  } catch {
    return null
  }
}

/** Looks for the two files that map a site's surface. Absence is not a finding. */
async function discoverSurface(base: URL, signal: AbortSignal) {
  const out: { label: string; url: string }[] = []
  for (const [label, path] of [
    ['robots.txt', '/robots.txt'],
    ['sitemap.xml', '/sitemap.xml'],
    ['security.txt', '/.well-known/security.txt'],
  ] as const) {
    try {
      const url = new URL(path, base).toString()
      const res = await fetch(url, {
        method: 'HEAD',
        signal,
        cache: 'no-store',
        headers: { 'user-agent': 'DGS-Scanner/1.0 (+https://dgs.app)' },
      })
      if (res.ok) out.push({ label, url })
    } catch {
      /* unreachable or blocked — nothing to report */
    }
  }
  return out
}

async function readSome(res: Response, max: number): Promise<string> {
  if (!res.body) return ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < max) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    chunks.push(value)
    size += value.byteLength
  }
  await reader.cancel().catch(() => {})
  const merged = new Uint8Array(size)
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.byteLength
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged)
}
