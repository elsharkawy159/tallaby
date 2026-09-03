import { getCommerceAnalytics } from './commerce.server'
import { getPosthogAnalytics } from './posthog.server'
import type { AdminAnalyticsPayload } from './analytics.types'

export async function getAdminAnalytics (): Promise<AdminAnalyticsPayload> {
  const [commerce, posthog] = await Promise.all([
    getCommerceAnalytics(),
    getPosthogAnalytics()
  ])

  return { commerce, posthog }
}
