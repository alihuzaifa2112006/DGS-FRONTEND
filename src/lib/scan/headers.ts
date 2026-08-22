import type { Finding, Severity } from '@/lib/security'

/* ------------------------------------------------------------------
   The deterministic half of a website audit.

   None of this needs a model. Whether a site sends HSTS, whether its
   cookies carry Secure/HttpOnly, whether it discloses a patch version
   in the Server header — these are facts you read off the response,
   and the severity is settled by published guidance, not judgement.

   The AI layer's job is the part this cannot do: reasoning about
   business logic, chaining findings, and reading response bodies.
   ------------------------------------------------------------------ */

export interface HeaderCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  detail: string
}

const SEVERITY_COST: Record<Severity, number> = {
  critical: 30,
  high: 18,
  medium: 9,
  low: 4,
  info: 0,
}

/** 0-100, higher is safer. Deliberately floored so a bad site is not negative. */
export function scoreFromFindings(findings: Finding[]): number {
  const penalty = findings.reduce((sum, f) => sum + SEVERITY_COST[f.severity], 0)
  return Math.max(0, Math.min(100, 100 - penalty))
}

interface AnalyseInput {
  url: string
  status: number
  headers: Record<string, string>
  cookies: string[]
  /** Whether plain http:// redirected to https://. */
  httpRedirectsToHttps: boolean | null
}

