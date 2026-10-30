import { sellerNotificationHref } from "@workspace/lib/notifications";

/**
 * Seller push alerts (ROADMAP.md F-06, migration 0124). Pure parts: which
 * bell notification types are pushed, the seller's per-type switches, which
 * claimed rows go to which device, and the payload. The sender lives in
 * push-alerts.server.ts.
 */

export const PUSH_CATEGORIES = ["newOrder", "orderProblem", "lowStock"] as const;
export type PushCategory = (typeof PUSH_CATEGORIES)[number];
export type PushPrefs = Record<PushCategory, boolean>;

/** No settings row means every switch is on. */
export const DEFAULT_PUSH_PREFS: PushPrefs = { newOrder: true, orderProblem: true, lowStock: true };

/**
 * `seller_notifications.type` → push switch. Types not listed are never
 * pushed (they stay in the bell). Low stock has no notification type yet:
 * F-10 adds one and maps it to "lowStock" here.
 */
const PUSH_TYPE_CATEGORY: Readonly<Record<string, PushCategory>> = {
  order_created: "newOrder",
  carrier_shipment_failed: "orderProblem",
  carrier_needs_attention: "orderProblem",
  // F-10 adds this seller_notifications type; pushed as soon as it exists.
  low_stock: "lowStock",
};

/** Where a pushed alert opens when the bell has no link for its type. */
const PUSH_CATEGORY_FALLBACK_PATH: Readonly<Record<PushCategory, string>> = {
  newOrder: "/orders",
  orderProblem: "/orders",
  lowStock: "/products",
};

/** Types with a push text in `pushAlerts.messages` (en.json / ar.json). */
export const PUSHED_NOTIFICATION_TYPES = Object.keys(PUSH_TYPE_CATEGORY);

export function pushCategoryOf(type: string): PushCategory | null {
  return Object.prototype.hasOwnProperty.call(PUSH_TYPE_CATEGORY, type) ? PUSH_TYPE_CATEGORY[type]! : null;
}

/** Only rows this recent are pushed; older ones are marked handled and dropped. */
export const PUSH_WINDOW_MINUTES = 60;
/** The most rows one dispatcher run claims. */
export const PUSH_CLAIM_LIMIT = 200;
/** Web Push TTL: a phone that is off for longer than this never shows a stale alert. */
export const PUSH_TTL_SECONDS = 60 * 60;

export type PushLocale = "ar" | "en";

export function pushLocale(value: unknown): PushLocale {
  return value === "en" ? "en" : "ar";
}

/** Settings row (or none) → switches. */
export function normalizePushPrefs(
  row: { newOrder?: boolean | null; orderProblem?: boolean | null; lowStock?: boolean | null } | null | undefined,
): PushPrefs {
  if (!row) return { ...DEFAULT_PUSH_PREFS };
  return {
    newOrder: row.newOrder ?? DEFAULT_PUSH_PREFS.newOrder,
    orderProblem: row.orderProblem ?? DEFAULT_PUSH_PREFS.orderProblem,
    lowStock: row.lowStock ?? DEFAULT_PUSH_PREFS.lowStock,
  };
}

export type VapidConfig = { publicKey: string; privateKey: string; subject: string };

const VAPID_KEY_RE = /^[A-Za-z0-9_-]+={0,2}$/;

/**
 * The VAPID keys from server env. Null (feature hidden, sender a no-op)
 * unless all three are set and look valid. The subject must be a mailto: or
 * https: URL (web-push requires it).
 */
export function parseVapidConfig(env: Record<string, string | undefined>): VapidConfig | null {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim() || env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
  const privateKey = env.VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = env.VAPID_SUBJECT?.trim() ?? "";
  if (!VAPID_KEY_RE.test(publicKey) || publicKey.length < 80 || publicKey.length > 100) return null;
  if (!VAPID_KEY_RE.test(privateKey) || privateKey.length < 40 || privateKey.length > 50) return null;
  if (!/^(mailto:\S+@\S+|https:\/\/\S+)$/.test(subject)) return null;
  return { publicKey, privateKey, subject };
}

