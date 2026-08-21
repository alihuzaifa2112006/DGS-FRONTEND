'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Logo from '@/components/Logo'

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="relative flex min-h-screen flex-col bg-ink-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-ink mask-radial" />
      <header className="relative flex h-16 items-center px-6">
        <Logo tone="dark" />
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[12px] uppercase tracking-[0.3em] text-brand-300">
          404 · not found
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="display mt-4 text-[56px] sm:text-[96px]">
          Endpoint <i className="text-brand-300">unreachable.</i>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-3 max-w-md text-[15px] text-ink-200">
          The route you requested returned nothing — which, for once, is the safest possible response.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-8 flex gap-3">
          <Button href="/" leftIcon={<Home size={16} />}>
            Home
          </Button>
          <Button variant="white" onClick={() => router.back()} leftIcon={<ArrowLeft size={16} />}>
            Go back
          </Button>
        </motion.div>
      </main>
    </div>
  )
}
