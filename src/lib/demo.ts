/* ------------------------------------------------------------------
   Demo content — NOT user data.

   Two legitimate uses only:
     1. the self-driving animations on the marketing pages, and
     2. the prefilled example request in the API Tester.

   Nothing in the console reads from this file. If a screen needs to
   show a user's results, it fetches them.
   ------------------------------------------------------------------ */

import type { AiAnalysis, ScanStep, SiteScanResult } from '@/lib/security'

/**
 * Prefill for the request builder.
 *
 * Points at a real public endpoint that actually answers, so the first Send
 * a new user presses returns a genuine response instead of a DNS failure.
 * No fake credentials — this is an example, not a scenario.
 */
export const sampleRequest = {
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/posts/1',
  headers: [{ key: 'Accept', value: 'application/json', on: true }],
  params: [] as { key: string; value: string; on: boolean }[],
  body: '',
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

export const scanSteps: ScanStep[] = [
  { id: 'dns', label: 'Resolving DNS & CDN', detail: 'A/AAAA · CNAME · edge provider' },
  { id: 'tls', label: 'TLS handshake & certificate', detail: 'chain · expiry · cipher suites' },
  { id: 'headers', label: 'Security headers', detail: 'CSP · HSTS · XFO · Referrer-Policy' },
  { id: 'crawl', label: 'Crawling public surface', detail: 'links · forms · scripts · robots.txt' },
  { id: 'apis', label: 'Discovering API endpoints', detail: 'fetch/XHR · GraphQL · Swagger' },
  { id: 'vuln', label: 'Vulnerability heuristics', detail: 'XSS · open redirect · IDOR probes' },
  { id: 'ai', label: 'AI Engine reasoning', detail: 'correlating signals · ranking risk' },
]

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
