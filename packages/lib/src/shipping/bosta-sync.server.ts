import { timingSafeEqual } from "node:crypto";
import { and, db, eq, isNotNull, orders, sellerNotifications, shipmentCarrierEvents, shipments, sql } from "@workspace/db";
import {
  getBostaAccountByIntegrationId,
  recordBostaResult,
  type StoreBostaAccount,
} from "../integrations/bosta.server";
import { applySellerShipmentStatus } from "./apply-seller-shipment.server";
import { getBostaDelivery, type BostaCallOptions } from "./bosta/bosta.client.server";
import { bostaStateEffect, bostaStatusPath } from "./bosta/bosta-states.lib";
import { isShippingStatus, type ShippingStatus } from "./shipment-status.lib";

/**
 * Bosta status updates (docs/superpowers/plans/2026-10-26-bosta-shipping.md
 * §4.5, BS-10/BS-11). The webhook and the sync cron both end in
 * `applyBostaState`, which records the carrier event once and walks the
 * shipment forward through the shared seller primitive, so "delivered" runs
 * the existing wallet, fee, affiliate and email path exactly once. No new
 * money logic.
 */

const CARRIER = "bosta";

/** Cancelled / terminated at Bosta. Before pickup it gives the order back to the seller. */
const CANCEL_CODES = new Set([48, 49]);
const PRE_PICKUP: ShippingStatus[] = ["pending", "assigned"];

export type BostaShipmentRef = {
  id: string;
  orderId: string;
  sellerId: string;
  status: string;
  externalStateCode: number | null;
};

export type BostaStateUpdate = {
  code: number;
  text?: string | null;
  exceptionCode?: number | null;
  exceptionReason?: string | null;
  occurredAt: string;
  payload?: Record<string, unknown>;
};

export type ApplyBostaStateResult = {
  /** False when this exact event was already recorded (a replay). */
  recorded: boolean;
  /** The shipment status afterwards. */
  status: string;
  /** Statuses the shipment moved through. */
  moved: ShippingStatus[];
};

function isAlreadyUpdated(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith("Shipment was already updated");
}

async function notifyAttention(shipment: BostaShipmentRef, update: BostaStateUpdate): Promise<void> {
  try {
    const [order] = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber, storeId: orders.storeId })
      .from(orders)
      .where(eq(orders.id, shipment.orderId))
      .limit(1);
    if (!order) return;
    await db
      .insert(sellerNotifications)
      .values({
        sellerId: shipment.sellerId,
        storeId: order.storeId,
        type: "carrier_needs_attention",
        data: { orderId: order.id, orderNumber: order.orderNumber, stateCode: update.code, reason: update.exceptionReason ?? null },
        dedupeKey: `carrier_needs_attention:${order.id}:${update.code}:${update.occurredAt}`,
      })
      .onConflictDoNothing();
  } catch {
    // A missed bell never blocks the status update.
  }
}

/**
 * Records one Bosta state for a shipment and moves the shipment forward.
 *
 * - The event is inserted once per (shipment, state, time); a replay changes nothing.
 * - States can arrive out of order: a state behind the current status is
 *   recorded but never moves the shipment back.
 * - Cancelled/terminated before pickup clears the Bosta link and returns the
 *   shipment to `pending`, so the seller can ship again or deliver it.
 * - Exceptions (47), investigations and holds flag the order for the seller.
 */
