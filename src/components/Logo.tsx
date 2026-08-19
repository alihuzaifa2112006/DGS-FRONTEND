import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/**
 * DGS wordmark. `tone` picks the text colour for light (paper) or dark (ink) surfaces.
 * The mark is an inline SVG (shield + reticle) that mirrors the favicon.
 */
export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dgs-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B26BE6" />
          <stop offset="1" stopColor="#7C25AD" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0E0B18" />
      <path d="M32 9 L50 16 V31 C50 43 42 51 32 56 C22 51 14 43 14 31 V16 Z" fill="url(#dgs-mark-g)" />
      <path d="M32 15 L45 20 V31 C45 40 39 46 32 50 C25 46 19 40 19 31 V20 Z" fill="#0E0B18" opacity="0.92" />
      <circle cx="32" cy="32" r="8" fill="none" stroke="#E9D5FF" strokeWidth="2" />
      <circle cx="32" cy="32" r="3.2" fill="#E9D5FF" />
      <path d="M32 20 V24 M32 40 V44 M20 32 H24 M40 32 H44" stroke="#E9D5FF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({
  tone = 'light',
  to = '/',
  compact = false,
  className,
}: {
  tone?: 'light' | 'dark'
  to?: string
  compact?: boolean
  className?: string
}) {
  const dark = tone === 'dark'
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2.5', className)} aria-label="DGS home">
      <span className="relative">
        <LogoMark size={34} className="transition-transform duration-500 group-hover:rotate-[-6deg]" />
        <span className="absolute -inset-1 -z-10 rounded-2xl bg-brand-500/0 blur-md transition group-hover:bg-brand-500/30" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={cn('block font-extrabold tracking-tight text-[17px]', dark ? 'text-white' : 'text-ink-900')}>
            DGS
          </span>
          <span className={cn('block font-mono text-[9.5px] uppercase tracking-[0.22em]', dark ? 'text-ink-200' : 'text-ink-400')}>
            Digital Guard
          </span>
        </span>
      )}
    </Link>
  )
}
