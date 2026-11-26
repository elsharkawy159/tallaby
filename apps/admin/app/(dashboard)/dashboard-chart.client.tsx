'use client'

import { useRef, useState } from 'react'
import { formatCurrency } from '@workspace/lib'
import type { OverviewPoint } from '@/lib/analytics/overview.types'
import { useContainerSize } from './_components/charts/use-container-size'

const PAD = { left: 48, right: 8, top: 10, bottom: 26 }

function compact (value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1)}M`
  if (value >= 1e3) return `${Math.round(value / 1e3)}k`
  return String(Math.round(value))
}

/** Up to `max` evenly spaced bucket indexes for the x-axis labels. */
function tickIndexes (n: number, max: number): number[] {
  if (n <= 0) return []
  if (n <= max) return Array.from({ length: n }, (_, i) => i)
  return Array.from({ length: max }, (_, t) => Math.round((t / (max - 1)) * (n - 1)))
}

/** Short axis text: "Week of Nov 03" → "Nov 03". */
const axisLabel = (label: string) => label.replace(/^Week of /, '')

/** The bucket under the pointer, for charts whose buckets are evenly spaced slots. */
function slotAt (event: React.MouseEvent<SVGRectElement>, innerW: number, n: number, centred: boolean) {
  const rect = event.currentTarget.ownerSVGElement!.getBoundingClientRect()
  const x = event.clientX - rect.left - PAD.left
  const i = centred ? Math.floor((x / innerW) * n) : Math.round((x / innerW) * (n - 1))
  return Math.max(0, Math.min(n - 1, i))
}

function Tooltip ({ left, top, width, children }: { left: number, top: number, width: number, children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border bg-popover px-2.5 py-2 text-xs whitespace-nowrap shadow-lg tabular-nums"
      style={{ left: Math.max(0, Math.min(left + 12, width - 200)), top: Math.max(0, top) }}
    >
      {children}
    </div>
  )
}

/**
 * GMV (area) against platform fees (bars) per bucket (an hour, a day or a
 * week). Fees are drawn on their own, taller scale since they are a tiny share of GMV.
 */
export function GmvFeesChart ({ points }: { points: OverviewPoint[] }) {
  const HEIGHT = 280
  const ref = useRef<HTMLDivElement>(null)
  const width = useContainerSize(ref)?.width ?? 0
  const [hover, setHover] = useState<number | null>(null)

  const W = Math.max(width, 320)
  const n = points.length
  const innerW = W - PAD.left - PAD.right
  const gmvMax = Math.max(1, ...points.map((d) => d.gmv)) * 1.12
  const feeMax = Math.max(1, ...points.map((d) => d.fees)) * 1.12 * 3
  const X = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const Y = (v: number, max: number) => PAD.top + (1 - v / max) * (HEIGHT - PAD.top - PAD.bottom)
  const base = Y(0, 1)

  const line = points.map((d, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(d.gmv, gmvMax).toFixed(1)}`).join('')
  const area = n > 1 ? `${line}L${X(n - 1)},${base}L${X(0)},${base}Z` : ''
  const barW = Math.max(2, Math.min(18, (innerW / Math.max(n, 1)) * 0.5))
  const active = hover == null ? null : points[hover]
  const hasData = points.some((d) => d.gmv > 0 || d.fees > 0)

  return (
    <div ref={ref} className="relative mt-2 h-[280px]">
      {width > 0 && n > 0 && (
        <svg viewBox={`0 0 ${W} ${HEIGHT}`} className="h-full w-full overflow-visible" role="img" aria-label="GMV and platform fees over the period">
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
          {tickIndexes(n, W < 560 ? 4 : 7).map((i) => (
            <text key={i} x={X(i)} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fill="var(--faint)">
              {axisLabel(points[i]!.label)}
            </text>
          ))}
          {points.map((d, i) => d.fees > 0 && (
            <rect
              key={i}
              x={X(i) - barW / 2}
              y={Y(d.fees, feeMax)}
              width={barW}
              height={base - Y(d.fees, feeMax)}
              rx="1.5"
              fill="var(--accent)"
              opacity=".85"
            />
          ))}
          {area && <path d={area} fill="url(#gmv-fill)" />}
          {n > 1 && <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" />}
          {n === 1 && <circle cx={X(0)} cy={Y(points[0]!.gmv, gmvMax)} r="4" fill="var(--primary)" />}
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
            onMouseMove={(event) => setHover(slotAt(event, innerW, n, false))}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}
      {width > 0 && !hasData && (
        <p className="pointer-events-none absolute inset-x-0 top-[42%] text-center text-sm text-muted-foreground">
          No orders or fees in this period.
        </p>
      )}
      {active && hover != null && (
        <Tooltip left={X(hover)} top={Y(active.gmv, gmvMax) - 70} width={W}>
          <b className="mb-0.5 block">{active.label}</b>
          GMV {formatCurrency(active.gmv)}
          <br />
          Fees {formatCurrency(active.fees)} · {active.orders.toLocaleString('en-US')} orders
        </Tooltip>
      )}
    </div>
  )
}

const GROWTH_SERIES = [
  { key: 'newSellers', label: 'New sellers', color: 'var(--primary)' },
  { key: 'newStores', label: 'New stores', color: 'var(--chart-4)' },
  { key: 'firstPublished', label: 'First published', color: 'var(--success)' },
  { key: 'topUps', label: 'Top-ups', color: 'var(--accent)' }
] as const satisfies ReadonlyArray<{ key: keyof OverviewPoint, label: string, color: string }>

/**
 * Sign-ups, new stores, first publishes and succeeded top-ups per bucket:
 * grouped bars while each bucket is wide enough, stacked bars when it is not.
 */
export function GrowthChart ({ points }: { points: OverviewPoint[] }) {
  const HEIGHT = 220
  const ref = useRef<HTMLDivElement>(null)
  const width = useContainerSize(ref)?.width ?? 0
  const [hover, setHover] = useState<number | null>(null)

  const W = Math.max(width, 320)
  const n = points.length
  const innerW = W - PAD.left - PAD.right
  const slot = innerW / Math.max(n, 1)
  const grouped = slot >= 18
  const value = (p: OverviewPoint, key: (typeof GROWTH_SERIES)[number]['key']) => p[key]
  const peak = Math.max(
    1,
    ...points.map((p) => grouped
      ? Math.max(...GROWTH_SERIES.map((s) => value(p, s.key)))
      : GROWTH_SERIES.reduce((total, s) => total + value(p, s.key), 0))
  )
  const max = Math.ceil(peak * 1.12)
  const Y = (v: number) => PAD.top + (1 - v / max) * (HEIGHT - PAD.top - PAD.bottom)
  const base = Y(0)
  const centre = (i: number) => PAD.left + slot * (i + 0.5)
  const groupW = Math.min(slot * 0.78, 64)
  const barW = grouped ? groupW / GROWTH_SERIES.length : Math.max(1.5, Math.min(slot * 0.7, 28))
  const active = hover == null ? null : points[hover]
  const hasData = points.some((p) => GROWTH_SERIES.some((s) => value(p, s.key) > 0))

  return (
    <>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {GROWTH_SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <i className="inline-block size-2.5 rounded-[3px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div ref={ref} className="relative mt-2 h-[220px]">
      {width > 0 && n > 0 && (
        <svg viewBox={`0 0 ${W} ${HEIGHT}`} className="h-full w-full overflow-visible" role="img" aria-label="Sign-ups, new stores, first publishes and top-ups over the period">
          {[0, 1, 2, 3, 4].map((step) => {
            const y = Y((max / 4) * step)
            return (
              <g key={step}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--border)" strokeDasharray={step ? '3 4' : undefined} />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--faint)">
                  {Number.isInteger((max / 4) * step) ? (max / 4) * step : ((max / 4) * step).toFixed(1)}
                </text>
              </g>
            )
          })}
          {tickIndexes(n, W < 560 ? 4 : 7).map((i) => (
            <text key={i} x={centre(i)} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fill="var(--faint)">
              {axisLabel(points[i]!.label)}
            </text>
          ))}
          {hover != null && (
            <rect x={PAD.left + slot * hover} y={PAD.top} width={slot} height={base - PAD.top} fill="var(--muted)" opacity=".6" />
          )}
          {points.map((p, i) => {
            if (grouped) {
              const left = centre(i) - groupW / 2
              return GROWTH_SERIES.map((s, k) => value(p, s.key) > 0 && (
                <rect
                  key={`${i}-${s.key}`}
                  x={left + k * barW + 0.5}
                  y={Y(value(p, s.key))}
                  width={Math.max(1, barW - 1)}
                  height={base - Y(value(p, s.key))}
                  rx="1.5"
                  fill={s.color}
                />
              ))
            }
            let acc = 0
            return GROWTH_SERIES.map((s) => {
              const v = value(p, s.key)
              if (v <= 0) return null
              const y0 = Y(acc)
              acc += v
              return (
                <rect key={`${i}-${s.key}`} x={centre(i) - barW / 2} y={Y(acc)} width={barW} height={y0 - Y(acc)} fill={s.color} />
              )
            })
          })}
          <rect
            x={PAD.left}
            y={0}
            width={innerW}
            height={HEIGHT}
            fill="transparent"
            onMouseMove={(event) => setHover(slotAt(event, innerW, n, true))}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}
      {width > 0 && !hasData && (
        <p className="pointer-events-none absolute inset-x-0 top-[40%] text-center text-sm text-muted-foreground">
          No sign-ups, stores or top-ups in this period.
        </p>
      )}
      {active && hover != null && (
        <Tooltip left={centre(hover)} top={PAD.top} width={W}>
          <b className="mb-1 block">{active.label}</b>
          {GROWTH_SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <i className="inline-block size-2 rounded-[2px]" style={{ background: s.color }} />
              {s.label}
              <b className="ml-auto pl-3">{value(active, s.key).toLocaleString('en-US')}</b>
            </span>
          ))}
        </Tooltip>
      )}
      </div>
    </>
  )
}
