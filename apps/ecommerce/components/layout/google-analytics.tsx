'use client'

import Script from 'next/script'
import { useIsMarketplaceHost } from '@/lib/marketplace/marketplace-host.client'

const MEASUREMENT_ID = 'G-ET1FTMXB9X'

/** Tallaby's GA4 tag. Marketplace only, never on seller storefronts (PLAN.md P5-05). */
export function GoogleAnalytics () {
  if (!useIsMarketplaceHost()) return null

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
