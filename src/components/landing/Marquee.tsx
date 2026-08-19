const items = [
  'SQL Injection',
  'Broken Auth',
  'IDOR',
  'CORS Misconfig',
  'XSS',
  'SSRF',
  'Rate-limit Bypass',
  'JWT Weakness',
  'Sensitive Data Exposure',
  'Open Redirect',
  'Mass Assignment',
  'Security Headers',
]

/** Threat ticker — a quiet, continuous reminder of what the engine looks for. */
export default function Marquee() {
  const row = [...items, ...items]
  return (
    <div className="border-y border-ink-900/8 bg-white/40 py-3">
      <div className="mask-fade-x overflow-hidden">
        <ul className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.16em] text-ink-500 hover:[animation-play-state:paused]">
          {row.map((t, i) => (
            <li key={i} className="flex items-center gap-10">
              <span>{t}</span>
              <span className="h-1 w-1 rounded-full bg-brand-500" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
