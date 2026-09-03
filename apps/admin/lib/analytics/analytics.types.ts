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

export interface CommerceAnalytics {
  revenue: PeriodMetric
  orders: PeriodMetric
  customers: PeriodMetric
  aov: PeriodMetric
  activeProducts: PeriodMetric
  dailyRevenue: ChartPoint[]
  monthlyRevenue: ChartPoint[]
  monthlyOrders: ChartPoint[]
  monthlyAov: ChartPoint[]
  monthlyClv: ChartPoint[]
  orderStatus: NamedValue[]
  salesByCategory: NamedValue[]
  customerActivity: MultiSeriesPoint[]
  topProducts: ProductPerformanceRow[]
  categories: CategoryPerformanceRow[]
  recentOrders: RecentOrderRow[]
  topSellers: SellerPerformanceRow[]
}

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
