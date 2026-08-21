import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your DGS console.',
}

export default function LoginPage() {
  return <LoginForm />
}
