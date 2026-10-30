import { createTranslator } from "next-intl";
import {
  and,
  asc,
  db,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  orders,
  sellerNotifications,
  sellerPushSettings,
  sellerPushSubscriptions,
  sql,
} from "@workspace/db";
import { sellerNotificationValues } from "@workspace/lib/notifications";
import { sendWebPushes, type WebPushJob } from "@workspace/lib/push/server";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";
import { formatMoney } from "@/lib/i18n/format";
import type { PushSubscriptionInput } from "./push-alerts.dto";
import {
  BELL_TEXT_PUSH_TYPES,
  buildPushPayload,
  normalizePushPrefs,
  orderIdsNeedingAmount,
  parseVapidConfig,
  planPushDeliveries,
  pushLocale,
  PUSH_CLAIM_LIMIT,
  PUSH_WINDOW_MINUTES,
  type PushCandidate,
  type PushDevice,
  type PushLocale,
  type PushPayload,
  type PushPrefs,
  type PushTranslate,
  type VapidConfig,
} from "./push-alerts.lib";

/**
 * Seller push alerts (ROADMAP.md F-06, 0124): subscriptions, switches and the
 * dispatcher. The tables are server-only; callers pass the seller id from
 * the session (requireSeller), never from the client.
 */

/** VAPID keys from server env, or null: the feature is hidden and sending is a no-op. */
export function getVapidConfig(): VapidConfig | null {
  return parseVapidConfig(process.env);
}

/** The public key only (safe for the browser), or null when push is off. */
export function getVapidPublicKey(): string | null {
  return getVapidConfig()?.publicKey ?? null;
}

export async function getSellerPushPrefs(sellerId: string): Promise<PushPrefs> {
  const [row] = await db
    .select({
      newOrder: sellerPushSettings.newOrder,
      orderProblem: sellerPushSettings.orderProblem,
      lowStock: sellerPushSettings.lowStock,
      account: sellerPushSettings.account,
    })
    .from(sellerPushSettings)
    .where(eq(sellerPushSettings.sellerId, sellerId))
    .limit(1);
  return normalizePushPrefs(row);
}

export async function saveSellerPushPrefs(sellerId: string, prefs: PushPrefs): Promise<void> {
  await db
    .insert(sellerPushSettings)
    .values({ sellerId, ...prefs })
    .onConflictDoUpdate({
      target: sellerPushSettings.sellerId,
      set: { ...prefs, updatedAt: sql`now()` },
    });
}

/**
 * Saves this device for the seller. The endpoint is unique: a device that
 * was saved for another account (signed out, other seller signed in) moves
 * to this one.
 */
export async function saveSellerPushSubscription(
  sellerId: string,
  input: PushSubscriptionInput,
  meta: { userAgent: string | null; locale: PushLocale },
): Promise<void> {
  const values = {
    sellerId,
    endpoint: input.endpoint,
    p256dh: input.keys.p256dh,
    auth: input.keys.auth,
    userAgent: meta.userAgent ? meta.userAgent.slice(0, 300) : null,
    locale: meta.locale,
  };
  await db
    .insert(sellerPushSubscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: sellerPushSubscriptions.endpoint,
      set: {
        sellerId: values.sellerId,
        p256dh: values.p256dh,
        auth: values.auth,
        userAgent: values.userAgent,
        locale: values.locale,
        updatedAt: sql`now()`,
      },
    });
}

/** Removes the seller's own device; another seller's endpoint matches nothing. */
export async function deleteSellerPushSubscription(sellerId: string, endpoint: string): Promise<void> {
  await db
    .delete(sellerPushSubscriptions)
    .where(and(eq(sellerPushSubscriptions.sellerId, sellerId), eq(sellerPushSubscriptions.endpoint, endpoint)));
}

async function loadDevices(sellerIds: string[]): Promise<Map<string, PushDevice[]>> {
  const map = new Map<string, PushDevice[]>();
  if (sellerIds.length === 0) return map;
  const rows = await db
    .select({
      id: sellerPushSubscriptions.id,
      sellerId: sellerPushSubscriptions.sellerId,
      endpoint: sellerPushSubscriptions.endpoint,
      p256dh: sellerPushSubscriptions.p256dh,
      auth: sellerPushSubscriptions.auth,
      locale: sellerPushSubscriptions.locale,
    })
    .from(sellerPushSubscriptions)
    .where(inArray(sellerPushSubscriptions.sellerId, sellerIds));
  for (const row of rows) {
    const list = map.get(row.sellerId) ?? [];
    list.push({ ...row, locale: pushLocale(row.locale) });
    map.set(row.sellerId, list);
  }
  return map;
}

