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
import { APPS, type AppId } from "@workspace/apps";
import type { StoreAppKey } from "@workspace/lib/integrations";

/**
 * Brand mark and tile for every App Center app. Colours and the logo file
 * come from the app's manifest (`icon` in @workspace/apps, F-93); only the
 * SVG glyph lives here, since Simple Icons is a dashboard dependency. Marks
 * without a Simple Icons glyph use the company's own logo (`image`, from its
 * website or Wikimedia Commons); `icon` stays as the fallback shape.
 */
export type AppBrand = {
  icon: Pick<SimpleIcon, "path">;
  bg: string;
  fg: string;
  dark?: boolean;
  /** The brand's own square logo in `public/app-logos`; shown instead of `icon` when set. */
  image?: string;
};

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

/** Bell: customer order notifications (F-63). */
const BELL_ICON = {
  path: "M12 2.5a6.5 6.5 0 0 0-6.5 6.5c0 3.6-.9 5.7-1.7 6.9-.4.6 0 1.6.8 1.6h14.8c.8 0 1.2-1 .8-1.6-.8-1.2-1.7-3.3-1.7-6.9A6.5 6.5 0 0 0 12 2.5Zm-2.6 16.5a2.7 2.7 0 0 0 5.2 0H9.4Z",
};

/** Speech bubble: SMS (F-62). */
const MESSAGE_ICON = {
  path: "M4.5 3.5h15A2.5 2.5 0 0 1 22 6v9.5a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.4c-.6.4-1.4 0-1.4-.8V18A2.5 2.5 0 0 1 2 15.5V6a2.5 2.5 0 0 1 2.5-2.5Z",
};

/** A product grid: Product feeds (F-11b). */
const FEED_ICON = {
  path: "M4.5 3h5A1.5 1.5 0 0 1 11 4.5v5A1.5 1.5 0 0 1 9.5 11h-5A1.5 1.5 0 0 1 3 9.5v-5A1.5 1.5 0 0 1 4.5 3Zm10 0h5A1.5 1.5 0 0 1 21 4.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 13 9.5v-5A1.5 1.5 0 0 1 14.5 3Zm-10 10h5a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 9.5 21h-5A1.5 1.5 0 0 1 3 19.5v-5A1.5 1.5 0 0 1 4.5 13Zm12.5 0a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2h-2a1 1 0 1 1 0-2h2v-2a1 1 0 0 1 1-1Z",
};

/** A tape measure: the Size chart app (F-92). */
const RULER_ICON = {
  path: "M3.5 7h17A1.5 1.5 0 0 1 22 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 15.5v-7A1.5 1.5 0 0 1 3.5 7Zm2 2v3.5h1.5V9H5.5Zm3.5 0v2.5h1.5V9H9Zm3.5 0v3.5H14V9h-1.5Zm3.5 0v2.5h1.5V9H16Z",
};

const GLYPHS: Record<AppId, Pick<SimpleIcon, "path">> = {
  ai_assistants: SPARKLES_ICON,
  customer_notifications: BELL_ICON,
  sms: MESSAGE_ICON,
  size_chart: RULER_ICON,
  product_feeds: FEED_ICON,
  meta_pixel: siMeta,
  meta_capi: siMeta,
  google_analytics: siGoogleanalytics,
  google_tag_manager: siGoogletagmanager,
  tiktok_pixel: siTiktok,
  snapchat_pixel: siSnapchat,
  shopify_import: siShopify,
  google_sheets: siGooglesheets,
  bosta: PARCEL_ICON,
  wassalha: SHEET_ICON,
  mylerz: PARCEL_ICON,
  jt_express: PARCEL_ICON,
  aramex: PARCEL_ICON,
  paymob: CARD_ICON,
  kashier: CARD_ICON,
  paytabs: CARD_ICON,
  moyasar: CARD_ICON,
  paylink: CARD_ICON,
  tabby: CARD_ICON,
  paypal: siPaypal,
  tallaby_pay: CARD_ICON,
};

export const APP_BRANDS = Object.fromEntries(
  APPS.map((app) => [
    app.id,
    {
      icon: GLYPHS[app.id],
      bg: app.icon.background,
      fg: app.icon.foreground,
      ...(app.icon.dark ? { dark: true } : {}),
      ...(app.icon.image ? { image: app.icon.image } : {}),
    } satisfies AppBrand,
  ]),
) as Record<StoreAppKey, AppBrand>;
