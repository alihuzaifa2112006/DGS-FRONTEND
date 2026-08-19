/* ------------------------------------------------------------------
   Mock data + types. UI-only for now — every "engine" call resolves
   from here with a small delay so animations have something to show.
   ------------------------------------------------------------------ */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Finding {
  id: string
  title: string
  severity: Severity
  category: string
  cwe?: string
  owasp?: string
  description: string
  evidence?: string
  fix: string
  effort: 'low' | 'medium' | 'high'
}

export interface AiAnalysis {
  score: number // 0-100 (higher = safer)
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  attackSurface: { label: string; value: string; risk: Severity }[]
  findings: Finding[]
  suggestions: string[]
  checks: { name: string; status: 'pass' | 'fail' | 'warn' }[]
}

export const severityMeta: Record<Severity, { label: string; text: string; bg: string; dot: string; rank: number }> = {
  critical: { label: 'Critical', text: 'text-red-300', bg: 'bg-red-500/15 ring-red-500/30', dot: 'bg-red-400', rank: 0 },
  high: { label: 'High', text: 'text-orange-300', bg: 'bg-orange-500/15 ring-orange-500/30', dot: 'bg-orange-400', rank: 1 },
  medium: { label: 'Medium', text: 'text-amber-300', bg: 'bg-amber-500/15 ring-amber-500/30', dot: 'bg-amber-400', rank: 2 },
  low: { label: 'Low', text: 'text-sky-300', bg: 'bg-sky-500/15 ring-sky-500/30', dot: 'bg-sky-400', rank: 3 },
  info: { label: 'Info', text: 'text-ink-200', bg: 'bg-white/8 ring-white/15', dot: 'bg-ink-300', rank: 4 },
}

export const gradeFor = (score: number): AiAnalysis['grade'] =>
  score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F'

export const sampleRequest = {
  method: 'POST',
  url: 'https://api.acme-shop.dev/v1/auth/login',
  headers: [
    { key: 'Content-Type', value: 'application/json', on: true },
    { key: 'Accept', value: 'application/json', on: true },
    { key: 'X-Client', value: 'dgs-console/1.0', on: true },
  ],
  params: [{ key: 'include', value: 'profile', on: true }],
  body: JSON.stringify(
    { email: 'sara@acme-shop.dev', password: 'hunter2', remember: true },
    null,
    2,
  ),
}

export const sampleResponse = {
  status: 200,
  statusText: 'OK',
  timeMs: 412,
  sizeKb: 1.9,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    server: 'nginx/1.18.0 (Ubuntu)',
    'x-powered-by': 'Express',
    'set-cookie': 'session=eyJhbGciOi...; Path=/',
    'access-control-allow-origin': '*',
    date: 'Wed, 19 Aug 2026 09:41:12 GMT',
  },
  body: {
    ok: true,
    user: { id: 1042, email: 'sara@acme-shop.dev', role: 'admin', password_hash: '$2b$10$e0NRxu2vT…' },
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEwNDIsInJvbGUiOiJhZG1pbiJ9.k3n…',
    expires_in: 31536000,
    debug: { query: 'SELECT * FROM users WHERE email = ?', took_ms: 3 },
  },
}

