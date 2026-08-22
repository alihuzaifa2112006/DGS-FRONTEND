import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your DGS console.',
}

export default function LoginPage() {
  // LoginForm reads ?next= via useSearchParams, which needs a Suspense boundary
  return (
    <Suspense fallback={<div className="h-[520px] animate-pulse rounded-xl bg-paper-2" />}>
      <LoginForm />
    </Suspense>
  )
}
