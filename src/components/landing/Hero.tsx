import { motion } from 'motion/react'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import HeroIllustration from './HeroIllustration'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const } },
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* backdrop: grid + violet wash */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-paper mask-radial" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(147_51_201/.18),transparent)] blur-2xl" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-20">
        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-6">
          <motion.p variants={item} className="eyebrow mb-5 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-brand-500" />
            API security · AI engine · PDF reports
          </motion.p>

          <motion.h1 variants={item} className="display text-balance text-[44px] text-ink-900 sm:text-[60px] lg:text-[72px]">
            Send the request.
            <br />
            Let the AI tell you <i>where it breaks.</i>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-500">
            DGS is a Postman-style workspace with a security brain. Fire any API call, hand the response to
            the AI Engine, and get every weakness ranked, explained and fixed — then export it as an
            audit-ready PDF. Point it at a whole website too.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" to="/signup" rightIcon={<ArrowRight size={17} />}>
              Start guarding for free
            </Button>
            <Button size="lg" variant="outline" href="#console" leftIcon={<PlayCircle size={18} className="text-brand-600" />}>
              See the console
            </Button>
          </motion.div>

          <motion.ul variants={item} className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-ink-900/8 pt-6">
            {[
              ['< 5s', 'to first finding'],
              ['OWASP', 'API Top-10 mapped'],
              ['PDF', 'audit-ready export'],
            ].map(([k, v]) => (
              <li key={k}>
                <div className="font-display text-[26px] leading-none text-ink-900">{k}</div>
                <div className="mt-1 text-xs text-ink-400">{v}</div>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <div className="lg:col-span-6">
          <HeroIllustration />
        </div>
      </div>
    </section>
  )
}
