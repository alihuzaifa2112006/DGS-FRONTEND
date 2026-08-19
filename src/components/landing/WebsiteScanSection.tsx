import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Check, X, Minus } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import { scanSteps, sampleSiteScan } from '@/lib/mock'

export default function WebsiteScanSection() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setActive((a) => (a + 1) % (scanSteps.length + 2)), 900)
    return () => window.clearInterval(t)
  }, [])

  return (
    <section id="website" className="relative scroll-mt-24 overflow-hidden bg-paper-2/60">
      <div className="pointer-events-none absolute inset-0 bg-grid-paper mask-fade-y opacity-70" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow mb-4">Website scanner</p>
            <h2 className="display text-[36px] text-ink-900 sm:text-[46px]">
              Don't have the API docs? <i>Give us the URL.</i>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-500">
              DGS crawls the public surface of a site, discovers the APIs behind it, checks TLS and security headers,
              probes common weaknesses, and hands everything to the AI Engine. Same report, zero setup.
            </p>
            <ul className="mt-6 space-y-2 text-[14px] text-ink-700">
              {['Endpoint discovery from fetch/XHR, GraphQL, Swagger', 'Header & TLS grading', 'Open redirect, IDOR, introspection probes', 'Tech-stack fingerprint'].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> {t}
                </li>
              ))}
            </ul>
            <Button className="mt-7" to="/signup" rightIcon={<ArrowRight size={16} />}>
              Scan a website
            </Button>
          </Reveal>
        </div>

        <Reveal index={1} className="lg:col-span-7">
          <div className="grid gap-4 md:grid-cols-5">
            {/* progress list */}
            <div className="rounded-2xl bg-ink-900 p-5 text-white ring-1 ring-white/10 shadow-lift md:col-span-3">
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-ink-800 px-3 py-2 font-mono text-[12px] ring-1 ring-white/8">
                <span className="text-ink-300">https://</span>
                <span className="text-white">acme-shop.dev</span>
                <span className="ml-auto text-brand-300">scanning</span>
              </div>
              <ol className="space-y-1">
                {scanSteps.map((s, i) => {
                  const state = i < active ? 'done' : i === active ? 'run' : 'todo'
                  return (
                    <li key={s.id} className="flex items-center gap-3 rounded-md px-2 py-1.5">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${
                          state === 'done'
                            ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                            : state === 'run'
                              ? 'bg-brand-500/20 text-brand-200 ring-brand-400/60'
                              : 'text-ink-400 ring-white/10'
                        }`}
                      >
                        {state === 'done' ? <Check size={11} /> : state === 'run' ? <span className="h-2 w-2 animate-pulse rounded-full bg-brand-300" /> : <Minus size={10} />}
                      </span>
                      <div className="min-w-0">
                        <div className={`text-[13px] font-semibold ${state === 'todo' ? 'text-ink-300' : 'text-white'}`}>{s.label}</div>
                        <div className="truncate font-mono text-[10.5px] text-ink-400">{s.detail}</div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* header grades */}
            <div className="space-y-4 md:col-span-2">
              <div className="rounded-2xl bg-white p-5 hairline">
                <p className="eyebrow mb-3">Security headers</p>
                <ul className="space-y-2">
                  {sampleSiteScan.headers.slice(0, 5).map((h) => (
                    <li key={h.name} className="flex items-center gap-2 text-[12px]">
                      {h.present ? <Check size={14} className="shrink-0 text-ok" /> : <X size={14} className="shrink-0 text-crit" />}
                      <span className="truncate font-mono text-ink-700">{h.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-white p-5 hairline">
                <p className="eyebrow mb-3">Discovered endpoints</p>
                <ul className="space-y-1.5">
                  {sampleSiteScan.endpoints.slice(0, 4).map((e, i) => (
                    <motion.li
                      key={e.path}
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-2 font-mono text-[11px]"
                    >
                      <span className="w-9 text-ink-400">{e.method}</span>
                      <span className="truncate text-ink-800">{e.path}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
