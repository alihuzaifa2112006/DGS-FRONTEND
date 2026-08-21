'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { subscribeToasts, type ToastItem } from '@/lib/toast'
import { cn } from '@/lib/utils'

const icons = { success: CheckCircle2, error: AlertTriangle, info: Info }
const tones = {
  success: 'text-emerald-300',
  error: 'text-red-300',
  info: 'text-brand-300',
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])
  useEffect(
    () =>
      subscribeToasts((t) => {
        setItems((p) => [...p, t])
        window.setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), 4200)
      }),
    [],
  )
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence>
        {items.map((t) => {
          const I = icons[t.kind]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl bg-ink-800 p-3.5 text-white shadow-lift ring-1 ring-white/10"
            >
              <I size={18} className={cn('mt-0.5 shrink-0', tones[t.kind])} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{t.title}</div>
                {t.body && <div className="mt-0.5 text-[12.5px] text-ink-200">{t.body}</div>}
              </div>
              <button onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))} className="rounded p-0.5 text-ink-300 hover:text-white" aria-label="Dismiss">
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
