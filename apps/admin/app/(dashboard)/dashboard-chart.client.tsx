'use client'

import { useRef, useState } from 'react'
import { formatCurrency } from '@workspace/lib'
import type { OverviewDay } from '@/lib/analytics/overview.types'
import { useContainerSize } from './_components/charts/use-container-size'

const HEIGHT = 280
const PAD = { left: 48, right: 8, top: 10, bottom: 26 }

function compact (value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1)}M`
  if (value >= 1e3) return `${Math.round(value / 1e3)}k`
  return String(Math.round(value))
}

function dayLabel (date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC'
  })
}

/**
 * GMV (area) against platform fees (bars) per Cairo day. Fees are drawn on
 * their own scale (right-hand axis) since they are a tiny share of GMV.
 */
export function GmvFeesChart ({ days }: { days: OverviewDay[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useContainerSize(ref)?.width ?? 0
  const [hover, setHover] = useState<number | null>(null)

  const W = Math.max(width, 320)
  const n = days.length
  const innerW = W - PAD.left - PAD.right
  const gmvMax = Math.max(1, ...days.map((d) => d.gmv)) * 1.12
  const feeMax = Math.max(1, ...days.map((d) => d.fees)) * 1.12 * 3
  const X = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const Y = (v: number, max: number) => PAD.top + (1 - v / max) * (HEIGHT - PAD.top - PAD.bottom)
  const base = Y(0, 1)

  const line = days.map((d, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(d.gmv, gmvMax).toFixed(1)}`).join('')
  const area = n > 0 ? `${line}L${X(n - 1)},${base}L${X(0)},${base}Z` : ''
  const barW = Math.max(2, (innerW / Math.max(n, 1)) * 0.5)
  const ticks = n <= 7 ? n : 6
  const active = hover == null ? null : days[hover]

  const onMove = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.ownerSVGElement!.getBoundingClientRect()
    const i = Math.round(((event.clientX - rect.left - PAD.left) / innerW) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  return (
    <div ref={ref} className="relative mt-2 h-[280px]">
      {width > 0 && n > 0 && (
        <svg viewBox={`0 0 ${W} ${HEIGHT}`} className="h-full w-full overflow-visible" role="img" aria-label="GMV and platform fees per day">
          <defs>
            <linearGradient id="gmv-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity=".28" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((step) => {
            const y = Y((gmvMax / 4) * step, gmvMax)
            return (
              <g key={step}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--border)" strokeDasharray={step ? '3 4' : undefined} />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--faint)">
                  {compact((gmvMax / 4) * step)}
                </text>
              </g>
            )
          })}
          {Array.from({ length: ticks }, (_, t) => {
            const i = Math.round((t / Math.max(ticks - 1, 1)) * (n - 1))
            return (
              <text key={t} x={X(i)} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fill="var(--faint)">
                {dayLabel(days[i]!.date)}
              </text>
            )
          })}
          {days.map((d, i) => d.fees > 0 && (
            <rect
              key={d.date}
              x={X(i) - barW / 2}
              y={Y(d.fees, feeMax)}
              width={barW}
              height={base - Y(d.fees, feeMax)}
              rx="1.5"
              fill="var(--accent)"
              opacity=".85"
            />
          ))}
          <path d={area} fill="url(#gmv-fill)" />
          <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" />
          {active && hover != null && (
            <>
              <line x1={X(hover)} x2={X(hover)} y1={PAD.top} y2={base} stroke="var(--border)" />
              <circle cx={X(hover)} cy={Y(active.gmv, gmvMax)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
            </>
          )}
          <rect
            x={PAD.left}
            y={0}
            width={innerW}
            height={HEIGHT}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}
      {active && hover != null && (
        <div
          className="pointer-events-none absolute rounded-lg border bg-popover px-2.5 py-2 text-xs whitespace-nowrap shadow-lg"
          style={{ left: Math.min(X(hover) + 12, W - 190), top: Math.max(0, Y(active.gmv, gmvMax) - 70) }}
        >
          <b className="mb-0.5 block">{dayLabel(active.date)}</b>
          GMV {formatCurrency(active.gmv)}
          <br />
          Fees {formatCurrency(active.fees)} · {active.orders.toLocaleString('en-US')} orders
        </div>
      )}
    </div>
  )
}
