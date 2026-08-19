export interface Session {
  email?: string
  name?: string
  at?: number
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem('dgs.session')
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('dgs.session')
}
