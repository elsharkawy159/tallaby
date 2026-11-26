/** Admin home ("Platform overview"), docs/admin-saas.md §3.9. */

/** `?range=` keys. Days are Africa/Cairo calendar days. */
export const OVERVIEW_PERIOD_KEYS = [
  'today',
  'yesterday',
  '3d',
  '7d',
  '30d',
  '90d',
  'month',
  'last_month',
  'year'
] as const
export type OverviewPeriodKey = (typeof OVERVIEW_PERIOD_KEYS)[number]

export const DEFAULT_OVERVIEW_PERIOD: OverviewPeriodKey = '30d'

/** The two groups of the header's period control. */
export const OVERVIEW_PERIOD_GROUPS: ReadonlyArray<readonly OverviewPeriodKey[]> = [
  ['today', 'yesterday', '3d', '7d', '30d', '90d'],
  ['month', 'last_month', 'year']
]

export type OverviewBucket = 'hour' | 'day' | 'week'

/**
 * A resolved period. Every date is a Cairo calendar day as `YYYY-MM-DD`;
 * `end` and `prevEnd` are exclusive.
 */
export interface OverviewPeriod {
  key: OverviewPeriodKey
  /** Short button text ("7 days", "This month"). */
  label: string
  start: string
  end: string
  prevStart: string
  prevEnd: string
  bucket: OverviewBucket
  /** "Nov 1 – Nov 26, 2026". */
  rangeLabel: string
  /** "Oct 1 – Oct 26". */
  prevLabel: string
}

/** One chart bucket (an hour, a day or a week) of the current period. */
export interface OverviewPoint {
  /** Axis / tooltip label: "14:00", "Nov 03", "Week of Nov 03". */
  label: string
  /** EGP orders only: other currencies are never added in. */
  gmv: number
  orders: number
  /** Net platform fees, EGP (USD fees converted at the switch's rate). */
  fees: number
  newSellers: number
  newStores: number
  firstPublished: number
  /** Succeeded top-ups (count). */
  topUps: number
}

export interface OverviewKpi {
  current: number
  previous: number
  changePercent: number
}

export interface OverviewTrend {
  period: OverviewPeriod
  /** EGP orders only. */
  gmv: OverviewKpi
  orders: OverviewKpi
  /** EGP orders, for the average order. */
  gmvOrders: OverviewKpi
  /** Average EGP order. */
  averageOrder: OverviewKpi
  /** Net platform fees (fees minus reversals), EGP. */
  fees: OverviewKpi
  /** Stores with at least one counted order. */
  activeStores: OverviewKpi
  deliveredOrders: OverviewKpi
  newSellers: OverviewKpi
  newStores: OverviewKpi
  /** Stores whose `first_published_at` falls in the period. */
  firstPublished: OverviewKpi
  /** Succeeded store-wallet top-ups. */
  topUps: OverviewKpi
  topUpSellers: number
  /** EGP paid by sellers. */
  topUpPaid: OverviewKpi
  /** USD put in wallets by those top-ups. */
  topUpCredited: number
  /** Sellers whose first-ever succeeded top-up is in the period. */
  firstTopUps: number
  /** Manual wallet changes from the admin dashboard (`reference_type = 'admin'`). */
  adminCredits: OverviewKpi
  adminCreditSellers: number
  /** USD, signed net. */
  adminCreditNet: number
  /** Sellers whose first activation event (orders/order-lock rule) is in the period. */
  newlyActivated: OverviewKpi
  /** The current period only, oldest first. */
  points: OverviewPoint[]
}

/** Point-in-time store wallet totals for one currency. */
export interface OverviewWalletTotals {
  currency: string
  wallets: number
  positiveTotal: number
  positiveCount: number
  /** Zero or negative. */
  negativeTotal: number
  negativeCount: number
}

/** "Right now": not affected by the period. */
export interface OverviewSnapshot {
  stores: {
    total: number
    published: number
    neverPublished: number
    offline: number
    suspended: number
  }
  sellers: {
    total: number
    /** By money, mirroring loadActivationFacts in packages/lib/src/billing/order-lock.server.ts. */
    activated: number
    /** Has a succeeded top-up row (real money). */
    paidTopUp: number
    /** Activated with no succeeded top-up and no `top_up` entry (admin credit, gift, switch conversion). */
    creditOnly: number
  }
  /** One row per wallet currency, most wallets first. */
  wallets: OverviewWalletTotals[]
  pendingTopUps: { count: number, amount: number }
}

export interface OverviewMix {
  funnel: Array<{ key: string, label: string, value: number }>
  /** Orders created in the period, by outcome group. */
  outcomes: Array<{ key: string, label: string, value: number }>
  /** Counted orders in the period, by payment method label. */
  payments: Array<{ label: string, value: number }>
}

export interface OverviewStoreRow {
  id: string
  name: string
  subdomain: string
  customDomain: string | null
  logoUrl: string | null
  siteStatus: string
  orders: number
  gmv: number
  growthPercent: number | null
  /** Delivered ÷ (delivered + returned); null when nothing finished shipping. */
  deliveryRate: number | null
  /** The owning seller's store wallet. */
  walletBalance: number | null
  walletCurrency: string
}

export interface OverviewNewStore {
  id: string
  name: string
  logoUrl: string | null
  category: string | null
  sellerName: string | null
  siteStatus: string
  createdAt: string
}

/** Top-ups started in the period, by provider. */
export interface OverviewTopUpProvider {
  provider: string
  succeeded: number
  /** EGP paid (succeeded). */
  paid: number
  /** USD credited (succeeded). */
  credited: number
  failed: number
  /** Pending or processing. */
  pending: number
  /** succeeded ÷ (succeeded + failed + pending); null when none started. */
  conversion: number | null
}

export interface OverviewAdminCredit {
  id: string
  sellerId: string
  sellerName: string
  storeName: string | null
  amount: number
  currency: string
  reason: string | null
  adminName: string | null
  createdAt: string
  walletBalance: number | null
  walletCurrency: string
  /** A succeeded top-up after this credit. */
  paidSince: boolean
}

export interface OverviewRecentTopUp {
  id: string
  sellerId: string
  sellerName: string
  storeName: string | null
  provider: string
  paid: number
  credited: number | null
  creditCurrency: string | null
  createdAt: string
  /** The seller's first-ever succeeded top-up. */
  first: boolean
}

export interface OverviewWalletLeader {
  sellerId: string
  sellerName: string
  storeName: string | null
  balance: number
  currency: string
  paidTopUp: boolean
}

export interface OverviewMoney {
  providers: OverviewTopUpProvider[]
  credits: OverviewAdminCredit[]
  /**
   * Every $5.00 USD admin credit, all time (not the period): newest first, at
   * most 50 rows; the counts cover all of them.
   */
  fiveDollar: { sellers: number, paidSince: number, credits: OverviewAdminCredit[] }
  recentTopUps: OverviewRecentTopUp[]
}