export async function applyBostaState(shipment: BostaShipmentRef, update: BostaStateUpdate): Promise<ApplyBostaStateResult> {
  const inserted = await db
    .insert(shipmentCarrierEvents)
    .values({
      shipmentId: shipment.id,
      carrier: CARRIER,
      stateCode: update.code,
      stateText: update.text ?? null,
      exceptionCode: update.exceptionCode ?? null,
      exceptionReason: update.exceptionReason?.slice(0, 500) ?? null,
      occurredAt: update.occurredAt,
      payload: update.payload ?? {},
    })
    .onConflictDoNothing()
    .returning({ id: shipmentCarrierEvents.id });
  const recorded = inserted.length > 0;
  if (!recorded && update.code === shipment.externalStateCode) {
    return { recorded, status: shipment.status, moved: [] };
  }

  const effect = bostaStateEffect(update.code);
  const current: ShippingStatus = isShippingStatus(shipment.status) ? shipment.status : "pending";

  if (CANCEL_CODES.has(update.code) && PRE_PICKUP.includes(current)) {
    await db
      .update(shipments)
      .set({
        status: "pending",
        externalId: null,
        trackingNumber: null,
        externalStateCode: update.code,
        externalState: update.text ?? null,
        needsAttention: true,
        lastError: "bosta_cancelled",
        lastSyncedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(shipments.id, shipment.id), eq(shipments.status, current)));
    if (recorded) await notifyAttention(shipment, update);
    return { recorded, status: "pending", moved: current === "pending" ? [] : ["pending"] };
  }

  const exception = update.exceptionReason?.trim();
  await db
    .update(shipments)
    .set({
      externalStateCode: update.code,
      externalState: update.text ?? null,
      needsAttention: effect.attention,
      lastError: effect.attention ? (exception ? `exception: ${exception}`.slice(0, 500) : `state_${update.code}`) : null,
      lastSyncedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(shipments.id, shipment.id));
  if (effect.attention && recorded) await notifyAttention(shipment, update);

  const moved: ShippingStatus[] = [];
  let from = current;
  if (effect.status) {
    for (const step of bostaStatusPath(current, effect.status)) {
      try {
        await applySellerShipmentStatus({
          orderId: shipment.orderId,
          sellerId: shipment.sellerId,
          shipmentId: shipment.id,
          status: step,
          expectedFromStatus: from,
          failureReason: step === "failed" ? (exception ?? `Bosta state ${update.code}`) : undefined,
        });
      } catch (error) {
        // Another update (or the seller) moved it meanwhile; the next update or sync resumes from there.
        if (isAlreadyUpdated(error)) break;
        throw error;
      }
      moved.push(step);
      from = step;
    }
  }
  return { recorded, status: from, moved };
}

/** Bosta's millisecond timestamp, or now. */
function occurredAt(value: unknown): string {
  const ms = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  const date = Number.isFinite(ms) && ms > 1_500_000_000_000 ? new Date(ms) : new Date();
  return date.toISOString();
}

function sameToken(header: string | undefined, token: string): boolean {
  const expected = Buffer.from(`Bearer ${token}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const shipmentColumns = {
  id: shipments.id,
  orderId: shipments.orderId,
  sellerId: shipments.sellerId,
  status: shipments.status,
  externalStateCode: shipments.externalStateCode,
  trackingNumber: shipments.trackingNumber,
};

/** Fetches the delivery from Bosta with the store's key and applies its state. */
async function syncOne(
  account: StoreBostaAccount,
  shipment: BostaShipmentRef & { trackingNumber: string | null },
  hint: { exceptionCode?: number | null; exceptionReason?: string | null; occurredAt?: string; payload?: Record<string, unknown> },
  options: BostaCallOptions,
): Promise<{ ok: true; result: ApplyBostaStateResult } | { ok: false; keyRejected: boolean }> {
  if (!shipment.trackingNumber) return { ok: false, keyRejected: false };
  const fetched = await getBostaDelivery(account.apiKey, shipment.trackingNumber, options);
  if (!fetched.ok) {
    const keyRejected = fetched.error.reason === "invalid_key" || fetched.error.reason === "forbidden";
    if (keyRejected) await recordBostaResult(account.storeId, { ok: false, error: fetched.error.message });
    return { ok: false, keyRejected };
  }
  const code = fetched.data.state.code;
  if (code === shipment.externalStateCode && !hint.payload) {
    // Nothing new since the last look: no event row, just the sync time.
    await db.update(shipments).set({ lastSyncedAt: sql`now()` }).where(eq(shipments.id, shipment.id));
    return { ok: true, result: { recorded: false, status: shipment.status, moved: [] } };
  }
  // The hinted time belongs to the webhook's state; a different fetched state is "now".
  const sameState = hint.payload && Number(hint.payload.state) === code;
  const result = await applyBostaState(shipment, {
    code,
    text: fetched.data.state.value ?? fetched.data.maskedState ?? null,
    exceptionCode: sameState ? hint.exceptionCode : null,
    exceptionReason: sameState ? hint.exceptionReason : null,
    occurredAt: sameState && hint.occurredAt ? hint.occurredAt : new Date().toISOString(),
    payload: { source: hint.payload ? "webhook" : "sync", ...(sameState ? { webhook: hint.payload } : {}) },
  });
  return { ok: true, result };
}

export type BostaWebhookResponse = { status: 200 | 401; body: Record<string, unknown> };

/**
 * `POST /api/webhooks/bosta/:integrationId` (apps/backend). The per-store
 * token must match; the payload only says which delivery changed. Its state
 * is re-read from Bosta with the store's own key, so a leaked token can't
 * fake a delivery and out-of-order webhooks can't move a shipment back.
 * Everything that isn't an auth failure answers 200, so Bosta stops retrying.
 */
export async function handleBostaWebhook(
  integrationId: string,
  authorization: string | undefined,
  body: unknown,
  options: BostaCallOptions = {},
): Promise<BostaWebhookResponse> {
  const account = await getBostaAccountByIntegrationId(integrationId);
  if (!account || !sameToken(authorization, account.webhookToken)) return { status: 401, body: { error: "unauthorized" } };

  const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const deliveryId = typeof payload._id === "string" ? payload._id : null;
  const trackingNumber =
    typeof payload.trackingNumber === "string" || typeof payload.trackingNumber === "number" ? String(payload.trackingNumber) : null;
  if (!deliveryId && !trackingNumber) return { status: 200, body: { ok: true, ignored: "no delivery" } };

  const [shipment] = await db
    .select(shipmentColumns)
    .from(shipments)
    .where(
      and(
        eq(shipments.carrier, CARRIER),
        eq(shipments.storeIntegrationId, account.integrationId),
        deliveryId ? eq(shipments.externalId, deliveryId) : eq(shipments.trackingNumber, trackingNumber!),
      ),
    )
    .limit(1);
  if (!shipment?.sellerId) return { status: 200, body: { ok: true, ignored: "unknown shipment" } };

  const exceptionCode = Number(payload.exceptionCode);
  const synced = await syncOne(
    account,
    { ...shipment, sellerId: shipment.sellerId },
    {
      exceptionCode: Number.isInteger(exceptionCode) ? exceptionCode : null,
      exceptionReason: typeof payload.exceptionReason === "string" ? payload.exceptionReason : null,
      occurredAt: occurredAt(payload.timeStamp),
      payload: { state: payload.state, timeStamp: payload.timeStamp, exceptionCode: payload.exceptionCode, exceptionReason: payload.exceptionReason, numberOfAttempts: payload.numberOfAttempts },
    },
    options,
  );
  return { status: 200, body: synced.ok ? { ok: true, status: synced.result.status } : { ok: true, deferred: true } };
}

/**
 * The fallback poll (BS-11): Bosta shipments that aren't final and weren't
 * updated in the last 2 hours, re-read from Bosta and applied. Per store, a
 * rejected key stops that store's batch (and marks the integration `error`).
 */
export async function syncBostaShipments(
  options: BostaCallOptions & { limit?: number; staleMinutes?: number } = {},
): Promise<{ checked: number; moved: number; failed: number }> {
  const { limit = 100, staleMinutes = 120, ...callOptions } = options;
  const rows = await db
    .select({ ...shipmentColumns, integrationId: shipments.storeIntegrationId })
    .from(shipments)
    .where(
      and(
        eq(shipments.carrier, CARRIER),
        isNotNull(shipments.externalId),
        isNotNull(shipments.storeIntegrationId),
        sql`${shipments.status} NOT IN ('delivered', 'returned', 'cancelled')`,
        sql`(${shipments.lastSyncedAt} IS NULL OR ${shipments.lastSyncedAt} < now() - make_interval(mins => ${staleMinutes}))`,
      ),
    )
    .orderBy(sql`${shipments.lastSyncedAt} ASC NULLS FIRST`)
    .limit(limit);

  const byIntegration = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!row.integrationId) continue;
    byIntegration.set(row.integrationId, [...(byIntegration.get(row.integrationId) ?? []), row]);
  }

  let checked = 0;
  let moved = 0;
  let failed = 0;
  for (const [integrationId, list] of byIntegration) {
    const account = await getBostaAccountByIntegrationId(integrationId);
    if (!account) continue;
    for (const row of list) {
      if (!row.sellerId) continue;
      checked += 1;
      const synced = await syncOne(account, { ...row, sellerId: row.sellerId }, {}, callOptions);
      if (!synced.ok) {
        failed += 1;
        if (synced.keyRejected) break;
        // Try again on the next run, not on every one.
        await db.update(shipments).set({ lastSyncedAt: sql`now()` }).where(eq(shipments.id, row.id));
        continue;
      }
      if (synced.result.moved.length) moved += 1;
    }
  }
  return { checked, moved, failed };
}

