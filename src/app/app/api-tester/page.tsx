import type { Metadata } from 'next'
import ApiTesterView from './ApiTesterView'

export const metadata: Metadata = {
  title: 'API Tester',
  description: 'Send any API request and hand the response to the AI Engine.',
}

export default function ApiTesterPage() {
  return <ApiTesterView />
}
