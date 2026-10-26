import { percentChange, toNumber } from './analytics.lib'
import {
  OVERVIEW_RANGES,
  type OverviewDay,
  type OverviewKpi,
  type OverviewMix,
  type OverviewRange
} from './overview.types'

/** `?range=` → 7 | 30 | 90 (default 30). */
export function parseOverviewRange (value: unknown): OverviewRange {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return (OVERVIEW_RANGES as readonly number[]).includes(parsed)
    ? (parsed as OverviewRange)
    : 30
}

export function kpi (current: number, previous: number): OverviewKpi {
  return { current, previous, changePercent: percentChange(current, previous) }
}

export interface RawOverviewDay {
  i: number
  date: string
  gmv: unknown
  orders: unknown
  delivered: unknown
  fees: unknown
  new_stores: unknown
  top_ups: unknown
}

/**
 * Splits the 2×range daily rows (index 0 = oldest) into the previous and the
 * current window, and sums each.
 */
export function splitDays (rows: RawOverviewDay[], range: number) {
  const sorted = [...rows].sort((a, b) => a.i - b.i)
  const days: OverviewDay[] = sorted.map((row) => ({
    date: row.date,
    gmv: toNumber(row.gmv),
    orders: toNumber(row.orders),
    fees: toNumber(row.fees),
    newStores: toNumber(row.new_stores)
  }))
  const previous = days.slice(0, range)
  const current = days.slice(range)
  const sum = (list: OverviewDay[], key: keyof Omit<OverviewDay, 'date'>) =>
    list.reduce((total, day) => total + day[key], 0)
  const sumRaw = (key: 'delivered' | 'top_ups') =>
    sorted.slice(range).reduce((total, row) => total + toNumber(row[key]), 0)

  return {
    days: current,
    gmv: kpi(sum(current, 'gmv'), sum(previous, 'gmv')),
    orders: kpi(sum(current, 'orders'), sum(previous, 'orders')),
    fees: kpi(sum(current, 'fees'), sum(previous, 'fees')),
    newStores: kpi(sum(current, 'newStores'), sum(previous, 'newStores')),
    deliveredOrders: sumRaw('delivered'),
    topUps: sumRaw('top_ups')
  }
}

const OUTCOME_GROUPS: Array<{ key: string, label: string, statuses: string[] }> = [
  { key: 'delivered', label: 'Delivered', statuses: ['delivered'] },
  {
    key: 'open',
    label: 'In progress',
    statuses: ['pending', 'payment_processing', 'confirmed', 'shipping_soon', 'shipped', 'out_for_delivery']
  },
  { key: 'returned', label: 'Returned / refunded', statuses: ['returned', 'refund_requested', 'refunded'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] }
]

export function groupOutcomes (byStatus: Record<string, unknown> | null): OverviewMix['outcomes'] {
  return OUTCOME_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    value: group.statuses.reduce((total, status) => total + toNumber(byStatus?.[status]), 0)
  }))
}

const FUNNEL_STEPS: Array<{ key: string, label: string }> = [
  { key: 'signed_up', label: 'Signed up' },
  { key: 'store', label: 'Store created' },
  { key: 'product', label: 'First product' },
  { key: 'published', label: 'Site published' },
  { key: 'order', label: 'First order' }
]

export function buildFunnel (raw: Record<string, unknown> | null): OverviewMix['funnel'] {
  return FUNNEL_STEPS.map((step) => ({ ...step, value: toNumber(raw?.[step.key]) }))
}

/** The step pair that loses the largest share of sellers, or null when nobody signed up. */
export function biggestFunnelDrop (funnel: OverviewMix['funnel']) {
  let best: { from: string, to: string, lost: number } | null = null
  for (let i = 1; i < funnel.length; i++) {
    const before = funnel[i - 1]!.value
    if (before === 0) continue
    const lost = (before - funnel[i]!.value) / before
    if (lost > 0 && (!best || lost > best.lost)) {
      best = { from: funnel[i - 1]!.label, to: funnel[i]!.label, lost }
    }
  }
  return best
}

/** Shares of a whole, rounded to one decimal; zeros when the total is zero. */
export function sharePercent (value: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((value / total) * 1000) / 10
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash on delivery',
  cod: 'Cash on delivery',
  cash_on_delivery: 'Cash on delivery',
  card: 'Card',
  kashier: 'Card',
  wallet: 'Wallet',
  instapay: 'InstaPay',
  vodafone_cash: 'Vodafone Cash'
}

export function paymentLabel (raw: string): string {
  // Some old rows hold the column default with its quotes ("'cash").
  const method = raw.replace(/['"]/g, '').trim().toLowerCase()
  return PAYMENT_LABELS[method] ??
    method.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

/** "Nile Crafts" → "NC". */
export function initials (name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => Array.from(word)[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
