import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: ReactNode
  error?: string
  icon?: ReactNode
  tone?: 'light' | 'dark'
}

/** Text input with floating label rail — used on auth + settings screens. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, icon, className, id, type, tone = 'light', ...props },
  ref,
) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  const inputId = id ?? props.name
  const dark = tone === 'dark'
  return (
    <label htmlFor={inputId} className={cn('block', className)}>
      {label && (
        <span className={cn('mb-1.5 flex items-center justify-between text-[13px] font-semibold', dark ? 'text-ink-100' : 'text-ink-700')}>
          {label}
          {hint && <span className={cn('font-normal text-xs', dark ? 'text-ink-300' : 'text-ink-400')}>{hint}</span>}
        </span>
      )}
      <span
        className={cn(
          'group flex h-11 items-center gap-2 rounded-lg px-3 transition-all',
          dark
            ? 'bg-ink-800 hairline-ink focus-within:bg-ink-700 focus-within:shadow-[0_0_0_2px_rgb(147_51_201/.5)]'
            : 'bg-white hairline focus-within:shadow-[inset_0_0_0_1px_rgb(147_51_201),0_0_0_3px_rgb(147_51_201/.15)]',
          error && 'shadow-[inset_0_0_0_1px_rgb(220_38_38)]',
        )}
      >
        {icon && <span className={cn('shrink-0', dark ? 'text-ink-300' : 'text-ink-400')}>{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={isPw && show ? 'text' : type}
          className={cn(
            'h-full w-full bg-transparent text-sm outline-none placeholder:text-ink-300',
            dark ? 'text-white' : 'text-ink-900',
          )}
          {...props}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className={cn('shrink-0 rounded p-1 transition', dark ? 'text-ink-300 hover:text-white' : 'text-ink-400 hover:text-ink-900')}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </span>
      {error && <span className="mt-1.5 block text-xs text-crit">{error}</span>}
    </label>
  )
})

export default Field