async function loadPrefs(sellerIds: string[]): Promise<Map<string, PushPrefs>> {
  const map = new Map<string, PushPrefs>();
  if (sellerIds.length === 0) return map;
  const rows = await db
    .select({
      sellerId: sellerPushSettings.sellerId,
      newOrder: sellerPushSettings.newOrder,
      orderProblem: sellerPushSettings.orderProblem,
      lowStock: sellerPushSettings.lowStock,
      account: sellerPushSettings.account,
    })
    .from(sellerPushSettings)
    .where(inArray(sellerPushSettings.sellerId, sellerIds));
  for (const row of rows) map.set(row.sellerId, normalizePushPrefs(row));
  return map;
}

/** Store order totals by order id (the caller checks the order is the notified store's). */
async function loadOrderAmounts(rows: PushCandidate[]): Promise<Map<string, { storeId: string | null; total: string }>> {
  const ids = orderIdsNeedingAmount(rows);
  const map = new Map<string, { storeId: string | null; total: string }>();
  if (ids.length === 0) return map;
  const found = await db
    .select({ id: orders.id, storeId: orders.storeId, total: orders.totalAmount })
    .from(orders)
    .where(inArray(orders.id, ids));
  for (const row of found) map.set(row.id, { storeId: row.storeId, total: row.total });
  return map;
}

type Messages = { pushAlerts: { messages: Record<string, unknown> }; notifications: { types: Record<string, unknown> } };

const TRANSLATORS: Record<PushLocale, PushTranslate> = {
  ar: makeTranslator("ar", arMessages, "push"),
  en: makeTranslator("en", enMessages, "push"),
};

/** The bell's `notifications.types` text, for pushed types without their own push text (0131). */
const BELL_TRANSLATORS: Record<PushLocale, PushTranslate> = {
  ar: makeTranslator("ar", arMessages, "bell"),
  en: makeTranslator("en", enMessages, "bell"),
};

const BELL_TEXT_TYPES: ReadonlySet<string> = new Set(BELL_TEXT_PUSH_TYPES);

function makeTranslator(locale: PushLocale, messages: Messages, which: "push" | "bell"): PushTranslate {
  const t = createTranslator(
    (which === "push"
      ? { locale, messages: { pushAlerts: { messages: messages.pushAlerts.messages } }, namespace: "pushAlerts.messages" }
      : { locale, messages: { notifications: { types: messages.notifications.types } }, namespace: "notifications.types" }) as never,
  ) as unknown as (key: string, values?: Record<string, string | number>) => string;
  return (key, values) => t(key, values);
}

/** Expires (marks handled) unpushed rows older than the window, then claims the recent ones. */
async function claimPendingRows(limit: number): Promise<{ expired: number; rows: PushCandidate[] }> {
  const windowStart = sql`now() - make_interval(mins => ${PUSH_WINDOW_MINUTES})`;
  const expired = await db
    .update(sellerNotifications)
    .set({ pushedAt: sql`now()` })
    .where(and(isNull(sellerNotifications.pushedAt), lt(sellerNotifications.createdAt, windowStart)))
    .returning({ id: sellerNotifications.id });

  // FOR UPDATE SKIP LOCKED + the outer `pushed_at IS NULL` re-check: two runs
  // at once (cron + webhook) split the rows, never both send one.
  const pending = db
    .select({ id: sellerNotifications.id })
    .from(sellerNotifications)
    .where(and(isNull(sellerNotifications.pushedAt), gte(sellerNotifications.createdAt, windowStart)))
    .orderBy(asc(sellerNotifications.createdAt))
    .limit(limit)
    .for("update", { skipLocked: true });

  const claimed = await db
    .update(sellerNotifications)
    .set({ pushedAt: sql`now()` })
    .where(and(isNull(sellerNotifications.pushedAt), inArray(sellerNotifications.id, pending)))
    .returning({
      id: sellerNotifications.id,
      sellerId: sellerNotifications.sellerId,
      storeId: sellerNotifications.storeId,
      type: sellerNotifications.type,
      data: sellerNotifications.data,
      createdAt: sellerNotifications.createdAt,
    });

  return { expired: expired.length, rows: claimed.map((row) => ({ ...row, data: row.data ?? {} })) };
}

