import type { Metadata } from 'next'
import ReportsView from './ReportsView'

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Every DGS audit on record, ready to export.',
}

export default function ReportsPage() {
  return <ReportsView />
}
