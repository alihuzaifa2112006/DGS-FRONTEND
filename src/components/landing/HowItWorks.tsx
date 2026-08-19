import { Reveal } from '@/components/ui/Reveal'
import { Send, BrainCircuit, FileDown } from 'lucide-react'

const steps = [
  {
    n: '01',
    title: 'Send',
    icon: Send,
    body: 'Compose any request — method, headers, params, body, auth. Hit send and read the raw response like you would in Postman.',
    detail: ['GET · POST · PUT · PATCH · DELETE', 'Bearer / Basic / API-key auth', 'Saved collections & history'],
  },
  {
    n: '02',
    title: 'Send to AI Engine',
    icon: BrainCircuit,
    body: 'One click hands the request + response to the engine. It reasons over headers, cookies, payload shape and status codes to find what an attacker would.',
    detail: ['OWASP API Top-10 mapping', 'CWE-tagged findings', 'Plain-language explanations'],
  },
  {
    n: '03',
    title: 'Fix & export',
    icon: FileDown,
    body: 'Every finding ships with a concrete fix, effort estimate and evidence. Bundle it into a branded PDF for your team or your client.',
    detail: ['Severity-ranked fixes', 'Copy-ready code snippets', 'PDF / JSON export'],
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Reveal>
            <p className="eyebrow mb-4">How it works</p>
            <h2 className="display text-[36px] text-ink-900 sm:text-[46px]">
              Three moves. <i>No security degree</i> required.
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-500">
              The workflow you already know from API clients — with an analyst sitting on your shoulder.
            </p>
          </Reveal>
        </div>

        <ol className="relative lg:col-span-8">
          {/* connector line */}
          <span className="absolute left-[19px] top-6 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-brand-500/60 via-ink-900/10 to-transparent sm:block" />
          {steps.map((s, i) => (
            <Reveal key={s.n} index={i} as="li" className="group relative grid gap-4 py-7 sm:grid-cols-[40px_1fr] sm:gap-8 sm:py-8">
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-paper ring-1 ring-ink-900/10 transition group-hover:ring-brand-500">
                <s.icon size={17} className="text-brand-600" />
              </div>
              <div className="rounded-xl bg-white/60 p-5 hairline transition duration-300 group-hover:bg-white group-hover:shadow-soft sm:p-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] text-brand-600">{s.n}</span>
                  <h3 className="text-[19px] font-bold tracking-tight text-ink-900">{s.title}</h3>
                </div>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">{s.body}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {s.detail.map((d) => (
                    <li key={d} className="rounded-md bg-paper-2 px-2 py-1 font-mono text-[11px] text-ink-600">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
