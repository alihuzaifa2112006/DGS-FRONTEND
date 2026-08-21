import type { Metadata } from 'next'
import SettingsView from './SettingsView'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Profile, workspace, AI Engine, API keys and report branding.',
}

export default function SettingsPage() {
  return <SettingsView />
}
