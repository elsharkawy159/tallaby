'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackTallabyPageView } from '@workspace/lib/integrations'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

/**
 * Tallaby's own Meta Pixel on tallaby.com: PageView on the first load and on
 * every client-side route change. The shared helper decides where it may run
 * (production hosts only, so never on seller storefronts, which share this
 * layout, nor on localhost or previews), loads Meta's base code once and
 * ignores a repeat of the same path. See docs/meta-pixel.md.
 */
export function MetaPixel () {
  const pathname = usePathname()
  useEffect(() => {
    trackTallabyPageView(PIXEL_ID, pathname)
  }, [pathname])
  return null
}
