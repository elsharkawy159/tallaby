import {
  siGoogleanalytics,
  siGooglesearchconsole,
  siGooglesheets,
  siGoogletagmanager,
  siMeta,
  siPaypal,
  siShopify,
  siSnapchat,
  siTiktok,
  siWhatsapp,
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

/** A "no" sign: Remove Tallaby badge (F-110). */
const HIDE_ICON = {
  path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 0 1 6.32 12.9L7.1 5.68A7.96 7.96 0 0 1 12 4Zm-8 8c0-1.85.63-3.55 1.68-4.9L16.9 18.32A8 8 0 0 1 4 12Z",
};

/** A tag with a down arrow: Downsell (F-116). */
const DOWNSELL_ICON = {
  path: "M3 4.5A1.5 1.5 0 0 1 4.5 3h6.38a1.5 1.5 0 0 1 1.06.44l8.62 8.62a1.5 1.5 0 0 1 0 2.12l-6.38 6.38a1.5 1.5 0 0 1-2.12 0L3.44 11.94A1.5 1.5 0 0 1 3 10.88V4.5ZM7.5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 4.5v3.09l-1.3-1.3-1.4 1.42L14 17.4l3.7-3.7-1.4-1.42-1.3 1.3V10.5h-2Z",
};

/** Two linked boxes: Cross-selling (F-32). */
const CROSS_SELL_ICON = {
  path: "M4.5 3h5A1.5 1.5 0 0 1 11 4.5v5A1.5 1.5 0 0 1 9.5 11h-5A1.5 1.5 0 0 1 3 9.5v-5A1.5 1.5 0 0 1 4.5 3Zm10 10h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5a1.5 1.5 0 0 1 1.5-1.5ZM14 5h3.5A2.5 2.5 0 0 1 20 7.5V11h-2V7.5a.5.5 0 0 0-.5-.5H14V5ZM4 13h2v3.5a.5.5 0 0 0 .5.5H10v2H6.5A2.5 2.5 0 0 1 4 16.5V13Z",
};

/** A small toast card: Sales pop-up (F-22). */
const TOAST_ICON = {
  path: "M4.5 12h15a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-4A2.5 2.5 0 0 1 4.5 12Zm1.5 3v3h3v-3H6Zm5 .5v1h7v-1h-7ZM12 2.5a5 5 0 0 1 5 5V9h-2V7.5a3 3 0 0 0-6 0V9H7V7.5a5 5 0 0 1 5-5Z",
};

/** A calculator: Round prices (F-112). */
const CALCULATOR_ICON = {
  path: "M7 2h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm1 3v4h8V5H8Zm0 7v2h2v-2H8Zm3 0v2h2v-2h-2Zm3 0v2h2v-2h-2Zm-6 4v2h2v-2H8Zm3 0v2h2v-2h-2Zm3 0v2h2v-2h-2Z",
};

/** A page with a progress bar along its top: Top loader (owner, 2026-11-27). */
const TOP_LOADER_ICON = {
  path: "M5 3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v1h11V5H5Zm-1 5v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8H4Zm3 2h10v2H7v-2Zm0 3h6v2H7v-2Z",
};

/** Features with their own dashboard page, listed as apps too (owner, 2026-11-27). */
const TICKET_ICON = {
  path: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6V6Z",
};
const PERCENT_ICON = {
  path: "M7 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm10 10a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM17.3 4.3l1.4 1.4-12 12-1.4-1.4 12-12Z",
};
const LAYERS_ICON = { path: "M4 4h16v4H4V4Zm0 6h16v4H4v-4Zm0 6h16v4H4v-4Z" };
const ENVELOPE_ICON = {
  path: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v.3l-9 5.4-9-5.4V6Zm0 2.6 9 5.4 9-5.4V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.6Z",
};
const GRID_ICON = { path: "M4 3h7v8H4V3Zm9 0h7v8h-7V3ZM4 13h7v8H4v-8Zm9 0h7v8h-7v-8Z" };
const SHIELD_ICON = { path: "M12 2 20 5v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3Z" };
const CART_ICON = {
  path: "M2 3h2.6l.6 3H22l-2.4 8.4A2 2 0 0 1 17.7 16H8.6a2 2 0 0 1-2-1.6L4.2 5H2V3Zm7 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z",
};

const PHONE_ICON = {
  path: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 3v13h8V5H8Zm3 14v1h2v-1h-2Z",
};
const GLOBE_ICON = {
  path: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.6 2.2A8 8 0 0 0 4.1 11h3.4c.2-2.6.9-5 2.9-6.8ZM13.6 4.2c2 1.8 2.7 4.2 2.9 6.8h3.4a8 8 0 0 0-6.3-6.8ZM14.5 11c-.2-2.5-1-4.5-2.5-6-1.5 1.5-2.3 3.5-2.5 6h5Zm-5 2c.2 2.5 1 4.5 2.5 6 1.5-1.5 2.3-3.5 2.5-6h-5Zm-5.4 0a8 8 0 0 0 6.3 6.8c-2-1.8-2.7-4.2-2.9-6.8H4.1Zm12.4 0c-.2 2.6-.9 5-2.9 6.8a8 8 0 0 0 6.3-6.8h-3.4Z",
};
const PHOTO_ICON = {
  path: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm4.5 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM4 17h16l-5-6-3.5 4-2.5-2.5L4 17Z",
};
/** A gift box: product bundles (F-07f). */
const BOX_ICON = {
  path: "M3 7h18v4H3V7Zm1 6h7v8H5a1 1 0 0 1-1-1v-7Zm9 0h7v7a1 1 0 0 1-1 1h-6v-8ZM11 7h2v4h-2V7Zm1-.5C10.5 3.5 7 3 7 5s3 1.5 5 1.5Zm0 0C13.5 3.5 17 3 17 5s-3 1.5-5 1.5Z",
};

const GLYPHS: Record<AppId, Pick<SimpleIcon, "path">> = {
  ai_assistants: SPARKLES_ICON,
  price_rounding: CALCULATOR_ICON,
  coupons: TICKET_ICON,
  automatic_discounts: PERCENT_ICON,
  quantity_offers: LAYERS_ICON,
  bundles: BOX_ICON,
  email_campaigns: ENVELOPE_ICON,
  catalog_share: GRID_ICON,
  order_protection: SHIELD_ICON,
  missed_orders: CART_ICON,
  store_app: PHONE_ICON,
  languages: GLOBE_ICON,
  shoppable_gallery: PHOTO_ICON,
  top_loader: TOP_LOADER_ICON,
  min_order: LAYERS_ICON,
  downsell: DOWNSELL_ICON,
  cross_sell: CROSS_SELL_ICON,
  sales_popup: TOAST_ICON,
  customer_notifications: BELL_ICON,
  whatsapp: siWhatsapp,
  whatsapp_button: siWhatsapp,
  sms: MESSAGE_ICON,
  size_chart: RULER_ICON,
  remove_branding: HIDE_ICON,
  product_feeds: FEED_ICON,
  qr_codes: { path: "M2 2h8v8H2zm2 2v4h4V4zm10-2h8v8h-8zm2 2v4h4V4zM2 14h8v8H2zm2 2v4h4v-4zm10-2h4v4h-4zm4 4h4v4h-4zm2-4h2v2h-2zm-6 6h2v2h-2z" },
  meta_pixel: siMeta,
  meta_capi: siMeta,
  google_analytics: siGoogleanalytics,
  google_search_console: siGooglesearchconsole,
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
  easykash: CARD_ICON,
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
