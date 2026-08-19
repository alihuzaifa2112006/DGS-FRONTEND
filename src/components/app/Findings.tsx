import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Copy, Check, Wrench } from 'lucide-react'
import { SeverityBadge } from './SeverityBadge'
import { severityMeta, type Finding, type Severity } from '@/lib/mock'
import { cn } from '@/lib/utils'

/** Expandable, filterable list of findings. */
export function FindingsList({ findings, compact = false }: { findings: Finding[]; compact?: boolean }) {
  const [filter, setFilter] = useState<Severity | 'all'>('all')
  const [open, setOpen] = useState<string | null>(findings[0]?.id ?? null)
  const sorted = [...findings].sort((a, b) => severityMeta[a.severity].rank - severityMeta[b.severity].rank)
  const shown = filter === 'all' ? sorted : sorted.filter((f) => f.severity === filter)
  const counts = sorted.reduce<Record<string, number>>((acc, f) => ((acc[f.severity] = (acc[f.severity] ?? 0) + 1), acc), {})

  return (
    <div>
      {!compact && (
        <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
          <Chip on={filter === 'all'} onClick={() => setFilter('all')}>
            All <span className="opacity-60">{sorted.length}</span>
          </Chip>
          {(Object.keys(severityMeta) as Severity[]).map(
            (s) =>
              counts[s] && (
                <Chip key={s} on={filter === s} onClick={() => setFilter(s)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', severityMeta[s].dot)} />
                  {severityMeta[s].label} <span className="opacity-60">{counts[s]}</span>
                </Chip>
              ),
          )}
        </div>
      )}
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {shown.map((f, i) => {
            const on = open === f.id
            return (
              <motion.li
                key={f.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn('overflow-hidden rounded-lg bg-ink-900/70 ring-1 transition', on ? 'ring-brand-500/40' : 'ring-white/6 hover:ring-white/12')}
              >
                <button onClick={() => setOpen(on ? null : f.id)} className="flex w-full items-start gap-3 p-3 text-left" aria-expanded={on}>
                  <SeverityBadge severity={f.severity} short className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10.5px] text-ink-400">{f.id}</span>
                      <span className="truncate text-[13.5px] font-semibold text-white">{f.title}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-ink-300">
                      <span>{f.category}</span>
                      {f.cwe && <span>{f.cwe}</span>}
                      {f.owasp && <span className="truncate">{f.owasp}</span>}
                    </div>
                  </div>
                  <ChevronDown size={16} className={cn('mt-1 shrink-0 text-ink-300 transition-transform', on && 'rotate-180')} />
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                      <div className="space-y-3 border-t border-white/6 px-3 pb-3 pt-3 text-[13px]">
                        <p className="leading-relaxed text-ink-100">{f.description}</p>
                        {f.evidence && (
                          <div>
                            <p className="eyebrow mb-1 text-ink-400">Evidence</p>
                            <CodeLine text={f.evidence} tone="bad" />
                          </div>
                        )}
                        <div>
                          <p className="eyebrow mb-1 flex items-center gap-1.5 text-ink-400">
                            <Wrench size={11} /> Fix · effort {f.effort}
                          </p>
                          <CodeLine text={f.fix} tone="good" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-mono text-[11px] ring-1 transition',
        on ? 'bg-white/10 text-white ring-white/20' : 'text-ink-200 ring-white/8 hover:bg-white/5',
      )}
    >
      {children}
    </button>
  )
}

export function CodeLine({ text, tone = 'neutral' }: { text: string; tone?: 'good' | 'bad' | 'neutral' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div
      className={cn(
        'group relative rounded-md px-3 py-2 pr-9 font-mono text-[12px] leading-relaxed ring-1',
        tone === 'bad' && 'bg-red-500/8 text-red-100 ring-red-500/20',
        tone === 'good' && 'bg-emerald-500/8 text-emerald-100 ring-emerald-500/20',
        tone === 'neutral' && 'bg-white/4 text-ink-100 ring-white/8',
      )}
    >
      {text}
      <button onClick={copy} className="absolute right-1.5 top-1.5 rounded p-1 text-ink-300 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100" aria-label="Copy">
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  )
}

/** Summary of pass/warn/fail checks rendered as a compact grid. */
export function ChecksGrid({ checks }: { checks: { name: string; status: 'pass' | 'fail' | 'warn' }[] }) {
  const tone = { pass: 'bg-emerald-400', fail: 'bg-red-400', warn: 'bg-amber-400' }
  return (
    <ul className="grid grid-cols-2 gap-1.5">
      {checks.map((c, i) => (
        <motion.li
          key={c.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2 rounded-md bg-white/4 px-2.5 py-1.5 text-[12px] text-ink-100 ring-1 ring-white/6"
        >
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tone[c.status])} />
          <span className="truncate">{c.name}</span>
        </motion.li>
      ))}
    </ul>
  )
}
