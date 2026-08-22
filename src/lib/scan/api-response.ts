import type { Finding } from '@/lib/security'
import { analyseHeaders, scoreFromFindings, type HeaderCheck } from '@/lib/scan/headers'

/* ------------------------------------------------------------------
   Audits a single API response.

   Same principle as the website scanner: everything here is checked
   against the actual bytes that came back, so every finding can point
   at its own evidence. Nothing is guessed.
   ------------------------------------------------------------------ */

export interface ApiAudit {
  score: number
  findings: Finding[]
  checks: HeaderCheck[]
  attackSurface: { label: string; value: string; risk: Finding['severity'] }[]
}

/**
 * Field names that should never appear in a response body.
 * Matched on the key, not the value — a key called `password_hash` is a
 * problem regardless of what is in it.
 */
const SECRET_KEYS: { pattern: RegExp; label: string; severity: Finding['severity'] }[] = [
  { pattern: /^(password|passwd|pwd|password_hash|passwordHash|hash)$/i, label: 'password material', severity: 'critical' },
  { pattern: /^(secret|client_secret|clientSecret|private_key|privateKey)$/i, label: 'a secret key', severity: 'critical' },
  { pattern: /^(api_?key|apiKey|access_?key)$/i, label: 'an API key', severity: 'critical' },
  { pattern: /^(ssn|social_security|national_id|cnic)$/i, label: 'a national ID number', severity: 'critical' },
  { pattern: /^(card_?number|cardNumber|cvv|cvc|pan)$/i, label: 'card details', severity: 'critical' },
  { pattern: /^(refresh_?token|refreshToken)$/i, label: 'a refresh token', severity: 'high' },
  { pattern: /^(session|session_?id|sessionId)$/i, label: 'a session identifier', severity: 'high' },
  { pattern: /^(salt|nonce_secret)$/i, label: 'a password salt', severity: 'medium' },
  { pattern: /^(debug|stack|stacktrace|stack_trace|trace|query|sql)$/i, label: 'internal debug detail', severity: 'medium' },
]

/** Walks the parsed body and reports any key that should not be there. */
function scanBodyKeys(value: unknown, path: string[] = [], out: { key: string; path: string; label: string; severity: Finding['severity'] }[] = [], depth = 0) {
  if (depth > 8 || out.length > 40) return out

  if (Array.isArray(value)) {
    // One representative element is enough; a 500-item list of the same
    // shape would otherwise produce 500 identical findings.
    if (value.length > 0) scanBodyKeys(value[0], [...path, '0'], out, depth + 1)
    return out
  }

  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const hit = SECRET_KEYS.find((s) => s.pattern.test(k))
      if (hit) out.push({ key: k, path: [...path, k].join('.'), label: hit.label, severity: hit.severity })
      scanBodyKeys(v, [...path, k], out, depth + 1)
    }
  }
  return out
}

