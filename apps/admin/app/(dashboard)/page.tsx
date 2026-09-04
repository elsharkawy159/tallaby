import { Suspense } from 'react'
import { AnalyticsRefreshButton } from './_components/analytics-refresh-button'
import {
  CategoryAndActivitySection,
  MetricsSection,
  RevenueAndStatusSection,
  TablesSection
} from './dashboard.sections'
import {
  CategoryAndActivitySkeleton,
  MetricsSkeleton,
  RevenueAndStatusSkeleton,
  TablesSkeleton
} from './dashboard.skeleton'

/**
 * The page itself does no data fetching, so the heading and layout reach the
 * browser on the first flush. Every query lives inside one of the four
 * Suspense boundaries below and streams in independently — a slow aggregate
 * now delays only its own card, not the whole dashboard.
 */
export default function DashboardPage () {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Live store metrics from orders. Last 30 days vs previous 30 days.
          </p>
        </div>
        <AnalyticsRefreshButton />
      </div>

      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsSection />
      </Suspense>

      <Suspense fallback={<RevenueAndStatusSkeleton />}>
        <RevenueAndStatusSection />
      </Suspense>

      <Suspense fallback={<TablesSkeleton />}>
        <TablesSection />
      </Suspense>

      <Suspense fallback={<CategoryAndActivitySkeleton />}>
        <CategoryAndActivitySection />
      </Suspense>
    </>
  )
}
