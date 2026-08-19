import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KV {
  key: string
  value: string
  on: boolean
}

/** Key/value row editor — params & headers, Postman-style. */
export function KVEditor({
  rows,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: {
  rows: KV[]
  onChange: (rows: KV[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}) {
  const update = (i: number, patch: Partial<KV>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const add = () => onChange([...rows, { key: '', value: '', on: true }])

  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-white/8">
      <div className="grid grid-cols-[36px_1fr_1fr_36px] border-b border-white/8 bg-ink-900/60 font-mono text-[10.5px] uppercase tracking-wider text-ink-300">
        <span className="px-2 py-2" />
        <span className="px-2 py-2">Key</span>
        <span className="px-2 py-2">Value</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <div key={i} className={cn('grid grid-cols-[36px_1fr_1fr_36px] items-center border-b border-white/6 last:border-b-0', !r.on && 'opacity-50')}>
          <label className="flex items-center justify-center py-2">
            <input type="checkbox" checked={r.on} onChange={(e) => update(i, { on: e.target.checked })} className="h-3.5 w-3.5 accent-brand-500" />
          </label>
          <input
            value={r.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder={keyPlaceholder}
            className="h-9 w-full bg-transparent px-2 font-mono text-[12.5px] text-white outline-none placeholder:text-ink-400 focus:bg-white/4"
          />
          <input
            value={r.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder={valuePlaceholder}
            className="h-9 w-full bg-transparent px-2 font-mono text-[12.5px] text-white outline-none placeholder:text-ink-400 focus:bg-white/4"
          />
          <button onClick={() => remove(i)} className="flex items-center justify-center py-2 text-ink-400 hover:text-red-300" aria-label="Remove row">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex h-9 w-full items-center gap-1.5 px-3 text-[12.5px] font-semibold text-brand-300 hover:bg-white/4">
        <Plus size={14} /> Add row
      </button>
    </div>
  )
}
