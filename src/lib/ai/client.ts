import { env } from '@/lib/env'
import { localAdvice, type Advice } from '@/lib/scan/advice'
import type { Finding } from '@/lib/security'

/* ------------------------------------------------------------------
   Bridge to the Python service (../python).

   That service holds the LLM key and does the PDF rendering. It is
   treated as optional on purpose: if it is down, misconfigured or
   slow, every caller here degrades to the built-in advice rather than
   failing. A security console that cannot answer because a sidecar is
   offline is worse than one that answers a little more plainly.
   ------------------------------------------------------------------ */

export interface AdvicePayload {
  target: string
  kind: 'website' | 'api'
  score: number
  grade: string
  findings: Finding[]
  checks?: { name: string; status: string; detail: string }[]
  tls?: unknown
  server?: string | null
}

const SUGGEST_TIMEOUT_MS = 45_000
const PDF_TIMEOUT_MS = 60_000

function serviceHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Internal-Token': env.PY_INTERNAL_TOKEN,
  }
}

export function aiConfigured(): boolean {
  return Boolean(env.PY_SERVICE_URL && env.PY_INTERNAL_TOKEN)
}

/** Asks the Python service for advice, falling back to the built-in generator. */
export async function getAdvice(payload: AdvicePayload): Promise<Advice> {
  const fallback = () =>
    localAdvice({ target: payload.target, score: payload.score, findings: payload.findings })

  if (!aiConfigured()) return fallback()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUGGEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${env.PY_SERVICE_URL}/api/suggest`, {
      method: 'POST',
      headers: serviceHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!res.ok) {
      console.warn(`[ai] service returned ${res.status}; using built-in advice`)
      return fallback()
    }

    const json = (await res.json()) as { ok?: boolean; data?: Advice }
    // Trust nothing: a malformed payload should not blank the UI.
    if (!json?.ok || !json.data?.headline || !Array.isArray(json.data.priority_actions)) {
      console.warn('[ai] service returned an unexpected shape; using built-in advice')
      return fallback()
    }
    return json.data
  } catch (err) {
    const reason = (err as Error).name === 'AbortError' ? 'timed out' : (err as Error).message
    console.warn(`[ai] service unreachable (${reason}); using built-in advice`)
    return fallback()
  } finally {
    clearTimeout(timer)
  }
}

export type PdfResult =
  | { ok: true; bytes: Uint8Array<ArrayBuffer>; filename: string }
  | { ok: false; reason: string }

/** Requests a rendered PDF report. There is no local fallback for this one. */
export async function getReportPdf(
  payload: AdvicePayload & { suggestions?: Advice },
): Promise<PdfResult> {
  if (!aiConfigured()) {
    return {
      ok: false,
      reason: 'PDF export needs the report service running. Start it from the python/ folder.',
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PDF_TIMEOUT_MS)

  try {
    const res = await fetch(`${env.PY_SERVICE_URL}/api/report/pdf`, {
      method: 'POST',
      headers: serviceHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!res.ok) {
      return { ok: false, reason: `The report service returned ${res.status}.` }
    }

    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Guard against a JSON error body arriving with a 200.
    if (bytes.byteLength < 5 || String.fromCharCode(...bytes.subarray(0, 4)) !== '%PDF') {
      return { ok: false, reason: 'The report service did not return a valid PDF.' }
    }

    const disposition = res.headers.get('content-disposition') ?? ''
    const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? 'dgs-report.pdf'

    return { ok: true, bytes, filename }
  } catch (err) {
    const reason =
      (err as Error).name === 'AbortError'
        ? 'The report took too long to generate.'
        : 'The report service is not reachable. Start it from the python/ folder.'
    return { ok: false, reason }
  } finally {
    clearTimeout(timer)
  }
}
