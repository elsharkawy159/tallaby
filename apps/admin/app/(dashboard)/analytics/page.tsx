import { getAdminAnalytics } from '@/lib/analytics/analytics.server'
import { AnalyticsRefreshButton } from '../_components/analytics-refresh-button'
import { AnalyticsDashboard } from './analytics.client'

export default async function AnalyticsPage () {
  const data = await getAdminAnalytics()

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
      <AnalyticsDashboard data={data} />
    </>
  )
}
