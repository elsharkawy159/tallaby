import { and, db, eq, notInArray, orderItems, orders, sql, storeIntegrations, stores } from "@workspace/db";
import { getStoreMetaCapiCredentials, recordMetaCapiResult } from "./meta-capi.server";
import { postMetaCapiEvents } from "./meta-capi.lib";
import {
  buildDeferredPurchase,
  buildDeliveredClaimPatch,
  buildDeliveredPurchaseEvent,
  deliveredPurchaseDecision,
  META_DEFERRED_PURCHASE_KEY,
  META_DELIVERED_FAILURES_KEY,
  META_DELIVERED_MAX_AGE_MS,
  META_DELIVERED_MAX_FAILURES,
  META_DELIVERED_SENT_KEY,
  readMetaTrackingSettings,
  validateMetaTrackingInput,
  type MetaTrackingSettings,
} from "./meta-tracking.lib";
import {
  isMetaCapiUsable,
  ownStoreStatus,
  summaryColumns,
  toIntegrationSummary,
  UUID_RE,
  type IntegrationResult,
  type Queryable,
  type StoreIntegrationSummary,
} from "./store-integrations.server";

/**
 * Meta ad-tracking settings and the Purchase-on-delivery sender (ROADMAP.md
 * F-30). Server-only. Settings live in the store's `meta_pixel` row
 * (`config.tracking`); the token stays in the encrypted `meta_capi` row and
 * is only read by getStoreMetaCapiCredentials.
 *
 * Purchase on delivery, end to end:
 * 1. Checkout (ecommerce, after the response, only with the visitor's
 *    tracking consent): instead of sending Purchase, `deferStorePurchase`
 *    saves Meta's `user_data` on the order (`metadata.metaCapiDeferred`).
 *    The browser Pixel's Purchase is blocked on that store
 *    (`getStorefrontTracking().metaBlockedEvents`).
 * 2. Delivered (every path: seller shipments incl. Bosta webhook + sync,
 *    Tallaby riders, admin): `sendDeliveredMetaPurchase(orderId)` after the
 *    status commit, plus the daily sweep `sendPendingDeliveredMetaPurchases`.
 * 3. One Purchase per order: a conditional UPDATE claims
 *    `metadata.capiDeliveredSentAt` before the Graph call; a failed call
 *    releases the claim and counts a failure (the sweep retries, max 3).
 *    `event_id` is the order id, as at checkout.
 * Refused orders (cancelled / returned) never become delivered: nothing is
 * sent for them. Every function here swallows its errors; a status change
 * never waits on, or fails because of, Meta.
 */

/** Settings plus whether server events can be sent (same rule as the sender). */
export async function getStoreMetaTracking(
  storeId: string,
  q: Queryable = db,
): Promise<{ settings: MetaTrackingSettings; capiConnected: boolean }> {
  const rows = UUID_RE.test(storeId)
    ? await q
        .select({
          provider: storeIntegrations.provider,
          status: storeIntegrations.status,
          config: storeIntegrations.config,
          hasSecret: sql<boolean>`(${storeIntegrations.credentialsEncrypted} IS NOT NULL)`,
        })
        .from(storeIntegrations)
        .innerJoin(stores, eq(stores.id, storeIntegrations.storeId))
        .where(and(eq(storeIntegrations.storeId, storeId), eq(stores.sellerId, storeIntegrations.sellerId)))
    : [];
  const pixel = rows.find((r) => r.provider === "meta_pixel" && r.status === "connected");
  return { settings: readMetaTrackingSettings(pixel?.config), capiConnected: isMetaCapiUsable(rows) };
}

export type SaveMetaTrackingError = "not_found" | "store_read_only" | "not_connected" | "invalid_settings";

/** Dashboard: saves the store's Meta event toggles and Purchase timing. */
export async function saveMetaTrackingSettings(
  sellerId: string,
  storeId: string,
  rawInput: unknown,
  q: Queryable = db,
): Promise<IntegrationResult<StoreIntegrationSummary, SaveMetaTrackingError>> {
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  const input = validateMetaTrackingInput(rawInput);
  if (!input.success) return { success: false, error: input.error };

  return q.transaction(async (tx) => {
    const store = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!store) return { success: false, error: "not_found" } as const;
    if (store.status !== "active") return { success: false, error: "store_read_only" } as const;

    const [row] = await tx
      .update(storeIntegrations)
      .set({
        config: sql`coalesce(${storeIntegrations.config}, '{}'::jsonb) || jsonb_build_object('tracking', ${JSON.stringify(input.data)}::jsonb)`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(storeIntegrations.storeId, storeId),
          eq(storeIntegrations.sellerId, sellerId),
          eq(storeIntegrations.provider, "meta_pixel"),
        ),
      )
      .returning(summaryColumns);
    if (!row) return { success: false, error: "not_connected" } as const;
    return { success: true, data: toIntegrationSummary("meta_pixel", row) } as const;
  });
}

/**
 * Checkout, delivered mode: saves the visitor's Meta match data on the order
 * so the delivered Purchase can be sent later. Only for an order of that
 * store, only once. The caller has already checked tracking consent.
 */
export async function deferStorePurchase(
  input: { orderId: string; storeId: string; userData: unknown; eventSourceUrl?: string | null },
  q: Queryable = db,
): Promise<boolean> {
  try {
    if (!UUID_RE.test(input.orderId) || !UUID_RE.test(input.storeId)) return false;
    const deferred = buildDeferredPurchase(input.userData, input.eventSourceUrl);
    const updated = await q
      .update(orders)
      .set({
        metadata: sql`coalesce(${orders.metadata}, '{}'::jsonb) || jsonb_build_object(${META_DEFERRED_PURCHASE_KEY}::text, ${JSON.stringify(deferred)}::jsonb)`,
      })
      .where(
        and(
          eq(orders.id, input.orderId),
          eq(orders.storeId, input.storeId),
          sql`(coalesce(${orders.metadata}, '{}'::jsonb) -> ${META_DEFERRED_PURCHASE_KEY}::text) IS NULL`,
        ),
      )
      .returning({ id: orders.id });
    return updated.length > 0;
  } catch {
    console.error("[meta-capi] deferring Purchase failed");
    return false;
  }
}

