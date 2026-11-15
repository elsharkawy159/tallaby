'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackTallabyPageView } from '@workspace/lib/integrations'
import { useTrackingConsent } from '@/lib/tracking-consent.client'
import { runWhenIdleAfterLoad } from '@/lib/run-when-idle.client'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

/**
 * Tallaby's own Meta Pixel on tallaby.com: PageView on the first load and on
 * every client-side route change, only after the visitor accepts (F-70a). The
 * shared helper decides where it may run (production hosts only, so never on
 * seller storefronts, which share this layout, nor on localhost or previews),
 * loads Meta's base code once and ignores a repeat of the same path, so
 * accepting counts the current page once. A decline revokes a pixel that has
 * already loaded. See docs/meta-pixel.md.
 *
 * The first call loads Meta's base code, so it waits for the page's `load`
 * event and an idle moment (owner, 2026-11-15: keep it off first paint). A
 * route change or a decline before then cancels the pending call; the new
 * path is the one counted, and a decline loads nothing.
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
    if (window.fbq) {
      trackTallabyPageView(PIXEL_ID, pathname)
      return
    }
    return runWhenIdleAfterLoad(() => trackTallabyPageView(PIXEL_ID, pathname))
  }, [pathname, consent])
  return null
}
