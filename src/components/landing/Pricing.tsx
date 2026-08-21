'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Starter',
    price: { m: 0, y: 0 },
    tag: 'For trying it out',
    features: ['50 AI analyses / month', '3 website scans', 'PDF export (watermarked)', 'Request history 7 days'],
    cta: 'Start free',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: { m: 29, y: 24 },
    tag: 'For developers & freelancers',
    features: ['Unlimited AI analyses', '40 website scans', 'Branded PDF reports', 'Collections & environments', 'Priority engine queue'],
    cta: 'Go Pro',
    href: '/signup?plan=pro',
    featured: true,
  },
  {
    name: 'Team',
    price: { m: 89, y: 74 },
    tag: 'For agencies & SOC teams',
    features: ['Everything in Pro', 'Unlimited website scans', 'Shared workspaces', 'SSO & audit log', 'API access & webhooks'],
    cta: 'Talk to us',
    href: '/signup?plan=team',
  },
]

export default function Pricing() {
  const [yearly, setYearly] = useState(true)
  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-4">Pricing</p>
          <h2 className="display text-[36px] text-ink-900 sm:text-[46px]">
            Cheaper than <i>one</i> incident.
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-white p-1 hairline">
          {(['Monthly', 'Yearly'] as const).map((l) => {
            const on = (l === 'Yearly') === yearly
            return (
              <button
                key={l}
                onClick={() => setYearly(l === 'Yearly')}
                className={cn('rounded-full px-4 py-1.5 text-[13px] font-semibold transition', on ? 'bg-ink-900 text-white' : 'text-ink-600 hover:text-ink-900')}
              >
                {l}
                {l === 'Yearly' && <span className="ml-1.5 font-mono text-[10px] text-brand-300">-17%</span>}
              </button>
            )
          })}
        </div>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p, i) => (
          <Reveal key={p.name} index={i}>
            <div
              className={cn(
                'relative flex h-full flex-col rounded-2xl p-6 transition duration-300',
                p.featured ? 'bg-ink-900 text-white shadow-lift ring-1 ring-brand-500/40' : 'bg-white/70 hairline hover:bg-white hover:shadow-soft',
              )}
            >
              {p.featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
                  Most picked
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className="text-[19px] font-bold tracking-tight">{p.name}</h3>
                <span className={cn('font-mono text-[11px]', p.featured ? 'text-ink-200' : 'text-ink-400')}>{p.tag}</span>
              </div>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-display text-[52px] leading-none">${yearly ? p.price.y : p.price.m}</span>
                <span className={cn('mb-2 text-sm', p.featured ? 'text-ink-200' : 'text-ink-400')}>/ month</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px]">
                    <Check size={16} className={cn('mt-0.5 shrink-0', p.featured ? 'text-brand-300' : 'text-brand-600')} />
                    <span className={p.featured ? 'text-ink-100' : 'text-ink-700'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant={p.featured ? 'primary' : 'outline'} href={p.href} className="mt-7 w-full">
                {p.cta}
              </Button>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
