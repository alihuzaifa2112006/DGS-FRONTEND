'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'
import {
  Globe,
  Radar,
  Check,
  X,
  Lock,
  Cpu,
  Link2,
  FileDown,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { VerdictCard } from '@/components/console/VerdictCard'
import type { Advice } from '@/lib/scan/advice'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { FindingsList } from '@/components/console/Findings'
import { toast } from '@/lib/toast'
import { apiPost, ApiClientError } from '@/lib/api'
import type { ScanResult } from '@/app/api/tools/scan/route'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'scanning' | 'done'

export default function WebsiteScan() {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function start(e?: FormEvent) {
    e?.preventDefault()
    if (!url.trim()) return toast('Enter a website URL', { kind: 'error' })

    setResult(null)
    setError(null)
    setPhase('scanning')

    try {
      // One real request. The server fetches the site, reads its headers and
      // cookies, opens a TLS socket for the certificate, and grades what it
      // finds — there is no scripted timeline to wait through.
      const r = await apiPost<ScanResult>('/api/tools/scan', { url: url.trim() })
      setResult(r)
      setPhase('done')
      toast('Scan complete', {
        kind: 'success',
        body: `${r.findings.length} findings · grade ${r.grade}`,
      })

      // Plain-English write-up is a second, slower call — the results are
      // already on screen while it lands, and it never blocks them.
      void loadAdvice(r)
    } catch (err) {
      const message =
        err instanceof ApiClientError ? (err.fieldError('url') ?? err.message) : 'The scan could not run.'
      setError(message)
      setPhase('idle')
      toast('Scan failed', { kind: 'error', body: message })
    }
  }

  async function loadAdvice(r: ScanResult) {
    setAdviceLoading(true)
    try {
      const a = await apiPost<Advice>('/api/tools/advice', {
        target: r.finalUrl,
        kind: 'website',
        score: r.score,
        grade: r.grade,
        findings: r.findings,
        checks: r.checks,
        tls: r.tls,
        server: r.server,
      })
      setAdvice(a)
    } catch {
      // The route already falls back to built-in advice, so reaching here
      // means the whole request failed. The technical panels still stand.
      setAdvice(null)
    } finally {
      setAdviceLoading(false)
    }
  }

  async function downloadPdf() {
    if (!result) return
    setDownloading(true)
    try {
      const res = await fetch('/api/tools/report', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': document.cookie.match(/(?:^|;\s*)dgs_csrf=([^;]*)/)?.[1] ?? '',
        },
        body: JSON.stringify({
          target: result.finalUrl,
          kind: 'website',
          score: result.score,
          grade: result.grade,
          findings: result.findings,
          checks: result.checks,
          tls: result.tls,
          server: result.server,
          suggestions: advice ?? undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error?.message ?? `Report failed (${res.status}).`)
      }

      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download =
        res.headers.get('content-disposition')?.match(/filename="?([^"]+)"?/)?.[1] ?? 'dgs-report.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Revoke on the next tick so the download has taken the reference.
      setTimeout(() => URL.revokeObjectURL(href), 1000)
      toast('Report downloaded', { kind: 'success' })
    } catch (err) {
      toast('Could not build the report', {
        kind: 'error',
        body: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setDownloading(false)
    }
  }

  function reset() {
    setPhase('idle')
    setResult(null)
    setError(null)
    setAdvice(null)
    setShowDetail(false)
    setUrl('')
  }

  const missingHeaders = result?.checks.filter((c) => c.status !== 'pass').length ?? 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Keyed so each phase fades in, but deliberately NOT wrapped in
          AnimatePresence: with mode="wait" the exiting panel could stall in
          its exit state and the next phase would never mount. A remount-on-key
          fade gives the same feel with no way to deadlock. */}
      <motion.div
        key={phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
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
                DGS fetches the page, grades its TLS certificate, security headers and cookie flags, and reports
                what it can prove from the response.
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

              {error && (
                <p
                  role="alert"
                  className="mx-auto mt-4 flex max-w-xl items-start gap-2 rounded-lg bg-red-500/10 p-3 text-left text-[12.5px] text-red-200 ring-1 ring-red-500/25"
                >
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-300" />
                  {error}
                </p>
              )}

              <p className="mx-auto mt-10 max-w-md rounded-lg bg-ink-800 p-3 text-[12px] text-ink-300 ring-1 ring-white/8">
                Scans are passive and non-destructive — one GET, plus a TLS handshake. Only scan sites you own or
                are explicitly authorised to test.
              </p>
            </div>
          )}

          {/* ───────── scanning ───────── */}
          {phase === 'scanning' && (
            <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl bg-ink-800 p-10 ring-1 ring-white/8">
              <div className="relative h-52 w-52">
                <span className="absolute inset-0 rounded-full border border-white/8" />
                <span className="absolute inset-6 rounded-full border border-dashed border-white/10" />
                <span className="absolute inset-12 rounded-full border border-white/8" />
                <span className="absolute inset-0 animate-radar rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgb(196_142_230/.0)_270deg,rgb(196_142_230/.55)_360deg)]" />
                <Globe size={26} className="absolute inset-0 m-auto text-brand-200" />
              </div>
              <p className="mt-6 font-mono text-[12px] text-ink-200">
                scanning <span className="text-white">{url}</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-ink-400">fetching · reading headers · checking TLS</p>
            </div>
          )}

          {/* ───────── results ───────── */}
          {phase === 'done' && result && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 rounded-2xl bg-ink-800 p-5 ring-1 ring-white/8 md:flex-row md:items-center">
                <ScoreRing value={result.score} size={96} stroke={8} label={`grade ${result.grade}`} />
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-ink-300">Website scan</p>
                  <h1 className="mt-1 truncate font-mono text-[20px] font-semibold text-white">{result.finalUrl}</h1>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-200">
                    {result.findings.length} findings ·{' '}
                    {result.findings.filter((f) => f.severity === 'critical').length} critical · {missingHeaders}{' '}
                    checks failing · HTTP {result.status}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[result.server, result.poweredBy, result.tls?.protocol]
                      .filter((x): x is string => Boolean(x))
                      .map((t) => (
                        <span
                          key={t}
                          className="rounded bg-white/5 px-2 py-0.5 font-mono text-[11px] text-ink-100 ring-1 ring-white/8"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-ink-900 text-white ring-0 hover:bg-ink-700"
                    onClick={reset}
                    leftIcon={<RotateCcw size={14} />}
                  >
                    New scan
                  </Button>
                  <Button onClick={() => void downloadPdf()} loading={downloading} leftIcon={<FileDown size={15} />}>
                    Export PDF
                  </Button>
                </div>
              </div>

              {/* The answer, before the data. */}
              <VerdictCard advice={advice} loading={adviceLoading} />

              <button
                onClick={() => setShowDetail((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-ink-800 px-5 py-3.5 text-left ring-1 ring-white/8 transition hover:bg-ink-700"
                aria-expanded={showDetail}
              >
                <span>
                  <span className="text-[13.5px] font-bold">Technical detail</span>
                  <span className="ml-2 text-[12.5px] text-ink-300">
                    headers, TLS, every finding
                  </span>
                </span>
                <ChevronDown
                  size={17}
                  className={cn('shrink-0 text-ink-300 transition-transform', showDetail && 'rotate-180')}
                />
              </button>

              <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-12', !showDetail && 'hidden')}>
                <div className="space-y-4 lg:col-span-4">
                  <Panel title="Transport" icon={Lock}>
                    {result.tls ? (
                      <ul className="space-y-2 text-[13px]">
                        <Row k="Protocol" v={result.tls.protocol ?? 'unknown'} ok={!/TLSv1(\.[01])?$/.test(result.tls.protocol ?? '')} />
                        <Row k="Cipher" v={result.tls.cipher ?? 'unknown'} />
                        <Row k="Issuer" v={result.tls.issuer ?? 'unknown'} />
                        <Row
                          k="Expires in"
                          v={result.tls.daysRemaining === null ? 'unknown' : `${result.tls.daysRemaining} days`}
                          ok={(result.tls.daysRemaining ?? 0) > 14}
                        />
                      </ul>
                    ) : (
                      <p className="text-[12.5px] text-ink-300">No TLS — this site was reached over plain HTTP.</p>
                    )}
                  </Panel>

                  <Panel title="Checks" icon={ShieldAlert}>
                    <ul className="space-y-1.5">
                      {result.checks.map((c, i) => (
                        <motion.li
                          key={c.name}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-start gap-2 text-[12.5px]"
                        >
                          {c.status === 'pass' ? (
                            <Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                          ) : c.status === 'warn' ? (
                            <Info size={14} className="mt-0.5 shrink-0 text-amber-300" />
                          ) : (
                            <X size={14} className="mt-0.5 shrink-0 text-red-300" />
                          )}
                          <div className="min-w-0">
                            <div className="font-mono text-ink-100">{c.name}</div>
                            <div className="truncate font-mono text-[11px] text-ink-400">{c.detail}</div>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </Panel>

                  {result.discovered.length > 0 && (
                    <Panel title="Public files" icon={Link2}>
                      <ul className="space-y-1.5">
                        {result.discovered.map((d) => (
                          <li key={d.url} className="flex items-center gap-2 text-[12px]">
                            <span className="min-w-0 flex-1 truncate font-mono text-ink-100">{d.label}</span>
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="font-mono text-[11px] text-brand-300 hover:text-brand-200"
                            >
                              open
                            </a>
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  )}
                </div>

                <div className="space-y-4 lg:col-span-8">
                  <Panel title="Findings" icon={ShieldAlert}>
                    {result.findings.length ? (
                      <FindingsList findings={result.findings} />
                    ) : (
                      <p className="text-[13px] text-ink-200">
                        No issues found in the checks this scan performs.
                      </p>
                    )}
                  </Panel>

                  {/* Says plainly what the score does not account for, so a
                      good grade is not read as a clean bill of health. */}
                  <Panel title="What this scan did not check" icon={Info}>
                    <ul className="space-y-1.5 text-[12.5px] text-ink-300">
                      {result.notCovered.map((x) => (
                        <li key={x} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </div>
              </div>
            </div>
          )}
      </motion.div>


    </div>
  )
}

function Panel({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon: typeof Cpu
  children: ReactNode
  className?: string
}) {
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
      <span className="shrink-0 text-ink-300">{k}</span>
      <span
        className={cn(
          'truncate font-mono text-[12.5px]',
          ok === undefined ? 'text-ink-100' : ok ? 'text-emerald-300' : 'text-red-300',
        )}
      >
        {v}
      </span>
    </li>
  )
}

