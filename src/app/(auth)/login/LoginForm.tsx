'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, LockKeyhole, ArrowRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { apiPost, ApiClientError } from '@/lib/api'
import { applySession, type AuthUser } from '@/lib/session'

export default function Login() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    setFields({})

    const data = new FormData(e.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')

    if (!email.includes('@')) return setFields({ email: 'Enter a valid email address.' })
    if (!password) return setFields({ password: 'Enter your password.' })

    setLoading(true)
    try {
      const { user } = await apiPost<{ user: AuthUser }>('/api/auth/login', {
        email,
        password,
        remember: data.get('remember') === 'on',
      })
      applySession(user)

      // `next` comes from middleware when it intercepted a protected page.
      // Only same-site paths are honoured, so a crafted ?next=https://evil
      // cannot turn our login screen into an open redirect.
      const next = params.get('next')
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/app')
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
      <p className="eyebrow mb-3">Welcome back</p>
      <h1 className="display text-[36px] text-ink-900 sm:text-[42px]">
        Sign in to your <i>console.</i>
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">
        New here?{' '}
        <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
          Create an account
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
        <Field
          name="email"
          type="email"
          label="Email"
          placeholder="you@company.com"
          icon={<Mail size={16} />}
          autoComplete="email"
          required
          error={fields.email}
        />
        <Field
          name="password"
          type="password"
          label="Password"
          hint={
            <Link href="/forgot-password" className="text-brand-600 hover:underline">
              Forgot?
            </Link>
          }
          placeholder="••••••••••"
          icon={<LockKeyhole size={16} />}
          autoComplete="current-password"
          required
          error={fields.password}
        />
        <label className="flex items-center gap-2 text-[13px] text-ink-600">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="h-4 w-4 rounded border-ink-300 accent-brand-600"
          />
          Keep me signed in on this device
        </label>
        <Button type="submit" size="lg" className="w-full" loading={loading} rightIcon={<ArrowRight size={16} />}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center font-mono text-[11px] text-ink-400">
        Protected by rate limiting &amp; device checks.
      </p>
    </>
  )
}
