"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/**
 * Tallaby's own store-views tag (owner, 2026-10-27, PLAN.md SA-01): Tallaby's
 * GTM container on every published storefront, separate from the seller's
 * apps. It sends one `tallaby_page_view` per page, carrying the store id, to
 * Tallaby's GA4 property; the seller dashboard reads it back per store.
 *
 * - Its own data layer (`tallabyDataLayer`), so the seller's GTM or GA4 never
 *   sees these events and Tallaby's container never sees theirs.
 * - Loads without the consent banner (owner decision, overrides D19 for this
 *   tag only). The seller's apps still wait for consent.
 * - The container id is checked by regex on the server before it gets here.
 */

const LAYER = "tallabyDataLayer";

declare global {
  interface Window {
    tallabyDataLayer?: unknown[];
  }
}

export function StoreViewsTag({ containerId, storeId }: { containerId: string; storeId: string }) {
  const pathname = usePathname();

  // One page view per route, including client-side navigations.
  useEffect(() => {
    window[LAYER] = window[LAYER] || [];
    window[LAYER].push({
      event: "tallaby_page_view",
      tallaby_store_id: storeId,
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }, [pathname, storeId]);

  return (
    <Script
      id="tallaby-store-views"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','${LAYER}','${containerId}');`,
      }}
    />
  );
}
