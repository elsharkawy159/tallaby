/**
 * Back-in-stock alerts (ROADMAP.md F-23a, 0126). Pure rules, safe on the
 * client: the email a visitor types, the subscriber locale, the unsubscribe
 * link and the batch sizes the cron uses.
 */

/** Emails per cron run (each is one backend call; the route has 300 s). */
export const STOCK_ALERT_BATCH = 100;
/** An alert older than this is never sent (the visitor has long moved on). */
export const STOCK_ALERT_MAX_AGE_DAYS = 180;
/** Open alerts one email may hold on one store (stops one address flooding a store). */
export const STOCK_ALERT_MAX_OPEN_PER_EMAIL = 30;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const TOKEN_RE = /^[0-9a-f]{32,128}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Trimmed and lower-cased; null when it is not a plausible address (≤ 254 chars). */
export function normalizeAlertEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  return EMAIL_RE.test(email) ? email : null;
}

/** The subscriber's mail language: English only when asked for, else Arabic (the default locale). */
export function alertLocale(input: unknown): "ar" | "en" {
  return input === "en" ? "en" : "ar";
}

export function isUuid(input: unknown): input is string {
  return typeof input === "string" && UUID_RE.test(input);
}

export function isUnsubscribeToken(input: unknown): input is string {
  return typeof input === "string" && TOKEN_RE.test(input);
}

/**
 * The unsubscribe link on the store's own origin (`/api` is served on every
 * host, see apps/ecommerce/proxy.ts).
 */
export function stockAlertUnsubscribeUrl(storeOrigin: string, token: string): string {
  return `${storeOrigin.replace(/\/+$/, "")}/api/stock-alerts/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * Whether the visitor's choice is in stock now, as the store product page
 * counts it: the selected variant's stock (untracked = 0), else the product's
 * own count, else what its variants hold.
 */
export function alertTargetInStock(input: {
  variantId: string | null;
  variantStock: number | null | undefined;
  productQuantity: number | string | null | undefined;
  variantStocks: Array<number | null | undefined>;
}): boolean {
  if (input.variantId) return Number(input.variantStock ?? 0) > 0;
  if (Number(input.productQuantity ?? 0) > 0) return true;
  return input.variantStocks.some((stock) => Number(stock ?? 0) > 0);
}
