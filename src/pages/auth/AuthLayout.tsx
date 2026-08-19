import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import Logo, { LogoMark } from '@/components/Logo'

const feed = [
  { sev: 'CRIT', text: 'password_hash exposed · POST /v1/auth/login', c: 'text-red-300 bg-red-500/15 ring-red-500/30' },
  { sev: 'HIGH', text: 'CORS wildcard on authenticated route', c: 'text-orange-300 bg-orange-500/15 ring-orange-500/30' },
  { sev: 'FIX', text: 'Set-Cookie: HttpOnly; Secure; SameSite=Lax', c: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30' },
  { sev: 'MED', text: 'JWT ttl 365d → recommend 15m + refresh', c: 'text-amber-300 bg-amber-500/15 ring-amber-500/30' },
  { sev: 'HIGH', text: 'GraphQL introspection enabled · acme-shop.dev', c: 'text-orange-300 bg-orange-500/15 ring-orange-500/30' },
  { sev: 'INFO', text: 'Report RPT-2041 exported · 9 pages', c: 'text-ink-200 bg-white/8 ring-white/15' },
  { sev: 'LOW', text: 'Server banner nginx/1.18.0 disclosed', c: 'text-sky-300 bg-sky-500/15 ring-sky-500/30' },
]

export default function AuthLayout() {
  const { pathname } = useLocation()
  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper lg:grid-cols-12">
      {/* form column */}
      <div className="relative flex flex-col px-5 py-6 sm:px-10 lg:col-span-6 xl:col-span-5">
        <div className="flex items-center justify-between">
          <Logo />
          <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 hover:text-ink-900">
            <ArrowLeft size={15} /> Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p className="font-mono text-[11px] text-ink-400">© {new Date().getFullYear()} DGS · Only test what you're authorised to test.</p>
      </div>

      {/* showcase column */}
      <aside className="relative hidden overflow-hidden bg-ink-900 text-white lg:col-span-6 lg:block xl:col-span-7">
        <div className="pointer-events-none absolute inset-0 bg-grid-ink mask-fade-y" />
        <div className="pointer-events-none absolute -right-40 top-1/3 h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(147_51_201/.35),transparent)] blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div>
            <p className="eyebrow text-ink-300">Live from the engine</p>
            <h2 className="display mt-4 max-w-md text-[40px] xl:text-[52px]">
              Every response has a <i className="text-brand-300">tell.</i>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-200">
              Sign in to fire requests, hand them to the AI Engine and export the report — the same three moves,
              every time.
            </p>
          </div>

          <LiveFeed />

          <div className="flex items-center gap-4 border-t border-white/10 pt-6">
            <LogoMark size={40} />
            <div>
              <div className="text-[13px] font-semibold">Digital Guard System</div>
              <div className="font-mono text-[11px] text-ink-300">AI-powered threat intelligence for APIs & web</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

function LiveFeed() {
  const [items, setItems] = useState(feed.slice(0, 5))
  const [i, setI] = useState(5)
  useEffect(() => {
    const t = window.setInterval(() => {
      setItems((prev) => [feed[i % feed.length], ...prev.slice(0, 4)])
      setI((v) => v + 1)
    }, 2400)
    return () => window.clearInterval(t)
  }, [i])
  return (
    <div className="my-8 rounded-2xl bg-ink-800/80 p-4 ring-1 ring-white/10 backdrop-blur">
      <div className="mb-3 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-300">
        <span>Findings stream</span>
        <span className="flex items-center gap-1.5 text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
        </span>
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((f, idx) => (
            <motion.li
              key={f.text + idx}
              layout
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1 - idx * 0.15, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 rounded-lg bg-ink-900 px-3 py-2 ring-1 ring-white/6"
            >
              <span className={`w-11 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold ring-1 ${f.c}`}>{f.sev}</span>
              <span className="truncate font-mono text-[12px] text-ink-100">{f.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
