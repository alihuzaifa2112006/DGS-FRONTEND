'use client'

import { motion } from 'motion/react'
import { ShieldCheck, ShieldAlert, ShieldX, Sparkles, Wrench, Zap } from 'lucide-react'
import { VERDICT_META, type Advice } from '@/lib/scan/advice'
import { cn } from '@/lib/utils'

const ICON = {
  safe: ShieldCheck,
  mostly_safe: ShieldCheck,
  needs_attention: ShieldAlert,
  at_risk: ShieldX,
} as const

/**
 * The answer, before the data.
 *
 * Someone who just scanned their own site wants to know whether they have a
 * problem — not what their HSTS max-age is. This says it in one sentence,
 * explains the consequence, and lists what to do first. The technical
 * panels stay available underneath for whoever wants them.
 */
export function VerdictCard({ advice, loading }: { advice: Advice | null; loading: boolean }) {
  if (loading) {
    return (
      <section className="rounded-2xl bg-ink-800 p-6 ring-1 ring-white/8">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 rounded bg-white/8" />
          <div className="h-7 w-3/4 rounded bg-white/8" />
          <div className="h-4 w-full rounded bg-white/6" />
          <div className="h-4 w-5/6 rounded bg-white/6" />
        </div>
      </section>
    )
  }

  if (!advice) return null

  const meta = VERDICT_META[advice.verdict]
  const Icon = ICON[advice.verdict]

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('overflow-hidden rounded-2xl ring-1', meta.ring)}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn('flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider', meta.tone)}>
            <Icon size={18} /> {meta.label}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider ring-1',
              advice.is_ai_generated
                ? 'bg-brand-500/15 text-brand-200 ring-brand-500/30'
                : 'bg-white/5 text-ink-300 ring-white/10',
            )}
            title={
              advice.is_ai_generated
                ? `Written by ${advice.generated_by}`
                : 'Written from the findings directly — the AI service was not reachable.'
            }
          >
            {advice.is_ai_generated ? (
              <span className="flex items-center gap-1">
                <Sparkles size={10} /> AI summary
              </span>
            ) : (
              'built-in summary'
            )}
          </span>
        </div>

        <h2 className="mt-3 text-[22px] font-bold leading-snug text-white sm:text-[26px]">{advice.headline}</h2>

        <p className="mt-2.5 max-w-3xl text-[14px] leading-relaxed text-ink-100">{advice.plain_summary}</p>

        {advice.risk_explanation && (
          <div className="mt-4 rounded-xl bg-ink-900/60 p-4 ring-1 ring-white/8">
            <p className="eyebrow mb-1.5 text-ink-400">What could actually go wrong</p>
            <p className="text-[13.5px] leading-relaxed text-ink-100">{advice.risk_explanation}</p>
          </div>
        )}
      </div>

      {advice.priority_actions.length > 0 && (
        <div className="border-t border-white/8 bg-ink-900/40 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-[14px] font-bold">
            <Wrench size={15} className="text-brand-300" /> What to fix first
          </h3>
          <ol className="mt-4 space-y-3.5">
            {advice.priority_actions.map((a, i) => (
              <motion.li
                key={a.title}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex gap-3.5"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/6 font-mono text-[11px] font-bold text-ink-100 ring-1 ring-white/10">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-white">{a.title}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-200">{a.why_it_matters}</p>
                  <p className="mt-1.5 rounded-lg bg-ink-900/70 px-3 py-2 font-mono text-[12px] leading-relaxed text-ink-100 ring-1 ring-white/8">
                    {a.how_to_fix}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      {advice.quick_wins.length > 0 && (
        <div className="border-t border-white/8 bg-ink-900/40 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-[14px] font-bold">
            <Zap size={15} className="text-amber-300" /> Quick wins
          </h3>
          <ul className="mt-3 space-y-2">
            {advice.quick_wins.map((q) => (
              <li key={q} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-100">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  )
}

export default VerdictCard
