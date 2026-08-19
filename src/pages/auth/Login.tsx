import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, LockKeyhole, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { wait } from '@/lib/mock'
import { SocialRow, Divider } from './SocialRow'

export default function Login() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)
    if (!String(data.get('email')).includes('@')) return setError('Enter a valid email address.')
    setLoading(true)
    await wait(900) // UI-only: swap for real auth call
    localStorage.setItem('dgs.session', JSON.stringify({ email: data.get('email'), at: Date.now() }))
    nav('/app')
  }

  return (
    <>
      <p className="eyebrow mb-3">Welcome back</p>
      <h1 className="display text-[36px] text-ink-900 sm:text-[42px]">
        Sign in to your <i>console.</i>
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>

      <SocialRow className="mt-8" />
      <Divider />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field name="email" type="email" label="Email" placeholder="you@company.com" icon={<Mail size={16} />} autoComplete="email" required error={error ?? undefined} />
        <Field
          name="password"
          type="password"
          label="Password"
          hint={
            <Link to="/forgot-password" className="text-brand-600 hover:underline">
              Forgot?
            </Link>
          }
          placeholder="••••••••••"
          icon={<LockKeyhole size={16} />}
          autoComplete="current-password"
          required
        />
        <label className="flex items-center gap-2 text-[13px] text-ink-600">
          <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded border-ink-300 accent-brand-600" />
          Keep me signed in on this device
        </label>
        <Button type="submit" size="lg" className="w-full" loading={loading} rightIcon={<ArrowRight size={16} />}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center font-mono text-[11px] text-ink-400">Protected by rate limiting & device checks.</p>
    </>
  )
}
