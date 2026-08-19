import type { ReactNode } from 'react'
import { Reveal } from '@/components/ui/Reveal'
import { motion } from 'motion/react'
import { ShieldCheck, FileText, Globe, KeyRound, Gauge, History } from 'lucide-react'

export default function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="mb-12 max-w-2xl">
        <p className="eyebrow mb-4">What you get</p>
        <h2 className="display text-[36px] text-ink-900 sm:text-[46px]">
          Everything between <i>"it works"</i> and <i>"it's safe."</i>
        </h2>
      </Reveal>

      <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-6">
        {/* big card: AI findings */}
        <Reveal className="md:col-span-4 md:row-span-2">
          <Card className="h-full">
            <CardHead icon={ShieldCheck} title="Findings that explain themselves" />
            <p className="max-w-md text-[14.5px] leading-relaxed text-ink-500">
              Each weakness carries severity, CWE / OWASP tags, the exact evidence from your response, and a fix you can paste.
              No jargon walls — the engine writes like a senior reviewer.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                ['Critical', 'password_hash returned in body', 'bg-crit'],
                ['High', 'Access-Control-Allow-Origin: *', 'bg-orange-500'],
                ['Medium', 'JWT expires_in 31536000', 'bg-warn'],
                ['Low', 'Server: nginx/1.18.0', 'bg-info'],
              ].map(([s, t, c], i) => (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5 hairline"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${c}`} />
                  <span className="w-14 shrink-0 font-mono text-[11px] text-ink-500">{s}</span>
                  <span className="truncate font-mono text-[12px] text-ink-800">{t}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal index={1} className="md:col-span-2">
          <Card className="h-full">
            <CardHead icon={FileText} title="PDF in one click" />
            <p className="text-[14px] leading-relaxed text-ink-500">Branded, paginated, with an executive summary up top and evidence in the appendix.</p>
            <div className="mt-4 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 w-12 rounded-sm bg-white hairline p-1.5" style={{ transform: `rotate(${(i - 1) * 3}deg)` }}>
                  <div className="h-1 w-6 rounded bg-brand-500/60" />
                  <div className="mt-1.5 space-y-1">
                    {[8, 7, 6, 7].map((w, j) => (
                      <div key={j} className="h-0.5 rounded bg-ink-900/15" style={{ width: `${w * 4}px` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal index={2} className="md:col-span-2">
          <Card className="h-full">
            <CardHead icon={Globe} title="Whole-site scans" />
            <p className="text-[14px] leading-relaxed text-ink-500">Paste a URL. DGS crawls, discovers endpoints and headers, and runs the same engine over all of it.</p>
          </Card>
        </Reveal>

        <Reveal index={3} className="md:col-span-2">
          <Card className="h-full">
            <CardHead icon={KeyRound} title="Auth-aware" />
            <p className="text-[14px] leading-relaxed text-ink-500">Bearer, Basic, API-key or cookie sessions — the engine reads token lifetimes and cookie flags, not just status codes.</p>
          </Card>
        </Reveal>

        <Reveal index={4} className="md:col-span-2">
          <Card className="h-full">
            <CardHead icon={Gauge} title="Score you can track" />
            <p className="text-[14px] leading-relaxed text-ink-500">0–100 with a letter grade, per endpoint and per project. Watch it climb as fixes land.</p>
            <div className="mt-4 flex items-end gap-1">
              {[42, 48, 55, 61, 66, 74, 81, 88].map((v, i) => (
                <motion.span
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${v * 0.5}px` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full rounded-t-sm bg-brand-500/70"
                />
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal index={5} className="md:col-span-2">
          <Card className="h-full">
            <CardHead icon={History} title="History & collections" />
            <p className="text-[14px] leading-relaxed text-ink-500">Every request, response and report is saved. Re-run and diff after you ship the fix.</p>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-white/70 p-6 hairline transition duration-300 hover:bg-white hover:shadow-lift ${className}`}>
      <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/0 blur-2xl transition duration-500 group-hover:bg-brand-500/15" />
      {children}
    </div>
  )
}

function CardHead({ icon: Icon, title }: { icon: typeof ShieldCheck; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-brand-200 ring-1 ring-ink-900">
        <Icon size={17} />
      </span>
      <h3 className="text-[17px] font-bold tracking-tight text-ink-900">{title}</h3>
    </div>
  )
}
