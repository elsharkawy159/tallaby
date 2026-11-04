'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { useIsMarketplaceHost } from '@/lib/marketplace/marketplace-host.client'
import { clearTagCookies, useTrackingConsent } from '@/lib/tracking-consent.client'

const MEASUREMENT_ID = 'G-ET1FTMXB9X'
const DISABLE_FLAG = `ga-disable-${MEASUREMENT_ID}`

/**
 * Tallaby's GA4 tag. Marketplace only, never on seller storefronts (PLAN.md
 * P5-05), and only after the visitor accepts (F-70a). A loaded script can't be
 * unloaded, so a decline sets Google's own off switch: no more hits from this
 * page, and the tag doesn't load at all on the next one. Accepting again turns
 * it back on; next/script doesn't run the same id twice, so no second page view.
 */
export function GoogleAnalytics () {
  const isMarketplace = useIsMarketplaceHost()
  const consent = useTrackingConsent()

  useEffect(() => {
    if (!isMarketplace || consent === 'pending') return
    const flags = window as unknown as Record<string, unknown>
    flags[DISABLE_FLAG] = consent !== 'granted'
    if (consent === 'denied') clearTagCookies()
  }, [isMarketplace, consent])

  if (!isMarketplace || consent !== 'granted') return null

  return (
    <>
      <Script
        id="ga4-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${MEASUREMENT_ID}');
          `.trim(),
        }}
      />
    </>
  )
}
