import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  LayoutDashboard,
  SendHorizontal,
  Globe,
  FileText,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import Logo, { LogoMark } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { getSession, clearSession, type Session } from '@/lib/session'

const nav = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/api-tester', label: 'API Tester', icon: SendHorizontal, kbd: '1' },
  { to: '/app/website-scan', label: 'Website Scan', icon: Globe, kbd: '2' },
  { to: '/app/reports', label: 'Reports', icon: FileText, kbd: '3' },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const titles: Record<string, string> = {
  '/app': 'Overview',
  '/app/api-tester': 'API Tester',
  '/app/website-scan': 'Website Scan',
  '/app/reports': 'Reports',
  '/app/settings': 'Settings',
}

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const session = getSession()

  // keyboard shortcuts: g then 1/2/3 would be nicer, keep simple: Alt+1..3
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!e.altKey) return
      const item = nav.find((n) => n.kbd === e.key)
      if (item) navigate(item.to)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [navigate])

  const logout = () => {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-ink-900 text-white">
      {/* ── sidebar (desktop) ── */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-white/8 bg-ink-950/60 lg:flex">
        <SidebarContent onLogout={logout} session={session} onNavigate={() => {}} />
      </aside>

      {/* ── sidebar (mobile drawer) ── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-white/8 bg-ink-950 lg:hidden"
            >
              <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-md p-1.5 text-ink-300 hover:text-white" aria-label="Close menu">
                <X size={18} />
              </button>
              <SidebarContent onLogout={logout} session={session} onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── main ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/8 bg-ink-900/80 px-4 backdrop-blur-md sm:px-6">
          <button className="rounded-md p-1.5 text-ink-200 hover:bg-white/5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <Link to="/app" className="lg:hidden">
            <LogoMark size={26} />
          </Link>
          <nav className="hidden items-center gap-1.5 text-[13px] sm:flex" aria-label="Breadcrumb">
            <span className="text-ink-300">Console</span>
            <ChevronRight size={14} className="text-ink-400" />
            <span className="font-semibold text-white">{titles[pathname] ?? 'Console'}</span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden h-9 w-64 items-center gap-2 rounded-md bg-ink-800 px-3 text-[13px] text-ink-300 ring-1 ring-white/8 md:flex">
              <Search size={14} />
              <span className="flex-1">Search requests, reports…</span>
              <kbd className="rounded bg-white/5 px-1.5 font-mono text-[10px] text-ink-300">⌘K</kbd>
            </div>
            <button className="relative rounded-md p-2 text-ink-200 hover:bg-white/5" aria-label="Notifications">
              <Bell size={17} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-400" />
            </button>
            <Link
              to="/app/api-tester"
              className="hidden h-9 items-center gap-1.5 rounded-md bg-brand-600 px-3 text-[13px] font-semibold hover:bg-brand-500 sm:inline-flex"
            >
              <Sparkles size={14} /> New analysis
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ onLogout, session, onNavigate }: { onLogout: () => void; session: Session | null; onNavigate: () => void }) {
  const initials = (session?.name || session?.email || 'DG').slice(0, 2).toUpperCase()
  return (
    <>
      <div className="flex h-14 items-center border-b border-white/8 px-4">
        <Logo tone="dark" to="/app" />
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="eyebrow mb-2 px-2 text-ink-400">Workspace</p>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center gap-3 rounded-md px-3 text-[13.5px] font-medium transition',
                isActive ? 'bg-white/6 text-white' : 'text-ink-200 hover:bg-white/4 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-pill" className="absolute left-0 top-2 h-6 w-0.5 rounded-r bg-brand-400" />}
                <n.icon size={17} className={cn(isActive ? 'text-brand-300' : 'text-ink-300 group-hover:text-ink-100')} />
                {n.label}
                {n.kbd && <kbd className="ml-auto rounded bg-white/5 px-1.5 font-mono text-[10px] text-ink-400">⌥{n.kbd}</kbd>}
              </>
            )}
          </NavLink>
        ))}

        <p className="eyebrow mb-2 mt-6 px-2 text-ink-400">Support</p>
        <Link to="/help" onClick={onNavigate} className="flex h-10 items-center gap-3 rounded-md px-3 text-[13.5px] font-medium text-ink-200 hover:bg-white/4 hover:text-white">
          <LifeBuoy size={17} className="text-ink-300" /> Help center
        </Link>
      </nav>

      {/* usage card */}
      <div className="mx-3 mb-3 rounded-xl bg-ink-800 p-3 ring-1 ring-white/8">
        <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-wider text-ink-300">
          <span>AI analyses</span>
          <span className="text-white">31 / 50</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
          <motion.div initial={{ width: 0 }} animate={{ width: '62%' }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300" />
        </div>
        <Link to="/#pricing" className="mt-2 inline-block text-[12px] font-semibold text-brand-300 hover:text-brand-200">
          Upgrade to Pro →
        </Link>
      </div>

      <div className="flex items-center gap-3 border-t border-white/8 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold">{initials}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{session?.name || 'Guest user'}</div>
          <div className="truncate font-mono text-[10.5px] text-ink-300">{session?.email || 'not signed in'}</div>
        </div>
        <button onClick={onLogout} className="rounded-md p-1.5 text-ink-300 hover:bg-white/5 hover:text-white" aria-label="Log out" title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </>
  )
}
