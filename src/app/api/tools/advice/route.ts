import { z } from 'zod'
import { withRoute } from '@/lib/http/route'
import { ok } from '@/lib/http/response'
import { getAdvice } from '@/lib/ai/client'
import type { Finding } from '@/lib/security'
import type { RateLimitRule } from '@/lib/http/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** LLM calls cost money and time even on a free tier. Keep them scarce. */
const ADVICE_LIMIT: RateLimitRule = { limit: 15, windowSeconds: 10 * 60 }

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

const adviceSchema = z.object({
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
})

type AdviceInput = z.infer<typeof adviceSchema>

/**
 * POST /api/tools/advice — turn findings into plain-English advice.
 *
 * Delegates to the Python service when it is running and falls back to the
 * built-in generator when it is not, so this endpoint always answers.
 */
export const POST = withRoute<AdviceInput>(
  {
    auth: 'required',
    body: adviceSchema,
    rateLimit: { rule: ADVICE_LIMIT, scope: 'advice', by: 'user' },
  },
  async ({ body }) => {
    const advice = await getAdvice({
      ...body,
      findings: body.findings as Finding[],
    })
    return ok(advice, { headers: { 'Cache-Control': 'no-store' } })
  },
)
