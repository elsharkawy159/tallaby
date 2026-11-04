'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackTallabyPageView } from '@workspace/lib/integrations'
import { useTrackingConsent } from '@/lib/tracking-consent.client'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

/**
 * Tallaby's own Meta Pixel on tallaby.com: PageView on the first load and on
 * every client-side route change, only after the visitor accepts (F-70a). The
 * shared helper decides where it may run (production hosts only, so never on
 * seller storefronts, which share this layout, nor on localhost or previews),
 * loads Meta's base code once and ignores a repeat of the same path, so
 * accepting counts the current page once. A decline revokes a pixel that has
 * already loaded. See docs/meta-pixel.md.
 */
export function MetaPixel () {
  const pathname = usePathname()
  const consent = useTrackingConsent()
  useEffect(() => {
    if (consent === 'pending') return
    try {
      if (consent !== 'granted') {
        window.fbq?.('consent', 'revoke')
        return
      }
      window.fbq?.('consent', 'grant')
    } catch {
      // Ad blockers / CSP must never break the page.
    }
    trackTallabyPageView(PIXEL_ID, pathname)
  }, [pathname, consent])
  return null
}
