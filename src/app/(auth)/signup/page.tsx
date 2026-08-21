import { Suspense } from 'react'
import type { Metadata } from 'next'
import SignupForm from './SignupForm'

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a free DGS account and start guarding your APIs.',
}

export default function SignupPage() {
  // SignupForm reads ?plan= via useSearchParams, which needs a Suspense boundary
  return (
    <Suspense fallback={<div className="h-[520px] animate-pulse rounded-xl bg-paper-2" />}>
      <SignupForm />
    </Suspense>
  )
}
