import { Suspense } from 'react'
import { getAdminAnalytics } from '@/lib/analytics/analytics.server'
import { AnalyticsRefreshButton } from '../_components/analytics-refresh-button'
import { ChartCardSkeleton, MetricsSkeleton } from '../dashboard.skeleton'
import { AnalyticsDashboard } from './analytics.client'

/**
 * This page's dashboard is a single client component that needs every series
 * at once, so the fetch cannot be split the way the main dashboard is. It can
 * still stream: the header renders immediately and the Suspense boundary keeps
 * the (slower) commerce + PostHog round-trip off the critical path.
 */
export default function AnalyticsPage () {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Live commerce data from orders, plus PostHog storefront traffic
          </p>
        </div>
        <AnalyticsRefreshButton />
      </div>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsData />
      </Suspense>
    </>
  )
}

async function AnalyticsData () {
  const data = await getAdminAnalytics()
  return <AnalyticsDashboard data={data} />
}

function AnalyticsSkeleton () {
  return (
    <div className="space-y-6">
      <MetricsSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  )
}
