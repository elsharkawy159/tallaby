'use client'

import Script from 'next/script'
import { useIsMarketplaceHost } from '@/lib/marketplace/marketplace-host.client'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

/**
 * Loads Meta Pixel once globally. PageView is fired from the init snippet only.
 * Do not call track('PageView') from route components.
 *
 * Marketplace only (PLAN.md P5-05), see `useIsMarketplaceHost`. The
 * <noscript> image fallback is therefore gone; it only counted visitors with
 * JavaScript disabled.
 */
export function MetaPixel () {
  const onMarketplace = useIsMarketplaceHost()
  if (!PIXEL_ID || !onMarketplace) return null

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');
        `.trim(),
      }}
    />
  )
}
