'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import {
  User,
  Building2,
  KeyRound,
  Bell,
  Palette,
  ShieldCheck,
  Copy,
  RefreshCw,
  Upload,
  Trash2,
  LockKeyhole,
  MonitorSmartphone,
  LogOut,
  AlertTriangle,
} from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { toast } from '@/lib/toast'
import { useAuth, updateSessionUser, signOut, type AuthUser } from '@/lib/session'
import { apiDelete, apiGet, apiPatch, apiPost, api, ApiClientError } from '@/lib/api'
import { cn, describeDevice, timeAgo } from '@/lib/utils'
import { useConfirm } from '@/components/ui/ConfirmDialog'

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: LockKeyhole },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'engine', label: 'AI Engine', icon: ShieldCheck },
  { id: 'api', label: 'API keys', icon: KeyRound },
  { id: 'notify', label: 'Notifications', icon: Bell },
  { id: 'branding', label: 'Report branding', icon: Palette },
]

export default function Settings() {
  const { user, status } = useAuth()
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
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-semibold transition',
                active === x.id ? 'bg-white/8 text-white' : 'text-ink-300 hover:bg-white/4 hover:text-white',
              )}
            >
              <x.icon size={15} className={active === x.id ? 'text-brand-300' : ''} /> {x.label}
            </button>
          ))}
        </nav>

        <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Keyed on the user id so the form re-seeds by remounting when the
              account resolves, instead of syncing props into state in an effect. */}
          {active === 'profile' && (
            <ProfileSection key={user?.id ?? 'pending'} user={user} loading={status === 'loading'} />
          )}
          {active === 'security' && <SecuritySection />}

          {active === 'workspace' && (
            <Card title="Workspace" desc="Shared settings for everyone in this workspace." mock>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field tone="dark" label="Workspace name" defaultValue="ITG Innovators" />
                <Field tone="dark" label="Slug" defaultValue="itg" hint="dgs.app/w/itg" />
                <Field tone="dark" label="Default environment" defaultValue="staging" />
                <Field tone="dark" label="Request timeout (ms)" defaultValue="10000" />
              </div>
              <MockSave />
            </Card>
          )}

          {active === 'engine' && (
            <Card title="AI Engine" desc="Control what the engine sees and how strict it is." mock>
              <Toggle
                on={redact}
                onChange={setRedact}
                label="Redact credentials before analysis"
                desc="Authorization headers, cookies and fields named password/token are masked before leaving the browser."
              />
              <Toggle
                on={strict}
                onChange={setStrict}
                label="Strict mode"
                desc="Treat missing hardening headers as Medium instead of Low. Good for regulated environments."
              />
              <div className="mt-4 rounded-lg bg-ink-900 p-4 ring-1 ring-white/8">
                <p className="eyebrow mb-2 text-ink-400">Frameworks to map against</p>
                <div className="flex flex-wrap gap-2">
                  {['OWASP API Top-10 2023', 'OWASP Top-10 2021', 'CWE', 'PCI-DSS 4.0', 'SOC 2'].map((f, i) => (
                    <label
                      key={f}
                      className="flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-1.5 text-[12.5px] ring-1 ring-white/8"
                    >
                      <input type="checkbox" defaultChecked={i < 3} className="accent-brand-500" /> {f}
                    </label>
                  ))}
                </div>
              </div>
              <MockSave />
            </Card>
          )}

          {active === 'api' && (
            <Card title="API keys" desc="Use DGS from CI or scripts. Keys inherit your plan limits." mock>
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
                    <button
                      onClick={() => toast('Copied', { kind: 'success' })}
                      className="rounded p-1.5 text-ink-300 hover:text-white"
                      aria-label="Copy key"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => toast('Key rotated', { kind: 'success', body: n })}
                      className="rounded p-1.5 text-ink-300 hover:text-white"
                      aria-label="Rotate"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4"
                size="sm"
                onClick={() =>
                  toast('New key created', { kind: 'success', body: 'Copy it now — it won’t be shown again.' })
                }
              >
                Create key
              </Button>
            </Card>
          )}

          {active === 'notify' && (
            <Card title="Notifications" desc="When should we interrupt you?" mock>
              <Toggle
                on={notify.critical}
                onChange={(v) => setNotify((n) => ({ ...n, critical: v }))}
                label="Critical findings"
                desc="Email + in-app the moment a Critical is detected."
              />
              <Toggle
                on={notify.weekly}
                onChange={(v) => setNotify((n) => ({ ...n, weekly: v }))}
                label="Weekly digest"
                desc="Score trend and open findings every Monday."
              />
              <Toggle
                on={notify.product}
                onChange={(v) => setNotify((n) => ({ ...n, product: v }))}
                label="Product updates"
                desc="New checks and engine releases."
              />
              <MockSave />
            </Card>
          )}

          {active === 'branding' && (
            <Card title="Report branding" desc="Appears on the cover and footer of exported PDFs (Pro+)." mock>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field tone="dark" label="Company name" defaultValue="ITG Innovators" />
                <Field tone="dark" label="Accent colour" defaultValue="#9333C9" />
                <Field
                  tone="dark"
                  label="Footer text"
                  defaultValue="Confidential — prepared by ITG Innovators"
                  className="sm:col-span-2"
                />
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
              <MockSave />
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Profile — name, company, role, avatar                              */
/* ================================================================== */

function ProfileSection({ user, loading }: { user: AuthUser | null; loading: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [form, setForm] = useState(() => ({
    name: user?.name ?? '',
    org: user?.org ?? '',
    role: user?.role ?? '',
  }))

  const dirty =
    !!user &&
    (form.name !== user.name || form.org !== (user.org ?? '') || form.role !== user.role)

  async function save() {
    setFields({})
    setSaving(true)
    try {
      const { user: updated } = await apiPatch<{ user: AuthUser }>('/api/account/profile', form)
      updateSessionUser(updated)
      toast('Profile saved', { kind: 'success' })
    } catch (err) {
      handleError(err, setFields)
    } finally {
      setSaving(false)
    }
  }

  async function upload(file: File) {
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const { user: updated } = await api<{ user: AuthUser }>('/api/account/avatar', {
        method: 'POST',
        body,
      })
      updateSessionUser(updated)
      toast('Photo updated', { kind: 'success' })
    } catch (err) {
      handleError(err)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function removePhoto() {
    setUploading(true)
    try {
      const { user: updated } = await apiDelete<{ user: AuthUser }>('/api/account/avatar')
      updateSessionUser(updated)
      toast('Photo removed', { kind: 'success' })
    } catch (err) {
      handleError(err)
    } finally {
      setUploading(false)
    }
  }

  if (loading || !user) {
    return (
      <Card title="Profile" desc="How you appear in reports and to teammates.">
        <div className="animate-pulse space-y-4">
          <div className="h-16 w-16 rounded-full bg-white/6" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-white/6" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Profile" desc="How you appear in reports and to teammates.">
      <div className="flex flex-wrap items-center gap-4">
        {user.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- our own route,
             versioned immutable URL; next/image would only add a proxy hop. */
          <img
            src={user.avatarUrl}
            alt="Your profile photo"
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover ring-1 ring-white/15"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-[20px] font-bold">
            {(user.name || user.email).slice(0, 2).toUpperCase()}
          </span>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="bg-ink-900 text-white ring-0 hover:bg-ink-700"
          leftIcon={<Upload size={14} />}
          loading={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {user.avatarUrl ? 'Replace photo' : 'Upload photo'}
        </Button>
        {user.avatarUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="text-ink-300 hover:bg-white/5 hover:text-white"
            leftIcon={<Trash2 size={14} />}
            disabled={uploading}
            onClick={() =>
              confirm.ask(
                {
                  title: 'Remove your photo?',
                  message: 'Your initials will be shown instead. You can upload a new photo any time.',
                  confirmLabel: 'Remove photo',
                },
                removePhoto,
              )
            }
          >
            Remove
          </Button>
        )}
        <span className="w-full font-mono text-[11px] text-ink-400 sm:w-auto">PNG, JPEG, WebP or GIF · up to 2 MB</span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          tone="dark"
          label="Full name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Sara Khan"
          error={fields.name}
        />
        <Field
          tone="dark"
          label="Email"
          value={user.email}
          readOnly
          disabled
          hint="contact support to change"
          className="opacity-70"
        />
        <Field
          tone="dark"
          label="Company"
          value={form.org}
          onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
          placeholder="Acme Shop"
          error={fields.org}
        />
        <Field
          tone="dark"
          label="Role"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          placeholder="Security engineer"
          error={fields.role}
        />
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-white/8 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-200 hover:bg-white/5 hover:text-white"
          disabled={!dirty || saving}
          onClick={() => {
            setFields({})
            setForm({ name: user.name, org: user.org ?? '', role: user.role })
          }}
        >
          Cancel
        </Button>
        <Button size="sm" loading={saving} disabled={!dirty} onClick={() => void save()}>
          Save changes
        </Button>
      </div>

      <confirm.Dialog />
    </Card>
  )
}

/* ================================================================== */
/* Security — password change + active sessions                       */
/* ================================================================== */

interface SessionRow {
  id: string
  current: boolean
  ip: string | null
  userAgent: string | null
  createdAt: string
  lastUsedAt: string
}

function SecuritySection() {
  const confirm = useConfirm()
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [signOutOthers, setSignOutOthers] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})

  const [sessions, setSessions] = useState<SessionRow[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  /** Bumping this re-runs the fetch below — used after a password change. */
  const reloadSessions = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    apiGet<{ sessions: SessionRow[] }>('/api/auth/sessions')
      .then((d) => {
        if (!cancelled) setSessions(d.sessions)
      })
      .catch(() => {
        if (!cancelled) setSessions([])
      })
    // Stops a slow response from writing into an unmounted component.
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  async function changePassword() {
    setFields({})
    if (pw.newPassword !== pw.confirm) return setFields({ confirm: 'Both passwords must match.' })

    setSaving(true)
    try {
      await apiPost('/api/account/password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
        signOutOthers,
      })
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      toast('Password changed', {
        kind: 'success',
        body: signOutOthers ? 'Other devices have been signed out.' : undefined,
      })
      reloadSessions()
    } catch (err) {
      handleError(err, setFields)
    } finally {
      setSaving(false)
    }
  }

  async function revoke(id: string) {
    setBusyId(id)
    try {
      await apiDelete(`/api/auth/sessions/${id}`)
      setSessions((s) => s?.filter((x) => x.id !== id) ?? null)
      toast('Device signed out', { kind: 'success' })
    } catch (err) {
      handleError(err)
    } finally {
      setBusyId(null)
    }
  }

  async function revokeOthers() {
    setBusyId('all')
    try {
      const { revoked } = await apiDelete<{ revoked: number }>('/api/auth/sessions')
      toast(revoked ? `Signed out ${revoked} session${revoked === 1 ? '' : 's'}` : 'No other sessions', {
        kind: 'success',
      })
      reloadSessions()
    } catch (err) {
      handleError(err)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <Card title="Password" desc="Changing this signs you out of other devices by default.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            tone="dark"
            type="password"
            label="Current password"
            className="sm:col-span-2"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
            error={fields.currentPassword}
          />
          <Field
            tone="dark"
            type="password"
            label="New password"
            autoComplete="new-password"
            value={pw.newPassword}
            onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
            error={fields.newPassword}
          />
          <Field
            tone="dark"
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            value={pw.confirm}
            onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            error={fields.confirm}
          />
        </div>

        <div className="mt-1">
          <Toggle
            on={signOutOthers}
            onChange={setSignOutOthers}
            label="Sign out other devices"
            desc="Recommended. Anything already signed in loses access within seconds."
          />
        </div>

        <div className="mt-5 flex justify-end border-t border-white/8 pt-4">
          <Button
            size="sm"
            loading={saving}
            disabled={!pw.currentPassword || !pw.newPassword || !pw.confirm}
            onClick={() => void changePassword()}
          >
            Update password
          </Button>
        </div>
      </Card>

      <Card title="Active sessions" desc="Every device currently signed in to this account.">
        {sessions === null ? (
          <div className="animate-pulse space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-white/6" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-[13px] text-ink-300">No active sessions found.</p>
        ) : (
          <ul className="divide-y divide-white/6 overflow-hidden rounded-lg ring-1 ring-white/8">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 bg-ink-900/60 px-4 py-3">
                <MonitorSmartphone size={16} className="shrink-0 text-ink-300" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] font-semibold">
                    {describeDevice(s.userAgent)}
                    {s.current && (
                      <span className="rounded bg-brand-600/25 px-1.5 py-0.5 font-mono text-[10px] text-brand-200 ring-1 ring-brand-500/30">
                        this device
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-ink-400">
                    {s.ip ?? 'unknown IP'} · active {timeAgo(s.lastUsedAt)}
                  </div>
                </div>
                {!s.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-ink-300 hover:bg-white/5 hover:text-white"
                    loading={busyId === s.id}
                    onClick={() =>
                      confirm.ask(
                        {
                          title: 'Sign out this device?',
                          message: (
                            <>
                              <span className="font-semibold text-white">{describeDevice(s.userAgent)}</span> will be
                              signed out immediately and will need to sign in again.
                            </>
                          ),
                          confirmLabel: 'Sign it out',
                        },
                        () => revoke(s.id),
                      )
                    }
                  >
                    Sign out
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/8 pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-ink-200 hover:bg-white/5 hover:text-white"
            leftIcon={<LogOut size={14} />}
            loading={busyId === 'all'}
            onClick={() =>
              confirm.ask(
                {
                  title: 'Sign out everywhere else?',
                  message:
                    'Every other device loses access immediately. This device stays signed in.',
                  confirmLabel: 'Sign out others',
                },
                revokeOthers,
              )
            }
          >
            Sign out everywhere else
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              confirm.ask(
                {
                  title: 'Sign out of everything?',
                  message:
                    'Every device is signed out, including this one. You will be returned to the sign-in screen.',
                  confirmLabel: 'Sign out everywhere',
                },
                () => signOut(true),
              )
            }
          >
            Sign out of everything
          </Button>
        </div>
      </Card>

      <confirm.Dialog />
    </>
  )
}

/* ================================================================== */
/* shared bits                                                        */
/* ================================================================== */

function handleError(err: unknown, setFields?: (f: Record<string, string>) => void) {
  if (err instanceof ApiClientError) {
    if (err.fields && setFields) {
      setFields(err.fields)
      return
    }
    toast('Could not save', { kind: 'error', body: err.message })
    return
  }
  toast('Could not save', { kind: 'error', body: 'Something went wrong. Please try again.' })
}

function Card({
  title,
  desc,
  children,
  mock,
}: {
  title: string
  desc: string
  children: ReactNode
  /** Marks a panel whose controls are still front-end only. */
  mock?: boolean
}) {
  return (
    <section className="rounded-xl bg-ink-800 p-5 ring-1 ring-white/8 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[16px] font-bold">{title}</h2>
        {mock && (
          <span className="shrink-0 rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/30">
            not saved yet
          </span>
        )}
      </div>
      <p className="mb-5 mt-0.5 text-[13px] text-ink-300">{desc}</p>
      {children}
    </section>
  )
}

/** Save button for the panels that still have no backend behind them. */
function MockSave() {
  return (
    <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/8 pt-4">
      <span className="mr-auto flex items-center gap-1.5 text-[12px] text-ink-400">
        <AlertTriangle size={13} className="text-amber-400" /> Front-end only — no API behind this yet.
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="text-ink-200 hover:bg-white/5 hover:text-white"
        onClick={() => toast('Not wired up yet', { kind: 'info', body: 'This panel still needs an endpoint.' })}
      >
        Save changes
      </Button>
    </div>
  )
}

function Toggle({
  on,
  onChange,
  label,
  desc,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
  desc: string
}) {
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
        <motion.span
          layout
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          style={{ left: on ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </label>
  )
}