/**
 * Push services the browsers use (Chrome/Edge/Android: FCM; Firefox:
 * Mozilla autopush; Edge legacy: WNS; Safari/iOS: Apple). The sender POSTs to
 * the endpoint, so anything else is refused: a forged endpoint can't turn
 * the dispatcher into a request proxy.
 */
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "android.googleapis.com",
  "push.services.mozilla.com",
  "notify.windows.com",
  "push.apple.com",
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

/** A path inside the dashboard, never another origin (`//x`, `/\x`, `https:`). */
export function safePushPath(path: string | null | undefined): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/";
  return path.length > 500 ? "/" : path;
}

export type PushCandidate = {
  id: string;
  sellerId: string;
  storeId: string | null;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
};

export type PushDevice = {
  id: string;
  sellerId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  locale: PushLocale;
};

export type PushDelivery = { row: PushCandidate; category: PushCategory; device: PushDevice };

/**
 * Which claimed rows go to which device: only pushed types, only rows inside
 * the window, only when the seller's switch is on, one delivery per device.
 */
export function planPushDeliveries(
  rows: PushCandidate[],
  prefsBySeller: Map<string, PushPrefs>,
  devicesBySeller: Map<string, PushDevice[]>,
  now: Date,
  windowMinutes: number = PUSH_WINDOW_MINUTES,
): PushDelivery[] {
  const oldest = now.getTime() - windowMinutes * 60_000;
  const deliveries: PushDelivery[] = [];
  for (const row of rows) {
    const category = pushCategoryOf(row.type);
    if (!category) continue;
    const created = Date.parse(row.createdAt);
    if (!Number.isFinite(created) || created < oldest) continue;
    const prefs = prefsBySeller.get(row.sellerId) ?? DEFAULT_PUSH_PREFS;
    if (!prefs[category]) continue;
    for (const device of devicesBySeller.get(row.sellerId) ?? []) {
      // A device row belongs to exactly one seller; never cross sellers.
      if (device.sellerId !== row.sellerId) continue;
      deliveries.push({ row, category, device });
    }
  }
  return deliveries;
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  lang: PushLocale;
  dir: "rtl" | "ltr";
};

/** Translator for the `pushAlerts.messages` namespace of one locale. */
export type PushTranslate = (key: string, values?: Record<string, string | number>) => string;

function dataString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === "string" ? value.slice(0, 40) : "";
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * The push text: order number and (for a store order) the formatted amount;
 * never customer names, phones or addresses. `amount` is already formatted
 * for the locale, or null.
 */
export function buildPushPayload(
  row: Pick<PushCandidate, "id" | "type" | "data">,
  locale: PushLocale,
  t: PushTranslate,
  amount: string | null = null,
): PushPayload {
  const orderNumber = dataString(row.data, "orderNumber");
  // low_stock rows (F-10, 0125) carry the product `name` and an optional `variantTitle`.
  const productName = [dataString(row.data, "name"), dataString(row.data, "variantTitle")].filter(Boolean).join(" · ");
  const values = { orderNumber, amount: amount ?? "", productName };
  const bodyKey = amount
    ? `${row.type}.bodyWithAmount`
    : productName && row.type === "low_stock"
      ? `${row.type}.bodyWithProduct`
      : `${row.type}.body`;
  const category = pushCategoryOf(row.type);
  const href =
    sellerNotificationHref({ type: row.type, data: row.data }) ??
    (category ? PUSH_CATEGORY_FALLBACK_PATH[category] : null);
  return {
    title: clip(t(`${row.type}.title`, values), 80),
    body: clip(t(bodyKey, values), 180),
    url: safePushPath(href),
    tag: `tallaby-${row.id}`,
    lang: locale,
    dir: locale === "ar" ? "rtl" : "ltr",
  };
}

/** The push service says the subscription is gone: delete it. */
export function isGonePushStatus(statusCode: unknown): boolean {
  return statusCode === 404 || statusCode === 410;
}

/** Order ids whose amount the payload shows: new store orders only (a marketplace order spans sellers). */
export function orderIdsNeedingAmount(rows: PushCandidate[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.type !== "order_created" || !row.storeId) continue;
    const orderId = row.data.orderId;
    if (typeof orderId === "string" && /^[0-9a-f-]{36}$/i.test(orderId)) ids.add(orderId);
  }
  return [...ids];
}
