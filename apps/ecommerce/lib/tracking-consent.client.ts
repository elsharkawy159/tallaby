"use client";

import { useSyncExternalStore } from "react";
import { STORE_TRACKING_CONSENT_COOKIE } from "@/lib/storefront-consent";
import { parseTrackingConsent, tagCookieDomains, tagCookieNames, type TrackingConsent } from "@/lib/tracking-consent.lib";

/**
 * The visitor's tracking choice in the browser, one mechanism for every host:
 * seller stores (seller-tracking.client.tsx) and tallaby.com
 * (tracking-consent-banner.client.tsx). localStorage and the cookie are both
 * per host, so a choice on one store never applies to another store, to
 * tallaby.com or to the dashboard.
 */
const CONSENT_KEY = "tallaby-store-tracking-consent:v1";
const CONSENT_EVENT = "tallaby-store-tracking-consent";
const OPEN_SETTINGS_EVENT = "tallaby-open-cookie-settings";

// Private mode can block storage: the choice then lasts until the page is left.
let memoryConsent: TrackingConsent = "unset";

export function readTrackingConsent(): TrackingConsent {
  try {
    const stored = parseTrackingConsent(window.localStorage.getItem(CONSENT_KEY));
    return stored === "unset" ? memoryConsent : stored;
  } catch {
    return memoryConsent;
  }
}

/**
 * Mirrors the choice into a host-only cookie so the server follows it too
 * (Conversions API events). No Domain attribute: it never reaches another host.
 */
export function mirrorTrackingConsentCookie(value: "granted" | "denied") {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${STORE_TRACKING_CONSENT_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function writeTrackingConsent(value: "granted" | "denied") {
  memoryConsent = value;
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // See memoryConsent.
  }
  mirrorTrackingConsentCookie(value);
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

/** "pending" on the server and first paint: nothing renders until the browser knows. */
export function useTrackingConsent(): TrackingConsent | "pending" {
  return useSyncExternalStore<TrackingConsent | "pending">(subscribe, readTrackingConsent, () => "pending");
}

/** The footer's "Cookie settings" link asks the banner to reopen. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

export function onOpenCookieSettings(listener: () => void) {
  window.addEventListener(OPEN_SETTINGS_EVENT, listener);
  return () => window.removeEventListener(OPEN_SETTINGS_EVENT, listener);
}

/** Expires the analytics and advertising cookies already set here, after a decline. */
export function clearTagCookies() {
  const domains = tagCookieDomains(window.location.hostname);
  for (const name of tagCookieNames(document.cookie)) {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
    for (const domain of domains) document.cookie = `${name}=; Path=/; Domain=${domain}; Max-Age=0`;
  }
}
