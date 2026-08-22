'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { Mail, LockKeyhole, User, Building2, ArrowRight, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { apiPost, ApiClientError } from '@/lib/api'
import { applySession, type AuthUser } from '@/lib/session'
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

export default function Signup() {
  const router = useRouter()
  const params = useSearchParams()
  const plan = params.get('plan')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const s = useMemo(() => strength(pw), [pw])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    setFields({})

    const data = new FormData(e.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const name = String(data.get('name') ?? '').trim()

    if (!name) return setFields({ name: 'Enter your name.' })
    if (!email.includes('@')) return setFields({ email: 'Enter a valid email address.' })
    // The server enforces this too — this is just a faster answer.
    if (s < 2) return setFields({ password: 'Choose a stronger password.' })

    setLoading(true)
    try {
      const { user } = await apiPost<{ user: AuthUser }>('/api/auth/signup', {
        name,
        email,
        password: pw,
        org: String(data.get('org') ?? '').trim(),
      })
      applySession(user)
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
      <p className="eyebrow mb-3">
        Create account
        {plan && <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-brand-700">{plan} plan</span>}
      </p>
      <h1 className="display text-[36px] text-ink-900 sm:text-[42px]">
        Start guarding <i>in a minute.</i>
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>


      {formError && (
        <div
          role="alert"
          className="mt-8 -mb-2 flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-[13px] text-red-700 ring-1 ring-red-200"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="name"
            label="Full name"
            placeholder="Sara Khan"
            icon={<User size={16} />}
            autoComplete="name"
            required
            error={fields.name}
          />
          <Field
            name="org"
            label="Company"
            hint="optional"
            placeholder="Acme Shop"
            icon={<Building2 size={16} />}
            autoComplete="organization"
            error={fields.org}
          />
        </div>
        <Field
          name="email"
          type="email"
          label="Work email"
          placeholder="you@company.com"
          icon={<Mail size={16} />}
          autoComplete="email"
          required
          error={fields.email}
        />
        <div>
          <Field
            name="password"
            type="password"
            label="Password"
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

        <label className="flex items-start gap-2 text-[13px] text-ink-600">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded accent-brand-600" />
          <span>
            I&apos;ll only scan systems I own or am authorised to test, and I agree to the{' '}
            <Link href="/help" className="font-semibold text-ink-900 underline decoration-ink-300 underline-offset-2">
              Terms
            </Link>
            .
          </span>
        </label>

        <Button type="submit" size="lg" className="w-full" loading={loading} rightIcon={<ArrowRight size={16} />}>
          Create account
        </Button>
      </form>
    </>
  )
}
