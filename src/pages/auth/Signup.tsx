import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, LockKeyhole, User, Building2, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { wait } from '@/lib/mock'
import { SocialRow, Divider } from './SocialRow'
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
  const nav = useNavigate()
  const [params] = useSearchParams()
  const plan = params.get('plan')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const s = useMemo(() => strength(pw), [pw])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)
    if (!String(data.get('email')).includes('@')) return setError('Enter a valid email address.')
    if (s < 2) return setError('Choose a stronger password.')
    setLoading(true)
    await wait(1100)
    localStorage.setItem('dgs.session', JSON.stringify({ email: data.get('email'), name: data.get('name'), at: Date.now() }))
    nav('/app')
  }

  return (
    <>
      <p className="eyebrow mb-3">Create account{plan && <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-brand-700">{plan} plan</span>}</p>
      <h1 className="display text-[36px] text-ink-900 sm:text-[42px]">
        Start guarding <i>in a minute.</i>
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>

      <SocialRow className="mt-8" />
      <Divider />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Full name" placeholder="Sara Khan" icon={<User size={16} />} autoComplete="name" required />
          <Field name="org" label="Company" hint="optional" placeholder="Acme Shop" icon={<Building2 size={16} />} autoComplete="organization" />
        </div>
        <Field name="email" type="email" label="Work email" placeholder="you@company.com" icon={<Mail size={16} />} autoComplete="email" required error={error ?? undefined} />
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
            I'll only scan systems I own or am authorised to test, and I agree to the{' '}
            <Link to="/help" className="font-semibold text-ink-900 underline decoration-ink-300 underline-offset-2">Terms</Link>.
          </span>
        </label>

        <Button type="submit" size="lg" className="w-full" loading={loading} rightIcon={<ArrowRight size={16} />}>
          Create account
        </Button>
      </form>
    </>
  )
}
