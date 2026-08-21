'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'ink' | 'ghost' | 'outline' | 'white' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const base =
  'relative inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none rounded-lg transition-all duration-200 ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:pointer-events-none active:translate-y-px'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_1px_0_rgb(255_255_255/.15)_inset,0_8px_20px_-8px_rgb(124_37_173/.6)] hover:bg-brand-500 hover:shadow-[0_1px_0_rgb(255_255_255/.2)_inset,0_12px_28px_-10px_rgb(124_37_173/.7)]',
  ink: 'bg-ink-900 text-white hover:bg-ink-700 shadow-soft',
  ghost: 'bg-transparent hover:bg-ink-900/5 text-ink-700',
  outline: 'bg-white/60 text-ink-900 hairline hover:bg-white',
  white: 'bg-white text-ink-900 hover:bg-paper-2 shadow-soft',
  danger: 'bg-crit text-white hover:bg-red-500',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  icon: 'h-9 w-9 p-0',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Renders the button as a link. Internal paths use next/link, external/mailto use <a>. */
  href?: string
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const isExternal = (href: string) => /^(https?:|mailto:|tel:|#)/.test(href)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', href, loading, leftIcon, rightIcon, children, ...props },
  ref,
) {
  const cls = cn(base, variants[variant], sizes[size], className)
  const inner = (
    <>
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  )

  if (href) {
    return isExternal(href) ? (
      <a href={href} className={cls}>
        {inner}
      </a>
    ) : (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    )
  }

  return (
    <button ref={ref} className={cls} disabled={loading || props.disabled} {...props}>
      {inner}
    </button>
  )
})

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default Button
