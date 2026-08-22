/* ------------------------------------------------------------------
   The security domain model.

   Types and lookup tables shared by the scanner, the API tester and
   every panel that renders a finding. Nothing fabricated lives here —
   demo content is in `demo.ts`.
   ------------------------------------------------------------------ */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Finding {
  id: string
  title: string
  severity: Severity
  category: string
  cwe?: string
  owasp?: string
  description: string
  evidence?: string
  fix: string
  effort: 'low' | 'medium' | 'high'
}

export interface AiAnalysis {
  score: number // 0-100 (higher = safer)
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  attackSurface: { label: string; value: string; risk: Severity }[]
  findings: Finding[]
  suggestions: string[]
  checks: { name: string; status: 'pass' | 'fail' | 'warn' }[]
}

export const severityMeta: Record<Severity, { label: string; text: string; bg: string; dot: string; rank: number }> = {
  critical: { label: 'Critical', text: 'text-red-300', bg: 'bg-red-500/15 ring-red-500/30', dot: 'bg-red-400', rank: 0 },
  high: { label: 'High', text: 'text-orange-300', bg: 'bg-orange-500/15 ring-orange-500/30', dot: 'bg-orange-400', rank: 1 },
  medium: { label: 'Medium', text: 'text-amber-300', bg: 'bg-amber-500/15 ring-amber-500/30', dot: 'bg-amber-400', rank: 2 },
  low: { label: 'Low', text: 'text-sky-300', bg: 'bg-sky-500/15 ring-sky-500/30', dot: 'bg-sky-400', rank: 3 },
  info: { label: 'Info', text: 'text-ink-200', bg: 'bg-white/8 ring-white/15', dot: 'bg-ink-300', rank: 4 },
}

export const gradeFor = (score: number): AiAnalysis['grade'] =>
  score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F'


/* ---------------- Website scan ---------------- */

export interface SiteScanResult {
  url: string
  score: number
  grade: AiAnalysis['grade']
  tech: string[]
  tls: { valid: boolean; issuer: string; expiresInDays: number; protocol: string }
  headers: { name: string; present: boolean; value?: string; weight: number }[]
  endpoints: { method: string; path: string; risk: Severity }[]
  findings: Finding[]
}


/* ---------------- Scan pipeline ---------------- */

export interface ScanStep {
  id: string
  label: string
  detail: string
}


/* ---------------- Reports ---------------- */

export interface Report {
  id: string
  name: string
  type: 'api' | 'website'
  target: string
  score: number
  /** Count, for the list row. The detail lives in `detail`. */
  findings: number
  critical: number
  createdAt: string
  pages: number
  /** One-line verdict shown in the preview drawer. */
  summary?: string
  /** The stored findings. Absent until the engine writes them. */
  detail?: Finding[]
}