export function analyseHeaders(input: AnalyseInput): { findings: Finding[]; checks: HeaderCheck[] } {
  const findings: Finding[] = []
  const checks: HeaderCheck[] = []
  const h = lowerKeys(input.headers)
  const isHttps = input.url.startsWith('https://')
  let n = 0
  const id = () => `H-${String(++n).padStart(2, '0')}`

  const record = (
    ok: boolean,
    name: string,
    detail: string,
    finding: Omit<Finding, 'id'> | null,
  ) => {
    checks.push({ name, status: ok ? 'pass' : finding?.severity === 'info' ? 'warn' : 'fail', detail })
    if (!ok && finding) findings.push({ id: id(), ...finding })
  }

  /* ---------------- transport ---------------- */

  if (isHttps) {
    const hsts = h['strict-transport-security']
    const maxAge = hsts ? Number(hsts.match(/max-age=(\d+)/i)?.[1] ?? 0) : 0
    record(
      Boolean(hsts) && maxAge >= 15552000,
      'Strict-Transport-Security',
      hsts ?? 'not sent',
      hsts
        ? maxAge >= 15552000
          ? null
          : {
              title: 'HSTS max-age is too short',
              severity: 'low',
              category: 'Transport',
              owasp: 'A02:2021 Cryptographic Failures',
              description: `max-age is ${maxAge}s. Below six months, a browser that has not visited recently is still downgradeable.`,
              evidence: hsts,
              fix: 'Set max-age=31536000; includeSubDomains, then submit to the HSTS preload list.',
              effort: 'low',
            }
        : {
            title: 'HSTS not enabled',
            severity: 'medium',
            category: 'Transport',
            cwe: 'CWE-319',
            owasp: 'A02:2021 Cryptographic Failures',
            description:
              'Without Strict-Transport-Security a first visit over http:// can be intercepted and downgraded before the redirect ever happens.',
            fix: 'Send Strict-Transport-Security: max-age=31536000; includeSubDomains on every https response.',
            effort: 'low',
          },
    )
  }

  if (input.httpRedirectsToHttps === false) {
    findings.push({
      id: id(),
      title: 'http:// is served without redirecting to https://',
      severity: 'high',
      category: 'Transport',
      cwe: 'CWE-319',
      owasp: 'A02:2021 Cryptographic Failures',
      description: 'The plain-HTTP endpoint answers directly, so traffic and any cookies it carries travel in clear text.',
      fix: 'Return 301 to the https:// URL for every http:// request.',
      effort: 'low',
    })
    checks.push({ name: 'HTTP → HTTPS redirect', status: 'fail', detail: 'serves content over plain HTTP' })
  } else if (input.httpRedirectsToHttps === true) {
    checks.push({ name: 'HTTP → HTTPS redirect', status: 'pass', detail: 'redirects to https' })
  }

  /* ---------------- content ---------------- */

  const csp = h['content-security-policy']
  record(Boolean(csp), 'Content-Security-Policy', csp ? truncate(csp) : 'not sent', csp ? null : {
    title: 'No Content-Security-Policy',
    severity: 'medium',
    category: 'Headers',
    cwe: 'CWE-1021',
    owasp: 'A05:2021 Security Misconfiguration',
    description:
      'CSP is the main control that limits what an injected script can do. Without it, a single XSS becomes full control of the page.',
    fix: "Start with default-src 'self' in report-only mode, fix what it reports, then enforce.",
    effort: 'medium',
  })

  if (csp && /unsafe-inline|unsafe-eval/i.test(csp)) {
    findings.push({
      id: id(),
      title: "CSP allows 'unsafe-inline' or 'unsafe-eval'",
      severity: 'low',
      category: 'Headers',
      owasp: 'A05:2021 Security Misconfiguration',
      description: 'These directives re-permit exactly the injection class CSP exists to stop.',
      evidence: truncate(csp),
      fix: 'Move to nonce- or hash-based script sources and drop both keywords.',
      effort: 'medium',
    })
  }

  const xcto = h['x-content-type-options']
  record(xcto?.toLowerCase() === 'nosniff', 'X-Content-Type-Options', xcto ?? 'not sent', xcto ? null : {
    title: 'X-Content-Type-Options not set to nosniff',
    severity: 'low',
    category: 'Headers',
    cwe: 'CWE-430',
    description: 'Browsers may sniff a response as a type it was not served as, turning an upload into a script.',
    fix: 'Send X-Content-Type-Options: nosniff.',
    effort: 'low',
  })

  const frame = h['x-frame-options']
  const frameAncestors = csp ? /frame-ancestors/i.test(csp) : false
  record(Boolean(frame) || frameAncestors, 'Clickjacking protection', frame ?? (frameAncestors ? "CSP frame-ancestors" : 'not sent'), frame || frameAncestors ? null : {
    title: 'Page can be framed by any site',
    severity: 'medium',
    category: 'Headers',
    cwe: 'CWE-1021',
    description: 'Neither X-Frame-Options nor a CSP frame-ancestors directive is present, so the page can be embedded and clickjacked.',
    fix: "Send X-Frame-Options: DENY, or CSP frame-ancestors 'none'.",
    effort: 'low',
  })

  const referrer = h['referrer-policy']
  record(Boolean(referrer), 'Referrer-Policy', referrer ?? 'not sent', referrer ? null : {
    title: 'No Referrer-Policy',
    severity: 'low',
    category: 'Headers',
    cwe: 'CWE-200',
    description: 'Full URLs — including any tokens in the query string — are sent to third-party sites in the Referer header.',
    fix: 'Send Referrer-Policy: strict-origin-when-cross-origin.',
    effort: 'low',
  })

  const permissions = h['permissions-policy'] ?? h['feature-policy']
  record(Boolean(permissions), 'Permissions-Policy', permissions ? truncate(permissions) : 'not sent', permissions ? null : {
    title: 'No Permissions-Policy',
    severity: 'info',
    category: 'Headers',
    description: 'Camera, microphone and geolocation are left available to the page and to anything embedded in it.',
    fix: 'Send Permissions-Policy: camera=(), microphone=(), geolocation=().',
    effort: 'low',
  })

  /* ---------------- disclosure ---------------- */

  const banner = [h['server'], h['x-powered-by'], h['x-aspnet-version']].filter(Boolean).join(' · ')
  const versioned = /\d+\.\d+/.test(banner)
  record(!versioned, 'Version disclosure', banner || 'no banner headers', versioned ? {
    title: 'Server software version disclosed',
    severity: 'low',
    category: 'Disclosure',
    cwe: 'CWE-200',
    description: 'Response headers name the software and its exact version, which is the first thing an attacker uses to pick a known CVE.',
    evidence: banner,
    fix: 'Strip or generalise Server and X-Powered-By at the edge.',
    effort: 'low',
  } : null)

  /* ---------------- CORS ---------------- */

  const acao = h['access-control-allow-origin']
  const acac = h['access-control-allow-credentials']
  if (acao === '*' && acac?.toLowerCase() === 'true') {
    findings.push({
      id: id(),
      title: 'CORS allows any origin with credentials',
      severity: 'critical',
      category: 'Access control',
      cwe: 'CWE-942',
      owasp: 'A01:2021 Broken Access Control',
      description:
        'Access-Control-Allow-Origin: * combined with Allow-Credentials: true lets any website read authenticated responses on behalf of a signed-in visitor.',
      evidence: `Access-Control-Allow-Origin: * / Access-Control-Allow-Credentials: true`,
      fix: 'Reflect only an explicit allow-list of origins, never the wildcard, whenever credentials are permitted.',
      effort: 'medium',
    })
    checks.push({ name: 'CORS policy', status: 'fail', detail: 'wildcard origin with credentials' })
  } else if (acao === '*') {
    checks.push({ name: 'CORS policy', status: 'warn', detail: 'wildcard origin (no credentials)' })
  } else if (acao) {
    checks.push({ name: 'CORS policy', status: 'pass', detail: acao })
  }

  /* ---------------- cookies ---------------- */

  for (const raw of input.cookies) {
    const name = raw.split('=')[0]?.trim() ?? 'cookie'
    const attrs = raw.toLowerCase()
    const missing: string[] = []
    if (isHttps && !attrs.includes('secure')) missing.push('Secure')
    if (!attrs.includes('httponly')) missing.push('HttpOnly')
    if (!attrs.includes('samesite')) missing.push('SameSite')

    if (missing.length) {
      const critical = missing.includes('HttpOnly') || missing.includes('Secure')
      findings.push({
        id: id(),
        title: `Cookie "${name}" is missing ${missing.join(', ')}`,
        severity: critical ? 'medium' : 'low',
        category: 'Session',
        cwe: 'CWE-1004',
        owasp: 'A05:2021 Security Misconfiguration',
        description: [
          missing.includes('HttpOnly') && 'Without HttpOnly the cookie is readable by any script on the page.',
          missing.includes('Secure') && 'Without Secure it is sent over plain HTTP.',
          missing.includes('SameSite') && 'Without SameSite it rides along on cross-site requests.',
        ]
          .filter(Boolean)
          .join(' '),
        evidence: truncate(raw, 120),
        fix: `Set ${missing.join('; ')} on this cookie.`,
        effort: 'low',
      })
    }
  }
  if (input.cookies.length) {
    const clean = !findings.some((f) => f.category === 'Session')
    checks.push({
      name: 'Cookie flags',
      status: clean ? 'pass' : 'fail',
      detail: `${input.cookies.length} cookie${input.cookies.length === 1 ? '' : 's'} set`,
    })
  }

  return { findings, checks }
}

function lowerKeys(o: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(o)) out[k.toLowerCase()] = v
  return out
}

function truncate(s: string, n = 90): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}
