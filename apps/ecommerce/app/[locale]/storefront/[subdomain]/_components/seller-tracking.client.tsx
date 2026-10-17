"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { useTranslations } from "next-intl";
import { isValidIntegrationId, type StorefrontTrackingConfig } from "@workspace/lib/integrations";
import { markStoreTrackingReady } from "@/lib/storefront-events.client";

/**
 * The store's own tracking apps (PLAN.md §9, P7-03), loaded only after the
 * visitor accepts (D19). The choice is kept per store host in localStorage.
 * Scripts are fixed templates; each id is checked again here before it is
 * written into one.
 */

const CONSENT_KEY = "tallaby-store-tracking-consent:v1";
const CONSENT_EVENT = "tallaby-store-tracking-consent";

type Consent = "granted" | "denied" | "unset";

function readConsent(): Consent {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    return "unset";
  }
}

function writeConsent(value: "granted" | "denied") {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Private mode: the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function SellerTracking({ config }: { config: StorefrontTrackingConfig }) {
  const t = useTranslations("storefront.consent");
  // "pending" on the server and first paint: nothing renders until the browser knows.
  const consent = useSyncExternalStore<Consent | "pending">(subscribe, readConsent, () => "pending");

  const pixelId = isValidIntegrationId("meta_pixel", config.metaPixelId) ? config.metaPixelId : null;
  const ga4Id = isValidIntegrationId("google_analytics", config.ga4MeasurementId) ? config.ga4MeasurementId : null;
  const gtmId = isValidIntegrationId("google_tag_manager", config.gtmContainerId) ? config.gtmContainerId : null;
  const any = Boolean(pixelId || ga4Id || gtmId);

  // Once the snippets have defined their queues (fbq / gtag / dataLayer),
  // release the commerce events that fired before (P7-04).
  useEffect(() => {
    if (!any || consent !== "granted") return;
    let tries = 0;
    const timer = setInterval(() => {
      const loaded =
        (!pixelId || typeof window.fbq === "function") &&
        (!ga4Id || typeof window.gtag === "function") &&
        (!gtmId || Array.isArray(window.dataLayer));
      if (loaded || ++tries > 100) {
        clearInterval(timer);
        if (loaded) markStoreTrackingReady();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [any, consent, pixelId, ga4Id, gtmId]);

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
            onClick={() => writeConsent("denied")}
          >
            {t("decline")}
          </button>
          <button
            type="button"
            className="rounded-xl bg-foreground px-4 py-2 font-medium text-background"
            onClick={() => writeConsent("granted")}
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
    </>
  );
}
