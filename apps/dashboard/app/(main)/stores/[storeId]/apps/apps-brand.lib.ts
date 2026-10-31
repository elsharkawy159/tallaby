import {
  siGoogleanalytics,
  siGooglesheets,
  siGoogletagmanager,
  siMeta,
  siPaypal,
  siShopify,
  siSnapchat,
  siTiktok,
  type SimpleIcon,
} from "simple-icons";
import type { StoreAppKey } from "@workspace/lib/integrations";

/**
 * Brand mark and tile colours for every entry of the store apps catalog
 * (`STORE_APPS` in @workspace/lib/integrations). Marks without a Simple Icons
 * glyph use a generic shape on the brand colour until official assets exist.
 */
export type AppBrand = { icon: Pick<SimpleIcon, "path">; bg: string; fg: string; dark?: boolean };

/** A parcel: shipping companies with no Simple Icons mark. */
const PARCEL_ICON = {
  path: "M12 1.5 2.5 6.25v11.5L12 22.5l9.5-4.75V6.25L12 1.5Zm0 2.24 6.8 3.4-2.86 1.43-6.8-3.4L12 3.74ZM7.13 6.18l6.8 3.4L12 10.55 5.2 7.14l1.93-.96ZM4.5 8.76l6.5 3.25v7.73l-6.5-3.25V8.76Zm15 0v7.73L13 19.74v-7.73l6.5-3.25Z",
};

/** A card: payment gateways with no Simple Icons mark. */
const CARD_ICON = {
  path: "M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13Zm2 2.5h14V5.5a.5.5 0 0 0-.5-.5h-13a.5.5 0 0 0-.5.5V8Zm0 3v7.5c0 .28.22.5.5.5h13a.5.5 0 0 0 .5-.5V11H5Zm2 4h4v2H7v-2Z",
};

/** A sheet: carriers that take an uploaded Excel file (Wassalha). */
const SHEET_ICON = {
  path: "M6 2h8l6 6v12.5A1.5 1.5 0 0 1 18.5 22h-13A1.5 1.5 0 0 1 4 20.5v-17A1.5 1.5 0 0 1 5.5 2H6Zm7 1.8V8.5a.5.5 0 0 0 .5.5h4.7L13 3.8ZM7 12v2h4v-2H7Zm6 0v2h4v-2h-4Zm-6 4v2h4v-2H7Zm6 0v2h4v-2h-4Z",
};

/** Sparkles: the AI assistants app (F-29), which covers several assistant brands. */
const SPARKLES_ICON = {
  path: "M10 2.5c.4 0 .75.27.86.66l.9 3.17a4.5 4.5 0 0 0 3.1 3.1l3.17.9a.9.9 0 0 1 0 1.73l-3.17.9a4.5 4.5 0 0 0-3.1 3.1l-.9 3.17a.9.9 0 0 1-1.72 0l-.91-3.17a4.5 4.5 0 0 0-3.1-3.1l-3.17-.9a.9.9 0 0 1 0-1.73l3.17-.9a4.5 4.5 0 0 0 3.1-3.1l.9-3.17c.12-.39.47-.66.87-.66Zm8.5 11c.33 0 .62.22.71.54l.32 1.1a2 2 0 0 0 1.33 1.33l1.1.32a.74.74 0 0 1 0 1.42l-1.1.32a2 2 0 0 0-1.33 1.33l-.32 1.1a.74.74 0 0 1-1.42 0l-.32-1.1a2 2 0 0 0-1.33-1.33l-1.1-.32a.74.74 0 0 1 0-1.42l1.1-.32a2 2 0 0 0 1.33-1.33l.32-1.1c.09-.32.38-.54.71-.54Zm0-12c.3 0 .55.19.64.47l.22.74a1.5 1.5 0 0 0 1.03 1.03l.74.22a.67.67 0 0 1 0 1.28l-.74.22a1.5 1.5 0 0 0-1.03 1.03l-.22.74a.67.67 0 0 1-1.28 0l-.22-.74a1.5 1.5 0 0 0-1.03-1.03l-.74-.22a.67.67 0 0 1 0-1.28l.74-.22a1.5 1.5 0 0 0 1.03-1.03l.22-.74c.09-.28.35-.47.64-.47Z",
};

export const APP_BRANDS: Record<StoreAppKey, AppBrand> = {
  ai_assistants: { icon: SPARKLES_ICON, bg: "#1F1A2E", fg: "#F4B860", dark: true },
  meta_pixel: { icon: siMeta, bg: "#0866FF", fg: "#FFFFFF" },
  meta_capi: { icon: siMeta, bg: "#0B1F3A", fg: "#5AA0FF", dark: true },
  google_analytics: { icon: siGoogleanalytics, bg: "#F9AB00", fg: "#FFFFFF" },
  google_tag_manager: { icon: siGoogletagmanager, bg: "#246FDB", fg: "#FFFFFF" },
  tiktok_pixel: { icon: siTiktok, bg: "#000000", fg: "#FFFFFF", dark: true },
  snapchat_pixel: { icon: siSnapchat, bg: "#FFFC00", fg: "#000000" },
  shopify_import: { icon: siShopify, bg: "#95BF47", fg: "#FFFFFF" },
  google_sheets: { icon: siGooglesheets, bg: "#0F9D58", fg: "#FFFFFF" },
  bosta: { icon: PARCEL_ICON, bg: "#E30613", fg: "#FFFFFF" },
  wassalha: { icon: SHEET_ICON, bg: "#003F87", fg: "#FFD100", dark: true },
  mylerz: { icon: PARCEL_ICON, bg: "#1B2A6B", fg: "#FFFFFF", dark: true },
  jt_express: { icon: PARCEL_ICON, bg: "#D7000F", fg: "#FFFFFF" },
  aramex: { icon: PARCEL_ICON, bg: "#DC291E", fg: "#FFFFFF" },
  paymob: { icon: CARD_ICON, bg: "#1863DC", fg: "#FFFFFF" },
  kashier: { icon: CARD_ICON, bg: "#5B2BE0", fg: "#FFFFFF" },
  paypal: { icon: siPaypal, bg: "#003087", fg: "#FFFFFF", dark: true },
  tallaby_pay: { icon: CARD_ICON, bg: "#0A5C4F", fg: "#FFFFFF", dark: true },
};
