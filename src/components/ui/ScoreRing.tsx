'use client'

import { motion } from 'motion/react'

const scoreColor = (v: number) => (v >= 75 ? '#34d399' : v >= 55 ? '#fbbf24' : '#f87171')

export function ScoreRing({
  value,
  size = 56,
  stroke = 5,
  label,
  track = 'rgba(255,255,255,.08)',
  text = '#fff',
}: {
  value: number
  size?: number
  stroke?: number
  label?: string
  track?: string
  text?: string
}) {
  const r = (size - stroke - 3) / 2
  const c = 2 * Math.PI * r
  const color = scoreColor(value)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * value) / 100 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dy={label ? '0.1em' : '0.36em'} textAnchor="middle" fill={text} fontFamily="JetBrains Mono, monospace" fontSize={size * 0.26} fontWeight="600">
        {value}
      </text>
      {label && (
        <text x="50%" y="50%" dy="1.5em" textAnchor="middle" fill={text} opacity="0.6" fontFamily="JetBrains Mono, monospace" fontSize={size * 0.11}>
          {label}
        </text>
      )}
    </svg>
  )
}

export default ScoreRing
