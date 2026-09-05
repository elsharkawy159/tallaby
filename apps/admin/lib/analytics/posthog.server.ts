import { toNumber } from './analytics.lib'
import type { PosthogAnalytics, PosthogFunnelStep } from './analytics.types'

interface HogqlResponse {
  results?: unknown[]
}

const FUNNEL_STEPS: Array<{ event: string, label: string }> = [
  { event: '$pageview', label: 'Pageviews' },
  { event: 'product_added_to_cart', label: 'Added to cart' },
  { event: 'checkout_started', label: 'Checkout started' },
  { event: 'order_placed', label: 'Orders placed' }
]

function getPosthogConfig () {
  const host = (process.env.POSTHOG_HOST ?? 'https://eu.posthog.com').replace(/\/$/, '')
  const projectId = process.env.POSTHOG_PROJECT_ID
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY

  if (!projectId || !apiKey) {
    return null
  }

  return { host, projectId, apiKey }
}

async function runHogql (query: string, name: string): Promise<unknown[][]> {
  const config = getPosthogConfig()
  if (!config) {
    return []
  }

  const response = await fetch(
    `${config.host}/api/projects/${config.projectId}/query/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        query: { kind: 'HogQLQuery', query },
        name
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    }
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`PostHog query failed (${response.status}): ${detail}`)
  }

  const payload = (await response.json()) as HogqlResponse
  return Array.isArray(payload.results) ? (payload.results as unknown[][]) : []
}

export async function getPosthogAnalytics (): Promise<PosthogAnalytics> {
  if (!getPosthogConfig()) {
    return {
      configured: false,
      hasEvents: false,
      message: 'Add POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to the admin env to load storefront traffic.',
      uniqueVisitors: 0,
      pageviews: 0,
      dailyPageviews: [],
      funnel: FUNNEL_STEPS.map((step) => ({ ...step, users: 0 }))
    }
  }

  try {
    const [summary, daily, funnel] = await Promise.all([
      runHogql(
        `SELECT
          count() AS pageviews,
          count(DISTINCT person_id) AS visitors
        FROM events
        WHERE timestamp >= now() - INTERVAL 30 DAY`,
        'admin-analytics-summary'
      ),
      runHogql(
        `SELECT
          toDate(timestamp) AS date,
          count() AS pageviews
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
        GROUP BY date
        ORDER BY date`,
        'admin-analytics-pageviews'
      ),
      runHogql(
        `SELECT
          event,
          count(DISTINCT person_id) AS users
        FROM events
        WHERE timestamp >= now() - INTERVAL 30 DAY
          AND event IN ('$pageview', 'product_added_to_cart', 'checkout_started', 'order_placed')
        GROUP BY event`,
        'admin-analytics-funnel'
      )
    ])

    const pageviews = toNumber(summary[0]?.[0])
    const uniqueVisitors = toNumber(summary[0]?.[1])
    const funnelCounts = new Map(
      funnel.map((row) => [String(row[0]), toNumber(row[1])])
    )

    const funnelSteps: PosthogFunnelStep[] = FUNNEL_STEPS.map((step) => ({
      ...step,
      users: funnelCounts.get(step.event) ?? 0
    }))

    return {
      configured: true,
      hasEvents: pageviews > 0 || uniqueVisitors > 0,
      message: pageviews > 0
        ? null
        : 'PostHog is connected, but no events have been ingested in the last 30 days yet.',
      uniqueVisitors,
      pageviews,
      dailyPageviews: daily.map((row) => ({
        date: String(row[0]),
        value: toNumber(row[1])
      })),
      funnel: funnelSteps
    }
  } catch (error) {
    return {
      configured: true,
      hasEvents: false,
      message: error instanceof Error ? error.message : 'Failed to query PostHog',
      uniqueVisitors: 0,
      pageviews: 0,
      dailyPageviews: [],
      funnel: FUNNEL_STEPS.map((step) => ({ ...step, users: 0 }))
    }
  }
}
