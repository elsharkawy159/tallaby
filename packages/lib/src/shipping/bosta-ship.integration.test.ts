import { randomBytes, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import type { IsolationWorld } from "../stores/isolation.fixtures";

/**
 * shipOrderWithBosta (BS-08) against staging with a fake Bosta: one delivery
 * per order however often it is pressed, address problems land in
 * needs_attention, a lost create response is re-linked. Skipped when
 * TEST_DATABASE_URL is unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

type ShipModule = typeof import("./bosta-ship.server");

const KEY = "bosta-test-key-ship-0001";

/** A fake Bosta. `mode` switches what POST /deliveries answers. */
function fakeBosta() {
  const state = { creates: 0, bodies: [] as Array<Record<string, unknown>>, mode: "ok" as "ok" | "duplicate" | "slow", existing: null as null | Record<string, unknown> };
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/pickup-locations")) {
      return Response.json({ success: true, data: { list: [{ _id: "loc-1", locationName: "Warehouse", isDefault: true }] } });
    }
    if (url.includes("/deliveries/search")) {
      return Response.json({ success: true, data: { deliveries: state.existing ? [state.existing] : [] } });
    }
    if (url.includes("/deliveries?apiVersion=1")) {
      state.creates += 1;
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      state.bodies.push(body);
      if (state.mode === "slow") await new Promise((resolve) => setTimeout(resolve, 400));
      if (state.mode === "duplicate") {
        state.existing = { _id: `bosta-${state.creates}`, trackingNumber: `TN${state.creates}`, state: { code: 10 }, businessReference: body.businessReference };
        return Response.json({ success: false, message: "uniqueBusinessReference already exists", errorCode: 1077 }, { status: 400 });
      }
      return Response.json({ success: true, data: { _id: `bosta-${state.creates}`, trackingNumber: `TN${state.creates}`, state: { code: 10, value: "Created" } } });
    }
    return Response.json({ success: false, message: "not found" }, { status: 404 });
  }) as unknown as typeof fetch;
  return { state, fetchImpl };
}

