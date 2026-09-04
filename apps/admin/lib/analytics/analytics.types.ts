export interface PeriodMetric {
  current: number
  previous: number
  changePercent: number
}

export interface ChartPoint {
  date: string
  value: number
  [key: string]: string | number | undefined
}

export interface NamedValue {
  name: string
  value: number
  color?: string
  [key: string]: string | number | undefined
}

export interface MultiSeriesPoint {
  date: string
  new: number
  returning: number
  [key: string]: string | number
}

export interface ProductPerformanceRow {
  productId: string
  name: string
  revenue: number
  orders: number
  units: number
  quantity: number
}

export interface CategoryPerformanceRow {
  categoryId: string
  name: string
  revenue: number
  products: number
  growthPercent: number
}

export interface RecentOrderRow {
  id: string
  orderNumber: string
  customer: string
  total: number
  status: string
  createdAt: string
}

export interface SellerPerformanceRow {
  sellerId: string
  name: string
  revenue: number
  orders: number
}

/**
 * The dashboard is assembled from these four independent slices rather than
 * one blocking payload, so each can sit behind its own <Suspense> boundary and
 * stream in as soon as its own queries finish.
 */
export interface DashboardMetrics {
  revenue: PeriodMetric
  orders: PeriodMetric
  customers: PeriodMetric
  aov: PeriodMetric
  activeProducts: PeriodMetric
}

export interface RevenueAndStatus {
  dailyRevenue: ChartPoint[]
  orderStatus: NamedValue[]
}

export interface DashboardTables {
  recentOrders: RecentOrderRow[]
  topProducts: ProductPerformanceRow[]
  topSellers: SellerPerformanceRow[]
}

export interface CategoryAndActivity {
  salesByCategory: NamedValue[]
  categories: CategoryPerformanceRow[]
  customerActivity: MultiSeriesPoint[]
}

export interface MonthlySeries {
  monthlyRevenue: ChartPoint[]
  monthlyOrders: ChartPoint[]
  monthlyAov: ChartPoint[]
  monthlyClv: ChartPoint[]
}

export interface CommerceAnalytics
  extends DashboardMetrics,
    RevenueAndStatus,
    DashboardTables,
    CategoryAndActivity,
    MonthlySeries {}

export interface PosthogFunnelStep {
  event: string
  label: string
  users: number
}

export interface PosthogAnalytics {
  configured: boolean
  hasEvents: boolean
  message: string | null
  uniqueVisitors: number
  pageviews: number
  dailyPageviews: ChartPoint[]
  funnel: PosthogFunnelStep[]
}

export interface AdminAnalyticsPayload {
  commerce: CommerceAnalytics
  posthog: PosthogAnalytics
}
