import { headers } from 'next/headers'
import { isMarketplaceHost } from '@workspace/lib/storefront'

/**
 * True when the current request is for the Tallaby marketplace, not a seller
 * storefront. Tallaby's own Meta CAPI events are sent only then (PLAN.md P5-05).
 */
export async function isMarketplaceRequest (): Promise<boolean> {
  return isMarketplaceHost((await headers()).get('host'))
}
