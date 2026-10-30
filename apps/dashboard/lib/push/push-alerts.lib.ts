import { sellerNotificationHref } from "@workspace/lib/notifications";
import { clipPushText, safePushPath, type PushLocale, type PushPayload } from "@workspace/lib/push";

export {
  isAllowedPushEndpoint,
  isGonePushStatus,
  parseVapidConfig,
  PUSH_TTL_SECONDS,
  safePushPath,
  type PushLocale,
  type PushPayload,
  type VapidConfig,
} from "@workspace/lib/push";

/**
 * Seller push alerts (ROADMAP.md F-06, migrations 0124 and 0131). Pure parts:
 * which bell notification types are pushed, the seller's per-type switches,
 * which claimed rows go to which device, and the payload. The sender lives in
 * push-alerts.server.ts; the Web Push core is shared in @workspace/lib/push.
 */

export const PUSH_CATEGORIES = ["newOrder", "orderProblem", "lowStock", "account"] as const;
export type PushCategory = (typeof PUSH_CATEGORIES)[number];
export type PushPrefs = Record<PushCategory, boolean>;

/** No settings row means every switch is on. */
export const DEFAULT_PUSH_PREFS: PushPrefs = { newOrder: true, orderProblem: true, lowStock: true, account: true };

/**
 * `seller_notifications.type` → push switch. Every bell type is pushed
 * (F-06d, 0131); a type in neither this map nor ALWAYS_PUSHED_TYPES stays in
 * the bell only.
 */
const PUSH_TYPE_CATEGORY: Readonly<Record<string, PushCategory>> = {
  order_created: "newOrder",
  carrier_shipment_failed: "orderProblem",
  carrier_needs_attention: "orderProblem",
  low_stock: "lowStock",
  top_up_approved: "account",
  top_up_rejected: "account",
  question_received: "account",
  review_received: "account",
  referral_commission_earned: "account",
  referral_payout_paid: "account",
  referral_payout_rejected: "account",
  welcome_gift_granted: "account",
  welcome_gift_expiring: "account",
  welcome_gift_expired: "account",
};

/** Messages from the Tallaby team (Admin › Sellers, 0131): pushed to every device, no switch. */
export const ALWAYS_PUSHED_TYPES: ReadonlySet<string> = new Set(["admin_message"]);

/** Where a pushed alert opens when the bell has no link for its type. */
const PUSH_CATEGORY_FALLBACK_PATH: Readonly<Record<PushCategory, string>> = {
  newOrder: "/orders",
  orderProblem: "/orders",
  lowStock: "/products",
  account: "/",
};

/**
 * Types with their own push text in `pushAlerts.messages` (en.json /
 * ar.json). The other pushed types reuse the bell's `notifications.types`
 * text, and `admin_message` carries the admin's own title and body.
 */
export const PUSHED_NOTIFICATION_TYPES = ["order_created", "carrier_shipment_failed", "carrier_needs_attention", "low_stock"];
const OWN_PUSH_TEXT: ReadonlySet<string> = new Set(PUSHED_NOTIFICATION_TYPES);

/** Every pushed type that reuses the bell text. */
export const BELL_TEXT_PUSH_TYPES = Object.keys(PUSH_TYPE_CATEGORY).filter((type) => !OWN_PUSH_TEXT.has(type));

export function pushCategoryOf(type: string): PushCategory | null {
  return Object.prototype.hasOwnProperty.call(PUSH_TYPE_CATEGORY, type) ? PUSH_TYPE_CATEGORY[type]! : null;
}

/** Only rows this recent are pushed; older ones are marked handled and dropped. */
export const PUSH_WINDOW_MINUTES = 60;
/** The most rows one dispatcher run claims. */
export const PUSH_CLAIM_LIMIT = 200;

export function pushLocale(value: unknown): PushLocale {
  return value === "en" ? "en" : "ar";
}

