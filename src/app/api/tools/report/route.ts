import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withRoute } from '@/lib/http/route'
import { ApiError } from '@/lib/http/response'
import { getReportPdf } from '@/lib/ai/client'
import type { Advice } from '@/lib/scan/advice'
import type { Finding } from '@/lib/security'
import type { RateLimitRule } from '@/lib/http/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Rendering a PDF is the heaviest thing either service does. */
const REPORT_LIMIT: RateLimitRule = { limit: 10, windowSeconds: 10 * 60 }

const findingSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  category: z.string(),
  cwe: z.string().optional(),
  owasp: z.string().optional(),
  description: z.string(),
  evidence: z.string().optional(),
  fix: z.string(),
  effort: z.enum(['low', 'medium', 'high']),
})

const reportSchema = z.object({
  target: z.string().trim().min(1).max(2048),
  kind: z.enum(['website', 'api']),
  score: z.number().int().min(0).max(100),
  grade: z.string().max(2),
  findings: z.array(findingSchema).max(100),
  checks: z
    .array(z.object({ name: z.string(), status: z.string(), detail: z.string() }))
    .max(60)
    .optional(),
  tls: z.unknown().optional(),
  server: z.string().nullable().optional(),
  suggestions: z.unknown().optional(),
})

type ReportInput = z.infer<typeof reportSchema>

/**
 * POST /api/tools/report — download the audit as a PDF.
 *
 * Streams the bytes straight through from the Python renderer. Unlike
 * /advice there is no local fallback: without that service there is
 * nothing to render with, and the error says so plainly.
 */
export const POST = withRoute<ReportInput>(
  {
    auth: 'required',
    body: reportSchema,
    rateLimit: { rule: REPORT_LIMIT, scope: 'report', by: 'user' },
  },
  async ({ body }) => {
    const result = await getReportPdf({
      ...body,
      findings: body.findings as Finding[],
      suggestions: body.suggestions as Advice | undefined,
    })

    if (!result.ok) throw new ApiError('SERVICE_UNAVAILABLE', result.reason)

    return new NextResponse(result.bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(result.bytes.byteLength),
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  },
)
