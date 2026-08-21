import type { Metadata } from 'next'
import HelpCenter from '@/components/help/HelpCenter'

export const metadata: Metadata = {
  title: 'Help center',
  description: 'Guides for the API Tester, the AI Engine, website scans and reports.',
}

export default function HelpPage() {
  return <HelpCenter />
}
