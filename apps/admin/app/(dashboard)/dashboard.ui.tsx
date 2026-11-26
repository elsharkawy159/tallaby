import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '@workspace/lib'
import { cn } from '@workspace/ui/lib/utils'
import type { OverviewKpi } from '@/lib/analytics/overview.types'
import { walletMoney } from './wallets/store-wallets.lib'

/** Shared building blocks of the admin home sections (dashboard.sections.tsx, dashboard.money.tsx). */

export const num = (value: number) => Math.round(value).toLocaleString('en-US')
export const money = (value: number) => formatCurrency(value, 'en-EG', { maximumFractionDigits: 0 })
/** A store wallet amount in its own currency (USD as "$1.25", anything else EGP). */
export const storeWallet = (value: number, currency: string) => (currency === 'USD' ? walletMoney(value, 'USD') : money(value))

export const cairoDay = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'Africa/Cairo' }).format(new Date(iso))

export const th = 'px-2.5 pb-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground first:pl-0 last:pr-0'
export const td = 'border-t px-2.5 py-[11px] whitespace-nowrap tabular-nums first:pl-0 last:pr-0'

export function Panel ({ className, children }: { className?: string, children: ReactNode }) {
  return (
    <div className={cn('flex min-w-0 flex-col rounded-[14px] border bg-card shadow-xs', className)}>
      {children}
    </div>
  )
}

export function PanelHeader ({ title, description, action }: {
  title: string
  description: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-[18px]">
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold">{title}</h3>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function PanelBody ({ className, children }: { className?: string, children: ReactNode }) {
  return <div className={cn('flex flex-1 flex-col px-5 pt-4 pb-5', className)}>{children}</div>
}

export function Note ({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={cn('mt-auto border-t pt-3.5 text-xs text-muted-foreground [&_b]:text-foreground', className)}>
      {children}
    </div>
  )
}

export function Empty ({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
}

export type PillTone = 'neutral' | 'primary' | 'accent' | 'success' | 'danger'

export function Pill ({ tone = 'neutral', className, children }: {
  tone?: PillTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
        tone === 'primary' && 'border-transparent bg-primary-soft text-primary-ink',
        tone === 'accent' && 'border-transparent bg-accent-soft text-accent-ink',
        tone === 'success' && 'border-transparent bg-success-soft text-success',
        tone === 'danger' && 'border-transparent bg-destructive-soft text-destructive',
        className
      )}
    >
      {children}
    </span>
  )
}

export const SITE_TONE: Record<string, PillTone> = {
  published: 'success',
  draft: 'neutral',
  unpublished: 'accent'
}

/** Change vs the previous period; "New" when there was nothing before. */
export function Delta ({ metric }: { metric: OverviewKpi }) {
  if (metric.previous === 0 && metric.current === 0) return <span className="font-semibold text-faint">—</span>
  if (metric.previous === 0) return <span className="font-semibold text-success">New</span>
  const up = metric.changePercent >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-semibold', up ? 'text-success' : 'text-destructive')}>
      <Icon className="size-[13px]" strokeWidth={2.25} />
      {Math.abs(metric.changePercent)}%
    </span>
  )
}

export function Sparkline ({ values, up }: { values: number[], up: boolean }) {
  if (values.length < 2 || values.every((v) => v === 0)) return null
  const w = 72
  const h = 24
  const max = Math.max(...values)
  const min = Math.min(...values)
  const points = values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`)
    .join(' ')
  return (
    <svg className="h-6 w-[72px] shrink-0" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={up ? 'var(--success)' : 'var(--destructive)'}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** A signed amount, green above zero and red below. */
export function Signed ({ value, currency }: { value: number, currency: string }) {
  return (
    <b className={cn('font-semibold', value > 0 && 'text-success', value < 0 && 'text-destructive')}>
      {value > 0 ? '+' : ''}{storeWallet(value, currency)}
    </b>
  )
}
