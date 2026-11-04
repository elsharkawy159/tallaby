import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The server-side orders list (ROADMAP.md F-43g) against the staging database:
 * tab counts, stage filters and search in SQL must match what the rows show.
 * Every order status, shipment status and a spread of payment statuses is
 * inserted under a new seller, then removed. Runs only when TEST_DATABASE_URL is
 * set (it becomes DATABASE_URL for @workspace/db); never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

const ORDER_STATUSES = [
  "pending",
  "payment_processing",
  "confirmed",
  "shipping_soon",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded",
  "returned",
] as const;
const PAYMENT_STATUSES = ["pending", "paid", "collected", "failed"] as const;
const SHIPMENT_STATUSES = [null, "pending", "assigned", "out_for_delivery", "delivered", "failed", "returned", "cancelled"] as const;

describe.skipIf(!TEST_DATABASE_URL)("orders list (integration)", { timeout: 180_000 }, () => {
  const run = randomUUID().slice(0, 8);
  const sellerId = randomUUID();
  const otherSellerId = randomUUID();
  const customerId = randomUUID();
  const storeA = randomUUID();
  const storeB = randomUUID();
  const productId = randomUUID();
  const otherProductId = randomUUID();
  const ids: string[] = [];
  const otherOrderId = randomUUID();
  const context = { stores: [], bostaStores: new Map(), wassalhaStores: new Set<string>() };

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./orders.query")),
    ...(await import("./orders-list.query")),
    ...(await import("./orders-view.lib")),
    ...(await import("./orders.lib")),
  });
  const scope = (over = {}) => ({ channel: "all", q: "", attention: false, ...over });
  const query = (over = {}) => ({ ...scope(), tab: "all" as const, sort: "newest" as const, ...over });

  // Rows are the truth: everything in SQL is compared with them.
  const allRows = async () => {
    const { loadSellerOrders } = await load();
    return loadSellerOrders(sellerId, ids, context, { withRisks: false });
  };

  beforeAll(async () => {
    const { db, sql, categories, orderItems, orders, products, shipments, userAddresses, users, eq } = await load();
    for (const id of [sellerId, otherSellerId, customerId]) {
      await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${`qa-${id.slice(0, 8)}@example.test`}, 'authenticated', 'authenticated')`);
    }
    await db.update(users).set({ isGuest: true, fullName: "Guest User", phone: null }).where(eq(users.id, customerId));
    for (const id of [sellerId, otherSellerId]) {
      const sub = `ol-${id.slice(0, 8)}`;
      await db.execute(sql`
        INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, status)
        VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'ol@example.com', 'approved')
      `);
    }
    for (const [id, owner] of [[storeA, sellerId], [storeB, sellerId]] as const) {
      const sub = `ol-${id.slice(0, 8)}`;
      await db.execute(sql`INSERT INTO stores (id, seller_id, name, subdomain) VALUES (${id}, ${owner}, ${sub}, ${sub})`);
    }
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    for (const [id, owner] of [[productId, sellerId], [otherProductId, otherSellerId]] as const) {
      await db.insert(products).values({ id, sellerId: owner, categoryId: category!.id, status: "active", quantity: "1000", price: 10, images: [] });
    }
    const [mona] = await db
      .insert(userAddresses)
      .values({ userId: customerId, fullName: "Mona Adel", phone: "+20 100 123 4567", addressLine1: "1 St", city: "Nasr City", state: "Cairo", postalCode: "", country: "EG" })
      .returning({ id: userAddresses.id });
    const [karim] = await db
      .insert(userAddresses)
      .values({ userId: customerId, fullName: "  ", phone: "0111 222 3333", addressLine1: "2 St", city: "Giza", state: "Giza", postalCode: "", country: "EG" })
      .returning({ id: userAddresses.id });

    // Every combination that can decide a stage.
    const combos = ORDER_STATUSES.flatMap((status) =>
      PAYMENT_STATUSES.flatMap((paymentStatus) =>
        SHIPMENT_STATUSES.map((shipment) => ({ id: randomUUID(), status, paymentStatus, shipment })),
      ),
    );
    await db.insert(orders).values(
      combos.map((c, i) => ({
        id: c.id,
        userId: customerId,
        orderNumber: `OL-${run}-${i}`,
        subtotal: "10",
        commissionRate: 0,
        commissionAmount: "0",
        sellerEarning: "10",
        totalAmount: String(10 + i),
        status: c.status,
        paymentStatus: c.paymentStatus,
        storeId: i % 3 === 0 ? null : i % 3 === 1 ? storeA : storeB,
        shippingAddressId: i % 2 === 0 ? mona!.id : karim!.id,
        createdAt: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString(),
      })),
    );
    ids.push(...combos.map((c) => c.id));
    await db.insert(orderItems).values(
      combos.map((c) => ({
        orderId: c.id,
        productId,
        sellerId,
        sku: `SKU-${run}`,
        productName: `Item ${run}`,
        quantity: 1,
        price: "10",
        subtotal: "10",
        commissionRate: 0,
        commissionAmount: "0",
        sellerEarning: "10",
        total: "10",
      })),
    );
    const withShipment = combos.filter((c) => c.shipment);
    await db.insert(shipments).values(
      withShipment.map((c, i) => ({
        orderId: c.id,
        status: c.shipment!,
        sellerId,
        carrier: i % 7 === 0 ? "bosta" : null,
        needsAttention: i % 14 === 0,
      })),
    );
    // Another seller's order must never count.
    await db.insert(orders).values({ id: otherOrderId, userId: customerId, orderNumber: `OL-${run}-other`, subtotal: "1", totalAmount: "1" });
    await db.insert(orderItems).values({ orderId: otherOrderId, productId: otherProductId, sellerId: otherSellerId, sku: "OTHER", productName: "Other", quantity: 1, price: "1", subtotal: "1", commissionRate: 0, commissionAmount: "0", sellerEarning: "1", total: "1" });
  }, 180_000);

  afterAll(async () => {
    const { db, sql } = await load();
    for (const id of [sellerId, otherSellerId, customerId]) {
      await db.execute(sql`DELETE FROM orders WHERE user_id = ${id}`);
      await db.execute(sql`DELETE FROM products WHERE seller_id = ${id}`);
      await db.execute(sql`DELETE FROM auth.users WHERE id = ${id}`);
      await db.execute(sql`DELETE FROM users WHERE id = ${id}`);
    }
  });

  it("gives every status combination the stage the row shows", async () => {
    const { db, orders, orderStageSql, inArray } = await load();
    const rows = await allRows();
    expect(rows).toHaveLength(ORDER_STATUSES.length * PAYMENT_STATUSES.length * SHIPMENT_STATUSES.length);
    const inSql = await db.select({ id: orders.id, stage: orderStageSql }).from(orders).where(inArray(orders.id, ids));
    const stageById = new Map(inSql.map((r) => [r.id, r.stage]));
    for (const row of rows) expect(`${row.id}:${stageById.get(row.id)}`).toBe(`${row.id}:${row.flow.stage}`);
  });

  it("counts tabs exactly as the rows do, for each store", async () => {
    const { countOrdersByTab, countByTab, matchesChannel } = await load();
    const rows = await allRows();
    expect(await countOrdersByTab(sellerId, scope())).toEqual(countByTab(rows));
    for (const channel of ["marketplace", storeA, storeB]) {
      expect(await countOrdersByTab(sellerId, scope({ channel }))).toEqual(
        countByTab(rows.filter((r) => matchesChannel(r, channel))),
      );
    }
  });

  it("lists each tab with exactly the orders the tab shows, newest first", async () => {
    const { listFilteredOrderIds, matchesTab, ORDERS_TABS } = await load();
    const rows = await allRows();
    for (const tab of ORDERS_TABS) {
      const want = rows
        .filter((r) => matchesTab(r, tab))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((r) => r.id);
      expect(await listFilteredOrderIds(sellerId, query({ tab }))).toEqual(want);
    }
  });

  it("counts orders waiting to be prepared per channel, as isAwaitingPrep reads the same orders", async () => {
    const { countOrdersAwaitingPrep, db, inArray, orders, isAwaitingPrep } = {
      ...(await load()),
      ...(await import("./order-flow.lib")),
    };
    const rows = await allRows();
    const statuses = await db.select({ id: orders.id, status: orders.status }).from(orders).where(inArray(orders.id, ids));
    const statusOf = new Map(statuses.map((o) => [o.id, o.status]));
    const waiting = rows.filter((r) => isAwaitingPrep(statusOf.get(r.id) ?? null, r.flow.stage));
    expect(waiting.length).toBeGreaterThan(0);
    expect(await countOrdersAwaitingPrep(sellerId, "all")).toBe(waiting.length);
    expect(await countOrdersAwaitingPrep(sellerId, storeA)).toBe(waiting.filter((r) => r.storeId === storeA).length);
    expect(await countOrdersAwaitingPrep(sellerId, "marketplace")).toBe(waiting.filter((r) => r.storeId === null).length);
    // The other seller has their one waiting order, and none of this seller's.
    expect(await countOrdersAwaitingPrep(otherSellerId, "all")).toBe(1);
  });

  it("searches number, name and phone as the rows do, older orders included", async () => {
    const { countOrdersByTab, listFilteredOrderIds, matchesQuery } = await load();
    const rows = await allRows();
    const searches = [`OL-${run}-1`, `#ol-${run}-20`, "mona", "MONA ADEL", "Guest", "qa-", "1001234", "+20 100", "0111 222", "11", "%", "_", "nothing-here", "#"];
    for (const q of searches) {
      const want = rows.filter((r) => matchesQuery(r, q)).map((r) => r.id).sort();
      expect((await listFilteredOrderIds(sellerId, query({ q }))).sort(), q).toEqual(want);
      expect((await countOrdersByTab(sellerId, scope({ q }))).all, q).toBe(want.length);
    }
  });

  it("finds the Bosta attention orders the rows flag", async () => {
    const { countOrdersByTab, listFilteredOrderIds, loadOrdersOverview } = await load();
    const rows = await allRows();
    const flagged = rows.filter((r) => r.bosta?.needsAttention).map((r) => r.id).sort();
    expect(flagged.length).toBeGreaterThan(0);
    expect((await listFilteredOrderIds(sellerId, query({ attention: true }))).sort()).toEqual(flagged);
    expect((await countOrdersByTab(sellerId, scope({ attention: true }))).all).toBe(flagged.length);
    expect(await loadOrdersOverview(sellerId)).toEqual({ orders: rows.length, attention: flagged.length });
  });

  it("pages and sorts without losing or repeating an order", async () => {
    const { listFilteredOrderIds, listOrderIdsPage } = await load();
    const rows = await allRows();
    const paged: string[] = [];
    for (let page = 1; (page - 1) * 50 < rows.length; page++) {
      paged.push(...(await listOrderIdsPage(sellerId, query(), page, 50)));
    }
    expect(paged).toEqual(await listFilteredOrderIds(sellerId, query()));
    expect(new Set(paged).size).toBe(rows.length);

    const byTotal = (await listOrderIdsPage(sellerId, query({ sort: "totalDesc" }), 1, 5)).map(
      (id) => Number(rows.find((r) => r.id === id)!.totalAmount),
    );
    expect(byTotal).toEqual([...byTotal].sort((a, b) => b - a));
    const [oldest] = await listOrderIdsPage(sellerId, query({ sort: "oldest" }), 1, 1);
    expect(oldest).toBe(ids[0]);
  });

  it("keeps another seller's orders out of lists, rows and summaries", async () => {
    const { countOrdersByTab, listFilteredOrderIds, loadOrderSummaries, loadOrdersOverview, loadSellerOrders } = await load();
    expect(await listFilteredOrderIds(sellerId, query())).not.toContain(otherOrderId);
    expect(await loadSellerOrders(sellerId, [otherOrderId], context)).toEqual([]);
    expect(await loadOrderSummaries(sellerId, [otherOrderId], context)).toEqual([]);
    // The other seller sees none of this seller's orders, and only their own line of theirs.
    expect(await listFilteredOrderIds(otherSellerId, query())).toEqual([otherOrderId]);
    expect((await countOrdersByTab(otherSellerId, scope())).all).toBe(1);
    expect((await loadOrdersOverview(otherSellerId)).orders).toBe(1);
    expect(await loadSellerOrders(otherSellerId, ids.slice(0, 3), context)).toEqual([]);
  });

  it("gives a selection the same flow as the rows, and loads an order off the page by id", async () => {
    const { loadOrderSummaries, loadSellerOrders } = await load();
    const rows = await allRows();
    const summaries = await loadOrderSummaries(sellerId, ids, context);
    expect(summaries.map((s) => s.id)).toEqual(ids);
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const summary of summaries) expect(summary.flow).toEqual(byId.get(summary.id)!.flow);

    // ?order=<id>: the oldest order, far past page 1 of any list.
    const [linked] = await loadSellerOrders(sellerId, [ids[0]!], context);
    expect(linked?.id).toBe(ids[0]);
  });
});
