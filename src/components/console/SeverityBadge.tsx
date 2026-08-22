import { severityMeta, type Severity } from '@/lib/security'
import { cn } from '@/lib/utils'

export function SeverityBadge({ severity, className, short }: { severity: Severity; className?: string; short?: boolean }) {
  const m = severityMeta[severity]
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ring-1', m.bg, m.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {short ? m.label.slice(0, 4) : m.label}
    </span>
  )
}

export function MethodChip({ method, className }: { method: string; className?: string }) {
  const map: Record<string, string> = {
    GET: 'bg-emerald-400 text-ink-900',
    POST: 'bg-amber-400 text-ink-900',
    PUT: 'bg-sky-400 text-ink-900',
    PATCH: 'bg-violet-400 text-ink-900',
    DELETE: 'bg-red-400 text-ink-900',
    HEAD: 'bg-ink-300 text-ink-900',
    OPTIONS: 'bg-ink-300 text-ink-900',
  }
  return <span className={cn('inline-flex rounded px-1.5 py-0.5 font-mono text-[10.5px] font-bold', map[method] ?? 'bg-ink-300 text-ink-900', className)}>{method}</span>
}
