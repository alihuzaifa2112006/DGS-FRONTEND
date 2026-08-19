import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { X, FileText, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const stages = ['Collecting findings', 'Rendering evidence', 'Writing executive summary', 'Laying out pages', 'Signing document']

/**
 * Simulated PDF export. UI-only: walks through stages, then offers a (fake) download
 * and a link to the Reports page. Wire `onDone` to the real generator later.
 */
export function ExportModal({
  open,
  onClose,
  title,
  target,
  reportId,
}: {
  open: boolean
  onClose: () => void
  title: string
  target: string
  reportId: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={onClose} />
          {/* Body mounts fresh each open, so progress state starts from zero */}
          <ExportBody onClose={onClose} title={title} target={target} reportId={reportId} />
        </>
      )}
    </AnimatePresence>
  )
}

function ExportBody({ onClose, title, target, reportId }: { onClose: () => void; title: string; target: string; reportId: string }) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const t = window.setInterval(() => {
      i += 1
      if (i >= stages.length) {
        window.clearInterval(t)
        setDone(true)
        toast('Report ready', { kind: 'success', body: `${reportId} · ${title}` })
      } else setStep(i)
    }, 650)
    return () => window.clearInterval(t)
  }, [reportId, title])

  return (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 z-[95] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-ink-800 text-white shadow-lift ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-brand-300" />
                <h3 className="text-[14.5px] font-bold">Export security report</h3>
              </div>
              <button onClick={onClose} className="rounded p-1 text-ink-300 hover:text-white" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-[150px_1fr]">
              {/* page preview */}
              <div className="relative mx-auto h-[200px] w-[150px] overflow-hidden rounded-md bg-white p-3 text-ink-900 shadow-lift">
                <div className="h-1.5 w-10 rounded bg-brand-500" />
                <div className="mt-2 h-2 w-24 rounded bg-ink-900/80" />
                <div className="mt-1 h-1.5 w-16 rounded bg-ink-900/30" />
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full border-[3px] border-amber-400" />
                  <div className="space-y-1">
                    <div className="h-1.5 w-14 rounded bg-ink-900/60" />
                    <div className="h-1.5 w-10 rounded bg-ink-900/30" />
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={cn('h-1.5 w-5 rounded', i === 1 ? 'bg-red-400' : i < 4 ? 'bg-orange-400' : 'bg-amber-400')} />
                      <div className="h-1.5 flex-1 rounded bg-ink-900/20" />
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between font-mono text-[6px] text-ink-400">
                  <span>DGS · {reportId}</span>
                  <span>1 / 9</span>
                </div>
                {!done && <motion.div className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-brand-500/30 to-transparent" animate={{ top: ['-10%', '110%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }} />}
              </div>

              <div>
                <p className="font-mono text-[11px] text-ink-300">{reportId}</p>
                <h4 className="mt-0.5 text-[15px] font-bold">{title}</h4>
                <p className="truncate font-mono text-[12px] text-ink-200">{target}</p>

                <ol className="mt-4 space-y-1.5">
                  {stages.map((s, i) => {
                    const st = done || i < step ? 'done' : i === step ? 'run' : 'todo'
                    return (
                      <li key={s} className="flex items-center gap-2 text-[12.5px]">
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full ring-1',
                            st === 'done' ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40' : st === 'run' ? 'ring-brand-400/60' : 'ring-white/10',
                          )}
                        >
                          {st === 'done' ? <Check size={10} /> : st === 'run' ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300" /> : null}
                        </span>
                        <span className={st === 'todo' ? 'text-ink-400' : 'text-ink-100'}>{s}</span>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/8 px-5 py-4 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={onClose} className="text-ink-200 hover:bg-white/5 hover:text-white">
                Close
              </Button>
              <Link to="/app/reports" onClick={onClose} className={cn('inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/5', !done && 'pointer-events-none opacity-40')}>
                Open in Reports
              </Link>
              <Button disabled={!done} leftIcon={<Download size={15} />} onClick={() => toast('Download started', { kind: 'info', body: `${reportId}.pdf · hooked to backend later` })}>
                Download PDF
              </Button>
            </div>
          </motion.div>
  )
}
