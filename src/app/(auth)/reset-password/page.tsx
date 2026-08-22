import type { Metadata } from 'next'
import { Suspense } from 'react'
import ResetForm from './ResetForm'

export const metadata: Metadata = {
  title: 'Choose a new password',
  description: 'Set a new password for your DGS account.',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  )
}
