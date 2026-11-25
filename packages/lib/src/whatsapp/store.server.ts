import {
  and,
  count,
  db,
  desc,
  eq,
  gte,
  orders,
  sql,
  storeWhatsappSettings,
  stores,
  whatsappInbound,
  whatsappMessages,
  whatsappSettings,
} from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { assertStoreOwnedBy } from "../stores/store-scope.server";
import {
  WHATSAPP_EVENTS,
  WHATSAPP_MESSAGE_STATUSES,
  isWhatsAppEvent,
  type WhatsAppEvent,
  type WhatsAppMessageStatus,
} from "./events.lib";
import { maskPhone } from "./phone.lib";

/**
 * A store's WhatsApp order notifications, for the seller dashboard
 * (ROADMAP.md F-109, docs/whatsapp.md §5). Server-only, never cached (rule 8:
 * orders and messaging).
 *
 * Tenant isolation (rule 5): callers pass the session's seller and the store
 * they checked with `requireStore`; every function checks again that the store
 * is this seller's, and every query filters `seller_id` AND `store_id`.
 *
 * Source of truth for "WhatsApp is on for this store": `store_whatsapp_settings.enabled`
 * (no row = the admin's `stores_default_on`). The App Center's install and
 * remove write it through `setStoreWhatsAppEnabled`; no `store_app_installs`
 * row is ever written for the `whatsapp` app.
 */

/** The App Center id of the app (`@workspace/apps`). */
export const WHATSAPP_APP = "whatsapp";

export const WHATSAPP_MESSAGES_PAGE_SIZE = 50;
const STATS_DAYS = 30;

export type WhatsAppGlobalSettings = {
  enabled: boolean;
  storesDefaultOn: boolean;
  eventsEnabled: WhatsAppEvent[];
  sellerPriceUsdCents: number;
};

export type StoreWhatsAppSettings = {
  enabled: boolean;
  events: WhatsAppEvent[];
  /** False while the store has no row and follows the admin default. */
  saved: boolean;
};

export type StoreWhatsAppStats = {
  days: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  confirmedByButton: number;
  cancelledByButton: number;
  /** What the seller was charged, US cents (0: free for now, D3). */
  costUsdCents: number;
};

export type StoreWhatsAppOverview = {
  global: WhatsAppGlobalSettings;
  store: StoreWhatsAppSettings;
  stats: StoreWhatsAppStats;
};

export type StoreWhatsAppMessageRow = {
  id: string;
  createdAt: string;
  event: string;
  status: WhatsAppMessageStatus;
  /** `+20 10•••••678`; never the full number. */
  phone: string;
  orderId: string | null;
  orderNumber: string | null;
  priceUsdCents: number;
};

export type StoreWhatsAppMessagesPage = {
  rows: StoreWhatsAppMessageRow[];
  page: number;
  pageCount: number;
  total: number;
};

export type StoreWhatsAppError = "disabled" | "invalid";
export type StoreWhatsAppResult<T> = { success: true; data: T } | { success: false; error: StoreWhatsAppError };

const DEFAULT_GLOBAL: WhatsAppGlobalSettings = {
  enabled: false,
  storesDefaultOn: false,
  eventsEnabled: [...WHATSAPP_EVENTS],
  sellerPriceUsdCents: 0,
};

/** Known events only, deduped, in WHATSAPP_EVENTS order. */
function cleanEvents(values: readonly unknown[] | null | undefined): WhatsAppEvent[] {
  const set = new Set((values ?? []).filter(isWhatsAppEvent));
  return WHATSAPP_EVENTS.filter((event) => set.has(event));
}

/**
 * Shipped dark (owner, 2026-11-26): any read error, a missing table above all
 * (Postgres 42P01 before 0180 is applied), reads as "WhatsApp is off", so the
 * dashboard and checkout never break on it.
 */
function logReadFailure(what: string, error: unknown) {
  const code = (error as { code?: unknown; cause?: { code?: unknown } } | null)?.code ?? (error as { cause?: { code?: unknown } } | null)?.cause?.code;
  if (code !== "42P01") console.error(`whatsapp: ${what} read failed`, typeof code === "string" ? code : "unknown");
}

/** The admin's settings (`whatsapp_settings`, id 1); off when the row is missing or can't be read. */
export async function getWhatsAppGlobalSettings(): Promise<WhatsAppGlobalSettings> {
  try {
    const [row] = await db
      .select({
        enabled: whatsappSettings.enabled,
        storesDefaultOn: whatsappSettings.storesDefaultOn,
        eventsEnabled: whatsappSettings.eventsEnabled,
        sellerPriceUsdCents: whatsappSettings.sellerPriceUsdCents,
      })
      .from(whatsappSettings)
      .where(eq(whatsappSettings.id, 1))
      .limit(1);
    if (!row) return { ...DEFAULT_GLOBAL };
    return { ...row, eventsEnabled: cleanEvents(row.eventsEnabled) };
  } catch (error) {
    logReadFailure("settings", error);
    return { ...DEFAULT_GLOBAL };
  }
}

