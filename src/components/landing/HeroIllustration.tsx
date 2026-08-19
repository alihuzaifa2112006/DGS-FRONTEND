import { motion } from 'motion/react'

/**
 * Animated hero scene: request → shield (AI engine) → report.
 * Pure SVG + CSS keyframes, no raster assets, so it stays crisp and themable.
 */
export default function HeroIllustration() {
  const threats = [
    { label: 'SQLi', delay: 0, y: 96 },
    { label: 'XSS', delay: 2.1, y: 424 },
    { label: 'IDOR', delay: 4.2, y: 124 },
    { label: 'CSRF', delay: 6.3, y: 452 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="relative mx-auto w-full max-w-[680px] [perspective:1200px]"
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_45%,rgb(147_51_201/.35),transparent_70%)] blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl bg-ink-900 shadow-lift ring-1 ring-white/10">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-[11px] text-ink-300">dgs://console/api-tester</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            engine live
          </span>
        </div>

        <div className="relative bg-grid-ink">
          <svg viewBox="0 0 680 520" className="block h-auto w-full" role="img" aria-label="Request flows into the DGS AI engine and comes out as a security report">
            <defs>
              <linearGradient id="h-flow" x1="0" x2="1">
                <stop offset="0" stopColor="#9333c9" stopOpacity="0.1" />
                <stop offset="0.5" stopColor="#c48ee6" />
                <stop offset="1" stopColor="#9333c9" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="h-core" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#c48ee6" stopOpacity="0.9" />
                <stop offset="0.5" stopColor="#7c25ad" stopOpacity="0.35" />
                <stop offset="1" stopColor="#7c25ad" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="h-shield" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#c48ee6" />
                <stop offset="1" stopColor="#7c25ad" />
              </linearGradient>
              <linearGradient id="h-sweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#c48ee6" stopOpacity="0" />
                <stop offset="1" stopColor="#c48ee6" stopOpacity="0.55" />
              </linearGradient>
              <filter id="h-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="h-req-clip"><rect x="24" y="150" width="200" height="220" rx="12" /></clipPath>
            </defs>

            {/* ── flow lines ── */}
            <g fill="none" strokeWidth="1.5" strokeLinecap="round">
              <path d="M224 260 C 270 260, 275 260, 300 260" stroke="rgba(255,255,255,.08)" />
              <path d="M224 260 C 270 260, 275 260, 300 260" stroke="url(#h-flow)" strokeDasharray="6 6" className="animate-dash" />
              <path d="M380 260 C 405 260, 410 260, 456 260" stroke="rgba(255,255,255,.08)" />
              <path d="M380 260 C 405 260, 410 260, 456 260" stroke="url(#h-flow)" strokeDasharray="6 6" className="animate-dash" style={{ animationDelay: '-.8s' }} />
            </g>

            {/* ── request card (left) ── */}
            <g>
              <rect x="24" y="150" width="200" height="220" rx="12" fill="#15111f" stroke="rgba(255,255,255,.1)" />
              <rect x="24" y="150" width="200" height="34" rx="12" fill="#1c1728" />
              <rect x="24" y="172" width="200" height="12" fill="#1c1728" />
              <rect x="38" y="160" width="40" height="14" rx="3" fill="#f59e0b" opacity=".9" />
              <text x="58" y="170.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="600" fill="#0b0814">POST</text>
              <text x="86" y="171" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#d8d3e3">/v1/auth/login</text>
              {/* body lines */}
              <g fontFamily="JetBrains Mono, monospace" fontSize="8.5">
                <text x="38" y="206" fill="#7b7290">{'{'}</text>
                <text x="48" y="222" fill="#c48ee6">"email"<tspan fill="#7b7290">: </tspan><tspan fill="#a5f3c8">"sara@acme.dev"</tspan></text>
                <text x="48" y="238" fill="#c48ee6">"password"<tspan fill="#7b7290">: </tspan><tspan fill="#a5f3c8">"••••••••"</tspan></text>
                <text x="48" y="254" fill="#c48ee6">"remember"<tspan fill="#7b7290">: </tspan><tspan fill="#fbbf24">true</tspan></text>
                <text x="38" y="270" fill="#7b7290">{'}'}</text>
              </g>
              <line x1="38" y1="286" x2="210" y2="286" stroke="rgba(255,255,255,.08)" />
              <text x="38" y="304" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#7b7290">RESPONSE</text>
              <rect x="38" y="312" width="28" height="12" rx="2" fill="rgba(16,185,129,.2)" />
              <text x="52" y="321" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#34d399">200</text>
              <text x="72" y="321" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#aaa2bb">412 ms · 1.9 kB</text>
              <rect x="38" y="334" width="150" height="6" rx="3" fill="rgba(255,255,255,.06)" />
              <rect x="38" y="346" width="110" height="6" rx="3" fill="rgba(255,255,255,.06)" />
              {/* scanning beam over the card */}
              <g clipPath="url(#h-req-clip)">
                <rect x="24" y="150" width="200" height="26" fill="#c48ee6" opacity=".12">
                  <animate attributeName="y" values="130;350;130" dur="3.2s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
                </rect>
                <rect x="24" y="150" width="200" height="1.5" fill="#c48ee6" opacity=".8">
                  <animate attributeName="y" values="156;376;156" dur="3.2s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
                </rect>
              </g>
            </g>

            {/* ── engine core (center) ── */}
            <g transform="translate(340 260)">
              <circle r="118" fill="url(#h-core)" />
              {/* orbit rings */}
              <circle r="92" fill="none" stroke="rgba(255,255,255,.08)" />
              <circle r="66" fill="none" stroke="rgba(255,255,255,.1)" strokeDasharray="2 6" />
              {/* radar sweep */}
              <g>
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
                <path d="M0 0 L92 0 A92 92 0 0 0 65 -65 Z" fill="url(#h-sweep)" opacity=".7" />
                <line x1="0" y1="0" x2="92" y2="0" stroke="#c48ee6" strokeWidth="1.5" />
              </g>
              {/* pulse rings */}
              {[0, 1.2].map((d) => (
                <circle key={d} r="30" fill="none" stroke="#c48ee6" strokeWidth="1.5">
                  <animate attributeName="r" from="30" to="70" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" from=".8" to="0" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" />
                </circle>
              ))}
              {/* shield */}
              <g filter="url(#h-glow)">
                <path d="M0 -44 L34 -31 V-2 C34 20 18 34 0 44 C-18 34 -34 20 -34 -2 V-31 Z" fill="url(#h-shield)" />
                <path d="M0 -33 L24 -24 V-2 C24 14 12 25 0 32 C-12 25 -24 14 -24 -2 V-24 Z" fill="#0e0b18" opacity=".9" />
                <circle r="9" fill="none" stroke="#e9d5ff" strokeWidth="2" />
                <circle r="3.4" fill="#e9d5ff" />
                <path d="M0 -14 V-10 M0 10 V14 M-14 0 H-10 M10 0 H14" stroke="#e9d5ff" strokeWidth="2" strokeLinecap="round" />
              </g>
              {/* orbiting nodes */}
              {[0, 120, 240].map((deg, i) => (
                <g key={deg}>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`${deg}`}
                    to={`${i % 2 ? deg - 360 : deg + 360}`}
                    dur="11s"
                    repeatCount="indefinite"
                  />
                  <circle cx="92" cy="0" r="4" fill="#0e0b18" stroke="#c48ee6" strokeWidth="1.5" />
                </g>
              ))}
              <text y="120" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2" fill="#aaa2bb">AI ENGINE</text>
            </g>

            {/* ── threats flying in and getting blocked ── */}
            {threats.map((t) => (
              <g key={t.label} style={{ animation: `dgs-threat 8.4s ${t.delay}s ease-in infinite`, ['--ty' as string]: `${Math.round((260 - t.y) * 0.8)}px` }}>
                <g transform={`translate(0 ${t.y})`}>
                  <rect x="-2" y="-9" width="46" height="18" rx="9" fill="rgba(220,38,38,.18)" stroke="rgba(248,113,113,.7)" />
                  <text x="21" y="3.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="600" fill="#fca5a5">{t.label}</text>
                </g>
              </g>
            ))}

            {/* ── report card (right) ── */}
            <g>
              <rect x="456" y="120" width="200" height="280" rx="12" fill="#15111f" stroke="rgba(255,255,255,.1)" />
              <text x="472" y="146" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="1.5" fill="#7b7290">SECURITY REPORT</text>
              <text x="472" y="164" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="#fff">auth/login</text>
              {/* score ring */}
              <g transform="translate(600 160)">
                <circle r="26" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
                <circle r="26" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeDasharray="163" strokeDashoffset="163" transform="rotate(-90)">
                  <animate attributeName="stroke-dashoffset" from="163" to="95" begin="1s" dur="1.4s" fill="freeze" calcMode="spline" keySplines=".16 1 .3 1" />
                </circle>
                <text y="4" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" fontWeight="600" fill="#fff">42</text>
              </g>
              {/* finding rows */}
              {[
                { c: '#f87171', w: 130, s: 'CRIT', t: 'password_hash in body' },
                { c: '#fb923c', w: 110, s: 'HIGH', t: 'CORS wildcard' },
                { c: '#fb923c', w: 104, s: 'HIGH', t: 'cookie flags missing' },
                { c: '#fbbf24', w: 88, s: 'MED', t: 'JWT ttl 365d' },
                { c: '#fbbf24', w: 82, s: 'MED', t: 'no rate limit' },
                { c: '#38bdf8', w: 60, s: 'LOW', t: 'server banner' },
              ].map((r, i) => (
                <g key={r.t} transform={`translate(472 ${212 + i * 26})`} opacity="0">
                  <animate attributeName="opacity" from="0" to="1" begin={`${1.2 + i * 0.12}s`} dur="0.6s" fill="freeze" />
                  <rect width="30" height="12" rx="2" fill={r.c} opacity=".18" />
                  <text x="15" y="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="7" fontWeight="600" fill={r.c}>{r.s}</text>
                  <text x="38" y="9.5" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#d8d3e3">{r.t}</text>
                  <rect x="0" y="17" width={r.w} height="3" rx="1.5" fill={r.c} opacity=".55" />
                </g>
              ))}
              {/* fixes chip */}
              <g transform="translate(472 372)">
                <rect width="168" height="18" rx="4" fill="rgba(147,51,201,.2)" stroke="rgba(196,142,230,.4)" />
                <text x="84" y="12" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#e9d5ff">8 fixes suggested · export PDF ↗</text>
              </g>
            </g>

            {/* labels along the flow */}
            <g fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="1.5" fill="#7b7290">
              <text x="262" y="246" textAnchor="middle">SEND</text>
              <text x="418" y="246" textAnchor="middle">EXPLAIN</text>
            </g>

            <style>{`
              @keyframes dgs-threat {
                0%   { transform: translate(-60px, 0); opacity: 0; }
                6%   { opacity: 1; }
                26%  { transform: translate(268px, var(--ty, 0px)); opacity: 1; }
                31%  { transform: translate(282px, var(--ty, 0px)); opacity: 0; }
                100% { transform: translate(282px, var(--ty, 0px)); opacity: 0; }
              }
            `}</style>
          </svg>
        </div>

        {/* status bar */}
        <div className="flex items-center justify-between border-t border-white/8 px-4 py-2 font-mono text-[10.5px] text-ink-300">
          <span>
            <span className="text-brand-300">→</span> 1 request · 8 findings · 42/100
          </span>
          <span className="hidden sm:inline">
            grade <span className="text-amber-400">D</span> · report ready
          </span>
        </div>
      </div>

      {/* floating chips */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.7 }}
        className="absolute -left-4 top-[18%] hidden animate-float rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-ink-800 shadow-lift ring-1 ring-ink-900/8 md:block"
      >
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-crit" />
        Password hash leaked
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.7 }}
        className="absolute -right-4 bottom-[14%] hidden animate-float rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-ink-800 shadow-lift ring-1 ring-ink-900/8 [animation-delay:-3s] md:block"
      >
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-ok" />
        Fix: HttpOnly; Secure; SameSite
      </motion.div>
    </motion.div>
  )
}
