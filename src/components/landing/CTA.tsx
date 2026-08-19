import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-14 text-center text-white ring-1 ring-white/10 sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-grid-ink mask-radial" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(147_51_201/.45),transparent)] blur-2xl" />
          {/* orbiting dots */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0">
            {[160, 230, 300].map((r, i) => (
              <span
                key={r}
                className="absolute h-2 w-2 rounded-full bg-brand-300/80 animate-orbit"
                style={{ ['--orbit-r' as string]: `${r}px`, animationDuration: `${12 + i * 6}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}
              />
            ))}
          </div>
          <div className="relative">
            <p className="eyebrow mb-4 text-ink-300">Get started</p>
            <h2 className="display mx-auto max-w-2xl text-[38px] sm:text-[56px]">
              Your API is already <i className="text-brand-300">talking</i> to attackers. Hear it first.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] text-ink-200">
              Free tier, no card. Your first finding usually lands within a minute of signing up.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" to="/signup" rightIcon={<ArrowRight size={17} />}>
                Create free account
              </Button>
              <Button size="lg" variant="white" to="/login">
                I have an account
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