async function readStoreSettings(sellerId: string, storeId: string, global: WhatsAppGlobalSettings): Promise<StoreWhatsAppSettings> {
  const fallback: StoreWhatsAppSettings = { enabled: global.storesDefaultOn, events: [...WHATSAPP_EVENTS], saved: false };
  try {
    const [row] = await db
      .select({ enabled: storeWhatsappSettings.enabled, events: storeWhatsappSettings.events })
      .from(storeWhatsappSettings)
      .where(and(eq(storeWhatsappSettings.storeId, storeId), eq(storeWhatsappSettings.sellerId, sellerId)))
      .limit(1);
    if (!row) return fallback;
    return { enabled: row.enabled, events: cleanEvents(row.events), saved: true };
  } catch (error) {
    logReadFailure("store settings", error);
    return { ...fallback, enabled: false };
  }
}

/** Whether the App Center shows the app as installed: the admin switch is on and the store has WhatsApp on. */
export async function isStoreWhatsAppOn(sellerId: string, storeId: string): Promise<boolean> {
  await assertStoreOwnedBy(sellerId, storeId);
  const global = await getWhatsAppGlobalSettings();
  if (!global.enabled) return false;
  return (await readStoreSettings(sellerId, storeId, global)).enabled;
}

/** Settings, chosen events and the last 30 days' numbers of one store. */
export async function getStoreWhatsAppOverview(sellerId: string, storeId: string): Promise<StoreWhatsAppOverview> {
  await assertStoreOwnedBy(sellerId, storeId);
  const since = new Date(Date.now() - STATS_DAYS * 86_400_000).toISOString();
  const global = await getWhatsAppGlobalSettings();
  const [store, [messages], [buttons]] = await Promise.all([
    readStoreSettings(sellerId, storeId, global),
    db
      .select({
        sent: sql<number>`count(*) filter (where ${whatsappMessages.status} in ('sent', 'delivered', 'read'))`.mapWith(Number),
        delivered: sql<number>`count(*) filter (where ${whatsappMessages.status} in ('delivered', 'read'))`.mapWith(Number),
        read: sql<number>`count(*) filter (where ${whatsappMessages.status} = 'read')`.mapWith(Number),
        failed: sql<number>`count(*) filter (where ${whatsappMessages.status} = 'failed')`.mapWith(Number),
        cost: sql<number>`coalesce(sum(${whatsappMessages.priceUsdCents}), 0)`.mapWith(Number),
      })
      .from(whatsappMessages)
      .where(
        and(
          eq(whatsappMessages.sellerId, sellerId),
          eq(whatsappMessages.storeId, storeId),
          gte(whatsappMessages.createdAt, since),
        ),
      )
      .catch((error: unknown) => {
        logReadFailure("message stats", error);
        return [];
      }),
    // Button taps are tied to the store through their order (and the order's store to the seller).
    db
      .select({
        confirmed: sql<number>`count(*) filter (where ${whatsappInbound.result} = 'confirmed')`.mapWith(Number),
        cancelled: sql<number>`count(*) filter (where ${whatsappInbound.result} = 'cancelled')`.mapWith(Number),
      })
      .from(whatsappInbound)
      .innerJoin(orders, eq(orders.id, whatsappInbound.orderId))
      .innerJoin(stores, eq(stores.id, orders.storeId))
      .where(and(eq(orders.storeId, storeId), eq(stores.sellerId, sellerId), gte(whatsappInbound.createdAt, since)))
      .catch((error: unknown) => {
        logReadFailure("button stats", error);
        return [];
      }),
  ]);
  return {
    global,
    store,
    stats: {
      days: STATS_DAYS,
      sent: messages?.sent ?? 0,
      delivered: messages?.delivered ?? 0,
      read: messages?.read ?? 0,
      failed: messages?.failed ?? 0,
      confirmedByButton: buttons?.confirmed ?? 0,
      cancelledByButton: buttons?.cancelled ?? 0,
      costUsdCents: messages?.cost ?? 0,
    },
  };
}

export type StoreWhatsAppMessagesQuery = { page?: number; status?: string | null; event?: string | null };