const STACK_TRACE = /(\bat\s+[\w$.<>]+\([^)]*:\d+:\d+\))|Traceback \(most recent call last\)|\bException in thread\b|\bORA-\d{5}\b|\bSQLSTATE\[/

export function auditApiResponse(input: {
  url: string
  method: string
  status: number
  headers: Record<string, string>
  cookies: string[]
  body: string
}): ApiAudit {
  // Header, cookie, CORS and disclosure checks are identical to a page
  // response, so reuse the scanner rather than re-implementing it.
  const { findings: headerFindings, checks } = analyseHeaders({
    url: input.url,
    status: input.status,
    headers: input.headers,
    cookies: input.cookies,
    httpRedirectsToHttps: null,
  })

  const findings: Finding[] = [...headerFindings]
  let n = findings.length
  const id = () => `A-${String(++n).padStart(2, '0')}`

  /* ---------------- response body ---------------- */

  let parsed: unknown = null
  try {
    parsed = JSON.parse(input.body)
  } catch {
    /* not JSON — the key scan simply does not apply */
  }

  if (parsed) {
    const leaks = scanBodyKeys(parsed)
    const seen = new Set<string>()
    for (const leak of leaks) {
      if (seen.has(leak.label)) continue
      seen.add(leak.label)
      findings.push({
        id: id(),
        title: `Response exposes ${leak.label}`,
        severity: leak.severity,
        category: 'Data exposure',
        cwe: 'CWE-200',
        owasp: 'A01:2021 Broken Access Control',
        description: `The field \`${leak.path}\` is returned to the caller. Anything in a response body is visible to whoever made the request, and to anything sitting between them and the server.`,
        evidence: leak.path,
        fix: `Remove \`${leak.key}\` from the response. If a client genuinely needs it, return an opaque reference instead of the value.`,
        effort: 'low',
      })
    }
    checks.push({
      name: 'Response body',
      status: leaks.length ? 'fail' : 'pass',
      detail: leaks.length ? `${leaks.length} sensitive field(s)` : 'no sensitive fields spotted',
    })
  }

  if (STACK_TRACE.test(input.body)) {
    findings.push({
      id: id(),
      title: 'Response contains a stack trace',
      severity: 'medium',
      category: 'Disclosure',
      cwe: 'CWE-209',
      owasp: 'A05:2021 Security Misconfiguration',
      description:
        'The error output includes internal file paths and line numbers, which maps out your codebase and framework versions for anyone probing it.',
      evidence: input.body.match(STACK_TRACE)?.[0]?.slice(0, 140),
      fix: 'Return a generic error body in production and log the detail server-side.',
      effort: 'low',
    })
  }

  /* ---------------- status handling ---------------- */

  if (input.status >= 500) {
    findings.push({
      id: id(),
      title: `Endpoint returned ${input.status}`,
      severity: 'medium',
      category: 'Reliability',
      description:
        'A server error on a normal request suggests unhandled input. Unhandled paths are where injection and denial-of-service bugs tend to live.',
      evidence: `HTTP ${input.status}`,
      fix: 'Handle the failing case explicitly and return a controlled 4xx where the input is at fault.',
      effort: 'medium',
    })
  }

  /* ---------------- rate limiting ---------------- */

  const hasRateLimitHeaders = Object.keys(input.headers).some((k) =>
    /^(ratelimit|x-ratelimit|retry-after)/i.test(k),
  )
  checks.push({
    name: 'Rate limiting',
    status: hasRateLimitHeaders ? 'pass' : 'warn',
    detail: hasRateLimitHeaders ? 'rate-limit headers present' : 'no rate-limit headers seen',
  })
  if (!hasRateLimitHeaders) {
    findings.push({
      id: id(),
      title: 'No rate-limit headers on this endpoint',
      severity: 'low',
      category: 'Abuse',
      owasp: 'A04:2021 Insecure Design',
      description:
        'Nothing in the response indicates a request budget. Absence of the headers is not proof there is no limit, but endpoints without one can be hammered — credential stuffing, scraping, cost inflation.',
      fix: 'Apply a per-IP and per-account limit, and advertise it with RateLimit-Limit / RateLimit-Remaining.',
      effort: 'medium',
    })
  }

  /* ---------------- caching of private data ---------------- */

  const cacheControl = Object.entries(input.headers).find(([k]) => k.toLowerCase() === 'cache-control')?.[1]
  const looksAuthed = input.cookies.length > 0
  if (looksAuthed && cacheControl && /public|max-age=[1-9]/i.test(cacheControl) && !/no-store|private/i.test(cacheControl)) {
    findings.push({
      id: id(),
      title: 'Authenticated response is cacheable',
      severity: 'medium',
      category: 'Session',
      cwe: 'CWE-524',
      description:
        'This response sets cookies but allows caching, so a shared proxy could store it and serve one user’s data to the next.',
      evidence: `Cache-Control: ${cacheControl}`,
      fix: 'Send Cache-Control: private, no-store on anything user-specific.',
      effort: 'low',
    })
  }

  const attackSurface: ApiAudit['attackSurface'] = [
    { label: 'Method', value: input.method, risk: 'info' },
    { label: 'Status', value: String(input.status), risk: input.status >= 500 ? 'medium' : 'info' },
    {
      label: 'Cookies set',
      value: String(input.cookies.length),
      risk: input.cookies.length ? 'low' : 'info',
    },
    {
      label: 'Body size',
      value: `${input.body.length} B`,
      risk: 'info',
    },
    {
      label: 'Transport',
      value: input.url.startsWith('https://') ? 'HTTPS' : 'HTTP',
      risk: input.url.startsWith('https://') ? 'info' : 'high',
    },
  ]

  return {
    score: scoreFromFindings(findings),
    findings,
    checks,
    attackSurface,
  }
}
