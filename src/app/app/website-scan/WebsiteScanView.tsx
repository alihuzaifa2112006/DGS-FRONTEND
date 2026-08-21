'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Globe, Radar, Check, X, Lock, Cpu, Link2, FileDown, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { FindingsList } from '@/components/console/Findings'
import { MethodChip, SeverityBadge } from '@/components/console/SeverityBadge'
import { ExportModal } from '@/components/console/ExportModal'
import { toast } from '@/lib/toast'
import { scanSteps, sampleSiteScan, type SiteScanResult } from '@/lib/mock'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'scanning' | 'done'

const recent = ['acme-shop.dev', 'portal.itginnovators.com', 'staging.fintrack.app']

export default function WebsiteScan() {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<SiteScanResult | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    if (phase !== 'scanning') return
    const lines = [
      'resolved 104.21.8.42 · cloudflare edge',
      'TLS 1.3 · ECDHE-RSA-AES128-GCM · cert valid 41d',
      'HSTS ✓  CSP ✗  XFO ✓  XCTO ✓  Referrer-Policy ✗',
      'crawled 38 pages · 6 forms · 14 scripts',
      'found 6 endpoints · graphql introspection open',
      'probing /api/user/{id} · /login?next= · /api/admin/*',
      'engine: correlating 19 signals → 6 findings',
    ]
    let i = 0
    const t = window.setInterval(() => {
      setLog((l) => [...l, lines[i]])
      i += 1
      if (i >= scanSteps.length) {
        window.clearInterval(t)
        window.setTimeout(() => {
          setResult({ ...sampleSiteScan, url: normalise(url) })
          setPhase('done')
          toast('Scan complete', { kind: 'success', body: `${sampleSiteScan.findings.length} findings · grade ${sampleSiteScan.grade}` })
        }, 700)
      } else setStep(i)
    }, 850)
    return () => window.clearInterval(t)
  }, [phase, url])

  function start(e?: FormEvent) {
    e?.preventDefault()
    if (!url.trim()) return toast('Enter a website URL', { kind: 'error' })
    setResult(null)
    setStep(0)
    setLog([])
    setPhase('scanning')
  }
  function reset() {
    setPhase('idle')
    setResult(null)
    setUrl('')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <AnimatePresence mode="wait">
        <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
        {/* ───────── idle ───────── */}
        {phase === 'idle' && (
          <div className="mx-auto max-w-2xl pt-6 text-center sm:pt-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-200 ring-1 ring-brand-500/30">
              <Globe size={28} />
            </span>
            <h1 className="display mt-6 text-[36px] sm:text-[48px]">
              Point the engine at a <i className="text-brand-300">website.</i>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-[14.5px] leading-relaxed text-ink-200">
              DGS crawls the public surface, discovers the APIs behind it, grades TLS & headers, probes common weaknesses and hands everything to the AI Engine.
            </p>

            <form onSubmit={start} className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
              <div className="flex h-12 flex-1 items-center gap-2 rounded-lg bg-ink-800 px-4 ring-1 ring-white/10 focus-within:ring-brand-500/60">
                <span className="font-mono text-[13px] text-ink-400">https://</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value.replace(/^https?:\/\//, ''))}
                  placeholder="your-site.com"
                  spellCheck={false}
                  autoFocus
                  className="h-full min-w-0 flex-1 bg-transparent font-mono text-[14px] text-white outline-none placeholder:text-ink-400"
                />
              </div>
              <Button type="submit" size="lg" leftIcon={<Radar size={17} />}>
                Start scan
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12px] text-ink-300">
              <span>Recent:</span>
              {recent.map((r) => (
                <button key={r} onClick={() => setUrl(r)} className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[11.5px] text-ink-100 ring-1 ring-white/8 hover:bg-white/10">
                  {r}
                </button>
              ))}
            </div>

            <p className="mx-auto mt-10 max-w-md rounded-lg bg-ink-800 p-3 text-[12px] text-ink-300 ring-1 ring-white/8">
              Scans are passive/non-destructive. Only scan sites you own or are explicitly authorised to test.
            </p>
          </div>
        )}

        {/* ───────── scanning ───────── */}
        {phase === 'scanning' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-ink-800 p-8 ring-1 ring-white/8 lg:col-span-5">
              <div className="relative h-52 w-52">
                <span className="absolute inset-0 rounded-full border border-white/8" />
                <span className="absolute inset-6 rounded-full border border-dashed border-white/10" />
                <span className="absolute inset-12 rounded-full border border-white/8" />
                <span className="absolute inset-0 animate-radar rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgb(196_142_230/.0)_270deg,rgb(196_142_230/.55)_360deg)]" />
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/10 [animation-duration:2.4s]" />
                {[
                  [22, 38],
                  [70, 25],
                  [60, 70],
                  [30, 72],
                ].map(([x, y], i) => (
                  <span key={i} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300 shadow-[0_0_12px_2px_rgb(196_142_230/.6)]" style={{ left: `${x}%`, top: `${y}%`, animation: `pulse 2s ${i * 0.4}s infinite` }} />
                ))}
                <Globe size={26} className="absolute inset-0 m-auto text-brand-200" />
              </div>
              <p className="mt-6 font-mono text-[12px] text-ink-200">
                scanning <span className="text-white">{normalise(url)}</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-ink-400">
                step {Math.min(step + 1, scanSteps.length)} / {scanSteps.length}
              </p>
            </div>

            <div className="rounded-2xl bg-ink-800 p-5 ring-1 ring-white/8 lg:col-span-7">
              <ol className="space-y-1.5">
                {scanSteps.map((s, i) => {
                  const st = i < step ? 'done' : i === step ? 'run' : 'todo'
                  return (
                    <li key={s.id} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 transition', st === 'run' && 'bg-white/4 ring-1 ring-brand-500/30')}>
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1', st === 'done' ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40' : st === 'run' ? 'text-brand-200 ring-brand-400/60' : 'text-ink-400 ring-white/10')}>
                        {st === 'done' ? <Check size={13} /> : st === 'run' ? <span className="h-2 w-2 animate-pulse rounded-full bg-brand-300" /> : <span className="font-mono text-[10px]">{i + 1}</span>}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={cn('text-[13.5px] font-semibold', st === 'todo' ? 'text-ink-300' : 'text-white')}>{s.label}</div>
                        <div className="truncate font-mono text-[11px] text-ink-400">{s.detail}</div>
                      </div>
                    </li>
                  )
                })}
              </ol>
              <div className="mt-4 rounded-lg bg-ink-900 p-3 font-mono text-[11.5px] leading-relaxed text-ink-200 ring-1 ring-white/8">
                {log.map((l, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}>
                    <span className="text-brand-300">›</span> {l}
                  </motion.div>
                ))}
                <span className="inline-block h-3.5 w-[6px] animate-blink bg-brand-300 align-middle" />
              </div>
            </div>
          </div>
        )}

        {/* ───────── results ───────── */}
        {phase === 'done' && result && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl bg-ink-800 p-5 ring-1 ring-white/8 md:flex-row md:items-center">
              <ScoreRing value={result.score} size={96} stroke={8} label={`grade ${result.grade}`} />
              <div className="min-w-0 flex-1">
                <p className="eyebrow text-ink-300">Website scan</p>
                <h1 className="mt-1 truncate font-mono text-[20px] font-semibold text-white">{result.url}</h1>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-200">
                  {result.findings.length} findings · {result.findings.filter((f) => f.severity === 'critical').length} critical · {result.endpoints.length} endpoints discovered · {result.headers.filter((h) => !h.present).length} security headers missing.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.tech.map((t) => (
                    <span key={t} className="rounded bg-white/5 px-2 py-0.5 font-mono text-[11px] text-ink-100 ring-1 ring-white/8">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-ink-900 text-white ring-0 hover:bg-ink-700" onClick={reset} leftIcon={<RotateCcw size={14} />}>
                  New scan
                </Button>
                <Button onClick={() => setExportOpen(true)} leftIcon={<FileDown size={15} />}>
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-4">
                {/* TLS */}
                <Panel title="Transport" icon={Lock}>
                  <ul className="space-y-2 text-[13px]">
                    <Row k="Protocol" v={result.tls.protocol} ok />
                    <Row k="Certificate" v={result.tls.valid ? 'valid' : 'invalid'} ok={result.tls.valid} />
                    <Row k="Issuer" v={result.tls.issuer} />
                    <Row k="Expires in" v={`${result.tls.expiresInDays} days`} ok={result.tls.expiresInDays > 14} />
                  </ul>
                </Panel>
                {/* headers */}
                <Panel title="Security headers" icon={ShieldAlert}>
                  <ul className="space-y-1.5">
                    {result.headers.map((h, i) => (
                      <motion.li key={h.name} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-2 text-[12.5px]">
                        {h.present ? <Check size={14} className="mt-0.5 shrink-0 text-emerald-300" /> : <X size={14} className="mt-0.5 shrink-0 text-red-300" />}
                        <div className="min-w-0">
                          <div className="font-mono text-ink-100">{h.name}</div>
                          {h.value && <div className="truncate font-mono text-[11px] text-ink-400">{h.value}</div>}
                        </div>
                        <span className="ml-auto font-mono text-[10.5px] text-ink-400">{h.weight}pt</span>
                      </motion.li>
                    ))}
                  </ul>
                </Panel>
                {/* endpoints */}
                <Panel title="Discovered endpoints" icon={Link2}>
                  <ul className="space-y-1.5">
                    {result.endpoints.map((e) => (
                      <li key={e.path} className="flex items-center gap-2 text-[12px]">
                        <MethodChip method={e.method} />
                        <span className="min-w-0 flex-1 truncate font-mono text-ink-100">{e.path}</span>
                        <SeverityBadge severity={e.risk} short />
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>

              <div className="lg:col-span-8">
                <Panel title="AI Engine findings" icon={Sparkles} className="h-full">
                  <FindingsList findings={result.findings} />
                </Panel>
              </div>
            </div>
          </div>
        )}
        </motion.div>
      </AnimatePresence>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} title={`${result?.url ?? 'Website'} full scan`} target={result?.url ?? ''} reportId="RPT-2043" />
    </div>
  )
}

function Panel({ title, icon: Icon, children, className }: { title: string; icon: typeof Cpu; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl bg-ink-800 p-4 ring-1 ring-white/8', className)}>
      <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold">
        <Icon size={14} className="text-brand-300" /> {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-ink-300">{k}</span>
      <span className={cn('font-mono text-[12.5px]', ok === undefined ? 'text-ink-100' : ok ? 'text-emerald-300' : 'text-red-300')}>{v}</span>
    </li>
  )
}

function normalise(u: string) {
  const clean = u.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `https://${clean}`
}
