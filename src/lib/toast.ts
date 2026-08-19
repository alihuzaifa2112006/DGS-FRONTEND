export type ToastKind = 'success' | 'error' | 'info'
export interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  body?: string
}

type Listener = (t: ToastItem) => void
const listeners = new Set<Listener>()
let seq = 0

export function subscribeToasts(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function toast(title: string, opts: { kind?: ToastKind; body?: string } = {}) {
  const t: ToastItem = { id: ++seq, kind: opts.kind ?? 'info', title, body: opts.body }
  listeners.forEach((l) => l(t))
}
