import { useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TOKEN = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g

/** Lightweight JSON syntax highlighter (no deps). Falls back to plain text for non-JSON. */
export function JsonView({ text, className, highlightKeys = [] }: { text: string; className?: string; highlightKeys?: string[] }) {
  const nodes = useMemo<ReactNode[]>(() => {
    const out: ReactNode[] = []
    let last = 0
    let i = 0
    for (const m of text.matchAll(TOKEN)) {
      const idx = m.index ?? 0
      if (idx > last) out.push(text.slice(last, idx))
      const tok = m[0]
      let cls = 'text-sky-300' // number
      let isKey = false
      if (tok.startsWith('"')) {
        if (/:\s*$/.test(tok)) {
          cls = 'text-brand-300'
          isKey = true
        } else cls = 'text-emerald-300'
      } else if (/^(true|false|null)$/.test(tok)) cls = 'text-amber-300'
      const keyName = isKey ? tok.replace(/^"|"\s*:\s*$/g, '') : ''
      const flagged = isKey && highlightKeys.includes(keyName)
      out.push(
        <span key={i++} className={cn(cls, flagged && 'rounded bg-red-500/25 px-0.5 ring-1 ring-red-400/50')}>
          {tok}
        </span>,
      )
      last = idx + tok.length
    }
    if (last < text.length) out.push(text.slice(last))
    return out
  }, [text, highlightKeys])

  return (
    <pre className={cn('whitespace-pre-wrap break-all font-mono text-[12px] leading-[1.7] text-ink-100', className)}>
      {nodes}
    </pre>
  )
}

export default JsonView
