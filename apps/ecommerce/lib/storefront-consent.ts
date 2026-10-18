/**
 * The storefront tracking consent (D19, PLAN.md P7-03) mirrored into a
 * host-only cookie, so server-side events (the store's Meta CAPI, P7-05) can
 * follow the same choice as the browser pixels. The banner writes it; only
 * "granted" allows a server event.
 */
export const STORE_TRACKING_CONSENT_COOKIE = "tallaby_store_consent";

export function hasStoreTrackingConsent(value: string | undefined | null): boolean {
  return value === "granted";
}
