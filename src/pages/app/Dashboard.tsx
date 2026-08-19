import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, SendHorizontal, Globe, FileText, TrendingUp, ShieldAlert, Sparkles, Clock } from 'lucide-react'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { MethodChip } from '@/components/app/SeverityBadge'
import { sampleReports } from '@/lib/mock'
import { getSession } from '@/lib/session'
import { cn, timeAgo } from '@/lib/utils'

const trend = [38, 41, 40, 47, 52, 55, 61, 58, 66, 71, 74, 79]
const sevCounts = [
  { k: 'Critical', n: 3, c: 'bg-red-400' },
  { k: 'High', n: 9, c: 'bg-orange-400' },
  { k: 'Medium', n: 14, c: 'bg-amber-400' },
  { k: 'Low', n: 11, c: 'bg-sky-400' },
]
const total = sevCounts.reduce((a, b) => a + b.n, 0)

export default function Dashboard() {
  const s = getSession()
  const first = (s?.name || s?.email || '').split(/[\s@]/)[0]
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-ink-300">{greet}</p>
          <h1 className="display mt-1 text-[32px] sm:text-[40px]">
            {first ? `${first}, your` : 'Your'} surface is <i className="text-brand-300">79 / 100</i> today.
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/app/api-tester" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-[13.5px] font-semibold hover:bg-brand-500">
            <SendHorizontal size={15} /> New request
          </Link>
          <Link to="/app/website-scan" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/6 px-4 text-[13.5px] font-semibold ring-1 ring-white/10 hover:bg-white/10">
            <Globe size={15} /> Scan website
          </Link>
        </div>
      </div>

      {/* stat tiles */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: 'Requests analysed', v: '128', d: '+12 this week', i: Sparkles },
          { l: 'Open findings', v: '37', d: '3 critical', i: ShieldAlert, warn: true },
          { l: 'Reports exported', v: '19', d: '2 today', i: FileText },
          { l: 'Avg. time to fix', v: '1.8d', d: '↓ 0.6d vs last month', i: Clock },
        ].map((t, idx) => (
          <motion.div
            key={t.l}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-xl bg-ink-800 p-4 ring-1 ring-white/8"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-300">{t.l}</span>
              <t.i size={15} className={t.warn ? 'text-orange-300' : 'text-brand-300'} />
            </div>
            <div className="mt-2 font-display text-[34px] leading-none">{t.v}</div>
            <div className={cn('mt-1.5 text-[12px]', t.warn ? 'text-orange-300' : 'text-ink-300')}>{t.d}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* trend */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl bg-ink-800 p-5 ring-1 ring-white/8 lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold">Security score · last 12 analyses</h2>
              <p className="mt-0.5 text-[12.5px] text-ink-300">Higher is safer. Score climbs as fixes are re-verified.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 font-mono text-[11px] text-emerald-300 ring-1 ring-emerald-500/30">
              <TrendingUp size={12} /> +41
            </span>
          </div>
          <Sparkline data={trend} />
        </motion.section>

        {/* severity mix */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl bg-ink-800 p-5 ring-1 ring-white/8 lg:col-span-4">
          <h2 className="text-[15px] font-bold">Open findings by severity</h2>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/6">
            {sevCounts.map((s, i) => (
              <motion.span
                key={s.k}
                initial={{ width: 0 }}
                animate={{ width: `${(s.n / total) * 100}%` }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={cn('h-full', s.c)}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {sevCounts.map((s) => (
              <li key={s.k} className="flex items-center gap-3 text-[13px]">
                <span className={cn('h-2 w-2 rounded-full', s.c)} />
                <span className="flex-1 text-ink-100">{s.k}</span>
                <span className="font-mono text-ink-300">{s.n}</span>
              </li>
            ))}
          </ul>
          <Link to="/app/reports" className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-300 hover:text-brand-200">
            View all findings <ArrowUpRight size={14} />
          </Link>
        </motion.section>

        {/* recent */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/8 lg:col-span-12">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <h2 className="text-[15px] font-bold">Recent analyses</h2>
            <Link to="/app/reports" className="text-[13px] font-semibold text-brand-300 hover:text-brand-200">
              All reports →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="font-mono text-[10.5px] uppercase tracking-wider text-ink-300">
                <tr className="[&>th]:px-5 [&>th]:py-2.5 [&>th]:font-medium">
                  <th>Target</th>
                  <th>Type</th>
                  <th>Findings</th>
                  <th>Score</th>
                  <th>When</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {sampleReports.slice(0, 5).map((r) => (
                  <tr key={r.id} className="transition hover:bg-white/3 [&>td]:px-5 [&>td]:py-3">
                    <td>
                      <div className="flex items-center gap-2">
                        {r.type === 'api' ? <MethodChip method={r.target.split(' ')[0]} /> : <Globe size={14} className="text-ink-300" />}
                        <span className="font-mono text-[12.5px] text-ink-100">{r.type === 'api' ? r.target.split(' ')[1] : r.target}</span>
                      </div>
                    </td>
                    <td className="capitalize text-ink-200">{r.type}</td>
                    <td>
                      <span className="text-ink-100">{r.findings}</span>
                      {r.critical > 0 && <span className="ml-2 rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[10px] text-red-300 ring-1 ring-red-500/30">{r.critical} crit</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ScoreRing value={r.score} size={30} stroke={3} />
                      </div>
                    </td>
                    <td className="text-ink-300">{timeAgo(r.createdAt)}</td>
                    <td className="text-right">
                      <Link to="/app/reports" className="text-brand-300 hover:text-brand-200">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

function Sparkline({ data }: { data: number[] }) {
  const w = 600
  const h = 160
  const pad = 8
  const max = 100
  const step = (w - pad * 2) / (data.length - 1)
  const pts = data.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${d} L${pts[pts.length - 1][0]} ${h - pad} L${pts[0][0]} ${h - pad} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-40 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9333c9" stopOpacity=".45" />
          <stop offset="1" stopColor="#9333c9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={h - pad - (g / 100) * (h - pad * 2)} y2={h - pad - (g / 100) * (h - pad * 2)} stroke="rgba(255,255,255,.06)" strokeDasharray="3 5" />
      ))}
      <motion.path d={area} fill="url(#spark-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} />
      <motion.path d={d} fill="none" stroke="#c48ee6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} />
      {pts.map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4.5 : 2.5} fill={i === pts.length - 1 ? '#fff' : '#c48ee6'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }} />
      ))}
    </svg>
  )
}
