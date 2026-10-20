/**
 * Ad packages a seller can buy from "Advertise your products". The price here
 * is the source of truth: `createAdRequest` snapshots it into the request, so
 * the client never sends an amount.
 */
export const AD_PACKAGE_PERIODS = ["weekly", "monthly"] as const;
export type AdPackagePeriod = (typeof AD_PACKAGE_PERIODS)[number];

export type AdPackageFeature = "video_social" | "video_ai" | "platforms" | "meta";

export type AdPackageKey =
  | "weekly_full"
  | "weekly_plus"
  | "weekly_pro"
  | "monthly_basic"
  | "monthly_plus"
  | "monthly_pro";

export interface AdPackageFeatureItem {
  key: AdPackageFeature;
  /**
   * One-time deliverable dropped on these plan columns (days for weekly
   * packages, weeks for monthly ones). Omitted = runs the whole campaign.
   */
  at?: readonly number[];
  /** How many deliverables, e.g. number of videos. */
  count?: number;
}

export interface AdPackage {
  key: AdPackageKey;
  period: AdPackagePeriod;
  price: number;
  durationDays: number;
  /** Approximate results shown to the seller with a "~". */
  estimates: { reach: number; messages: number; purchases: number };
  features: AdPackageFeatureItem[];
  highlight?: boolean;
}

/** Monthly plans are laid out in weeks, weekly plans in days. */
export const MONTHLY_PLAN_COLUMNS = 4;

export function planColumns(pkg: AdPackage): number {
  return pkg.period === "monthly" ? MONTHLY_PLAN_COLUMNS : pkg.durationDays;
}

const includedEverywhere: AdPackageFeatureItem[] = [
  { key: "platforms" },
  { key: "meta" },
];

const socialVideo: AdPackageFeatureItem = { key: "video_social", at: [1], count: 1 };
const aiVideos = (count: number, at: readonly number[]): AdPackageFeatureItem => ({
  key: "video_ai",
  at,
  count,
});

export const AD_PACKAGES: readonly AdPackage[] = [
  {
    // Key kept from the original single package so existing requests still resolve.
    key: "weekly_full",
    period: "weekly",
    price: 700,
    durationDays: 7,
    estimates: { reach: 6700, messages: 165, purchases: 4 },
    features: [socialVideo, ...includedEverywhere],
  },
  {
    key: "weekly_plus",
    period: "weekly",
    price: 1500,
    durationDays: 7,
    estimates: { reach: 14000, messages: 350, purchases: 8 },
    features: [aiVideos(1, [1]), ...includedEverywhere],
    highlight: true,
  },
  {
    key: "weekly_pro",
    period: "weekly",
    price: 3000,
    durationDays: 7,
    estimates: { reach: 27000, messages: 680, purchases: 16 },
    features: [aiVideos(2, [1]), ...includedEverywhere],
  },
  {
    key: "monthly_basic",
    period: "monthly",
    price: 2500,
    durationDays: 30,
    estimates: { reach: 22000, messages: 570, purchases: 14 },
    features: [socialVideo, ...includedEverywhere],
  },
  {
    key: "monthly_plus",
    period: "monthly",
    price: 5000,
    durationDays: 30,
    estimates: { reach: 42000, messages: 1100, purchases: 27 },
    features: [aiVideos(2, [1, 3]), ...includedEverywhere],
    highlight: true,
  },
  {
    key: "monthly_pro",
    period: "monthly",
    price: 10000,
    durationDays: 30,
    estimates: { reach: 80000, messages: 2150, purchases: 52 },
    features: [aiVideos(4, [1, 2, 3, 4]), ...includedEverywhere],
  },
];

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
