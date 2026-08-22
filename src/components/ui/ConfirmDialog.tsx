'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface ConfirmOptions {
  title: string
  /** One or two sentences saying plainly what is about to happen. */
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button, for anything destructive or hard to undo. */
  tone?: 'danger' | 'default'
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal confirmation for actions the user cannot simply undo.
 *
 * Cancel is focused on open, not Confirm — a stray Enter should do nothing
 * rather than complete a destructive action.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
        return
      }
      // Keep focus inside the dialog while it is open.
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => cancelRef.current?.focus(), 40)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm"
            onClick={loading ? undefined : onCancel}
          />
          <div className="pointer-events-none fixed inset-0 z-[125] flex items-center justify-center p-4">
            <motion.div
              ref={panelRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-message"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto w-full max-w-[420px] rounded-2xl bg-ink-800 p-5 text-white shadow-lift ring-1 ring-white/10"
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1',
                    tone === 'danger'
                      ? 'bg-red-500/15 text-red-300 ring-red-500/30'
                      : 'bg-brand-500/15 text-brand-200 ring-brand-500/30',
                  )}
                >
                  <AlertTriangle size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="confirm-title" className="text-[15.5px] font-bold">
                    {title}
                  </h2>
                  <div id="confirm-message" className="mt-1.5 text-[13px] leading-relaxed text-ink-200">
                    {message}
                  </div>
                </div>
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="rounded p-1 text-ink-400 transition hover:text-white disabled:opacity-40"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  ref={cancelRef}
                  variant="ghost"
                  size="sm"
                  className="text-ink-200 hover:bg-white/5 hover:text-white"
                  onClick={onCancel}
                  disabled={loading}
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={tone === 'danger' ? 'danger' : 'primary'}
                  size="sm"
                  loading={loading}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Hook form, for screens with several confirmable actions.
 *
 *   const confirm = useConfirm()
 *   ...
 *   onClick={() => confirm.ask({ title: 'Delete report?', message: '…' }, () => remove(id))}
 *   ...
 *   <confirm.Dialog />
 */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    options: ConfirmOptions
    action: (() => void | Promise<void>) | null
    loading: boolean
  }>({
    open: false,
    options: { title: '', message: '' },
    action: null,
    loading: false,
  })

  const ask = useCallback((options: ConfirmOptions, action: () => void | Promise<void>) => {
    setState({ open: true, options, action, loading: false })
  }, [])

  const cancel = useCallback(() => {
    setState((s) => (s.loading ? s : { ...s, open: false, action: null }))
  }, [])

  const confirm = useCallback(async () => {
    const action = state.action
    if (!action) return
    setState((s) => ({ ...s, loading: true }))
    try {
      await action()
    } finally {
      setState((s) => ({ ...s, open: false, loading: false, action: null }))
    }
  }, [state.action])

  const Dialog = useCallback(
    () => (
      <ConfirmDialog
        open={state.open}
        {...state.options}
        loading={state.loading}
        onConfirm={confirm}
        onCancel={cancel}
      />
    ),
    [state.open, state.options, state.loading, confirm, cancel],
  )

  return { ask, Dialog }
}

export default ConfirmDialog