export const sampleAnalysis: AiAnalysis = {
  score: 42,
  grade: 'D',
  summary:
    'The login endpoint authenticates correctly but leaks sensitive data and lacks hardening. A password hash and SQL debug output are returned to the client, CORS is wide-open, the session cookie is not marked HttpOnly/Secure, and the JWT lives for a full year. Server fingerprint headers reveal the stack.',
  attackSurface: [
    { label: 'Auth type', value: 'JWT (HS256), 365d TTL', risk: 'high' },
    { label: 'CORS', value: 'Access-Control-Allow-Origin: *', risk: 'high' },
    { label: 'Transport', value: 'HTTPS ✓  HSTS ✗', risk: 'medium' },
    { label: 'Fingerprint', value: 'nginx/1.18.0 · Express', risk: 'low' },
    { label: 'Rate limiting', value: 'No RateLimit-* headers', risk: 'medium' },
    { label: 'Payload', value: 'password_hash · debug.query', risk: 'critical' },
  ],
  findings: [
    {
      id: 'F-01',
      title: 'Password hash exposed in response body',
      severity: 'critical',
      category: 'Sensitive Data Exposure',
      cwe: 'CWE-200',
      owasp: 'API3:2023 Broken Object Property Level Authorization',
      description:
        'The `user.password_hash` field is serialised into the login response. Even bcrypt hashes are offline-crackable and should never leave the server.',
      evidence: '"password_hash": "$2b$10$e0NRxu2vT…"',
      fix: 'Whitelist response fields with a DTO/serializer (e.g. `pick(user, ["id","email","role"])`). Add a response-schema test that fails on unknown keys.',
      effort: 'low',
    },
    {
      id: 'F-02',
      title: 'Wildcard CORS on an authenticated endpoint',
      severity: 'high',
      category: 'Misconfiguration',
      cwe: 'CWE-942',
      owasp: 'API8:2023 Security Misconfiguration',
      description:
        '`Access-Control-Allow-Origin: *` lets any origin read this response in the browser. Combined with the token in the body, a malicious site can harvest sessions.',
      evidence: 'access-control-allow-origin: *',
      fix: 'Reflect only an allow-list of origins and set `Vary: Origin`. Never use `*` together with credentials.',
      effort: 'low',
    },
    {
      id: 'F-03',
      title: 'Session cookie missing HttpOnly, Secure and SameSite',
      severity: 'high',
      category: 'Session Management',
      cwe: 'CWE-1004',
      owasp: 'API2:2023 Broken Authentication',
      description: 'The `session` cookie is readable by JavaScript and can be sent over plain HTTP, making XSS→session theft trivial.',
      evidence: 'set-cookie: session=…; Path=/',
      fix: 'Set `HttpOnly; Secure; SameSite=Lax` (or Strict) and a short `Max-Age`.',
      effort: 'low',
    },
    {
      id: 'F-04',
      title: 'JWT lifetime of 365 days',
      severity: 'medium',
      category: 'Authentication',
      cwe: 'CWE-613',
      owasp: 'API2:2023 Broken Authentication',
      description: 'A stolen token stays valid for a year; there is no refresh-token rotation.',
      evidence: '"expires_in": 31536000',
      fix: 'Issue 15-minute access tokens plus rotating refresh tokens; store a token version to allow revocation.',
      effort: 'medium',
    },
    {
      id: 'F-05',
      title: 'SQL debug information leaked',
      severity: 'medium',
      category: 'Information Disclosure',
      cwe: 'CWE-209',
      description: 'The `debug.query` object reveals table/column names, helping an attacker craft injection payloads.',
      evidence: '"query": "SELECT * FROM users WHERE email = ?"',
      fix: 'Strip debug objects in production builds; gate them behind `NODE_ENV !== "production"`.',
      effort: 'low',
    },
    {
      id: 'F-06',
      title: 'No rate limiting on credential endpoint',
      severity: 'medium',
      category: 'Brute Force',
      cwe: 'CWE-307',
      owasp: 'API4:2023 Unrestricted Resource Consumption',
      description: 'No `RateLimit-*`/`Retry-After` headers and no lockout signal — credential stuffing is unthrottled.',
      fix: 'Add IP + account throttling (e.g. 5 attempts / 15 min), return 429 with `Retry-After`, add CAPTCHA after repeated failures.',
      effort: 'medium',
    },
    {
      id: 'F-07',
      title: 'Server version fingerprinting',
      severity: 'low',
      category: 'Information Disclosure',
      cwe: 'CWE-200',
      description: '`Server: nginx/1.18.0` and `X-Powered-By: Express` disclose exact versions.',
      evidence: 'server: nginx/1.18.0 (Ubuntu)',
      fix: 'Set `server_tokens off;` in nginx and `app.disable("x-powered-by")` in Express.',
      effort: 'low',
    },
    {
      id: 'F-08',
      title: 'Missing security headers',
      severity: 'low',
      category: 'Hardening',
      description: 'No `Strict-Transport-Security`, `X-Content-Type-Options`, or `Cache-Control: no-store` on a credential response.',
      fix: 'Use helmet (Node) or equivalent; ensure `Cache-Control: no-store` for auth responses.',
      effort: 'low',
    },
  ],
  suggestions: [
    'Adopt a response DTO layer so nothing but explicit fields can be serialised.',
    'Move to short-lived JWTs + refresh rotation; add a `jti` claim and a revocation list.',
    'Put the endpoint behind a WAF rule set for credential stuffing (OWASP CRS 9xx).',
    'Add contract tests: assert `password_hash`, `debug` never appear in any 2xx body.',
    'Log auth failures with request IDs and alert on >20 failures/min per IP.',
  ],
  checks: [
    { name: 'TLS in use', status: 'pass' },
    { name: 'HSTS header', status: 'fail' },
    { name: 'CORS policy', status: 'fail' },
    { name: 'Cookie flags', status: 'fail' },
    { name: 'Rate limit signals', status: 'warn' },
    { name: 'Sensitive fields', status: 'fail' },
    { name: 'Content-Type set', status: 'pass' },
    { name: 'Error verbosity', status: 'warn' },
  ],
}

