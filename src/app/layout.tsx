import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Manrope, JetBrains_Mono } from 'next/font/google'
import Toaster from '@/components/ui/Toaster'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument-serif',
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://dgs.local'),
  title: {
    default: 'DGS — Digital Guard System',
    template: '%s · DGS',
  },
  description:
    'Send any API request, hand the response to the AI Engine, and get weaknesses, attack surface and fixes in seconds. Scan websites and export audit-ready PDF reports.',
  applicationName: 'DGS — Digital Guard System',
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#0E0B18',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Toaster />
        {children}
      </body>
    </html>
  )
}
