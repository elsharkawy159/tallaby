import { getCommerceAnalytics } from './commerce.server'
import type { CommerceAnalytics } from './analytics.types'

/** Admin analytics come from our own database (orders, products, customers). */
export async function getAdminAnalytics (): Promise<CommerceAnalytics> {
  return getCommerceAnalytics()
}