/* ---------------- Website scan ---------------- */

export interface ScanStep {
  id: string
  label: string
  detail: string
}

export const scanSteps: ScanStep[] = [
  { id: 'dns', label: 'Resolving DNS & CDN', detail: 'A/AAAA · CNAME · edge provider' },
  { id: 'tls', label: 'TLS handshake & certificate', detail: 'chain · expiry · cipher suites' },
  { id: 'headers', label: 'Security headers', detail: 'CSP · HSTS · XFO · Referrer-Policy' },
  { id: 'crawl', label: 'Crawling public surface', detail: 'links · forms · scripts · robots.txt' },
  { id: 'apis', label: 'Discovering API endpoints', detail: 'fetch/XHR · GraphQL · Swagger' },
  { id: 'vuln', label: 'Vulnerability heuristics', detail: 'XSS · open redirect · IDOR probes' },
  { id: 'ai', label: 'AI Engine reasoning', detail: 'correlating signals · ranking risk' },
]

export interface SiteScanResult {
  url: string
  score: number
  grade: AiAnalysis['grade']
  tech: string[]
  tls: { valid: boolean; issuer: string; expiresInDays: number; protocol: string }
  headers: { name: string; present: boolean; value?: string; weight: number }[]
  endpoints: { method: string; path: string; risk: Severity }[]
  findings: Finding[]
}

