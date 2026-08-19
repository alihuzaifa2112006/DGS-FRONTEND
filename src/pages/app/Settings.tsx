import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { User, Building2, KeyRound, Bell, Palette, ShieldCheck, Copy, RefreshCw, Upload } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { toast } from '@/lib/toast'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'engine', label: 'AI Engine', icon: ShieldCheck },
  { id: 'api', label: 'API keys', icon: KeyRound },
  { id: 'notify', label: 'Notifications', icon: Bell },
  { id: 'branding', label: 'Report branding', icon: Palette },
]

export default function Settings() {
  const s = getSession()
  const [active, setActive] = useState('profile')
  const [redact, setRedact] = useState(true)
  const [strict, setStrict] = useState(false)
  const [notify, setNotify] = useState({ critical: true, weekly: true, product: false })

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <p className="eyebrow text-ink-300">Settings</p>
      <h1 className="display mt-1 text-[32px] sm:text-[40px]">
        Tune the <i className="text-brand-300">guard.</i>
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
          {sections.map((x) => (
            <button
              key={x.id}
              onClick={() => setActive(x.id)}
              className={cn('flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-semibold transition', active === x.id ? 'bg-white/8 text-white' : 'text-ink-300 hover:bg-white/4 hover:text-white')}
            >
              <x.icon size={15} className={active === x.id ? 'text-brand-300' : ''} /> {x.label}
            </button>
          ))}
        </nav>

        <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {active === 'profile' && (
            <Card title="Profile" desc="How you appear in reports and to teammates.">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-[20px] font-bold">{(s?.name || s?.email || 'DG').slice(0, 2).toUpperCase()}</span>
                <Button variant="outline" size="sm" className="bg-ink-900 text-white ring-0 hover:bg-ink-700" leftIcon={<Upload size={14} />}>
                  Upload photo
                </Button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field tone="dark" label="Full name" defaultValue={s?.name ?? ''} placeholder="Sara Khan" />
                <Field tone="dark" label="Email" defaultValue={s?.email ?? ''} placeholder="you@company.com" />
                <Field tone="dark" label="Role" defaultValue="Security engineer" />
                <Field tone="dark" label="Timezone" defaultValue="Asia/Karachi (GMT+5)" />
              </div>
              <Save />
            </Card>
          )}

          {active === 'workspace' && (
            <Card title="Workspace" desc="Shared settings for everyone in this workspace.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field tone="dark" label="Workspace name" defaultValue="ITG Innovators" />
                <Field tone="dark" label="Slug" defaultValue="itg" hint="dgs.app/w/itg" />
                <Field tone="dark" label="Default environment" defaultValue="staging" />
                <Field tone="dark" label="Request timeout (ms)" defaultValue="10000" />
              </div>
              <Save />
            </Card>
          )}

          {active === 'engine' && (
            <Card title="AI Engine" desc="Control what the engine sees and how strict it is.">
              <Toggle on={redact} onChange={setRedact} label="Redact credentials before analysis" desc="Authorization headers, cookies and fields named password/token are masked before leaving the browser." />
              <Toggle on={strict} onChange={setStrict} label="Strict mode" desc="Treat missing hardening headers as Medium instead of Low. Good for regulated environments." />
              <div className="mt-4 rounded-lg bg-ink-900 p-4 ring-1 ring-white/8">
                <p className="eyebrow mb-2 text-ink-400">Frameworks to map against</p>
                <div className="flex flex-wrap gap-2">
                  {['OWASP API Top-10 2023', 'OWASP Top-10 2021', 'CWE', 'PCI-DSS 4.0', 'SOC 2'].map((f, i) => (
                    <label key={f} className="flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-1.5 text-[12.5px] ring-1 ring-white/8">
                      <input type="checkbox" defaultChecked={i < 3} className="accent-brand-500" /> {f}
                    </label>
                  ))}
                </div>
              </div>
              <Save />
            </Card>
          )}

          {active === 'api' && (
            <Card title="API keys" desc="Use DGS from CI or scripts. Keys inherit your plan limits.">
              <ul className="divide-y divide-white/6 overflow-hidden rounded-lg ring-1 ring-white/8">
                {[
                  ['ci-github-actions', 'dgs_live_7f3a…c91e', '2d ago'],
                  ['local-dev', 'dgs_test_11b0…44aa', '3w ago'],
                ].map(([n, k, u]) => (
                  <li key={n} className="flex flex-wrap items-center gap-3 bg-ink-900/60 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold">{n}</div>
                      <div className="font-mono text-[11.5px] text-ink-300">{k}</div>
                    </div>
                    <span className="font-mono text-[11px] text-ink-400">used {u}</span>
                    <button onClick={() => toast('Copied', { kind: 'success' })} className="rounded p-1.5 text-ink-300 hover:text-white" aria-label="Copy key">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => toast('Key rotated', { kind: 'success', body: n })} className="rounded p-1.5 text-ink-300 hover:text-white" aria-label="Rotate">
                      <RefreshCw size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <Button className="mt-4" size="sm" onClick={() => toast('New key created', { kind: 'success', body: 'Copy it now — it won’t be shown again.' })}>
                Create key
              </Button>
            </Card>
          )}

          {active === 'notify' && (
            <Card title="Notifications" desc="When should we interrupt you?">
              <Toggle on={notify.critical} onChange={(v) => setNotify((n) => ({ ...n, critical: v }))} label="Critical findings" desc="Email + in-app the moment a Critical is detected." />
              <Toggle on={notify.weekly} onChange={(v) => setNotify((n) => ({ ...n, weekly: v }))} label="Weekly digest" desc="Score trend and open findings every Monday." />
              <Toggle on={notify.product} onChange={(v) => setNotify((n) => ({ ...n, product: v }))} label="Product updates" desc="New checks and engine releases." />
              <Save />
            </Card>
          )}

          {active === 'branding' && (
            <Card title="Report branding" desc="Appears on the cover and footer of exported PDFs (Pro+).">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field tone="dark" label="Company name" defaultValue="ITG Innovators" />
                <Field tone="dark" label="Accent colour" defaultValue="#9333C9" />
                <Field tone="dark" label="Footer text" defaultValue="Confidential — prepared by ITG Innovators" className="sm:col-span-2" />
              </div>
              <div className="mt-4 flex items-center gap-4 rounded-lg border border-dashed border-white/15 p-4">
                <span className="flex h-12 w-12 items-center justify-center rounded bg-white/5 text-ink-300">
                  <Upload size={18} />
                </span>
                <div className="text-[12.5px] text-ink-200">
                  Drop a logo (SVG/PNG, ≤ 1 MB)
                  <div className="font-mono text-[11px] text-ink-400">used on report cover</div>
                </div>
              </div>
              <Save />
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function Card({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-ink-800 p-5 ring-1 ring-white/8 sm:p-6">
      <h2 className="text-[16px] font-bold">{title}</h2>
      <p className="mb-5 mt-0.5 text-[13px] text-ink-300">{desc}</p>
      {children}
    </section>
  )
}

function Save() {
  return (
    <div className="mt-5 flex justify-end gap-2 border-t border-white/8 pt-4">
      <Button variant="ghost" size="sm" className="text-ink-200 hover:bg-white/5 hover:text-white">
        Cancel
      </Button>
      <Button size="sm" onClick={() => toast('Settings saved', { kind: 'success' })}>
        Save changes
      </Button>
    </div>
  )
}

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-white/6 py-3.5 last:border-b-0">
      <span>
        <span className="block text-[13.5px] font-semibold">{label}</span>
        <span className="block text-[12.5px] text-ink-300">{desc}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-brand-600' : 'bg-white/12')}
      >
        <motion.span layout className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style={{ left: on ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
      </button>
    </label>
  )
}
