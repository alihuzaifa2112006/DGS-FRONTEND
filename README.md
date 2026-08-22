# DGS — Digital Guard System

Postman-style API workspace with a security engine: send a request through the server proxy, inspect the real
response, scan a website from its URL, export a report.

**Status.** Auth, accounts, the request proxy, the scanner, the AI write-up and PDF export all work end to
end. What is missing is persistence — see [What is still missing](#what-is-still-missing). No screen invents
data: anything without a backend behind it says so.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · MongoDB + Mongoose · `jose` (JWT) · `zod` ·
`motion` · `lucide-react`

```bash
cp .env.example .env.local   # then fill in MONGODB_URI + the two secrets
npm install
npm run dev                  # http://localhost:3000
npm run build
npm run lint
npm run typecheck
```

Generate the secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Auth

Cookie sessions, no OTP, no third-party sign-in.

| Piece | How |
| --- | --- |
| Password hashing | `scrypt` (N=32768, r=8, p=2) from `node:crypto` — cost is stored in the hash, so it can be raised later and `needsRehash` upgrades records on next sign-in |
| Access token | 15-minute HS256 JWT in an httpOnly cookie |
| Refresh token | 30-day opaque token, **HMAC-hashed at rest**, path-scoped to `/api/auth` |
| Rotation | every refresh mints a successor; replaying a spent token revokes the whole family and forces a fresh login |
| Instant revocation | `User.tokenVersion` is checked on every request, so a password change kills live access tokens |
| CSRF | double-submit cookie + `Origin`/`Referer` check on every write |
| Brute force | per-IP sliding-window limiter *and* a per-account lockout after 8 failures |
| Enumeration | login and forgot-password answer identically for known and unknown addresses; a miss still burns equivalent CPU so timing does not leak |

`src/middleware.ts` gates `/app/*` at the edge and attaches CSP, HSTS, `X-Frame-Options` and friends to every
response.

## API

| Route | Purpose |
| --- | --- |
| `POST /api/auth/signup` `login` `logout` `refresh` | session lifecycle (`logout?all=1` ends every device) |
| `GET /api/auth/me` | current user — ETag'd, memoised in-process for 15s |
| `GET /api/auth/csrf` | hands the browser its CSRF token |
| `POST /api/auth/forgot-password` `reset-password` | single-use emailed link, 15-minute expiry |
| `GET/DELETE /api/auth/sessions` `DELETE /api/auth/sessions/:id` | list and revoke devices |
| `GET/PATCH /api/account/profile` | name, company, role |
| `POST /api/account/password` | requires the current password; optionally signs out other devices |
| `POST/DELETE /api/account/avatar` · `GET /api/account/avatar/:userId` | upload, remove, serve |
| `POST /api/tools/http` | **the request proxy** — what makes the API Tester real |
| `POST /api/tools/scan` | **the website scanner** |
| `POST /api/tools/advice` | plain-English verdict + priority actions (AI, with a built-in fallback) |
| `POST /api/tools/report` | download the audit as a PDF |
| `GET /api/health` | liveness + a real database ping |

Every response uses one envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message, fields? } }`.

### The proxy and the scanner

Both fetch a user-supplied URL from our server, which is an SSRF primitive by default. `src/lib/http/ssrf.ts`
resolves every hostname first and rejects loopback, private, link-local (including `169.254.169.254`), CGNAT and
multicast ranges — in IPv4, in IPv6, through IPv4-mapped and 6to4 forms, and **again on every redirect hop**.
Non-HTTP schemes, credentials in the URL and datastore/shell ports are refused outright.

The scanner is deliberately model-free. It grades TLS (protocol, cipher, issuer, expiry), security headers,
cookie flags, CORS and version disclosure — facts you read off the response, where severity is settled by
published guidance. Every result carries an `evidence` field, and the response includes a `notCovered` list so a
good grade is not mistaken for a clean bill of health.

## The Python service (`../python`)

A small FastAPI sidecar holds the LLM key and renders PDFs. Two endpoints — `/api/suggest` and
`/api/report/pdf` — both behind a shared secret (`X-Internal-Token`) and its own rate limiter.

```bash
cd ../python
./run.sh            # or run.bat on Windows
```

Then in `client/.env.local`:

```
PY_SERVICE_URL=http://127.0.0.1:8000
PY_INTERNAL_TOKEN=<the INTERNAL_TOKEN from python/.env>
```

**It is optional on purpose.** If it is down, unconfigured or slow, `/api/tools/advice` falls back to
`src/lib/scan/advice.ts`, which builds the same plain-English shape from the findings with no model
involved. The UI labels which one it used — "AI summary" or "built-in summary". Only PDF export hard-depends
on the service.

**On the model.** The key supplied is an **OpenRouter** key, not a Google one. OpenRouter no longer offers a
free Gemini tier — `google/gemini-2.0-flash-exp:free` has been retired — so the default is
`google/gemini-2.5-flash`, which **consumes OpenRouter credits**. Override with `OPENROUTER_MODEL`.

## Rate limiting & caching

- Sliding-window limiter in MongoDB (shared across serverless instances), with an in-process memo for the
  already-blocked hot path. **Rejected requests are not counted** — otherwise a retrying client could never
  recover and the `Retry-After` we return would be a lie.
- `RateLimit-*` headers on every limited route.
- `/api/auth/me` and `/api/account/profile` are ETag'd and answer `304` unchanged.
- Avatars are served under a versioned URL with `immutable` caching, so the browser refetches only after a change.
- Mongo TTL indexes sweep expired sessions, reset tokens, rate-limit counters and audit logs — no cron.

## Structure

```
src/
  app/
    (auth)/          login · signup · forgot-password · reset-password
    app/             console — overview, api-tester, website-scan, reports, settings
    api/
      auth/*         session lifecycle
      account/*      profile, password, avatar
      tools/http     request proxy
      tools/scan     website scanner
      tools/advice   plain-English write-up (AI, with fallback)
      tools/report   PDF export
  components/ui/ConfirmDialog.tsx   confirmation modal for anything destructive
  lib/
    env.ts           validated environment, fails loudly at boot
    api.ts           browser client — CSRF header, single-flight token refresh
    session.ts       client auth store (mirrors /api/auth/me; holds no credential)
    security.ts      the domain model — Finding, Severity, scoring. Real.
    demo.ts          demo content for the marketing pages ONLY. Never read by the console.
    auth/            password, jwt, tokens, cookies, csrf, current-user
    db/              mongoose connection + models
    http/            response envelope, route wrapper, rate-limit, cache, ssrf, image
    scan/            headers.ts, tls.ts, api-response.ts — the deterministic audits
                     advice.ts — plain-English fallback when the AI service is down
    ai/client.ts     bridge to ../python, degrades gracefully
```

**Conventions**

- `page.tsx` is a server component that exports `metadata`; interactive UI lives in a co-located `*View.tsx`.
- Route handlers wrap in `withRoute({ auth, body, rateLimit })` — that one wrapper does the database
  connection, CSRF, auth, zod validation and error funnelling.
- `security.ts` vs `demo.ts` is a hard line. If a console screen has no data, it renders an empty state.

## What is still missing

Panels with no backend are labelled **"not saved yet"** in the UI rather than pretending to save.

1. **Persistence for results.** Scans and requests are not stored, so Reports is empty and the Overview tiles
   read `—`. Needs `Report`/`Analysis` collections; `src/lib/security.ts` already holds the shape. Everything
   else depends on this one.
2. **Workspace, API keys, notifications, report branding.** Settings panels with no endpoints behind them
   (each is labelled "not saved yet").
3. **Email delivery.** Reset links print to the server console until `RESEND_API_KEY` is set.
4. **Email change + 2FA.** Email is read-only by design — changing it is an account-takeover step and needs
   its own verification flow.
5. **Deeper scanning** — crawling, endpoint discovery, authenticated scans, injection and access-control
   testing. That needs a long-running worker with a job queue; serverless functions time out first.

## Deploying

Set `MONGODB_URI`, `AUTH_SECRET`, `TOKEN_PEPPER` and `APP_URL` in the host's environment. In MongoDB Atlas,
allow the platform's egress (`0.0.0.0/0` for Vercel, which has no static IPs).

Built by Eng. Ali Huzaifa.
