import { Suspense } from 'react'
import { AnalyticsRefreshButton } from './_components/analytics-refresh-button'
import {
  CategoryAndActivitySection,
  MetricsSection,
  RevenueAndStatusSection
} from './dashboard.sections'
import {
  CategoryAndActivitySkeleton,
  MetricsSkeleton,
  RevenueAndStatusSkeleton
} from './dashboard.skeleton'

/**
 * The page itself does no data fetching, so the heading and layout reach the
 * browser on the first flush. Every query lives inside one of the Suspense
 * boundaries below and streams in independently — a slow aggregate now delays
 * only its own card, not the whole dashboard.
 *
 * TablesSection is temporarily disabled: its aggregates (plus parallel
 * Metrics/Category queries) were oversubscribing the Supabase :6543 pooler
 * and leaving Suspense skeletons spinning forever.
 */
export default function DashboardPage () {
  return (
    <>
      <div className="mb-6 flex items-center justify-end">
        <AnalyticsRefreshButton />
      </div>

      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsSection />
      </Suspense>

      <Suspense fallback={<RevenueAndStatusSkeleton />}>
        <RevenueAndStatusSection />
      </Suspense>

      {/* TablesSection disabled — see file comment above
      <Suspense fallback={<TablesSkeleton />}>
        <TablesSection />
      </Suspense>
      */}

      <Suspense fallback={<CategoryAndActivitySkeleton />}>
        <CategoryAndActivitySection />
      </Suspense>
    </>
  )
}
