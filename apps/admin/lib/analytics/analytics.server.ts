import { getCommerceAnalytics } from './commerce.server'
// Temporarily disabled — PostHog queries were slowing the admin panel.
// import { getPosthogAnalytics } from './posthog.server'
import type { AdminAnalyticsPayload, PosthogAnalytics } from './analytics.types'

const DISABLED_POSTHOG: PosthogAnalytics = {
  configured: false,
  hasEvents: false,
  message: 'PostHog temporarily disabled.',
  uniqueVisitors: 0,
  pageviews: 0,
  dailyPageviews: [],
  funnel: [
    { event: '$pageview', label: 'Pageviews', users: 0 },
    { event: 'product_added_to_cart', label: 'Added to cart', users: 0 },
    { event: 'checkout_started', label: 'Checkout started', users: 0 },
    { event: 'order_placed', label: 'Orders placed', users: 0 }
  ]
}

export async function getAdminAnalytics (): Promise<AdminAnalyticsPayload> {
  const commerce = await getCommerceAnalytics()
  // const posthog = await getPosthogAnalytics()
  const posthog = DISABLED_POSTHOG

  return { commerce, posthog }
}
