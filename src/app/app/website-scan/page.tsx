import type { Metadata } from 'next'
import WebsiteScanView from './WebsiteScanView'

export const metadata: Metadata = {
  title: 'Website Scan',
  description: 'Crawl a site, discover its APIs and grade its security posture.',
}

export default function WebsiteScanPage() {
  return <WebsiteScanView />
}
