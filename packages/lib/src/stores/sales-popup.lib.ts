import { getGovernorateLabel, normalizeGovernorate } from "../shipping/governorate.lib";

/**
 * Sales pop-up (ROADMAP.md F-22): small toasts on the store website, "Someone
 * from Giza ordered <product> 12 minutes ago". Pure, safe on the client.
 *
 * Only real orders of that store are shown (owner's real-data rule,
 * 2026-10-27): no names, phones or addresses, just the product, the
 * governorate and how long ago. The feed is hidden while the store has fewer
 * than `SALES_FEED_MIN_ORDERS` recent orders, so a store never shows one
 * lonely order over and over.
 *
 * Settings live in `stores.settings.salesPopup` (other keys kept); no migration.
 */

/** Page kinds the seller can pick. Cart, checkout and account pages never show it. */
export const SALES_POPUP_PAGES = ["home", "catalog", "product", "other"] as const;
export type SalesPopupPage = (typeof SALES_POPUP_PAGES)[number];

/** Seconds before the first toast and between two toasts. */
export const SALES_POPUP_DELAY = { min: 3, max: 120, default: 8 } as const;

export type StoreSalesPopupSettings = {
  /** Off until the seller turns it on. */
  enabled: boolean;
  delaySeconds: number;
  /** Where it shows; never empty when enabled (an empty pick falls back to all). */
  pages: SalesPopupPage[];
};

export const SALES_POPUP_DEFAULTS: StoreSalesPopupSettings = {
  enabled: false,
  delaySeconds: SALES_POPUP_DELAY.default,
  pages: [...SALES_POPUP_PAGES],
};

function clampDelay(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return SALES_POPUP_DELAY.default;
  return Math.min(SALES_POPUP_DELAY.max, Math.max(SALES_POPUP_DELAY.min, Math.round(n)));
}

function cleanPages(value: unknown): SalesPopupPage[] {
  if (!Array.isArray(value)) return [...SALES_POPUP_PAGES];
  // Kept in the canonical order, without duplicates or unknown values.
  const picked = SALES_POPUP_PAGES.filter((page) => value.includes(page));
  return picked.length ? picked : [...SALES_POPUP_PAGES];
}

/** The store's sales pop-up settings from `stores.settings`, every field re-validated. */
export function parseStoreSalesPopup(settings: unknown): StoreSalesPopupSettings {
  const raw = (settings as { salesPopup?: unknown } | null | undefined)?.salesPopup;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...SALES_POPUP_DEFAULTS, pages: [...SALES_POPUP_DEFAULTS.pages] };
  const value = raw as { enabled?: unknown; delaySeconds?: unknown; pages?: unknown };
  return { enabled: value.enabled === true, delaySeconds: clampDelay(value.delaySeconds), pages: cleanPages(value.pages) };
}

/** A save from the dashboard, cleaned the same way (never trusted as sent). */
export function normalizeSalesPopupInput(input: unknown): StoreSalesPopupSettings {
  return parseStoreSalesPopup({ salesPopup: input });
}

/**
 * Which page kind a store-website path is (locale prefix already stripped,
 * as `usePathname` from `@/i18n/navigation` gives it), or null for pages that
 * never show the pop-up: cart, checkout, orders, account, sign-in, wishlist.
 */
export function salesPopupPageKind(pathname: string | null | undefined): SalesPopupPage | null {
  const path = (pathname || "/").split(/[?#]/)[0]!.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  const first = path.split("/")[1]!.toLowerCase();
  if (NEVER_SEGMENTS.has(first)) return null;
  if (first === "products") return path.split("/").length > 2 ? "product" : "catalog";
  return "other";
}

const NEVER_SEGMENTS = new Set([
  "cart",
  "checkout",
  "orders",
  "order",
  "profile",
  "account",
  "auth",
  "login",
  "sign-in",
  "signin",
  "signup",
  "sign-up",
  "register",
  "wishlist",
  "track",
  "payment",
  "thank-you",
]);

export function salesPopupShowsOn(settings: Pick<StoreSalesPopupSettings, "enabled" | "pages">, pathname: string | null | undefined): boolean {
  if (!settings.enabled) return false;
  const kind = salesPopupPageKind(pathname);
  return kind != null && settings.pages.includes(kind);
}

/** Orders newer than this count as recent. */
export const SALES_FEED_DAYS = 7;
/** At most this many toasts per visit. */
export const SALES_FEED_LIMIT = 10;
/** Fewer recent orders than this: no pop-up at all. */
export const SALES_FEED_MIN_ORDERS = 3;
/** Long product names are cut in the toast. */
const PRODUCT_MAX = 80;

/** One recent order as the server reads it (never sent to the browser as is). */
export type SalesFeedRow = { product: string | null; state: string | null; createdAt: string | null };

/** What the browser gets: no ids, names, phones or addresses. */
export type SalesFeedItem = {
  product: string;
  /** Localized governorate, or null when the address has none we recognise. */
  governorate: string | null;
  minutesAgo: number;
};

/**
 * The public feed from recent order rows (newest first): only the product,
 * the governorate and how many minutes ago. Empty when there are fewer than
 * `SALES_FEED_MIN_ORDERS` usable recent orders.
 */
export function buildSalesFeed(rows: readonly SalesFeedRow[], locale: string, now: number): SalesFeedItem[] {
  const since = now - SALES_FEED_DAYS * 86_400_000;
  const items: SalesFeedItem[] = [];
  for (const row of rows) {
    const at = row.createdAt ? Date.parse(row.createdAt) : NaN;
    const product = row.product?.trim().replace(/\s+/g, " ");
    if (!product || !Number.isFinite(at) || at < since) continue;
    const code = normalizeGovernorate(row.state);
    items.push({
      product: product.length > PRODUCT_MAX ? `${product.slice(0, PRODUCT_MAX - 1).trimEnd()}…` : product,
      governorate: code ? getGovernorateLabel(code, locale) : null,
      minutesAgo: Math.max(0, Math.floor((now - at) / 60_000)),
    });
    if (items.length >= SALES_FEED_LIMIT) break;
  }
  return items.length >= SALES_FEED_MIN_ORDERS ? items : [];
}

/** "12 minutes ago" parts for `Intl.RelativeTimeFormat` (minutes, then hours, then days). */
export function salesPopupAgo(minutes: number): { value: number; unit: "minute" | "hour" | "day" } {
  const m = Math.max(0, Math.floor(minutes));
  if (m < 60) return { value: m, unit: "minute" };
  if (m < 24 * 60) return { value: Math.floor(m / 60), unit: "hour" };
  return { value: Math.floor(m / (24 * 60)), unit: "day" };
}
