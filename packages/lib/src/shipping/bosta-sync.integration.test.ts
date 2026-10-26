import { randomBytes, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import type { IsolationWorld } from "../stores/isolation.fixtures";

/**
 * Bosta status updates (BS-10/BS-11) against staging with a fake Bosta: the
 * webhook re-reads the state, replays are no-ops, states never go back,
 * delivered posts the seller's fee exactly once (a Bosta COD is
 * seller-collected), a cancel before pickup gives the order back, and the
 * sync cron catches a dropped webhook. Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const KEY = "bosta-test-key-sync-0001";

function fakeBosta() {
  const state = { creates: 0, codes: new Map<string, number>(), reads: 0, terminated: [] as string[], labels: [] as string[] };
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/pickup-locations")) {
      return Response.json({ success: true, data: { list: [{ _id: "loc-1", locationName: "Warehouse", isDefault: true }] } });
    }
    if (url.includes("/deliveries?apiVersion=1") && init?.method === "POST") {
      state.creates += 1;
      const tn = `SY${Date.now()}${state.creates}`;
      state.codes.set(tn, 10);
      return Response.json({ success: true, data: { _id: `sync-${tn}`, trackingNumber: tn, state: { code: 10 } } });
    }
    const terminate = /\/deliveries\/business\/([^/?]+)\/terminate$/.exec(url);
    if (terminate && init?.method === "DELETE") {
      state.terminated.push(decodeURIComponent(terminate[1]!));
      return Response.json({ success: true, data: null });
    }
    if (url.endsWith("/deliveries/mass-awb")) {
      const body = JSON.parse(String(init?.body)) as { trackingNumbers: string };
      state.labels.push(body.trackingNumbers);
      return Response.json({ success: true, data: Buffer.from("%PDF-1.4 fake label ".repeat(10)).toString("base64") });
    }
    const match = /\/deliveries\/business\/([^/?]+)$/.exec(url);
    if (match) {
      state.reads += 1;
      const tn = decodeURIComponent(match[1]!);
      const code = state.codes.get(tn);
      if (code == null) return Response.json({ success: false, message: "not found" }, { status: 404 });
      return Response.json({ success: true, data: { _id: `sync-${tn}`, trackingNumber: tn, state: { code, value: `State ${code}` } } });
    }
    return Response.json({ success: false, message: "not found" }, { status: 404 });
  }) as unknown as typeof fetch;
  return { state, fetchImpl };
}

describe.skipIf(!TEST_DATABASE_URL)("Bosta status updates (integration)", { timeout: 90_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const buyer = randomUUID();
  const bosta = fakeBosta();
  let w: IsolationWorld;
  let ship: typeof import("./bosta-ship.server");
  let sync: typeof import("./bosta-sync.server");
  let account: { integrationId: string; webhookToken: string };
  let productId = "";
  let cairo = "";
  const previousDbUrl = process.env.DATABASE_URL;
  const previousKey = process.env.INTEGRATIONS_ENCRYPTION_KEY;

  async function shippedOrder() {
    const [row] = await db
      .insert(s.orders)
      .values({
        orderNumber: `SY-${randomUUID().slice(0, 12)}`,
        userId: buyer,
        subtotal: "250.00",
        totalAmount: "300.00",
        status: "confirmed",
        paymentStatus: "pending",
        paymentMethod: "cash_on_delivery",
        storeId: w.a.a1,
        shippingAddressId: cairo,
      })
      .returning({ id: s.orders.id });
    await db.insert(s.orderItems).values({
      orderId: row!.id,
      productId,
      sellerId: w.a.sellerId,
      sku: "sy-sku",
      productName: "Lamp",
      quantity: 1,
      price: "250.00",
      subtotal: "250.00",
      total: "250.00",
      // The flat EGP 5 fee snapshot, as checkout writes it.
      commissionAmount: "5.00",
      commissionRate: 0,
      sellerEarning: "245.00",
      status: "confirmed",
      metadata: { platformFee: { model: "flat", piastres: 500 } },
    });
    const result = await ship.shipOrderWithBosta(w.a.a1, row!.id, { trigger: "manual", fetchImpl: bosta.fetchImpl });
    if (!result.ok) throw new Error(`ship failed: ${result.error}`);
    return { orderId: row!.id, trackingNumber: result.trackingNumber };
  }

  const shipmentOf = async (orderId: string) => (await db.select().from(s.shipments).where(eq(s.shipments.orderId, orderId)))[0]!;
  const webhook = (orderShipment: { externalId: string | null; trackingNumber: string | null }, state: number, token = account.webhookToken) =>
    sync.handleBostaWebhook(
      account.integrationId,
      `Bearer ${token}`,
      { _id: orderShipment.externalId, trackingNumber: orderShipment.trackingNumber, state, timeStamp: Date.now() },
      { fetchImpl: bosta.fetchImpl },
    );

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.INTEGRATIONS_ENCRYPTION_KEY ||= randomBytes(32).toString("hex");
    ship = await import("./bosta-ship.server");
    sync = await import("./bosta-sync.server");
    const { createIsolationWorld } = await import("../stores/isolation.fixtures");
    const { saveBostaKey, getStoreBostaAccount } = await import("../integrations/bosta.server");
    w = await createIsolationWorld(db);

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, categoryId: category!.id, status: "active", quantity: "100", sku: `sy-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id });
    productId = product!.id;
    await db.insert(s.users).values({ id: buyer, isGuest: false, role: "customer" });
    const [address] = await db
      .insert(s.userAddresses)
      .values({ userId: buyer, fullName: "Omar Said", phone: "01112345678", addressLine1: "5 Makram Ebeid St", city: "مدينة نصر", state: "القاهرة", postalCode: "11765" })
      .returning({ id: s.userAddresses.id });
    cairo = address!.id;

    expect((await saveBostaKey(w.a.sellerId, w.a.sellerId, w.a.a1, KEY, { q: db, fetchImpl: bosta.fetchImpl })).success).toBe(true);
    const found = await getStoreBostaAccount(w.a.a1);
    account = { integrationId: found!.integrationId, webhookToken: found!.webhookToken };
  }, 120_000);

  afterAll(async () => {
    const orderRows = await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer));
    const orderIds = orderRows.map((row) => row.id);
    if (orderIds.length) {
      await db.delete(s.shipments).where(inArray(s.shipments.orderId, orderIds));
      await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, orderIds));
    }
    if (productId) await db.delete(s.products).where(eq(s.products.id, productId));
    // The ledger is append-only: deleting the seller accounts cascades it (the one allowed delete).
    await w?.cleanup();
    if (orderIds.length) await db.delete(s.orders).where(inArray(s.orders.id, orderIds));
    await db.delete(s.userAddresses).where(eq(s.userAddresses.userId, buyer));
    await db.delete(s.users).where(eq(s.users.id, buyer));
    await client.end();
    process.env.DATABASE_URL = previousDbUrl;
    process.env.INTEGRATIONS_ENCRYPTION_KEY = previousKey;
  });

  it("rejects a wrong token and an unknown integration with 401", async () => {
    const { orderId } = await shippedOrder();
    const row = await shipmentOf(orderId);
    expect(await webhook(row, 41, "wrong-token")).toMatchObject({ status: 401 });
    expect(
      await sync.handleBostaWebhook(randomUUID(), `Bearer ${account.webhookToken}`, { _id: row.externalId }, { fetchImpl: bosta.fetchImpl }),
    ).toMatchObject({ status: 401 });
    expect((await shipmentOf(orderId)).status).toBe("assigned");
  });

  it("uses Bosta's state, not the payload's, and a replay is a no-op", async () => {
    const { orderId, trackingNumber } = await shippedOrder();
    const row = await shipmentOf(orderId);

    // The payload claims "delivered"; Bosta says "out for delivery".
    bosta.state.codes.set(trackingNumber, 41);
    expect(await webhook(row, 45)).toMatchObject({ status: 200, body: { status: "out_for_delivery" } });
    expect(await shipmentOf(orderId)).toMatchObject({ status: "out_for_delivery", externalStateCode: 41 });
    expect((await db.select().from(s.orders).where(eq(s.orders.id, orderId)))[0]!.status).toBe("out_for_delivery");

    const events = async () => (await db.select().from(s.shipmentCarrierEvents).where(eq(s.shipmentCarrierEvents.shipmentId, row.id))).length;
    const before = await events();
    await sync.applyBostaState(
      { ...(await shipmentOf(orderId)), sellerId: w.a.sellerId },
      { code: 41, occurredAt: "2026-10-26T10:00:00.000Z" },
    );
    const after = await events();
    await sync.applyBostaState(
      { ...(await shipmentOf(orderId)), sellerId: w.a.sellerId },
      { code: 41, occurredAt: "2026-10-26T10:00:00.000Z" },
    );
    expect(await events()).toBe(after);
    expect(after).toBe(before + 1);
  });

  it("ignores states that arrive out of order", async () => {
    const { orderId } = await shippedOrder();
    const row = await shipmentOf(orderId);
    await sync.applyBostaState({ ...row, sellerId: w.a.sellerId }, { code: 41, occurredAt: new Date().toISOString() });
    const later = await shipmentOf(orderId);
    const result = await sync.applyBostaState({ ...later, sellerId: w.a.sellerId }, { code: 21, occurredAt: new Date(Date.now() - 60_000).toISOString() });
    expect(result.moved).toEqual([]);
    expect((await shipmentOf(orderId)).status).toBe("out_for_delivery");
  });

  it("delivered walks assigned → out for delivery → delivered and posts only the fee, once", async () => {
    const { orderId, trackingNumber } = await shippedOrder();
    const row = await shipmentOf(orderId);
    bosta.state.codes.set(trackingNumber, 45);
    expect(await webhook(row, 45)).toMatchObject({ status: 200, body: { status: "delivered" } });
    expect(await shipmentOf(orderId)).toMatchObject({ status: "delivered", externalStateCode: 45 });
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, orderId));
    expect(order!.status).toBe("delivered");

    const ledger = async () => db.select().from(s.walletTransactions).where(eq(s.walletTransactions.orderId, orderId));
    const first = await ledger();
    // Bosta collected the cash for the seller: no sale is credited; the fee is posted (or skipped in the trial).
    expect(first.filter((e) => e.type === "sale")).toHaveLength(0);
    expect(first.filter((e) => e.type === "fee").length).toBeLessThanOrEqual(1);

    // Replays and a later sync change nothing.
    await webhook(row, 45);
    await sync.applyBostaState({ ...(await shipmentOf(orderId)), sellerId: w.a.sellerId }, { code: 45, occurredAt: new Date().toISOString() });
    expect((await ledger()).length).toBe(first.length);
  });

  it("an exception flags the order and keeps the status", async () => {
    const { orderId, trackingNumber } = await shippedOrder();
    bosta.state.codes.set(trackingNumber, 47);
    const row = await shipmentOf(orderId);
    await sync.handleBostaWebhook(
      account.integrationId,
      `Bearer ${account.webhookToken}`,
      { _id: row.externalId, trackingNumber, state: 47, exceptionReason: "Customer not answering", exceptionCode: 1, timeStamp: Date.now() },
      { fetchImpl: bosta.fetchImpl },
    );
    expect(await shipmentOf(orderId)).toMatchObject({
      status: "assigned",
      needsAttention: true,
      lastError: "exception: Customer not answering",
    });
    const bells = await db
      .select()
      .from(s.sellerNotifications)
      .where(and(eq(s.sellerNotifications.sellerId, w.a.sellerId), eq(s.sellerNotifications.type, "carrier_needs_attention")));
    expect(bells.some((b) => (b.data as { orderId?: string }).orderId === orderId)).toBe(true);
  });

  it("cancelled at Bosta before pickup gives the order back to the seller", async () => {
    const { orderId, trackingNumber } = await shippedOrder();
    bosta.state.codes.set(trackingNumber, 49);
    expect(await webhook(await shipmentOf(orderId), 49)).toMatchObject({ status: 200 });
    expect(await shipmentOf(orderId)).toMatchObject({
      status: "pending",
      externalId: null,
      trackingNumber: null,
      needsAttention: true,
      lastError: "bosta_cancelled",
    });
    expect((await db.select().from(s.orders).where(eq(s.orders.id, orderId)))[0]!.status).toBe("confirmed");
    // It can go to Bosta again.
    expect(await ship.shipOrderWithBosta(w.a.a1, orderId, { trigger: "manual", fetchImpl: bosta.fetchImpl })).toMatchObject({ ok: true });
  });

  it("the sync cron catches a dropped webhook", async () => {
    const { orderId, trackingNumber } = await shippedOrder();
    bosta.state.codes.set(trackingNumber, 24);
    await db
      .update(s.shipments)
      .set({ lastSyncedAt: new Date(Date.now() - 3 * 3600_000).toISOString() })
      .where(eq(s.shipments.orderId, orderId));
    const summary = await sync.syncBostaShipments({ fetchImpl: bosta.fetchImpl, limit: 500 });
    expect(summary.checked).toBeGreaterThanOrEqual(1);
    expect(await shipmentOf(orderId)).toMatchObject({ status: "out_for_delivery", externalStateCode: 24 });
  });

  it("cancel before pickup needs the Full access setting, then gives the order back", async () => {
    const orders = await import("./bosta-orders.server");
    const { saveBostaSettings } = await import("../integrations/bosta.server");
    const { orderId, trackingNumber } = await shippedOrder();

    expect(await orders.cancelBostaShipment(w.a.sellerId, w.a.a1, orderId, { fetchImpl: bosta.fetchImpl })).toEqual({
      ok: false,
      error: "full_access_required",
    });
    await saveBostaSettings(w.a.sellerId, w.a.a1, { canCancel: true }, { q: db, fetchImpl: bosta.fetchImpl });
    try {
      expect(await orders.cancelBostaShipment(w.b.sellerId, w.a.a1, orderId, { fetchImpl: bosta.fetchImpl })).toEqual({
        ok: false,
        error: "not_connected",
      });
      expect(await orders.cancelBostaShipment(w.a.sellerId, w.a.a1, orderId, { fetchImpl: bosta.fetchImpl })).toEqual({ ok: true });
      expect(bosta.state.terminated).toContain(trackingNumber);
      expect(await shipmentOf(orderId)).toMatchObject({ status: "pending", externalId: null, lastError: "bosta_cancelled" });

      // After pickup Bosta can't terminate it.
      const picked = await shippedOrder();
      bosta.state.codes.set(picked.trackingNumber, 21);
      await webhook(await shipmentOf(picked.orderId), 21);
      expect(await orders.cancelBostaShipment(w.a.sellerId, w.a.a1, picked.orderId, { fetchImpl: bosta.fetchImpl })).toEqual({
        ok: false,
        error: "picked_up",
      });
    } finally {
      await saveBostaSettings(w.a.sellerId, w.a.a1, { canCancel: false }, { q: db, fetchImpl: bosta.fetchImpl });
    }
  });

  it("labels and the timeline only for this store's own shipments", async () => {
    const orders = await import("./bosta-orders.server");
    const a = await shippedOrder();
    const b = await shippedOrder();

    const labels = await orders.getBostaLabels(w.a.sellerId, w.a.a1, [a.orderId, b.orderId], { type: "A6", lang: "ar" }, { fetchImpl: bosta.fetchImpl });
    expect(labels).toMatchObject({ ok: true, count: 2 });
    expect(bosta.state.labels.at(-1)!.split(",").sort()).toEqual([a.trackingNumber, b.trackingNumber].sort());
    expect(await orders.getBostaLabels(w.b.sellerId, w.a.a1, [a.orderId], { type: "A6", lang: "ar" }, { fetchImpl: bosta.fetchImpl })).toEqual({
      ok: false,
      error: "not_connected",
    });
    expect(await orders.getBostaLabels(w.a.sellerId, w.a.a2, [a.orderId], { type: "A6", lang: "ar" }, { fetchImpl: bosta.fetchImpl })).toEqual({
      ok: false,
      error: "not_connected",
    });

    const timeline = await orders.listBostaTimeline(w.a.sellerId, w.a.a1, a.orderId);
    expect(timeline?.[0]).toMatchObject({ stateCode: 10 });
    expect(await orders.listBostaTimeline(w.b.sellerId, w.a.a1, a.orderId)).toBeNull();
  });

});
