'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { SendHorizontal, Globe, FileText, ShieldAlert, Sparkles, Clock, Radar } from 'lucide-react'
import { useSession } from '@/lib/session'

/* ------------------------------------------------------------------
   Nothing is persisted yet — no analyses, no reports, no score
   history. Rather than invent numbers, every tile reads em-dash and
   the page leads with the two actions that would produce real data.

   When the engine lands, replace `stats` and the empty panel below
   with a fetch; the layout is already sized for it.
   ------------------------------------------------------------------ */

const stats = [
  { label: 'Requests analysed', icon: Sparkles },
  { label: 'Open findings', icon: ShieldAlert },
  { label: 'Reports exported', icon: FileText },
  { label: 'Avg. time to fix', icon: Clock },
]

export default function Dashboard() {
  const session = useSession()
  const first = firstName(session?.name || session?.email || '')
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-ink-300" suppressHydrationWarning>
            {greet}
          </p>
          <h1 className="display mt-1 text-[32px] sm:text-[40px]">
            {first ? `${first}, nothing is` : 'Nothing is'} <i className="text-brand-300">guarded yet.</i>
          </h1>
          <p className="mt-2 max-w-lg text-[14px] text-ink-300">
            Send an API request or scan a site, and this page fills with your real score, findings and history.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/api-tester"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-[13.5px] font-semibold hover:bg-brand-500"
          >
            <SendHorizontal size={15} /> New request
          </Link>
          <Link
            href="/app/website-scan"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/6 px-4 text-[13.5px] font-semibold ring-1 ring-white/10 hover:bg-white/10"
          >
            <Globe size={15} /> Scan website
          </Link>
        </div>
      </div>

      {/* stat tiles — placeholders until there is something to count */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((t, idx) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-xl bg-ink-800 p-4 ring-1 ring-white/8"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-300">{t.label}</span>
              <t.icon size={15} className="text-ink-400" />
            </div>
            <div className="mt-2 font-display text-[34px] leading-none text-ink-400">—</div>
            <div className="mt-1.5 text-[12px] text-ink-400">no data yet</div>
          </motion.div>
        ))}
      </div>

      {/* empty state */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-4 rounded-xl bg-ink-800 ring-1 ring-white/8"
      >
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-brand-300 ring-1 ring-white/10">
            <Radar size={26} />
          </span>
          <h2 className="mt-5 text-[17px] font-bold">No analyses on record</h2>
          <p className="mt-1.5 max-w-md text-[13.5px] text-ink-300">
            Your security score, findings breakdown and recent activity appear here once the first audit runs.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/app/api-tester"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3.5 text-[13px] font-semibold hover:bg-brand-500"
            >
              <SendHorizontal size={14} /> Audit an API endpoint
            </Link>
            <Link
              href="/app/website-scan"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-white/6 px-3.5 text-[13px] font-semibold ring-1 ring-white/10 hover:bg-white/10"
            >
              <Globe size={14} /> Scan a website
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

/**
 * "Eng. Ali Huzaifa" should greet Ali, not Eng. Skips leading honorifics —
 * anything ending in a full stop — and falls back to the first token.
 */
function firstName(nameOrEmail: string): string {
  const tokens = nameOrEmail.split(/[\s@]+/).filter(Boolean)
  return tokens.find((t) => !t.endsWith('.')) ?? tokens[0] ?? ''
}