export const sampleSiteScan: SiteScanResult = {
  url: 'https://acme-shop.dev',
  score: 68,
  grade: 'C',
  tech: ['Next.js 14', 'Vercel Edge', 'Stripe.js', 'Google Tag Manager', 'Cloudflare'],
  tls: { valid: true, issuer: "Let's Encrypt R3", expiresInDays: 41, protocol: 'TLS 1.3' },
  headers: [
    { name: 'Strict-Transport-Security', present: true, value: 'max-age=63072000; includeSubDomains', weight: 15 },
    { name: 'Content-Security-Policy', present: false, weight: 25 },
    { name: 'X-Frame-Options', present: true, value: 'SAMEORIGIN', weight: 10 },
    { name: 'X-Content-Type-Options', present: true, value: 'nosniff', weight: 10 },
    { name: 'Referrer-Policy', present: false, weight: 8 },
    { name: 'Permissions-Policy', present: false, weight: 7 },
    { name: 'Cross-Origin-Opener-Policy', present: false, weight: 5 },
  ],
  endpoints: [
    { method: 'GET', path: '/api/products?limit=50', risk: 'low' },
    { method: 'POST', path: '/api/cart', risk: 'medium' },
    { method: 'GET', path: '/api/user/1042', risk: 'high' },
    { method: 'POST', path: '/api/checkout/session', risk: 'medium' },
    { method: 'GET', path: '/api/admin/orders', risk: 'critical' },
    { method: 'GET', path: '/graphql?query={__schema{types{name}}}', risk: 'high' },
  ],
  findings: [
    {
      id: 'W-01',
      title: 'Admin API reachable without auth challenge',
      severity: 'critical',
      category: 'Broken Access Control',
      owasp: 'A01:2021',
      description: '`/api/admin/orders` responds 200 with paginated orders to an unauthenticated probe.',
      fix: 'Enforce server-side role checks on every /api/admin/* route; add integration tests for anonymous access.',
      effort: 'medium',
    },
    {
      id: 'W-02',
      title: 'GraphQL introspection enabled in production',
      severity: 'high',

      category: 'Information Disclosure',
      description: 'The full schema (types, mutations, args) is downloadable, giving attackers a map of the API.',
      fix: 'Disable introspection outside development; add depth/complexity limits.',
      effort: 'low',
    },
    {
      id: 'W-03',
      title: 'No Content-Security-Policy',
      severity: 'high',
      category: 'XSS Hardening',
      owasp: 'A05:2021',
      description: 'Inline scripts and third-party tags (GTM) run unrestricted; any XSS becomes full account takeover.',
      fix: 'Start with `Content-Security-Policy-Report-Only`, use nonces for inline scripts, then enforce.',
      effort: 'high',
    },
    {
      id: 'W-04',
      title: 'Sequential user IDs in /api/user/{id}',
      severity: 'high',
      category: 'IDOR',
      owasp: 'API1:2023',
      description: 'IDs are integers and the endpoint returned another user\'s public profile including email.',
      fix: 'Use opaque UUIDs and verify ownership on every object access.',
      effort: 'medium',
    },
    {
      id: 'W-05',
      title: 'Open redirect on /login?next=',
      severity: 'medium',
      category: 'Phishing Vector',
      description: '`next=https://evil.example` is followed after login.',
      fix: 'Allow only relative paths or an explicit host allow-list for `next`.',
      effort: 'low',
    },
    {
      id: 'W-06',
      title: 'Certificate expires in 41 days',
      severity: 'info',
      category: 'TLS',
      description: 'Auto-renewal appears configured; monitor to be safe.',
      fix: 'Add expiry monitoring (e.g. alert at 14 days).',
      effort: 'low',
    },
  ],
}

/* ---------------- Reports ---------------- */

export interface Report {
  id: string
  name: string
  type: 'api' | 'website'
  target: string
  score: number
  findings: number
  critical: number
  createdAt: string
  pages: number
}

export const sampleReports: Report[] = [
  { id: 'RPT-2041', name: 'Login endpoint audit', type: 'api', target: 'POST /v1/auth/login', score: 42, findings: 8, critical: 1, createdAt: '2026-08-19T09:41:00Z', pages: 9 },
  { id: 'RPT-2040', name: 'acme-shop.dev full scan', type: 'website', target: 'https://acme-shop.dev', score: 68, findings: 6, critical: 1, createdAt: '2026-08-18T16:02:00Z', pages: 14 },
  { id: 'RPT-2037', name: 'Payments webhook', type: 'api', target: 'POST /v1/webhooks/stripe', score: 81, findings: 3, critical: 0, createdAt: '2026-08-17T11:20:00Z', pages: 6 },
  { id: 'RPT-2033', name: 'Public catalogue', type: 'api', target: 'GET /v1/products', score: 93, findings: 1, critical: 0, createdAt: '2026-08-15T08:05:00Z', pages: 4 },
  { id: 'RPT-2029', name: 'portal.itginnovators.com', type: 'website', target: 'https://portal.itginnovators.com', score: 77, findings: 4, critical: 0, createdAt: '2026-08-12T13:44:00Z', pages: 11 },
  { id: 'RPT-2021', name: 'User profile PATCH', type: 'api', target: 'PATCH /v1/users/:id', score: 55, findings: 5, critical: 1, createdAt: '2026-08-09T10:12:00Z', pages: 8 },
]

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
