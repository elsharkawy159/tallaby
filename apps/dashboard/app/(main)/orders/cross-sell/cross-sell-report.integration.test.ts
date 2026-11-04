import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * The cross-sell report (ROADMAP.md F-32f) against the staging database, with
 * snapshots in the shape `applyCrossSellDiscounts` saves. Another store's orders,
 * orders that fell through and old orders stay out, and another seller gets
 * nothing. Rows are removed afterwards. Runs only when TEST_DATABASE_URL is set;
 * never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

const session = vi.hoisted(() => ({ userId: "", locked: false }));
vi.mock("@/lib/auth/session.server", () => ({ getSessionUser: async () => ({ id: session.userId }) }));
vi.mock("@workspace/lib/billing/order-lock", () => ({
  getOrderLock: async () => ({ locked: session.locked, pendingReview: false }),
}));

describe.skipIf(!TEST_DATABASE_URL)("cross-sell report (integration)", { timeout: 120_000 }, () => {
  const run = randomUUID().slice(0, 8);
  const sellerId = randomUUID();
  const otherSellerId = randomUUID();
  const customerId = randomUUID();
  const storeA = randomUUID();
  const storeB = randomUUID();
  const mainId = randomUUID();
  const cableId = randomUUID();
  const caseId = randomUUID();
  const cableOffer = randomUUID();
  const caseOffer = randomUUID();
  const FILTERS = { days: 30 as const, page: 1, size: 20 };
  let counter = 0;

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./cross-sell-report.query")),
    ...(await import("@/lib/auth/require-seller.server")),
  });

  const snapshot = (offerId: string, unitDiscountPiastres: number, discountedUnits: number) => ({
    crossSell: { offerId, mainProductId: mainId, discountType: "percent", discountValue: 10, unitDiscountPiastres, discountedUnits },
  });

  /** An order with its main line and offer lines. */
  async function order(input: {
    storeId: string;
    owner?: string;
    status?: string;
    daysAgo?: number;
    lines: { productId: string; name: string; metadata: unknown }[];
  }) {
    const { db, sql } = await load();
    const id = randomUUID();
    counter += 1;
    const at = new Date(Date.now() - (input.daysAgo ?? 0) * 86_400_000).toISOString();
    await db.execute(sql`
      INSERT INTO orders (id, order_number, user_id, store_id, status, subtotal, total_amount, created_at)
      VALUES (${id}, ${`QA-${run}-${counter}`}, ${customerId}, ${input.storeId}, ${input.status ?? "confirmed"}, '100', '100', ${at})
    `);
    for (const line of [{ productId: mainId, name: "Power bank", metadata: null }, ...input.lines]) {
      await db.execute(sql`
        INSERT INTO order_items (order_id, product_id, seller_id, sku, product_name, quantity, price, subtotal, commission_rate, commission_amount, seller_earning, total, metadata)
        VALUES (${id}, ${line.productId}, ${input.owner ?? sellerId}, 'QA', ${line.name}, 1, '100', '100', 0, '0', '100', '100', ${line.metadata === null ? null : JSON.stringify(line.metadata)}::jsonb)
      `);
    }
  }

  const cable = (unit: number, units: number) => ({ productId: cableId, name: "Cable", metadata: snapshot(cableOffer, unit, units) });
  const phoneCase = (unit: number, units: number) => ({ productId: caseId, name: "Case", metadata: snapshot(caseOffer, unit, units) });

  beforeAll(async () => {
    const { db, sql, categories, products } = await load();
    for (const id of [sellerId, otherSellerId, customerId]) {
      const email = `qa-${id.slice(0, 8)}@example.test`;
      await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${email}, 'authenticated', 'authenticated')`);
      await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${id}, ${email}, false) ON CONFLICT DO NOTHING`);
    }
    for (const id of [sellerId, otherSellerId]) {
      await db.execute(sql`
        INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email, status)
        VALUES (${id}, 'QA report', 'QA report', ${`qa-${id.slice(0, 8)}`}, 'individual', '{"country":"EG"}'::jsonb, 'x@example.com', 'approved')
      `);
    }
    for (const [id, name] of [
      [storeA, "a"],
      [storeB, "b"],
    ] as const) {
      await db.execute(sql`INSERT INTO stores (id, seller_id, name, subdomain, status) VALUES (${id}, ${sellerId}, ${`QA ${name}`}, ${`qa-r${name}-${run}`}, 'active')`);
    }
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    for (const [id, key] of [
      [mainId, "m"],
      [cableId, "c"],
      [caseId, "s"],
    ] as const) {
      await db.insert(products).values({ id, sellerId, categoryId: category!.id, status: "active", quantity: "50", price: 100, images: [], sku: `qa-${run}-${key}` });
    }

    // Counted in store A: three orders, one with both offers.
    await order({ storeId: storeA, lines: [cable(1000, 2)] });
    await order({ storeId: storeA, status: "delivered", daysAgo: 10, lines: [cable(1000, 1), phoneCase(250, 3)] });
    await order({ storeId: storeA, status: "pending", lines: [cable(999, 1)] });
    // Not counted: no offer, fell through, too old, another store.
    await order({ storeId: storeA, lines: [] });
    await order({ storeId: storeA, status: "cancelled", lines: [cable(1000, 9)] });
    await order({ storeId: storeA, status: "payment_processing", lines: [cable(1000, 9)] });
    await order({ storeId: storeA, status: "returned", lines: [cable(1000, 9)] });
    await order({ storeId: storeA, daysAgo: 45, lines: [cable(1000, 5)] });
    await order({ storeId: storeB, lines: [cable(1000, 7)] });
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    // Deleting the auth users cascades to everything they own (0134).
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerId}, ${otherSellerId}, ${customerId})`);
  }, 120_000);

  it("adds up orders, units and discount for each offer of this store", async () => {
    const { loadCrossSellReport } = await load();
    const report = await loadCrossSellReport(sellerId, storeA, FILTERS);
    expect(report.rows).toEqual([
      { offerId: cableOffer, offerName: "Cable", mainName: "Power bank", orders: 3, units: 4, discount: "39.99" },
      { offerId: caseOffer, offerName: "Case", mainName: "Power bank", orders: 1, units: 3, discount: "7.50" },
    ]);
    expect(report.total).toBe(2);
  });

  it("counts an order with two offers once in the totals", async () => {
    const { loadCrossSellReport } = await load();
    const { totals } = await loadCrossSellReport(sellerId, storeA, FILTERS);
    expect(totals).toEqual({ orders: 3, units: 7, discount: "47.49" });
  });

  it("follows the period", async () => {
    const { loadCrossSellReport } = await load();
    expect((await loadCrossSellReport(sellerId, storeA, { ...FILTERS, days: 7 })).totals.orders).toBe(2);
    expect((await loadCrossSellReport(sellerId, storeA, { ...FILTERS, days: 90 })).totals.orders).toBe(4);
  });

  it("pages on the server", async () => {
    const { loadCrossSellReport } = await load();
    const second = await loadCrossSellReport(sellerId, storeA, { ...FILTERS, size: 1, page: 2 });
    expect(second.rows.map((r) => r.offerName)).toEqual(["Case"]);
    expect(second).toMatchObject({ total: 2, pages: 2, page: 2 });
  });

  it("gives another seller nothing for this store", async () => {
    const { loadCrossSellReport } = await load();
    expect(await loadCrossSellReport(otherSellerId, storeA, FILTERS)).toMatchObject({ rows: [], total: 0, totals: { orders: 0 } });
  });

  it("stops at the first top-up lock", async () => {
    const { requireOrdersStore } = await load();
    session.userId = sellerId;
    session.locked = true;
    await expect(requireOrdersStore(storeA)).rejects.toMatchObject({ code: "orders_locked" });
    session.locked = false;
  });
});
