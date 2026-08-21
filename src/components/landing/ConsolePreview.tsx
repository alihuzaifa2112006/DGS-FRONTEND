'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { sampleAnalysis, severityMeta } from '@/lib/mock'

type Stage = 'typing' | 'sent' | 'response' | 'analysing' | 'report'
const URL = 'https://api.acme-shop.dev/v1/auth/login'

/** Looping, self-driving demo of the console. */
export default function ConsolePreview() {
  const [stage, setStage] = useState<Stage>('typing')
  const [typed, setTyped] = useState('')

  useEffect(() => {
    let t: number
    if (stage === 'typing') {
      if (typed.length < URL.length) {
        t = window.setTimeout(() => setTyped(URL.slice(0, typed.length + 1)), 28)
      } else {
        t = window.setTimeout(() => setStage('sent'), 500)
      }
    } else if (stage === 'sent') t = window.setTimeout(() => setStage('response'), 900)
    else if (stage === 'response') t = window.setTimeout(() => setStage('analysing'), 1800)
    else if (stage === 'analysing') t = window.setTimeout(() => setStage('report'), 2200)
    else if (stage === 'report')
      t = window.setTimeout(() => {
        setTyped('')
        setStage('typing')
      }, 6500)
    return () => window.clearTimeout(t)
  }, [stage, typed])

  const findings = sampleAnalysis.findings.slice(0, 4)

  return (
    <section id="console" className="relative scroll-mt-24 bg-ink-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-ink mask-fade-y" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mb-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow mb-4 text-ink-300">The console</p>
            <h2 className="display text-[36px] sm:text-[48px]">
              Familiar on the left. <i className="text-brand-300">Frightening</i> on the right.
            </h2>
          </Reveal>
          <Reveal index={1} className="lg:col-span-5">
            <p className="text-[15px] leading-relaxed text-ink-200">
              The request panel behaves like the tools you use daily. The AI panel is where DGS earns its
              name — it reads the response the way a pentester would and writes it up like a colleague.
            </p>
            <Button variant="white" size="md" href="/signup" className="mt-5" rightIcon={<ArrowRight size={15} />}>
              Try it on your own API
            </Button>
          </Reveal>
        </div>

        <Reveal index={2}>
          <div className="overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-white/10 shadow-lift">
            {/* toolbar */}
            <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5 sm:px-4">
              <span className="rounded bg-amber-400 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-ink-900">POST</span>
              <div className="flex h-9 flex-1 items-center rounded-md bg-ink-900 px-3 font-mono text-[12.5px] text-ink-100 ring-1 ring-white/8">
                <span className="truncate">{typed}</span>
                {stage === 'typing' && <span className="ml-0.5 inline-block h-4 w-[2px] animate-blink bg-brand-300" />}
              </div>
              <motion.button
                animate={stage === 'sent' ? { scale: [1, 0.94, 1] } : {}}
                className="hidden h-9 items-center gap-1.5 rounded-md bg-brand-600 px-3 text-[12.5px] font-semibold sm:flex"
              >
                Send
              </motion.button>
              <motion.button
                animate={stage === 'analysing' ? { scale: [1, 0.94, 1] } : {}}
                className={`hidden h-9 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold ring-1 transition sm:flex ${
                  stage === 'analysing' || stage === 'report'
                    ? 'bg-brand-500/20 text-brand-200 ring-brand-400/50'
                    : 'bg-white/5 text-ink-200 ring-white/10'
                }`}
              >
                <Sparkles size={13} /> Send to AI Engine
              </motion.button>
            </div>

            <div className="grid min-h-[420px] grid-cols-1 lg:grid-cols-2">
              {/* response */}
              <div className="border-b border-white/8 p-4 lg:border-b-0 lg:border-r sm:p-5">
                <div className="mb-3 flex items-center gap-3 font-mono text-[11px] text-ink-300">
                  <span className="uppercase tracking-widest">Response</span>
                  <AnimatePresence>
                    {stage !== 'typing' && stage !== 'sent' && (
                      <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">200 OK</span>
                        <span>412 ms</span>
                        <span>1.9 kB</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="relative min-h-[300px] rounded-lg bg-ink-900 p-4 font-mono text-[12px] leading-[1.7] ring-1 ring-white/8">
                  {stage === 'typing' && <p className="text-ink-400">{'// hit Send to see the response'}</p>}
                  {stage === 'sent' && (
                    <div className="space-y-2">
                      {[80, 60, 70, 40].map((w, i) => (
                        <div key={i} className="h-3 rounded bg-white/5 shimmer" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  )}
                  {stage !== 'typing' && stage !== 'sent' && (
                    <motion.pre initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre-wrap break-all text-ink-100">
                      <span className="text-ink-400">{'{'}</span>
                      {'\n  '}<span className="text-brand-300">"ok"</span>: <span className="text-amber-300">true</span>,
                      {'\n  '}<span className="text-brand-300">"user"</span>: {'{'}
                      {'\n    '}<span className="text-brand-300">"id"</span>: <span className="text-sky-300">1042</span>,
                      {'\n    '}<span className="text-brand-300">"role"</span>: <span className="text-emerald-300">"admin"</span>,
                      {'\n    '}<Hi on={stage === 'report'}><span className="text-brand-300">"password_hash"</span>: <span className="text-emerald-300">"$2b$10$e0NRxu2vT…"</span></Hi>
                      {'\n  }'},
                      {'\n  '}<span className="text-brand-300">"token"</span>: <span className="text-emerald-300">"eyJhbGciOiJIUzI1NiIs…"</span>,
                      {'\n  '}<Hi on={stage === 'report'}><span className="text-brand-300">"expires_in"</span>: <span className="text-sky-300">31536000</span></Hi>,
                      {'\n  '}<Hi on={stage === 'report'}><span className="text-brand-300">"debug"</span>: {'{ '}<span className="text-brand-300">"query"</span>: <span className="text-emerald-300">"SELECT * FROM users…"</span>{' }'}</Hi>
                      {'\n'}<span className="text-ink-400">{'}'}</span>
                    </motion.pre>
                  )}
                </div>
              </div>

              {/* AI panel */}
              <div className="relative p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-300">
                  <Sparkles size={12} className="text-brand-300" /> AI Engine
                </div>
                <div className="relative min-h-[300px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={stage === 'analysing' || stage === 'report' ? stage : 'idle'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                    {(stage === 'typing' || stage === 'sent' || stage === 'response') && (
                      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 text-center">
                        <p className="max-w-[240px] text-[13px] text-ink-300">
                          Waiting for a response to analyse.
                        </p>
                      </div>
                    )}
                    {stage === 'analysing' && (
                      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
                        <div className="relative h-16 w-16">
                          <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/30" />
                          <span className="absolute inset-2 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
                          <Sparkles size={18} className="absolute inset-0 m-auto text-brand-200" />
                        </div>
                        <ThinkingLines />
                      </div>
                    )}
                    {stage === 'report' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 rounded-lg bg-ink-900 p-3 ring-1 ring-white/8">
                          <ScoreRing value={sampleAnalysis.score} />
                          <div>
                            <div className="text-[13px] font-semibold text-white">Security score 42 / 100 · Grade D</div>
                            <p className="mt-1 text-[12px] leading-relaxed text-ink-200">
                              Authenticates correctly but leaks a password hash, SQL debug output and runs with wildcard CORS.
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {findings.map((f, i) => {
                            const m = severityMeta[f.severity]
                            return (
                              <motion.li
                                key={f.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + i * 0.12 }}
                                className="flex items-start gap-3 rounded-lg bg-ink-900/60 p-3 ring-1 ring-white/6"
                              >
                                <span className={`mt-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ring-1 ${m.bg} ${m.text}`}>
                                  {m.label}
                                </span>
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-semibold text-white">{f.title}</div>
                                  <div className="mt-0.5 line-clamp-1 text-[11.5px] text-ink-300">Fix: {f.fix}</div>
                                </div>
                              </motion.li>
                            )
                          })}
                        </ul>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center justify-between font-mono text-[11px] text-ink-300">
                          <span>+4 more findings · 5 suggestions</span>
                          <span className="text-brand-300">Export PDF ↗</span>
                        </motion.div>
                      </div>
                    )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Hi({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className={`rounded px-0.5 transition-colors duration-500 ${on ? 'bg-red-500/25 ring-1 ring-red-400/50' : ''}`}>
      {children}
    </span>
  )
}

function ThinkingLines() {
  const lines = ['reading headers…', 'checking cookie flags…', 'inspecting payload shape…', 'mapping to OWASP API Top-10…']
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % lines.length), 520)
    return () => window.clearInterval(t)
  }, [lines.length])
  return (
    <AnimatePresence mode="wait">
      <motion.p key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="font-mono text-[12px] text-ink-200">
        {lines[i]}
      </motion.p>
    </AnimatePresence>
  )
}

