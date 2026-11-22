"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { isValidIntegrationId, type StorefrontTrackingConfig } from "@workspace/lib/integrations";
import { markStoreTrackingReady, setStoreMetaBlockedEvents } from "@/lib/storefront-events.client";
import { STORE_TRACKING_CONSENT_COOKIE } from "@/lib/storefront-consent";
import { mirrorTrackingConsentCookie, useTrackingConsent, writeTrackingConsent } from "@/lib/tracking-consent.client";

/**
 * The store's own tracking apps (PLAN.md §9, P7-03), loaded only after the
 * visitor accepts (D19). The choice is kept per store host in localStorage
 * (tracking-consent.client.ts, shared with tallaby.com's banner).
 * Scripts are fixed templates; each id is checked again here before it is
 * written into one.
 */

export function SellerTracking({ config }: { config: StorefrontTrackingConfig }) {
  const t = useTranslations("storefront.consent");
  const consent = useTrackingConsent();

  const pixelId = isValidIntegrationId("meta_pixel", config.metaPixelId) ? config.metaPixelId : null;
  const ga4Id = isValidIntegrationId("google_analytics", config.ga4MeasurementId) ? config.ga4MeasurementId : null;
  const gtmId = isValidIntegrationId("google_tag_manager", config.gtmContainerId) ? config.gtmContainerId : null;
  const tiktokId = isValidIntegrationId("tiktok_pixel", config.tiktokPixelId) ? config.tiktokPixelId : null;
  const snapId = isValidIntegrationId("snapchat_pixel", config.snapPixelId) ? config.snapPixelId : null;
  const any = Boolean(pixelId || ga4Id || gtmId || tiktokId || snapId);
  // F-30: Meta events this store does not send from the browser (server-computed).
  const metaBlockedKey = (config.metaBlockedEvents ?? []).join(",");

  // Choices made before the cookie existed (localStorage only) are mirrored once.
  useEffect(() => {
    if ((consent === "granted" || consent === "denied") && !document.cookie.includes(`${STORE_TRACKING_CONSENT_COOKIE}=${consent}`)) {
      mirrorTrackingConsentCookie(consent);
    }
  }, [consent]);

  // Once the snippets have defined their queues (fbq / gtag / dataLayer / ttq / snaptr),
  // release the commerce events that fired before (P7-04).
  useEffect(() => {
    if (!any || consent !== "granted") return;
    let tries = 0;
    const timer = setInterval(() => {
      const loaded =
        (!pixelId || typeof window.fbq === "function") &&
        (!ga4Id || typeof window.gtag === "function") &&
        (!gtmId || Array.isArray(window.dataLayer)) &&
        (!tiktokId || typeof window.ttq?.track === "function") &&
        (!snapId || typeof window.snaptr === "function");
      if (loaded || ++tries > 100) {
        clearInterval(timer);
        if (loaded) {
          setStoreMetaBlockedEvents(metaBlockedKey ? metaBlockedKey.split(",") : []);
          markStoreTrackingReady();
        }
      }
    }, 100);
    return () => clearInterval(timer);
  }, [any, consent, pixelId, ga4Id, gtmId, tiktokId, snapId, metaBlockedKey]);

  if (!any) return null;

  if (consent === "pending" || consent === "denied") return null;

  if (consent === "unset") {
    return (
      <div
        role="region"
        aria-label={t("label")}
        className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-2xl border bg-background p-4 text-sm shadow-lg"
      >
        <p className="min-w-0 flex-1 text-pretty">{t("text")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-xl border px-4 py-2 font-medium"
            onClick={() => writeTrackingConsent("denied")}
          >
            {t("decline")}
          </button>
          <button
            type="button"
            className="rounded-xl bg-foreground px-4 py-2 font-medium text-background"
            onClick={() => writeTrackingConsent("granted")}
          >
            {t("accept")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {pixelId && (
        <Script
          id="store-meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
          }}
        />
      )}
      {ga4Id && (
        <>
          <Script
            id="store-ga4-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
          />
          <Script
            id="store-ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`,
            }}
          />
        </>
      )}
      {gtmId && (
        <Script
          id="store-gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      )}
      {tiktokId && (
        <Script
          id="store-tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            // TikTok's base code (Pixel v1.3). Its history observer sends the page view on client navigation.
            __html: `!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)}; ttq.load('${tiktokId}'); ttq.page();}(window, document, 'ttq');`,
          }}
        />
      )}
      {snapId && (
        <>
          <Script
            id="store-snap-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              // Snap's standard snippet, with its implicit global `r` declared.
              __html: `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${snapId}',{});snaptr('track','PAGE_VIEW');`,
            }}
          />
          <SnapPageViews />
        </>
      )}
    </>
  );
}

/**
 * The page the Snap snippet already counted. Module scope, not a ref, so a
 * remount (storefront ↔ checkout layouts, where next/script does not run the
 * snippet again) still counts the page it lands on.
 */
let snapLastPath: string | null = null;

/** Snap does not follow client navigation: one PAGE_VIEW per new path (F-103). */
function SnapPageViews() {
  const pathname = usePathname();
  useEffect(() => {
    if (snapLastPath === null) {
      snapLastPath = pathname;
      return;
    }
    if (pathname === snapLastPath) return;
    snapLastPath = pathname;
    try {
      if (typeof window.snaptr === "function") window.snaptr("track", "PAGE_VIEW");
    } catch {
      // A blocked tracker must never break the store.
    }
  }, [pathname]);
  return null;
}
