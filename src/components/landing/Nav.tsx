'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const links = [
  { label: 'How it works', href: '/#how' },
  { label: 'Console', href: '/#console' },
  { label: 'Website scan', href: '/#website' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Help', href: '/help' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* announcement rail */}
      <div className="relative z-50 bg-ink-900 text-[12px] text-ink-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <p className="truncate">
            <span className="mr-2 inline-flex h-4 items-center rounded-sm bg-brand-500 px-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
              New
            </span>
            AI Engine v2 now explains <em className="font-display not-italic text-white">why</em> an endpoint is weak — not just that it is.
          </p>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <Link href="/login" className="hover:text-white">Log in</Link>
            <span className="text-ink-500">/</span>
            <Link href="/help" className="hover:text-white">Help center</Link>
          </div>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-300',
          scrolled ? 'bg-paper/85 backdrop-blur-md shadow-[0_1px_0_rgb(20_12_40/.08)]' : 'bg-transparent',
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="group relative rounded-md px-3 py-2 text-[13.5px] font-semibold text-ink-700 transition hover:text-ink-900"
                >
                  {l.label}
                  <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-brand-600 transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="ghost" size="sm" href="/login">
              Log in
            </Button>
            <Button size="sm" href="/signup" rightIcon={<ArrowUpRight size={15} />}>
              Launch console
            </Button>
          </div>

          <button
            className="rounded-md p-2 text-ink-800 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-full border-t border-ink-900/8 bg-paper/95 backdrop-blur-lg lg:hidden"
            >
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
                <ul className="divide-y divide-ink-900/8">
                  {links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} onClick={() => setOpen(false)} className="flex items-center justify-between py-3 text-[15px] font-semibold text-ink-800">
                        {l.label}
                        <ArrowUpRight size={16} className="text-ink-400" />
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" href="/login">Log in</Button>
                  <Button href="/signup">Launch console</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