/** One page (50 rows, newest first) of the store's message history. Unknown filters are ignored. */
export async function listStoreWhatsAppMessages(
  sellerId: string,
  storeId: string,
  query: StoreWhatsAppMessagesQuery = {},
): Promise<StoreWhatsAppMessagesPage> {
  await assertStoreOwnedBy(sellerId, storeId);
  const filters: SQL[] = [eq(whatsappMessages.sellerId, sellerId), eq(whatsappMessages.storeId, storeId)];
  const status = query.status && (WHATSAPP_MESSAGE_STATUSES as readonly string[]).includes(query.status) ? query.status : null;
  const event = query.event && isWhatsAppEvent(query.event) ? query.event : null;
  if (status) filters.push(eq(whatsappMessages.status, status));
  if (event) filters.push(eq(whatsappMessages.event, event));
  const where = and(...filters);

  try {
    return await readMessagesPage(where, storeId, query.page);
  } catch (error) {
    logReadFailure("messages", error);
    return { rows: [], page: 1, pageCount: 1, total: 0 };
  }
}

async function readMessagesPage(where: SQL | undefined, storeId: string, requestedPage: number | undefined): Promise<StoreWhatsAppMessagesPage> {
  const [totalRow] = await db.select({ total: count() }).from(whatsappMessages).where(where);
  const total = totalRow?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / WHATSAPP_MESSAGES_PAGE_SIZE));
  const requested = Number.isFinite(requestedPage) ? Math.floor(requestedPage as number) : 1;
  const page = Math.min(Math.max(requested, 1), pageCount);

  const rows = await db
    .select({
      id: whatsappMessages.id,
      createdAt: whatsappMessages.createdAt,
      event: whatsappMessages.event,
      status: whatsappMessages.status,
      toPhone: whatsappMessages.toPhone,
      orderId: whatsappMessages.orderId,
      orderNumber: orders.orderNumber,
      priceUsdCents: whatsappMessages.priceUsdCents,
    })
    .from(whatsappMessages)
    // The order's own store must match too, so a number is never shown from another store.
    .leftJoin(orders, and(eq(orders.id, whatsappMessages.orderId), eq(orders.storeId, storeId)))
    .where(where)
    .orderBy(desc(whatsappMessages.createdAt), desc(whatsappMessages.id))
    .limit(WHATSAPP_MESSAGES_PAGE_SIZE)
    .offset((page - 1) * WHATSAPP_MESSAGES_PAGE_SIZE);

  return {
    rows: rows.map(({ toPhone, orderNumber, orderId, ...row }) => ({
      ...row,
      status: row.status as WhatsAppMessageStatus,
      phone: maskPhone(toPhone),
      orderId: orderNumber ? orderId : null,
      orderNumber: orderNumber ?? null,
    })),
    page,
    pageCount,
    total,
  };
}

async function upsertStoreSettings(sellerId: string, storeId: string, values: { enabled: boolean; events: WhatsAppEvent[] }) {
  const now = new Date().toISOString();
  await db
    .insert(storeWhatsappSettings)
    .values({ storeId, sellerId, enabled: values.enabled, events: values.events, updatedAt: now })
    .onConflictDoUpdate({
      target: storeWhatsappSettings.storeId,
      set: { enabled: values.enabled, events: values.events, updatedAt: now },
      // The row is keyed by store; never take over a row saved under another seller.
      setWhere: eq(storeWhatsappSettings.sellerId, sellerId),
    });
}

/**
 * Saves the store's switch and chosen events. Refused while the admin has
 * WhatsApp off ("Coming soon": nothing is editable). Events outside
 * WHATSAPP_EVENTS are refused, not dropped.
 */
export async function updateStoreWhatsAppSettings(
  sellerId: string,
  storeId: string,
  input: { enabled: boolean; events: readonly string[] },
): Promise<StoreWhatsAppResult<StoreWhatsAppSettings>> {
  if (typeof input.enabled !== "boolean" || !Array.isArray(input.events) || input.events.length > WHATSAPP_EVENTS.length * 2) {
    return { success: false, error: "invalid" };
  }
  if (!input.events.every(isWhatsAppEvent)) return { success: false, error: "invalid" };
  await assertStoreOwnedBy(sellerId, storeId);
  const global = await getWhatsAppGlobalSettings();
  if (!global.enabled) return { success: false, error: "disabled" };
  const events = cleanEvents(input.events);
  await upsertStoreSettings(sellerId, storeId, { enabled: input.enabled, events });
  return { success: true, data: { enabled: input.enabled, events, saved: true } };
}

/**
 * The App Center's install (true) and remove (false). Keeps the store's chosen
 * events. Refused both ways while the admin has WhatsApp off: the app is
 * "Coming soon" then, and nothing about it can change (owner, 2026-11-26).
 */
export async function setStoreWhatsAppEnabled(sellerId: string, storeId: string, enabled: boolean): Promise<StoreWhatsAppResult<null>> {
  await assertStoreOwnedBy(sellerId, storeId);
  const global = await getWhatsAppGlobalSettings();
  if (!global.enabled) return { success: false, error: "disabled" };
  const current = await readStoreSettings(sellerId, storeId, global);
  await upsertStoreSettings(sellerId, storeId, { enabled, events: current.events });
  return { success: true, data: null };
}
