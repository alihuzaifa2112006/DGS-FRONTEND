import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHmac } from 'node:crypto'
import { promisify } from 'node:util'
import { env } from '@/lib/env'

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

/* ------------------------------------------------------------------
   scrypt — memory-hard, and in Node's standard library, so there is no
   native build step and nothing to keep patched.

   Cost is encoded in every stored hash, so these numbers can be raised
   later: `needsRehash` spots the old parameters and `verifyPassword`'s
   caller transparently upgrades the record on next sign-in.
   ------------------------------------------------------------------ */
const PARAMS = { N: 32768, r: 8, p: 2, keylen: 64 } as const
// 128 * N * r * p, plus headroom.
const MAXMEM = 128 * PARAMS.N * PARAMS.r * PARAMS.p * 2

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(normalize(password), salt, PARAMS.keylen, { ...PARAMS, maxmem: MAXMEM })
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parse(stored)
  if (!parsed) return false

  const key = await scrypt(normalize(password), parsed.salt, parsed.hash.length, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    maxmem: 128 * parsed.N * parsed.r * parsed.p * 2,
  })
  // Lengths already match by construction; timingSafeEqual throws otherwise.
  if (key.length !== parsed.hash.length) return false
  return timingSafeEqual(key, parsed.hash)
}

/** True when `stored` was made with weaker parameters than we now use. */
export function needsRehash(stored: string): boolean {
  const parsed = parse(stored)
  if (!parsed) return true
  return parsed.N !== PARAMS.N || parsed.r !== PARAMS.r || parsed.p !== PARAMS.p
}

/**
 * Burns roughly the same CPU as a real verify. Called when the email does
 * not exist, so "no such user" and "wrong password" take the same time and
 * an attacker cannot enumerate accounts with a stopwatch.
 */
export async function fakeVerify(): Promise<void> {
  await scrypt(randomBytes(16), randomBytes(16), PARAMS.keylen, { ...PARAMS, maxmem: MAXMEM })
}

/* ---------------- token hashing (refresh + reset links) ---------------- */

/**
 * Refresh and reset tokens are already 256 bits of CSPRNG output, so they
 * need no stretching — only a keyed digest, so that a leaked database
 * cannot be replayed against a running server.
 */
export function hashToken(raw: string): string {
  return createHmac('sha256', env.TOKEN_PEPPER).update(raw).digest('base64url')
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/* ---------------- internals ---------------- */

/**
 * Unicode-normalise so a password typed on iOS and on Windows produce the
 * same bytes. Also caps input length — scrypt over a 10 MB "password" is
 * a free CPU-exhaustion vector.
 */
function normalize(password: string): string {
  return password.normalize('NFKC').slice(0, 1024)
}

function parse(stored: string) {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return null
  const [, n, r, p, salt, hash] = parts
  const N = Number(n)
  const rr = Number(r)
  const pp = Number(p)
  if (!Number.isInteger(N) || !Number.isInteger(rr) || !Number.isInteger(pp)) return null
  // Refuse absurd parameters from a tampered record — they would OOM the process.
  if (N > 1 << 20 || rr > 32 || pp > 16) return null
  return { N, r: rr, p: pp, salt: Buffer.from(salt, 'base64'), hash: Buffer.from(hash, 'base64') }
}
