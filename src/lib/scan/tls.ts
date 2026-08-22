import tls from 'node:tls'
import type { Finding } from '@/lib/security'

export interface TlsInfo {
  protocol: string | null
  cipher: string | null
  issuer: string | null
  subject: string | null
  validFrom: string | null
  validTo: string | null
  daysRemaining: number | null
  altNames: string[]
}

/**
 * Opens a TLS connection purely to read the negotiated parameters and the
 * certificate. `fetch` gives no access to either, so this is a second,
 * short-lived socket to the same host.
 */
export function inspectTls(hostname: string, port = 443, timeoutMs = 8000): Promise<TlsInfo | null> {
  return new Promise((resolve) => {
    let settled = false
    const done = (value: TlsInfo | null) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(value)
    }

    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname, // SNI — without it a shared host serves the wrong cert
        // We are auditing, not trusting. An expired or self-signed certificate
        // is a finding to report, not a reason to fail the handshake.
        rejectUnauthorized: false,
        timeout: timeoutMs,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate(false)
          const validTo = cert?.valid_to ? new Date(cert.valid_to) : null
          done({
            protocol: socket.getProtocol(),
            cipher: socket.getCipher()?.name ?? null,
            // A distinguished-name field can repeat, in which case Node hands
            // back an array rather than a string.
            issuer: first(cert?.issuer?.O) ?? first(cert?.issuer?.CN),
            subject: first(cert?.subject?.CN),
            validFrom: cert?.valid_from ?? null,
            validTo: cert?.valid_to ?? null,
            daysRemaining: validTo ? Math.floor((validTo.getTime() - Date.now()) / 86_400_000) : null,
            altNames: (cert?.subjectaltname ?? '')
              .split(',')
              .map((s) => s.trim().replace(/^DNS:/, ''))
              .filter(Boolean)
              .slice(0, 20),
          })
        } catch {
          done(null)
        }
      },
    )

    socket.on('error', () => done(null))
    socket.on('timeout', () => done(null))
  })
}

/** Turns the negotiated TLS parameters into findings. */
export function tlsFindings(info: TlsInfo | null, startId: number): Finding[] {
  if (!info) return []
  const out: Finding[] = []
  let n = startId
  const id = () => `T-${String(++n).padStart(2, '0')}`

  const protocol = info.protocol ?? ''
  if (/TLSv1(\.[01])?$/.test(protocol)) {
    out.push({
      id: id(),
      title: `Obsolete TLS version negotiated (${protocol})`,
      severity: 'high',
      category: 'Transport',
      cwe: 'CWE-327',
      owasp: 'A02:2021 Cryptographic Failures',
      description: 'TLS 1.0 and 1.1 are deprecated and no longer considered safe against modern attacks.',
      evidence: `${protocol} · ${info.cipher ?? 'unknown cipher'}`,
      fix: 'Disable TLS 1.0/1.1 and require TLS 1.2 or above.',
      effort: 'low',
    })
  }

  if (info.daysRemaining !== null) {
    if (info.daysRemaining < 0) {
      out.push({
        id: id(),
        title: 'TLS certificate has expired',
        severity: 'critical',
        category: 'Transport',
        cwe: 'CWE-295',
        description: `The certificate expired ${Math.abs(info.daysRemaining)} day(s) ago. Browsers will interrupt every visitor.`,
        evidence: `valid_to ${info.validTo}`,
        fix: 'Renew the certificate and automate renewal so it cannot lapse again.',
        effort: 'low',
      })
    } else if (info.daysRemaining < 14) {
      out.push({
        id: id(),
        title: `TLS certificate expires in ${info.daysRemaining} day(s)`,
        severity: 'medium',
        category: 'Transport',
        description: 'The certificate is close enough to expiry that a failed renewal would take the site down.',
        evidence: `valid_to ${info.validTo}`,
        fix: 'Confirm automatic renewal is working.',
        effort: 'low',
      })
    }
  }

  return out
}

/** Certificate DN fields are `string | string[] | undefined` depending on the cert. */
function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}
