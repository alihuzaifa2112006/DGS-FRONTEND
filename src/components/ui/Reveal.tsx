import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

const variants: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(4px)' },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.75, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
}

/** Scroll-triggered fade/lift wrapper. `index` staggers siblings. */
export function Reveal({
  children,
  index = 0,
  className,
  once = true,
  as = 'div',
}: {
  children: ReactNode
  index?: number
  className?: string
  once?: boolean
  as?: 'div' | 'section' | 'li' | 'span' | 'p' | 'h1' | 'h2' | 'h3'
}) {
  const M = motion[as] as typeof motion.div
  return (
    <M
      className={className}
      variants={variants}
      custom={index}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-10% 0px -10% 0px' }}
    >
      {children}
    </M>
  )
}

export default Reveal