/** Settings row (or none) → switches. */
export function normalizePushPrefs(
  row:
    | { newOrder?: boolean | null; orderProblem?: boolean | null; lowStock?: boolean | null; account?: boolean | null }
    | null
    | undefined,
): PushPrefs {
  if (!row) return { ...DEFAULT_PUSH_PREFS };
  return {
    newOrder: row.newOrder ?? DEFAULT_PUSH_PREFS.newOrder,
    orderProblem: row.orderProblem ?? DEFAULT_PUSH_PREFS.orderProblem,
    lowStock: row.lowStock ?? DEFAULT_PUSH_PREFS.lowStock,
    account: row.account ?? DEFAULT_PUSH_PREFS.account,
  };
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

/** `category` is null for ALWAYS_PUSHED_TYPES (no switch). */
export type PushDelivery = { row: PushCandidate; category: PushCategory | null; device: PushDevice };

/**
 * Which claimed rows go to which device: only pushed types, only rows inside
 * the window, only when the seller's switch is on (Tallaby messages have no
 * switch), one delivery per device.
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
    const always = ALWAYS_PUSHED_TYPES.has(row.type);
    const category = always ? null : pushCategoryOf(row.type);
    if (!always && !category) continue;
    const created = Date.parse(row.createdAt);
    if (!Number.isFinite(created) || created < oldest) continue;
    const prefs = prefsBySeller.get(row.sellerId) ?? DEFAULT_PUSH_PREFS;
    if (category && !prefs[category]) continue;
    for (const device of devicesBySeller.get(row.sellerId) ?? []) {
      // A device row belongs to exactly one seller; never cross sellers.
      if (device.sellerId !== row.sellerId) continue;
      deliveries.push({ row, category, device });
    }
  }
  return deliveries;
}

/** Translator for one namespace of one locale. */
export type PushTranslate = (key: string, values?: Record<string, string | number>) => string;

/**
 * The bell's own text for a pushed type without a push text: the
 * `notifications.types` translator and the values the bell shows
 * (`sellerNotificationValues`).
 */
export type PushBellText = { t: PushTranslate; values: Record<string, string | number> };

function dataString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === "string" ? value.slice(0, 40) : "";
}

/**
 * The push text: order number and (for a store order) the formatted amount;
 * never customer names, phones or addresses. `amount` is already formatted
 * for the locale, or null. Types without their own push text use `bell`; a
 * Tallaby message shows the admin's own title and body.
 */
export function buildPushPayload(
  row: Pick<PushCandidate, "id" | "type" | "data">,
  locale: PushLocale,
  t: PushTranslate,
  amount: string | null = null,
  bell?: PushBellText,
): PushPayload {
  const base = { tag: `tallaby-${row.id}`, lang: locale, dir: locale === "ar" ? "rtl" : "ltr" } as const;
  const href = sellerNotificationHref({ type: row.type, data: row.data });

  if (row.type === "admin_message") {
    const title = typeof row.data.title === "string" ? row.data.title : "";
    const body = typeof row.data.body === "string" ? row.data.body : "";
    return {
      ...base,
      title: clipPushText(title || (locale === "ar" ? "طلبي" : "Tallaby"), 80),
      body: clipPushText(body, 180),
      url: safePushPath(href),
    };
  }

  const category = pushCategoryOf(row.type);
  const url = safePushPath(href ?? (category ? PUSH_CATEGORY_FALLBACK_PATH[category] : null));

  if (!OWN_PUSH_TEXT.has(row.type) && bell) {
    return {
      ...base,
      title: clipPushText(bell.t(`${row.type}.title`, bell.values), 80),
      body: clipPushText(bell.t(`${row.type}.body`, bell.values), 180),
      url,
    };
  }

  const orderNumber = dataString(row.data, "orderNumber");
  // low_stock rows (F-10, 0125) carry the product `name` and an optional `variantTitle`.
  const productName = [dataString(row.data, "name"), dataString(row.data, "variantTitle")].filter(Boolean).join(" · ");
  const values = { orderNumber, amount: amount ?? "", productName };
  const bodyKey = amount
    ? `${row.type}.bodyWithAmount`
    : productName && row.type === "low_stock"
      ? `${row.type}.bodyWithProduct`
      : `${row.type}.body`;
  return {
    ...base,
    title: clipPushText(t(`${row.type}.title`, values), 80),
    body: clipPushText(t(bodyKey, values), 180),
    url,
  };
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
