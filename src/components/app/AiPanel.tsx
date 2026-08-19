import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Sparkles, FileDown, Lightbulb, Crosshair, ListChecks, ShieldAlert, RefreshCw } from 'lucide-react'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Button } from '@/components/ui/Button'
import { FindingsList, ChecksGrid } from './Findings'
import { SeverityBadge } from './SeverityBadge'
import type { AiAnalysis } from '@/lib/mock'
import { cn } from '@/lib/utils'

export type AiState = 'idle' | 'thinking' | 'done'

const thinkingLines = [
  'Parsing response headers…',
  'Checking cookie attributes…',
  'Inspecting payload for secrets…',
  'Evaluating CORS & transport…',
  'Mapping to OWASP API Top-10…',
  'Ranking by exploitability…',
  'Drafting fixes…',
]

export function AiPanel({
  state,
  analysis,
  onAnalyse,
  onExport,
  canAnalyse,
  className,
}: {
  state: AiState
  analysis: AiAnalysis | null
  onAnalyse: () => void
  onExport: () => void
  canAnalyse: boolean
  className?: string
}) {
  const [tab, setTab] = useState<'findings' | 'surface' | 'fixes'>('findings')

  return (
    <section className={cn('flex min-h-0 flex-col rounded-xl bg-ink-800 ring-1 ring-white/8', className)}>
      <header className="flex items-center justify-between gap-2 border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500/20 text-brand-200 ring-1 ring-brand-500/30">
            <Sparkles size={14} />
          </span>
          <div>
            <h2 className="text-[13.5px] font-bold leading-none">AI Engine</h2>
            <p className="mt-0.5 font-mono text-[10.5px] text-ink-300">dgs-analyst · v2</p>
          </div>
        </div>
        {state === 'done' && analysis && (
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={onAnalyse} className="text-ink-200 hover:bg-white/5 hover:text-white" leftIcon={<RefreshCw size={13} />}>
              <span className="hidden sm:inline">Re-run</span>
            </Button>
            <Button size="sm" onClick={onExport} leftIcon={<FileDown size={14} />}>
              Export PDF
            </Button>
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="relative mb-5 h-20 w-20">
                <span className="absolute inset-0 rounded-full bg-brand-500/10 ring-1 ring-brand-500/20" />
                <span className="absolute inset-3 rounded-full bg-brand-500/10 ring-1 ring-brand-500/20" />
                <ShieldAlert size={24} className="absolute inset-0 m-auto text-brand-300" />
              </div>
              <h3 className="text-[15px] font-bold">Nothing analysed yet</h3>
              <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-ink-300">
                Send a request, then hand the response to the engine. It reads headers, cookies and payload the way an attacker would.
              </p>
              <Button className="mt-5" onClick={onAnalyse} disabled={!canAnalyse} leftIcon={<Sparkles size={15} />}>
                Send to AI Engine
              </Button>
              {!canAnalyse && <p className="mt-2 font-mono text-[10.5px] text-ink-400">needs a response first</p>}
            </motion.div>
          )}

          {state === 'thinking' && (
            <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full min-h-[320px] flex-col items-center justify-center">
              <div className="relative h-24 w-24">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/20 [animation-duration:1.8s]" />
                <span className="absolute inset-2 animate-spin rounded-full border-2 border-brand-400/70 border-t-transparent [animation-duration:1.4s]" />
                <span className="absolute inset-5 animate-spin rounded-full border-2 border-dashed border-brand-300/50 [animation-direction:reverse] [animation-duration:3s]" />
                <Sparkles size={20} className="absolute inset-0 m-auto text-brand-200" />
              </div>
              <Thinking />
              <div className="mt-6 w-full max-w-xs space-y-2">
                {[90, 70, 80, 55].map((w, i) => (
                  <div key={i} className="h-2.5 rounded bg-white/5 shimmer" style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          )}

          {state === 'done' && analysis && (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* score + summary */}
              <div className="flex gap-4 rounded-lg bg-ink-900 p-4 ring-1 ring-white/8">
                <ScoreRing value={analysis.score} size={84} stroke={7} label={`grade ${analysis.grade}`} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-bold">Security score {analysis.score}/100</h3>
                    <span className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-200">
                      {analysis.findings.length} findings · {analysis.findings.filter((f) => f.severity === 'critical').length} critical
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-100">{analysis.summary}</p>
                </div>
              </div>

              {/* checks */}
              <div>
                <p className="eyebrow mb-2 flex items-center gap-1.5 text-ink-400">
                  <ListChecks size={12} /> Quick checks
                </p>
                <ChecksGrid checks={analysis.checks} />
              </div>

              {/* tabs */}
              <div className="flex gap-1 rounded-lg bg-ink-900 p-1 ring-1 ring-white/8">
                {(
                  [
                    ['findings', 'Findings', ShieldAlert],
                    ['surface', 'Attack surface', Crosshair],
                    ['fixes', 'Suggestions', Lightbulb],
                  ] as const
                ).map(([k, l, I]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={cn(
                      'relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-[12.5px] font-semibold transition',
                      tab === k ? 'text-white' : 'text-ink-300 hover:text-white',
                    )}
                  >
                    {tab === k && <motion.span layoutId="ai-tab" className="absolute inset-0 rounded-md bg-white/8" />}
                    <I size={13} className="relative" />
                    <span className="relative hidden sm:inline">{l}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === 'findings' && (
                  <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <FindingsList findings={analysis.findings} />
                  </motion.div>
                )}
                {tab === 'surface' && (
                  <motion.ul key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="divide-y divide-white/6 overflow-hidden rounded-lg ring-1 ring-white/8">
                    {analysis.attackSurface.map((a) => (
                      <li key={a.label} className="flex items-center gap-3 bg-ink-900/60 px-3 py-2.5 text-[13px]">
                        <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-300">{a.label}</span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-100">{a.value}</span>
                        <SeverityBadge severity={a.risk} short />
                      </li>
                    ))}
                  </motion.ul>
                )}
                {tab === 'fixes' && (
                  <motion.ol key="x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <li key={s} className="flex gap-3 rounded-lg bg-ink-900/60 p-3 text-[13px] ring-1 ring-white/6">
                        <span className="font-mono text-[11px] text-brand-300">0{i + 1}</span>
                        <span className="text-ink-100">{s}</span>
                      </li>
                    ))}
                  </motion.ol>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

function Thinking() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % thinkingLines.length), 480)
    return () => window.clearInterval(t)
  }, [])
  return (
    <div className="mt-5 h-5">
      <AnimatePresence mode="wait">
        <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="font-mono text-[12px] text-ink-200">
          {thinkingLines[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
