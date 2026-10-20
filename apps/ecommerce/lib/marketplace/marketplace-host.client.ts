'use client'

import { useSyncExternalStore } from 'react'
import { isMarketplaceHost } from '@workspace/lib/storefront'

const noop = () => () => {}

/**
 * True in the browser on the Tallaby marketplace host, false on seller
 * storefronts and during server rendering (PLAN.md P5-05).
 *
 * Seller storefronts share the root layout, so Tallaby's own tracking checks
 * the host in the browser. Nothing is rendered on the server, which keeps it
 * out of storefront HTML while the layout stays static. Template preview
 * frames on tallaby.com (/template-preview) are not page views either.
 */
export function useIsMarketplaceHost (): boolean {
  return useSyncExternalStore(
    noop,
    () => isMarketplaceHost(window.location.host) && window.self === window.top,
    () => false,
  )
}