describe.skipIf(!TEST_DATABASE_URL)("shipOrderWithBosta (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const buyer = randomUUID();
  const bosta = fakeBosta();
  let w: IsolationWorld;
  let ship: ShipModule;
  let productId = "";
  let cairo = "";
  let nowhere = "";
  const previousDbUrl = process.env.DATABASE_URL;
  const previousKey = process.env.INTEGRATIONS_ENCRYPTION_KEY;

  async function order(values: Partial<typeof s.orders.$inferInsert> = {}) {
    const [row] = await db
      .insert(s.orders)
      .values({
        orderNumber: `BS-${randomUUID().slice(0, 12)}`,
        userId: buyer,
        subtotal: "250.00",
        shippingCost: "50.00",
        totalAmount: "300.00",
        status: "confirmed",
        paymentStatus: "pending",
        paymentMethod: "cash_on_delivery",
        storeId: w.a.a1,
        shippingAddressId: cairo,
        ...values,
      })
      .returning({ id: s.orders.id });
    await db.insert(s.orderItems).values({
      orderId: row!.id,
      productId,
      sellerId: w.a.sellerId,
      sku: "bs-sku",
      productName: "Mug",
      quantity: 2,
      price: "125.00",
      subtotal: "250.00",
      total: "250.00",
      commissionAmount: "0",
      commissionRate: 0,
      sellerEarning: "250.00",
      status: "confirmed",
    });
    return row!.id;
  }

  const shipment = async (orderId: string) =>
    (await db.select().from(s.shipments).where(eq(s.shipments.orderId, orderId)))[0];

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.INTEGRATIONS_ENCRYPTION_KEY ||= randomBytes(32).toString("hex");
    // Imported after DATABASE_URL is set: they load the shared @workspace/db client.
    ship = await import("./bosta-ship.server");
    const { createIsolationWorld } = await import("../stores/isolation.fixtures");
    const { saveBostaKey } = await import("../integrations/bosta.server");
    w = await createIsolationWorld(db);

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, categoryId: category!.id, status: "active", quantity: "100", sku: `bs-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id });
    productId = product!.id;

    await db.insert(s.users).values({ id: buyer, isGuest: false, role: "customer" });
    const address = async (state: string, city: string) =>
      (
        await db
          .insert(s.userAddresses)
          .values({ userId: buyer, fullName: "Mona Adel", phone: "01012345678", addressLine1: "12 Abbas El Akkad St", city, state, postalCode: "11765" })
          .returning({ id: s.userAddresses.id })
      )[0]!.id;
    cairo = await address("القاهرة", "مدينة نصر");
    nowhere = await address("Atlantis", "Lost City");

    const saved = await saveBostaKey(w.a.sellerId, w.a.sellerId, w.a.a1, KEY, { q: db, fetchImpl: bosta.fetchImpl });
    expect(saved.success).toBe(true);
  }, 120_000);

  afterAll(async () => {
    const orderRows = await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer));
    const orderIds = orderRows.map((row) => row.id);
    if (orderIds.length) {
      await db.delete(s.shipments).where(inArray(s.shipments.orderId, orderIds));
      await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, orderIds));
      await db.delete(s.orders).where(inArray(s.orders.id, orderIds));
    }
    if (productId) await db.delete(s.products).where(eq(s.products.id, productId));
    await db.delete(s.userAddresses).where(eq(s.userAddresses.userId, buyer));
    await db.delete(s.users).where(eq(s.users.id, buyer));
    await w?.cleanup();
    await client.end();
    process.env.DATABASE_URL = previousDbUrl;
    process.env.INTEGRATIONS_ENCRYPTION_KEY = previousKey;
  });

  it("creates one Bosta delivery and moves the shipment to assigned", async () => {
    const orderId = await order();
    const before = bosta.state.creates;
    const result = await ship.shipOrderWithBosta(w.a.a1, orderId, { trigger: "manual", sellerId: w.a.sellerId, fetchImpl: bosta.fetchImpl });
    expect(result).toMatchObject({ ok: true, trackingNumber: `TN${before + 1}` });
    expect(bosta.state.creates).toBe(before + 1);

    const body = bosta.state.bodies.at(-1)!;
    expect(body).toMatchObject({
      type: 10,
      cod: 300,
      uniqueBusinessReference: `tallaby:${orderId}`,
      businessLocationId: "loc-1",
      escrowInfo: { isExcluded: true },
      receiver: { firstName: "Mona", lastName: "Adel", phone: "01012345678" },
    });
    expect((body.dropOffAddress as Record<string, unknown>).districtId).toBeTruthy();

    const row = await shipment(orderId);
    expect(row).toMatchObject({
      carrier: "bosta",
      status: "assigned",
      externalId: `bosta-${before + 1}`,
      trackingNumber: `TN${before + 1}`,
      externalStateCode: 10,
      needsAttention: false,
      storeIntegrationId: expect.any(String),
    });
    const items = await db.select({ status: s.orderItems.status }).from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
    expect(items.every((i) => i.status === "shipping_soon")).toBe(true);
    const events = await db.select().from(s.shipmentCarrierEvents).where(eq(s.shipmentCarrierEvents.shipmentId, row!.id));
    expect(events).toHaveLength(1);

    // Pressing again never creates a second delivery.
    expect(await ship.shipOrderWithBosta(w.a.a1, orderId, { trigger: "manual", fetchImpl: bosta.fetchImpl })).toEqual({
      ok: false,
      error: "already_shipped",
    });
    expect(bosta.state.creates).toBe(before + 1);
  });

  it("a double click while the call is in flight sends one request", async () => {
    const orderId = await order();
    const before = bosta.state.creates;
    bosta.state.mode = "slow";
    try {
      const results = await Promise.all([
        ship.shipOrderWithBosta(w.a.a1, orderId, { trigger: "manual", fetchImpl: bosta.fetchImpl }),
        ship.shipOrderWithBosta(w.a.a1, orderId, { trigger: "manual", fetchImpl: bosta.fetchImpl }),
      ]);
      expect(results.filter((r) => r.ok)).toHaveLength(1);
      expect(results.find((r) => !r.ok)).toMatchObject({ ok: false, error: expect.stringMatching(/in_progress|already_shipped/) });
    } finally {
      bosta.state.mode = "ok";
    }
    expect(bosta.state.creates).toBe(before + 1);
  });

  it("prepaid orders send COD 0; unpaid online orders wait", async () => {
    const paid = await order({ paymentStatus: "paid", paymentMethod: "card" });
    expect(await ship.shipOrderWithBosta(w.a.a1, paid, { trigger: "manual", fetchImpl: bosta.fetchImpl })).toMatchObject({ ok: true });
    expect(bosta.state.bodies.at(-1)).toMatchObject({ cod: 0 });

    const unpaid = await order({ paymentMethod: "instapay" });
    expect(await ship.shipOrderWithBosta(w.a.a1, unpaid, { trigger: "on_confirm", fetchImpl: bosta.fetchImpl })).toEqual({
      ok: false,
      error: "awaiting_payment",
    });
    expect(await shipment(unpaid)).toBeUndefined();
  });

  it("an unmatched address needs the seller: needs_attention, a notification, and the picker after a pick ships", async () => {
    const orderId = await order({ shippingAddressId: nowhere });
    const before = bosta.state.creates;
    const failed = await ship.shipOrderWithBosta(w.a.a1, orderId, { trigger: "manual", fetchImpl: bosta.fetchImpl });
    expect(failed).toMatchObject({ ok: false, error: "unknown_region" });
    expect(bosta.state.creates).toBe(before);
    expect(await shipment(orderId)).toMatchObject({ carrier: "bosta", status: "pending", needsAttention: true, lastError: "unknown_region", externalId: null });
    const bells = await db
      .select()
      .from(s.sellerNotifications)
      .where(and(eq(s.sellerNotifications.sellerId, w.a.sellerId), eq(s.sellerNotifications.type, "carrier_shipment_failed")));
    expect(bells.some((b) => (b.data as { orderId?: string }).orderId === orderId)).toBe(true);

    const preview = await ship.previewBostaShipment(w.a.sellerId, w.a.a1, orderId, { locale: "en" });
    expect(preview).toMatchObject({ ok: true, data: { destination: { ok: false, reason: "unknown_region" }, lastError: "unknown_region" } });

    // The seller picks a Nasr City district from the Cairo preview's list.
    const cairoPreview = await ship.previewBostaShipment(w.a.sellerId, w.a.a1, await order(), { locale: "en" });
    if (!cairoPreview.ok || !cairoPreview.data.destination.ok) throw new Error("expected a Cairo match");
    const districtId = cairoPreview.data.destination.districtId!;
    const retried = await ship.shipOrderWithBosta(w.a.a1, orderId, {
      trigger: "retry",
      overrides: { districtId },
      fetchImpl: bosta.fetchImpl,
    });
    expect(retried).toMatchObject({ ok: true });
    expect(await shipment(orderId)).toMatchObject({ status: "assigned", needsAttention: false, lastError: null });
  });

  it("re-links a delivery Bosta already has (lost create response)", async () => {
    const orderId = await order();
    bosta.state.mode = "duplicate";
    try {
      const result = await ship.shipOrderWithBosta(w.a.a1, orderId, { trigger: "manual", fetchImpl: bosta.fetchImpl });
      expect(result).toMatchObject({ ok: true });
    } finally {
      bosta.state.mode = "ok";
    }
    expect(await shipment(orderId)).toMatchObject({ status: "assigned", externalId: expect.stringMatching(/^bosta-/) });
  });

  it("refuses another seller, another store and marketplace orders", async () => {
    const orderId = await order();
    expect(await ship.shipOrderWithBosta(w.a.a1, orderId, { trigger: "manual", sellerId: w.b.sellerId, fetchImpl: bosta.fetchImpl })).toEqual({
      ok: false,
      error: "not_connected",
    });
    expect(await ship.shipOrderWithBosta(w.b.b1, orderId, { trigger: "manual", fetchImpl: bosta.fetchImpl })).toEqual({
      ok: false,
      error: "not_connected",
    });
    const marketplace = await order({ storeId: null });
    expect(await ship.shipOrderWithBosta(w.a.a1, marketplace, { trigger: "manual", fetchImpl: bosta.fetchImpl })).toEqual({
      ok: false,
      error: "not_found",
    });
    expect(await ship.previewBostaShipment(w.b.sellerId, w.a.a1, orderId)).toEqual({ ok: false, error: "not_connected" });
  });
});
