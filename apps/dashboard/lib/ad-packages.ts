/**
 * Ad packages a seller can buy from "Advertise your products". The price here
 * is the source of truth: `createAdRequest` snapshots it into the request, so
 * the client never sends an amount.
 */
export const AD_PACKAGES = [
  {
    key: "weekly_full",
    price: 700,
    durationDays: 7,
    features: ["video", "platforms", "featured", "meta"],
  },
] as const;

export type AdPackage = (typeof AD_PACKAGES)[number];
export type AdPackageKey = AdPackage["key"];
export type AdPackageFeature = AdPackage["features"][number];

export const VODAFONE_CASH_NUMBER = "01003272830";

/** Egyptian mobile number, e.g. 01012345678. */
export const EGYPT_MOBILE_REGEX = /^01[0125]\d{8}$/;

export const AD_REQUEST_STATUSES = [
  "pending",
  "approved",
  "active",
  "completed",
  "rejected",
] as const;

export type AdRequestStatus = (typeof AD_REQUEST_STATUSES)[number];

export function getAdPackage(key: string): AdPackage | undefined {
  return AD_PACKAGES.find((p) => p.key === key);
}
