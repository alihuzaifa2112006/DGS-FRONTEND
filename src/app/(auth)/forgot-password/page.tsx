import type { Metadata } from 'next'
import ForgotForm from './ForgotForm'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Request a single-use password reset link for your DGS account.',
}

export default function ForgotPasswordPage() {
  return <ForgotForm />
}
