import { lookup } from 'node:dns/promises'
import net from 'node:net'

/* ------------------------------------------------------------------
   Guards for the outbound proxy.

   An endpoint that fetches a user-supplied URL from our server is a
   server-side request forgery primitive by default: the attacker gets
   to make requests *from inside our network*, with our egress IP, to
   things a browser could never reach — cloud metadata services,
   internal admin panels, databases bound to localhost.

   So every hostname is resolved first and every resolved address is
   checked against the ranges below before a socket is opened.
   ------------------------------------------------------------------ */

export type SsrfVerdict = { ok: true; addresses: string[] } | { ok: false; reason: string }

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * Ports that are never a legitimate HTTP API but are very much worth
 * probing from inside a VPC. Blocking them removes the cheapest use of
 * this endpoint as an internal port scanner.
 */
const BLOCKED_PORTS = new Set([
  22, 23, 25, 110, 143, 445, 465, 587, 993, 995, // shells and mail
  1433, 1521, 3306, 5432, 6379, 9200, 11211, 27017, 27018, 27019, // datastores
])

export function isBlockedIp(ip: string): boolean {
  const version = net.isIP(ip)
  if (version === 4) return isBlockedIPv4(ip)
  if (version === 6) return isBlockedIPv6(ip)
  return true // not an IP literal we can reason about — refuse
}

function isBlockedIPv4(ip: string): boolean {
  const p = ip.split('.').map(Number)
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = p as [number, number, number, number]

  if (a === 0) return true // 0.0.0.0/8 "this network"
  if (a === 10) return true // private
  if (a === 127) return true // loopback
  if (a === 169 && b === 254) return true // link-local — includes 169.254.169.254 (cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true // private
  if (a === 192 && b === 168) return true // private
  if (a === 192 && b === 0) return true // IETF protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
  if (a === 198 && (b === 18 || b === 19)) return true // benchmarking
  if (a >= 224) return true // multicast, reserved, broadcast
  return false
}

/**
 * Expands any IPv6 form into its eight 16-bit groups.
 *
 * Needed because Node normalises `::ffff:127.0.0.1` to `::ffff:7f00:1` — a
 * textual check for a dotted quad misses it entirely, and the address still
 * routes to loopback. Anything that cannot be parsed returns null and is
 * treated as blocked.
 */
function expandIPv6(ip: string): number[] | null {
  let text = ip.split('%')[0]! // drop any zone id

  // A trailing dotted quad (::ffff:127.0.0.1) becomes two hex groups.
  const dotted = text.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (dotted) {
    const octets = dotted[1]!.split('.').map(Number)
    if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
    const hi = ((octets[0]! << 8) | octets[1]!).toString(16)
    const lo = ((octets[2]! << 8) | octets[3]!).toString(16)
    text = text.slice(0, dotted.index) + `${hi}:${lo}`
  }

  const halves = text.split('::')
  if (halves.length > 2) return null

  const parse = (part: string) =>
    part === '' ? [] : part.split(':').map((h) => (/^[0-9a-f]{1,4}$/i.test(h) ? parseInt(h, 16) : NaN))

  const head = parse(halves[0]!)
  const tail = halves.length === 2 ? parse(halves[1]!) : []
  if ([...head, ...tail].some(Number.isNaN)) return null

  if (halves.length === 2) {
    const gap = 8 - head.length - tail.length
    if (gap < 0) return null
    return [...head, ...Array(gap).fill(0), ...tail]
  }
  return head.length === 8 ? head : null
}

function isBlockedIPv6(ip: string): boolean {
  const g = expandIPv6(ip.toLowerCase())
  if (!g) return true

  const allZero = (upto: number) => g.slice(0, upto).every((x) => x === 0)
  const embeddedV4 = (hi: number, lo: number) =>
    `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`

  if (allZero(8)) return true // ::
  if (allZero(7) && g[7] === 1) return true // ::1 loopback

  // ::ffff:a.b.c.d — IPv4-mapped. Routes exactly like the v4 address.
  if (allZero(5) && g[5] === 0xffff) return isBlockedIPv4(embeddedV4(g[6]!, g[7]!))

  // ::a.b.c.d — deprecated IPv4-compatible, same reasoning.
  if (allZero(6) && !(g[6] === 0 && g[7] === 0)) return isBlockedIPv4(embeddedV4(g[6]!, g[7]!))

  if ((g[0]! & 0xffc0) === 0xfe80) return true // fe80::/10 link-local
  if ((g[0]! & 0xfe00) === 0xfc00) return true // fc00::/7 unique local
  if ((g[0]! & 0xff00) === 0xff00) return true // ff00::/8 multicast

  // 2002::/16 (6to4) embeds a v4 address in groups 1-2.
  if (g[0] === 0x2002) return isBlockedIPv4(embeddedV4(g[1]!, g[2]!))

  // 2001:0::/32 Teredo — also tunnels v4.
  if (g[0] === 0x2001 && g[1] === 0) return true

  return false
}

/**
 * Validates a URL and resolves it. Returns the resolved addresses so the
 * caller can be sure the name it checked is the name it fetches.
 */
export async function assertSafeUrl(raw: string): Promise<SsrfVerdict> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, reason: 'That is not a valid URL.' }
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, reason: 'Only http:// and https:// URLs can be sent.' }
  }

  // Credentials in the URL get forwarded as an Authorization header by some
  // stacks; refuse rather than leak them into logs.
  if (url.username || url.password) {
    return { ok: false, reason: 'Remove the credentials from the URL and use a header instead.' }
  }

  const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, reason: 'That port is not valid.' }
  }
  if (BLOCKED_PORTS.has(port)) {
    return { ok: false, reason: `Port ${port} is not allowed.` }
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '')

  // An IP literal needs no DNS round-trip.
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      return { ok: false, reason: 'That address is on a private or reserved range.' }
    }
    return { ok: true, addresses: [hostname] }
  }

  // Block the obvious internal names before spending a DNS query.
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    return { ok: false, reason: 'That hostname resolves inside the network.' }
  }

  let resolved: { address: string }[]
  try {
    resolved = await lookup(hostname, { all: true })
  } catch {
    return { ok: false, reason: `Could not resolve ${hostname}.` }
  }

  if (resolved.length === 0) {
    return { ok: false, reason: `Could not resolve ${hostname}.` }
  }

  // Every address must pass. A name that resolves to one public and one
  // private address is a rebinding attempt, not a misconfiguration.
  for (const { address } of resolved) {
    if (isBlockedIp(address)) {
      return { ok: false, reason: 'That hostname resolves to a private or reserved address.' }
    }
  }

  return { ok: true, addresses: resolved.map((r) => r.address) }
}

/**
 * Headers we refuse to forward from the client.
 *
 * Hop-by-hop headers belong to a single connection and must not be relayed;
 * `cookie` and `host` would leak our own session and confuse the origin.
 */
const FORBIDDEN_REQUEST_HEADERS = new Set([
  'host',
  'cookie',
  'connection',
  'keep-alive',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'accept-encoding',
])

export function sanitiseRequestHeaders(input: Record<string, string>): Headers {
  const out = new Headers()
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = rawKey.trim().toLowerCase()
    if (!key || FORBIDDEN_REQUEST_HEADERS.has(key)) continue
    // Header injection: a newline would let the caller append arbitrary headers.
    if (/[\r\n]/.test(rawKey) || /[\r\n]/.test(rawValue)) continue
    try {
      out.set(key, rawValue)
    } catch {
      /* invalid header name — skip it rather than fail the whole request */
    }
  }
  return out
}
