'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, Rocket, BrainCircuit, FileText, HelpCircle, ArrowRight, Plus } from 'lucide-react'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'start', label: 'Getting started', icon: Rocket },
  { id: 'engine', label: 'AI Engine & fixes', icon: BrainCircuit },
  { id: 'reports', label: 'Reports & PDF', icon: FileText },
  { id: 'faq', label: 'FAQs', icon: HelpCircle },
]

const articles: Record<string, { q: string; a: string }[]> = {
  start: [
    { q: 'Sending your first request', a: 'Open the API Tester, pick a method, paste the URL, add headers/body and press Send (or ⌘/Ctrl+Enter). The response appears below with status, latency and size.' },
    { q: 'Saving requests into collections', a: 'Use the save icon on the request panel. Collections can be grouped by project and shared with your workspace on Team plans.' },
    { q: 'Using environments', a: 'Define variables like {{baseUrl}} and {{token}} under Settings → Workspace. Switch environments from the top bar without touching the request.' },
  ],
  engine: [
    { q: 'What does "Send to AI Engine" actually do?', a: 'It bundles the request and the response (headers, cookies, body) and asks the engine to reason over them like a pentester: auth scheme, token lifetimes, CORS, sensitive fields, error verbosity, rate limiting and more.' },
    { q: 'How are findings scored?', a: 'Each finding is ranked by exploitability and impact and mapped to CWE and OWASP API Top-10. The overall 0–100 score weights Criticals heavily; fixing one Critical usually moves the score more than five Lows.' },
    { q: 'Applying the suggested fixes', a: 'Every finding ships a copy-ready fix with an effort estimate. Re-run the request after deploying and the engine will re-verify and update the score.' },
    { q: 'Redacting secrets before analysis', a: 'Enable "Redact credentials" under Settings → AI Engine. Authorization headers, cookies and password/token fields are masked in the browser before anything is sent.' },
  ],
  reports: [
    { q: 'Exporting a PDF', a: 'From any analysis or scan, press Export PDF. The report includes an executive summary, attack surface, ranked findings with evidence and fixes, and an appendix with the raw request/response.' },
    { q: 'Branding the report', a: 'Pro and Team plans can set a company name, accent colour, footer and logo under Settings → Report branding.' },
    { q: 'Sharing with clients', a: 'Reports are PDF so they travel anywhere. Team plans add share links with expiry and view tracking.' },
  ],
  faq: [
    { q: 'Is the website scanner safe to run on production?', a: 'Scans are passive and non-destructive — no payloads are injected, no accounts are created. Still, only scan what you own or are authorised to test.' },
    { q: 'Why does my request show a "sample" badge?', a: 'Browsers block cross-origin requests to APIs that don\'t allow your origin (CORS). In the full build the DGS proxy relays the request; for now the console shows a representative sample so the AI flow still works.' },
    { q: 'Can I export JSON instead of PDF?', a: 'Yes — every report can be exported as JSON for your own tooling. Use the Reports page actions.' },
  ],
}

export default function Help() {
  const [tab, setTab] = useState('start')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<number | null>(0)
  const list = (q ? Object.values(articles).flat() : articles[tab]).filter((a) => a.q.toLowerCase().includes(q.toLowerCase()) || a.a.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="min-h-screen bg-paper">
      <Nav />
      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-paper mask-radial" />
          <div className="mx-auto max-w-4xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pt-20">
            <Reveal>
              <p className="eyebrow mb-4 justify-center">Help center</p>
              <h1 className="display text-[40px] text-ink-900 sm:text-[56px]">
                How can we <i>help?</i>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[15px] text-ink-500">Guides for the API Tester, the AI Engine, website scans and reports.</p>
            </Reveal>
            <Reveal index={1}>
              <div className="mx-auto mt-8 flex h-13 max-w-xl items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-soft hairline focus-within:shadow-[inset_0_0_0_1px_rgb(147_51_201),0_0_0_4px_rgb(147_51_201/.12)]">
                <Search size={18} className="text-ink-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles, e.g. “CORS”, “PDF”, “redact”" className="h-full w-full bg-transparent text-[14.5px] text-ink-900 outline-none placeholder:text-ink-300" />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-20 sm:px-6 md:grid-cols-12">
          <aside className="min-w-0 md:col-span-3">
            <p className="eyebrow mb-3 px-2">Topics</p>
            <div className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id)
                    setQ('')
                    setOpen(0)
                  }}
                  className={cn('flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-semibold transition', tab === t.id && !q ? 'bg-ink-900 text-white shadow-soft' : 'text-ink-600 hover:bg-white hover:text-ink-900')}
                >
                  <t.icon size={15} className={tab === t.id && !q ? 'text-brand-300' : 'text-brand-600'} /> {t.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 md:col-span-9">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['01', 'Send', 'Fire any request, read the raw response.'],
                ['02', 'Analyse', 'Hand it to the engine. Get ranked findings.'],
                ['03', 'Export', 'PDF for your team or client, in one click.'],
              ].map(([n, t, d], i) => (
                <Reveal key={n} index={i}>
                  <div className="rounded-xl bg-white/70 p-4 hairline">
                    <span className="font-mono text-[11px] text-brand-600">{n}</span>
                    <h3 className="mt-1 text-[15px] font-bold text-ink-900">{t}</h3>
                    <p className="mt-1 text-[12.5px] text-ink-500">{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-white/80 p-5 hairline sm:p-6">
              <h2 className="mb-3 text-[17px] font-bold text-ink-900">{q ? `Results for “${q}”` : tabs.find((t) => t.id === tab)?.label}</h2>
              <ul className="divide-y divide-ink-900/8">
                {list.map((a, i) => {
                  const on = open === i
                  return (
                    <li key={a.q}>
                      <button onClick={() => setOpen(on ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                        <span className="text-[15px] font-semibold text-ink-900">{a.q}</span>
                        <motion.span animate={{ rotate: on ? 45 : 0 }} className="shrink-0 text-ink-400">
                          <Plus size={16} />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {on && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <p className="pb-4 text-[14px] leading-relaxed text-ink-500">{a.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  )
                })}
                {list.length === 0 && <li className="py-6 text-center text-[13.5px] text-ink-500">Nothing matched. Try another word.</li>}
              </ul>
            </div>

            <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl bg-ink-900 p-6 text-white sm:flex-row sm:items-center">
              <div>
                <h3 className="text-[16px] font-bold">Still stuck?</h3>
                <p className="mt-0.5 text-[13px] text-ink-200">Our security team answers within one business day.</p>
              </div>
              <Button variant="white" href="mailto:support@itginnovators.com" rightIcon={<ArrowRight size={15} />}>
                Contact support
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
