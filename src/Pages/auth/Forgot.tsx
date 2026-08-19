import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, ArrowRight, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { wait } from '@/lib/mock'

export default function Forgot() {
  const [sent, setSent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email'))
    setLoading(true)
    await wait(900)
    setLoading(false)
    setSent(email)
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <MailCheck size={24} />
        </span>
        <h1 className="display mt-5 text-[34px] text-ink-900">Check your inbox.</h1>
        <p className="mt-2 text-[14px] text-ink-500">
          If <span className="font-semibold text-ink-800">{sent}</span> has an account, a reset link is on its way. It expires in 15 minutes.
        </p>
        <Button variant="outline" to="/login" className="mt-6">
          Back to sign in
        </Button>
      </motion.div>
    )
  }

  return (
    <>
      <p className="eyebrow mb-3">Reset password</p>
      <h1 className="display text-[36px] text-ink-900 sm:text-[42px]">
        Locked out? <i>Happens.</i>
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">Enter your email and we'll send a single-use reset link.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field name="email" type="email" label="Email" placeholder="you@company.com" icon={<Mail size={16} />} autoComplete="email" required />
        <Button type="submit" size="lg" className="w-full" loading={loading} rightIcon={<ArrowRight size={16} />}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-ink-500">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
