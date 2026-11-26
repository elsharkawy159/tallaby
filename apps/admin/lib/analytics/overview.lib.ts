import { percentChange, toNumber } from './analytics.lib'
import {
  DEFAULT_OVERVIEW_PERIOD,
  OVERVIEW_PERIOD_KEYS,
  type OverviewBucket,
  type OverviewKpi,
  type OverviewMix,
  type OverviewPeriod,
  type OverviewPeriodKey,
  type OverviewPoint,
  type OverviewTrend
} from './overview.types'

/* ── Periods ──────────────────────────────────────────────────────────────
 * Every bound is a Cairo calendar day as `YYYY-MM-DD`. Day arithmetic runs on
 * the date alone (UTC midnight of that date), never on wall-clock offsets, so
 * Egypt's DST changes cannot shift a bound. SQL turns each date into an
 * instant with `(date)::timestamp AT TIME ZONE 'Africa/Cairo'`.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

/** Old bookmarks used `?range=7|30|90`. */
const LEGACY_PERIODS: Record<string, OverviewPeriodKey> = { 7: '7d', 30: '30d', 90: '90d' }

const PERIOD_LABELS: Record<OverviewPeriodKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '3d': '3 days',
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  month: 'This month',
  last_month: 'Last month',
  year: 'This year'
}

const ROLLING_DAYS: Partial<Record<OverviewPeriodKey, number>> = { '3d': 3, '7d': 7, '30d': 30, '90d': 90 }

/** `?range=` → a period key; unknown values fall back to 30 days. */
export function parseOverviewPeriodKey (value: unknown): OverviewPeriodKey {
  const raw = String((Array.isArray(value) ? value[0] : value) ?? '').trim()
  if ((OVERVIEW_PERIOD_KEYS as readonly string[]).includes(raw)) return raw as OverviewPeriodKey
  return LEGACY_PERIODS[raw] ?? DEFAULT_OVERVIEW_PERIOD
}

export function periodLabel (key: OverviewPeriodKey): string {
  return PERIOD_LABELS[key]
}

function toDayNumber (date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y!, m! - 1, d!) / DAY_MS
}

function fromDayNumber (day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

/** A real calendar date written `YYYY-MM-DD`. */
export function isIsoDate (value: string): boolean {
  return ISO_DATE.test(value) && fromDayNumber(toDayNumber(value)) === value
}

export function addDays (date: string, days: number): string {
  return fromDayNumber(toDayNumber(date) + days)
}

/** Whole days from `from` to `to` (`to` exclusive). */
export function daysBetween (from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from)
}

/** The Cairo calendar day that `now` falls on. */
export function cairoDate (now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function monthStart (date: string, monthsBack = 0): string {
  const [y, m] = date.split('-').map(Number)
  const index = y! * 12 + (m! - 1) - monthsBack
  const year = Math.floor(index / 12)
  return `${String(year).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}-01`
}

function formatDay (date: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' })
}

/**
 * "Nov 1 – Nov 26, 2026" (one day: "Nov 26, 2026"). With `withYear` false the
 * year is left out when the whole span sits in `refYear`.
 */
function spanLabel (start: string, end: string, withYear: boolean, refYear: string): string {
  const last = addDays(end, -1)
  const sameYear = start.slice(0, 4) === last.slice(0, 4)
  const showYear = withYear || !sameYear || last.slice(0, 4) !== refYear
  const short = (date: string, year: boolean) =>
    formatDay(date, { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}) })
  if (start === last) return short(start, showYear)
  return `${short(start, showYear && !sameYear)} – ${short(last, showYear)}`
}

/**
 * The current and previous window of a period key, as Cairo dates (`end` and
 * `prevEnd` exclusive). Rolling periods are the last N days including today,
 * against the N days before. "This month" and "This year" compare with the same
 * number of days from the start of the previous month / year, clamped to its
 * length. Buckets: hours for one day, days up to 92 days, weeks above.
 */
export function resolveOverviewPeriod (key: OverviewPeriodKey, now: Date): OverviewPeriod {
  const today = cairoDate(now)
  const tomorrow = addDays(today, 1)
  let start: string
  let end: string
  let prevStart: string
  let prevEnd: string

  const rolling = ROLLING_DAYS[key]
  if (rolling) {
    start = addDays(today, -(rolling - 1))
    end = tomorrow
    prevStart = addDays(start, -rolling)
    prevEnd = start
  } else if (key === 'today') {
    start = today
    end = tomorrow
    prevStart = addDays(today, -1)
    prevEnd = today
  } else if (key === 'yesterday') {
    start = addDays(today, -1)
    end = today
    prevStart = addDays(today, -2)
    prevEnd = start
  } else if (key === 'month') {
    start = monthStart(today)
    end = tomorrow
    prevStart = monthStart(today, 1)
    prevEnd = addDays(prevStart, Math.min(daysBetween(start, end), daysBetween(prevStart, start)))
  } else if (key === 'last_month') {
    start = monthStart(today, 1)
    end = monthStart(today)
    prevStart = monthStart(today, 2)
    prevEnd = start
  } else {
    // 'year'
    start = `${today.slice(0, 4)}-01-01`
    end = tomorrow
    prevStart = `${String(Number(today.slice(0, 4)) - 1).padStart(4, '0')}-01-01`
    prevEnd = addDays(prevStart, Math.min(daysBetween(start, end), daysBetween(prevStart, start)))
  }

  for (const date of [start, end, prevStart, prevEnd]) {
    if (!isIsoDate(date)) throw new Error(`Invalid overview period date: ${date}`)
  }

  const days = daysBetween(start, end)
  const bucket: OverviewBucket = days <= 1 ? 'hour' : days <= 92 ? 'day' : 'week'
  const refYear = addDays(end, -1).slice(0, 4)
  return {
    key,
    label: PERIOD_LABELS[key],
    start,
    end,
    prevStart,
    prevEnd,
    bucket,
    rangeLabel: spanLabel(start, end, true, refYear),
    prevLabel: spanLabel(prevStart, prevEnd, false, refYear)
  }
}