type SellerPushJob = { device: PushDevice; payload: PushPayload; urgent: boolean };

async function sendAll(config: VapidConfig, jobs: SellerPushJob[]): Promise<{ sent: number; failed: number; removed: number }> {
  const webJobs: WebPushJob[] = jobs.map(({ device, payload, urgent }) => ({
    id: device.id,
    endpoint: device.endpoint,
    p256dh: device.p256dh,
    auth: device.auth,
    payload,
    urgent,
  }));
  const { sent, failed, okIds, goneIds } = await sendWebPushes(config, webJobs, "seller");
  if (goneIds.length > 0) {
    await db.delete(sellerPushSubscriptions).where(inArray(sellerPushSubscriptions.id, goneIds));
  }
  if (okIds.length > 0) {
    await db
      .update(sellerPushSubscriptions)
      .set({ lastSuccessAt: sql`now()` })
      .where(inArray(sellerPushSubscriptions.id, okIds));
  }
  return { sent, failed, removed: goneIds.length };
}

export type PushDispatchResult = {
  enabled: boolean;
  expired: number;
  claimed: number;
  deliveries: number;
  sent: number;
  failed: number;
  removed: number;
};

/**
 * One dispatcher run (Supabase webhook on insert, or the cron): claims the
 * recent unpushed bell rows and sends the pushed types to each of the
 * seller's devices. At most once per row; a crash after the claim loses that
 * push but never repeats it. A no-op while the VAPID keys are missing.
 */
export async function dispatchSellerPushes(limit: number = PUSH_CLAIM_LIMIT): Promise<PushDispatchResult> {
  const config = getVapidConfig();
  const empty = { expired: 0, claimed: 0, deliveries: 0, sent: 0, failed: 0, removed: 0 };
  if (!config) return { enabled: false, ...empty };

  const { expired, rows } = await claimPendingRows(limit);
  if (rows.length === 0) return { enabled: true, ...empty, expired };

  const sellerIds = [...new Set(rows.map((row) => row.sellerId))];
  const [devices, prefs] = await Promise.all([loadDevices(sellerIds), loadPrefs(sellerIds)]);
  const deliveries = planPushDeliveries(rows, prefs, devices, new Date());
  if (deliveries.length === 0) return { enabled: true, ...empty, expired, claimed: rows.length };

  const amounts = await loadOrderAmounts(deliveries.map((d) => d.row));
  const jobs = deliveries.map(({ row, category, device }) => {
    const orderId = typeof row.data.orderId === "string" ? row.data.orderId : null;
    const order = orderId ? amounts.get(orderId) : undefined;
    // Only the notified store's own order shows its amount.
    const amount = order && row.storeId && order.storeId === row.storeId ? formatMoney(order.total, device.locale) : null;
    const bell = BELL_TEXT_TYPES.has(row.type)
      ? {
          t: BELL_TRANSLATORS[device.locale],
          values: sellerNotificationValues(row.data, (value) => formatMoney(value, device.locale)),
        }
      : undefined;
    return {
      device,
      payload: buildPushPayload(row, device.locale, TRANSLATORS[device.locale], amount, bell),
      urgent: category === "newOrder",
    };
  });

  const result = await sendAll(config, jobs);
  return { enabled: true, expired, claimed: rows.length, deliveries: jobs.length, ...result };
}

/** A test alert to the seller's own devices (settings "Send a test alert"). */
export async function sendSellerTestPush(sellerId: string): Promise<{ sent: number; devices: number }> {
  const config = getVapidConfig();
  if (!config) return { sent: 0, devices: 0 };
  const devices = (await loadDevices([sellerId])).get(sellerId) ?? [];
  const jobs: SellerPushJob[] = devices.map((device) => {
    const t = TRANSLATORS[device.locale];
    return {
      device,
      urgent: false,
      payload: {
        title: t("test.title"),
        body: t("test.body"),
        url: "/settings#push-alerts",
        tag: "tallaby-test",
        lang: device.locale,
        dir: device.locale === "ar" ? "rtl" : "ltr",
      } satisfies PushPayload,
    };
  });
  const result = jobs.length ? await sendAll(config, jobs) : { sent: 0 };
  return { sent: result.sent, devices: devices.length };
}
