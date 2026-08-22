'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { LockKeyhole, ArrowRight, Check, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { apiPost, ApiClientError } from '@/lib/api'
import { applySession, type AuthUser } from '@/lib/session'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

function strength(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
const colors = ['', 'bg-crit', 'bg-warn', 'bg-brand-500', 'bg-ok']

export default function ResetForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''

  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const s = useMemo(() => strength(pw), [pw])

  if (!token) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert size={24} />
        </span>
        <h1 className="display mt-5 text-[34px] text-ink-900">Link is incomplete.</h1>
        <p className="mt-2 text-[14px] text-ink-500">
          This page needs the token from your reset email. Request a fresh link and open it directly.
        </p>
        <Button href="/forgot-password" className="mt-6">
          Request a new link
        </Button>
      </motion.div>
    )
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    setFields({})

    if (s < 2) return setFields({ password: 'Choose a stronger password.' })
    if (pw !== confirm) return setFields({ confirm: 'Both passwords must match.' })

    setLoading(true)
    try {
      const { user } = await apiPost<{ user: AuthUser }>('/api/auth/reset-password', {
        token,
        password: pw,
      })
      // The API signs this browser in as part of the reset, so there is no
      // reason to bounce back through the login screen.
      applySession(user)
      toast('Password updated', { kind: 'success', body: 'Other devices have been signed out.' })
      router.replace('/app')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fields) setFields(err.fields)
        else setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <>
      <p className="eyebrow mb-3">Reset password</p>
      <h1 className="display text-[36px] text-ink-900 sm:text-[42px]">
        Choose a <i>new password.</i>
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">
        Setting this signs out every other device on your account.
      </p>

      {(formError || fields.token) && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-[13px] text-red-700 ring-1 ring-red-200"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {formError ?? fields.token}{' '}
            <Link href="/forgot-password" className="font-semibold underline">
              Request a new link
            </Link>
          </span>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <Field
            name="password"
            type="password"
            label="New password"
            placeholder="At least 8 characters"
            icon={<LockKeyhole size={16} />}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            error={fields.password}
          />
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: i <= s ? 1 : 0.25 }}
                  className={cn('h-1 flex-1 rounded-full bg-ink-900/15', i <= s && colors[s])}
                />
              ))}
            </div>
            <span className="w-12 text-right font-mono text-[10.5px] text-ink-400">{labels[s]}</span>
          </div>
        </div>

        <Field
          name="confirm"
          type="password"
          label="Confirm new password"
          placeholder="Type it again"
          icon={<LockKeyhole size={16} />}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          error={fields.confirm}
        />

        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-ink-500">
          {[
            ['8+ characters', pw.length >= 8],
            ['Upper & lower case', /[A-Z]/.test(pw) && /[a-z]/.test(pw)],
            ['A number', /\d/.test(pw)],
            ['A symbol', /[^A-Za-z0-9]/.test(pw)],
          ].map(([t, ok]) => (
            <li key={t as string} className={cn('flex items-center gap-1.5', ok && 'text-ok')}>
              <Check size={13} className={ok ? 'opacity-100' : 'opacity-30'} /> {t as string}
            </li>
          ))}
        </ul>

        <Button type="submit" size="lg" className="w-full" loading={loading} rightIcon={<ArrowRight size={16} />}>
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-500">
        Changed your mind?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