/** Bucket count of a period (the SQL bucket numbers are 0 … count − 1). */
export function bucketCount (period: OverviewPeriod): number {
  const days = daysBetween(period.start, period.end)
  if (period.bucket === 'hour') return days * 24
  return period.bucket === 'week' ? Math.ceil(days / 7) : days
}

/** The chart labels of a period's buckets, oldest first. */
export function periodBuckets (period: OverviewPeriod): string[] {
  const count = bucketCount(period)
  if (period.bucket === 'hour') {
    const multiDay = count > 24
    return Array.from({ length: count }, (_, i) => {
      const hour = `${String(i % 24).padStart(2, '0')}:00`
      if (!multiDay) return hour
      return `${formatDay(addDays(period.start, Math.floor(i / 24)), { month: 'short', day: '2-digit' })} ${hour}`
    })
  }
  const step = period.bucket === 'week' ? 7 : 1
  return Array.from({ length: count }, (_, i) => {
    const label = formatDay(addDays(period.start, i * step), { month: 'short', day: '2-digit' })
    return step === 7 ? `Week of ${label}` : label
  })
}

export function kpi (current: number, previous: number): OverviewKpi {
  return { current, previous, changePercent: percentChange(current, previous) }
}

/** Metrics the totals query returns as `<name>_cur` / `<name>_prev`. */
export const TREND_METRICS = [
  'gmv',
  'gmv_orders',
  'orders',
  'delivered',
  'fees',
  'active_stores',
  'new_sellers',
  'new_stores',
  'first_published',
  'top_ups',
  'top_up_paid',
  'admin_credits',
  'activated'
] as const
export type TrendMetric = (typeof TREND_METRICS)[number]

export interface RawOverviewPoint {
  i: unknown
  gmv?: unknown
  orders?: unknown
  fees?: unknown
  new_sellers?: unknown
  new_stores?: unknown
  first_published?: unknown
  top_ups?: unknown
}

/** One point per bucket, zero-filled, from the series query's rows. */
export function fillPoints (period: OverviewPeriod, rows: RawOverviewPoint[]): OverviewPoint[] {
  const byIndex = new Map(rows.map((row) => [toNumber(row.i), row]))
  return periodBuckets(period).map((label, i) => {
    const row = byIndex.get(i)
    return {
      label,
      gmv: toNumber(row?.gmv),
      orders: toNumber(row?.orders),
      fees: toNumber(row?.fees),
      newSellers: toNumber(row?.new_sellers),
      newStores: toNumber(row?.new_stores),
      firstPublished: toNumber(row?.first_published),
      topUps: toNumber(row?.top_ups)
    }
  })
}

/** The totals row (current and previous window) plus the series → the KPI model. */
export function buildTrend (
  period: OverviewPeriod,
  totals: Record<string, unknown>,
  series: RawOverviewPoint[]
): OverviewTrend {
  const pair = (name: TrendMetric) => kpi(toNumber(totals[`${name}_cur`]), toNumber(totals[`${name}_prev`]))
  const gmv = pair('gmv')
  const gmvOrders = pair('gmv_orders')
  const average = (value: number, count: number) => (count > 0 ? Math.round((value / count) * 100) / 100 : 0)
  return {
    period,
    gmv,
    orders: pair('orders'),
    gmvOrders,
    averageOrder: kpi(average(gmv.current, gmvOrders.current), average(gmv.previous, gmvOrders.previous)),
    fees: pair('fees'),
    activeStores: pair('active_stores'),
    deliveredOrders: pair('delivered'),
    newSellers: pair('new_sellers'),
    newStores: pair('new_stores'),
    firstPublished: pair('first_published'),
    topUps: pair('top_ups'),
    topUpSellers: toNumber(totals.top_up_sellers),
    topUpPaid: pair('top_up_paid'),
    topUpCredited: toNumber(totals.top_up_credited),
    firstTopUps: toNumber(totals.first_top_ups),
    adminCredits: pair('admin_credits'),
    adminCreditSellers: toNumber(totals.admin_credit_sellers),
    adminCreditNet: toNumber(totals.admin_credit_net),
    newlyActivated: pair('activated'),
    points: fillPoints(period, series)
  }
}

/** Sums points into at most `max` groups so a long sparkline stays readable. */
export function sparkSeries (
  points: OverviewPoint[],
  key: keyof Omit<OverviewPoint, 'label'>,
  max = 14
): number[] {
  const size = Math.max(1, Math.ceil(points.length / max))
  const out: number[] = []
  for (let i = 0; i < points.length; i += size) {
    out.push(points.slice(i, i + size).reduce((total, point) => total + point[key], 0))
  }
  return out
}

/** succeeded ÷ (succeeded + failed + pending), one decimal; null when nothing started. */
export function conversionPercent (succeeded: number, failed: number, pending: number): number | null {
  const started = succeeded + failed + pending
  return started > 0 ? Math.round((succeeded / started) * 1000) / 10 : null
}

/* ── Mix ─────────────────────────────────────────────────────────────── */

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
  { key: 'activated', label: 'Activated' },
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
