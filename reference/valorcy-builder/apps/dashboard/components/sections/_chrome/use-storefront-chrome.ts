'use client'

import { useEffect, useState } from 'react'

import { getCart } from '@/actions/storefront-cart-actions'
import { usePublicSiteContext } from '@/components/website-builder/public-site-context'

export interface StorefrontChromeState {
  /** Storefront features are reachable — otherwise chrome falls back to links. */
  enabled: boolean
  cartCount: number
  isSignedIn: boolean
}

/**
 * Live storefront data for the shared chrome's cart / account components.
 *
 * Only does anything on a published storefront (where `siteSlug` is set); on the
 * builder canvas and on non-store sites it returns a disabled state and the
 * components render as plain configurable links. Failures are swallowed on
 * purpose — a cart lookup must never break the navbar.
 */
export function useStorefrontChrome (): StorefrontChromeState {
  const site = usePublicSiteContext()
  const slug = site?.siteSlug ?? null
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    getCart(slug)
      .then((cart) => {
        if (cancelled) return
        setCartCount(cart.totals?.itemCount ?? 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [slug])

  return {
    enabled: Boolean(slug),
    cartCount,
    isSignedIn: site?.isSignedIn ?? false,
  }
}
