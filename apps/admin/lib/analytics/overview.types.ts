/** Admin home ("Platform overview"), docs/admin-saas.md §3.9. */

export const OVERVIEW_RANGES = [7, 30, 90] as const
export type OverviewRange = (typeof OVERVIEW_RANGES)[number]

/** One Cairo calendar day of the current window. */
export interface OverviewDay {
  date: string
  gmv: number
  orders: number
  fees: number
  newStores: number
}

export interface OverviewKpi {
  current: number
  previous: number
  changePercent: number
}

export interface OverviewTrend {
  range: OverviewRange
  gmv: OverviewKpi
  orders: OverviewKpi
  /** Net platform fees (fees minus fee reversals) taken from store wallets. */
  fees: OverviewKpi
  /** Stores with at least one counted order in the window. */
  activeStores: OverviewKpi
  newStores: OverviewKpi
  deliveredOrders: number
  /** Succeeded store-wallet top-ups. */
  topUps: number
  /** The current window only, oldest first. */
  days: OverviewDay[]
}

export interface OverviewMix {
  /** Live stores by site status (draft | published | unpublished). */
  sites: Record<string, number>
  suspendedStores: number
  sellersInTrial: number
  sellersPastTrial: number
  negativeWallets: number
  /** EGP, zero or negative. */
  negativeTotal: number
  funnel: Array<{ key: string, label: string, value: number }>
  /** Orders created in the window, by outcome group. */
  outcomes: Array<{ key: string, label: string, value: number }>
  /** Counted orders in the window, by payment method label. */
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
