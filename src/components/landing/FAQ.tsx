import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'

const faqs = [
  {
    q: 'Does DGS send my API data to a third party?',
    a: 'Only what you explicitly send to the AI Engine — the request and response you are looking at. Nothing is stored beyond your workspace history, and you can redact headers or body fields before analysis.',
  },
  {
    q: 'Is this a replacement for a penetration test?',
    a: 'No. Think of it as a continuous first-pass reviewer that catches the 80% of issues that are obvious in a response — before they reach a human tester or an attacker.',
  },
  {
    q: 'Which vulnerabilities does the engine detect?',
    a: 'Broken authentication, sensitive data exposure, CORS and cookie misconfiguration, missing security headers, verbose errors, weak token lifetimes, rate-limit gaps, IDOR patterns, and more — mapped to OWASP API Top-10 and CWE.',
  },
  {
    q: 'Can I scan a website I do not own?',
    a: 'Only scan targets you own or are authorised to test. Scans are non-destructive, but you accept responsibility for the targets you enter.',
  },
  {
    q: 'What is in the PDF report?',
    a: 'Executive summary and score, attack-surface overview, ranked findings with evidence and fixes, and an appendix with the raw request/response. Branded with your logo on Pro and Team.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-28">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow mb-4">FAQ</p>
          <h2 className="display text-[36px] text-ink-900 sm:text-[44px]">
            Questions people <i>actually</i> ask.
          </h2>
        </Reveal>
        <div className="lg:col-span-8">
          <ul className="divide-y divide-ink-900/8 border-y border-ink-900/8">
            {faqs.map((f, i) => {
              const on = open === i
              return (
                <Reveal key={f.q} index={i} as="li">
                  <button onClick={() => setOpen(on ? null : i)} className="flex w-full items-center justify-between gap-6 py-5 text-left" aria-expanded={on}>
                    <span className="text-[16px] font-semibold text-ink-900">{f.q}</span>
                    <motion.span animate={{ rotate: on ? 45 : 0 }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white hairline text-ink-700">
                      <Plus size={16} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-2xl pb-5 text-[14.5px] leading-relaxed text-ink-500">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