export type DeliveredPurchaseResult = "sent" | "skipped" | "failed";

/**
 * Sends the one server Purchase of a delivered order whose Purchase was
 * deferred at checkout. Safe to call after any status write (it checks the
 * order itself) and safe to call twice (claim). Never throws.
 */
export async function sendDeliveredMetaPurchase(
  orderId: string,
  options: { q?: Queryable; fetchImpl?: typeof fetch; timeoutMs?: number; now?: Date } = {},
): Promise<DeliveredPurchaseResult> {
  const { q = db, now = new Date() } = options;
  try {
    if (!UUID_RE.test(orderId)) return "skipped";
    const [order] = await q
      .select({
        id: orders.id,
        storeId: orders.storeId,
        status: orders.status,
        deliveredAt: orders.deliveredAt,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        metadata: orders.metadata,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    // Cheap exit for every order that did not defer its Purchase.
    if (!order?.storeId || order.status !== "delivered") return "skipped";
    const metadata = order.metadata as Record<string, unknown> | null;
    if (!metadata || !metadata[META_DEFERRED_PURCHASE_KEY] || metadata[META_DELIVERED_SENT_KEY]) return "skipped";

    const { settings } = await getStoreMetaTracking(order.storeId, q);
    const decision = deliveredPurchaseDecision({ order, settings, now });
    if (!decision.send) return "skipped";

    const credentials = await getStoreMetaCapiCredentials(order.storeId, q);
    if (!credentials) return "skipped";

    // The claim: only one caller ever gets this row back.
    const claimPatch = buildDeliveredClaimPatch(now);
    const claimedAt = claimPatch[META_DELIVERED_SENT_KEY]!;
    const claimed = await q
      .update(orders)
      .set({ metadata: sql`coalesce(${orders.metadata}, '{}'::jsonb) || ${JSON.stringify(claimPatch)}::jsonb` })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.storeId, order.storeId),
          eq(orders.status, "delivered"),
          sql`(coalesce(${orders.metadata}, '{}'::jsonb) -> ${META_DELIVERED_SENT_KEY}::text) IS NULL`,
          sql`(coalesce(${orders.metadata}, '{}'::jsonb) -> ${META_DEFERRED_PURCHASE_KEY}::text) IS NOT NULL`,
        ),
      )
      .returning({ id: orders.id });
    if (claimed.length === 0) return "skipped";

    const items = await q
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.orderId, order.id),
          notInArray(orderItems.status, ["cancelled", "returned", "refunded"]),
        ),
      );

    const event = buildDeliveredPurchaseEvent({
      orderId: order.id,
      eventTime: decision.eventTime,
      deferred: decision.deferred,
      totalAmount: order.totalAmount,
      currency: order.currency,
      items,
    });
    const result = await postMetaCapiEvents(credentials, [event], {
      graphVersion: process.env.META_GRAPH_API_VERSION,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
    });
    await recordMetaCapiResult(order.storeId, result.ok ? { ok: true } : { ok: false, error: result.error }, q);
    if (result.ok) return "sent";

    // Release our claim and count the failure, so the sweep retries (max 3).
    await q
      .update(orders)
      .set({
        metadata: sql`(coalesce(${orders.metadata}, '{}'::jsonb) - ${META_DELIVERED_SENT_KEY}::text) || jsonb_build_object(${META_DELIVERED_FAILURES_KEY}::text, coalesce((${orders.metadata} ->> ${META_DELIVERED_FAILURES_KEY}::text)::int, 0) + 1)`,
      })
      .where(
        and(
          eq(orders.id, order.id),
          sql`(${orders.metadata} ->> ${META_DELIVERED_SENT_KEY}::text) = ${claimedAt}`,
        ),
      );
    return "failed";
  } catch {
    console.error("[meta-capi] delivered Purchase failed");
    return "failed";
  }
}

/**
 * Daily safety net (dashboard bosta-sync cron): delivered orders whose
 * deferred Purchase was not sent yet (a missed hook or a failed call),
 * while Meta still accepts the event.
 */
export async function sendPendingDeliveredMetaPurchases(
  options: { limit?: number; q?: Queryable } = {},
): Promise<{ checked: number; sent: number; failed: number }> {
  const { q = db, limit = 100 } = options;
  const since = new Date(Date.now() - META_DELIVERED_MAX_AGE_MS).toISOString();
  const rows = await q
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        sql`${orders.storeId} IS NOT NULL`,
        eq(orders.status, "delivered"),
        sql`${orders.deliveredAt} >= ${since}`,
        sql`(${orders.metadata} -> ${META_DEFERRED_PURCHASE_KEY}::text) IS NOT NULL`,
        sql`(${orders.metadata} -> ${META_DELIVERED_SENT_KEY}::text) IS NULL`,
        sql`coalesce((${orders.metadata} ->> ${META_DELIVERED_FAILURES_KEY}::text)::int, 0) < ${META_DELIVERED_MAX_FAILURES}`,
      ),
    )
    .limit(Math.max(1, Math.min(limit, 500)));

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const result = await sendDeliveredMetaPurchase(row.id, { q });
    if (result === "sent") sent += 1;
    else if (result === "failed") failed += 1;
  }
  return { checked: rows.length, sent, failed };
}
