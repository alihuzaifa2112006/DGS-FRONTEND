'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, Globe, FileDown, Eye, Trash2, FileText, SlidersHorizontal, X, Calendar } from 'lucide-react'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Button } from '@/components/ui/Button'
import { MethodChip } from '@/components/console/SeverityBadge'
import { FindingsList } from '@/components/console/Findings'
import { toast } from '@/lib/toast'
import { sampleReports, sampleAnalysis, sampleSiteScan, type Report } from '@/lib/mock'
import { cn, timeAgo } from '@/lib/utils'

type Filter = 'all' | 'api' | 'website'

export default function Reports() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [items, setItems] = useState<Report[]>(sampleReports)
  const [preview, setPreview] = useState<Report | null>(null)

  const shown = useMemo(
    () => items.filter((r) => (filter === 'all' || r.type === filter) && (r.name + r.target + r.id).toLowerCase().includes(q.toLowerCase())),
    [items, filter, q],
  )

  const remove = (id: string) => {
    setItems((p) => p.filter((r) => r.id !== id))
    toast('Report deleted', { kind: 'info', body: id })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-ink-300">Reports</p>
          <h1 className="display mt-1 text-[32px] sm:text-[40px]">
            Every audit, <i className="text-brand-300">on record.</i>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex h-10 items-center gap-2 rounded-lg bg-ink-800 px-3 ring-1 ring-white/8 focus-within:ring-brand-500/60">
            <Search size={15} className="text-ink-300" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports…" className="h-full w-44 bg-transparent text-[13px] text-white outline-none placeholder:text-ink-400 sm:w-56" />
          </div>
          <div className="flex h-10 items-center gap-1 rounded-lg bg-ink-800 p-1 ring-1 ring-white/8">
            {(['all', 'api', 'website'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn('h-8 rounded-md px-3 text-[12.5px] font-semibold capitalize transition', filter === f ? 'bg-white/8 text-white' : 'text-ink-300 hover:text-white')}>
                {f === 'api' ? 'API' : f}
              </button>
            ))}
          </div>
          <button className="flex h-10 items-center gap-1.5 rounded-lg bg-ink-800 px-3 text-[12.5px] font-semibold text-ink-200 ring-1 ring-white/8 hover:text-white">
            <SlidersHorizontal size={14} /> <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* summary strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Total reports', items.length],
          ['API audits', items.filter((r) => r.type === 'api').length],
          ['Website scans', items.filter((r) => r.type === 'website').length],
          ['Critical open', items.reduce((a, r) => a + r.critical, 0)],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl bg-ink-800 px-4 py-3 ring-1 ring-white/8">
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-300">{l}</div>
            <div className="mt-1 font-display text-[28px] leading-none">{v}</div>
          </div>
        ))}
      </div>

      {/* list */}
      <div className="mt-4 overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/8">
        <div className="hidden grid-cols-[1fr_120px_110px_90px_120px_120px] gap-3 border-b border-white/8 px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-300 md:grid">
          <span>Report</span>
          <span>Type</span>
          <span>Findings</span>
          <span>Score</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y divide-white/6">
          <AnimatePresence initial={false}>
            {shown.map((r, i) => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-1 gap-3 px-5 py-3.5 transition hover:bg-white/3 md:grid-cols-[1fr_120px_110px_90px_120px_120px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-brand-300 ring-1 ring-white/8">
                    {r.type === 'api' ? <FileText size={16} /> : <Globe size={16} />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-white">{r.name}</span>
                      <span className="hidden font-mono text-[10.5px] text-ink-400 sm:inline">{r.id}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11.5px] text-ink-300">
                      {r.type === 'api' && <MethodChip method={r.target.split(' ')[0]} />}
                      <span className="truncate">{r.type === 'api' ? r.target.split(' ')[1] : r.target}</span>
                    </div>
                  </div>
                </div>
                <div className="text-[12.5px] capitalize text-ink-200">
                  <span className="md:hidden font-mono text-[10px] uppercase tracking-wider text-ink-400">Type · </span>
                  {r.type} · {r.pages}p
                </div>
                <div className="text-[13px]">
                  <span className="md:hidden font-mono text-[10px] uppercase tracking-wider text-ink-400">Findings · </span>
                  <span className="text-white">{r.findings}</span>
                  {r.critical > 0 && <span className="ml-2 rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[10px] text-red-300 ring-1 ring-red-500/30">{r.critical} crit</span>}
                </div>
                <div className="flex items-center gap-2">
                  <ScoreRing value={r.score} size={32} stroke={3} />
                </div>
                <div className="flex items-center gap-1.5 text-[12.5px] text-ink-300">
                  <Calendar size={12} /> {timeAgo(r.createdAt)}
                </div>
                <div className="flex items-center gap-1 md:justify-end">
                  <IconBtn title="Preview" onClick={() => setPreview(r)}>
                    <Eye size={15} />
                  </IconBtn>
                  <IconBtn title="Download PDF" onClick={() => toast('Download started', { kind: 'info', body: `${r.id}.pdf` })}>
                    <FileDown size={15} />
                  </IconBtn>
                  <IconBtn title="Delete" onClick={() => remove(r.id)} danger>
                    <Trash2 size={15} />
                  </IconBtn>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {shown.length === 0 && (
          <div className="p-10 text-center text-[13px] text-ink-300">
            No reports match “{q}”.
          </div>
        )}
      </div>

      {/* preview drawer */}
      <AnimatePresence>
        {preview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={() => setPreview(null)} />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-[85] flex w-[min(640px,100vw)] flex-col bg-ink-900 text-white shadow-lift ring-1 ring-white/10"
            >
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-ink-300">{preview.id}</p>
                  <h2 className="truncate text-[16px] font-bold">{preview.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" leftIcon={<FileDown size={14} />} onClick={() => toast('Download started', { kind: 'info', body: `${preview.id}.pdf` })}>
                    PDF
                  </Button>
                  <button onClick={() => setPreview(null)} className="rounded p-1.5 text-ink-300 hover:text-white" aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="flex gap-4 rounded-xl bg-ink-800 p-4 ring-1 ring-white/8">
                  <ScoreRing value={preview.score} size={80} stroke={7} label={preview.type} />
                  <div>
                    <p className="font-mono text-[12px] text-ink-200">{preview.target}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-100">
                      {preview.type === 'api' ? sampleAnalysis.summary : `Scan of ${preview.target}: ${sampleSiteScan.findings.length} findings across access control, headers and API exposure.`}
                    </p>
                  </div>
                </div>
                <p className="eyebrow mb-2 mt-5 text-ink-400">Findings</p>
                <FindingsList findings={preview.type === 'api' ? sampleAnalysis.findings : sampleSiteScan.findings} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function IconBtn({ children, title, onClick, danger }: { children: ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} className={cn('rounded-md p-2 text-ink-300 transition hover:bg-white/6', danger ? 'hover:text-red-300' : 'hover:text-white')}>
      {children}
    </button>
  )
}
