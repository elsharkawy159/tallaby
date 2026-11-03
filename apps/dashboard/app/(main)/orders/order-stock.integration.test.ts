import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Stock on order moves (ROADMAP.md F-42a) against the staging database, through
 * the real server actions. The seller session, cache, emails and page refresh
 * are stubbed; every query is real. Creates its own order and product and
 * removes them after. Runs only when TEST_DATABASE_URL is set (it becomes
 * DATABASE_URL for @workspace/db); never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

const session = vi.hoisted(() => ({ sellerId: "" }));
vi.mock("@/lib/auth/require-seller.server", () => {
  class AccessError extends Error {}
  return {
    AccessError,
    isAccessError: () => false,
    requireSeller: async () => ({ userId: session.sellerId, sellerId: session.sellerId, status: "approved", plan: "free" }),
  };
});
vi.mock("@workspace/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/cache")>()),
  applyInvalidation: async () => {},
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {}, updateTag: () => {} }));
vi.mock("next/server", () => ({ after: () => {} }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));
vi.mock("@workspace/lib/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/lib/orders")>()),
  sendOrderEventEmail: async () => {},
}));
vi.mock("@workspace/lib/shipping/bosta-ship", () => ({ autoShipOrderWithBosta: async () => {} }));

describe.skipIf(!TEST_DATABASE_URL)("stock on order moves (integration)", { timeout: 90_000 }, () => {
  const productId = randomUUID();
  const orderId = randomUUID();
  const addressName = `QA-${randomUUID().slice(0, 8)}`;
  let sellerId = "";

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./orders.server")),
  });

  const stock = async () => {
    const { db, eq, products } = await load();
    const [row] = await db.select({ q: products.quantity }).from(products).where(eq(products.id, productId));
    return Number(row!.q);
  };
  const setStock = async (quantity: number) => {
    const { db, eq, products } = await load();
    await db.update(products).set({ quantity: String(quantity) }).where(eq(products.id, productId));
  };
  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    const { updateSellerOrder } = await load();
    return updateSellerOrder({ orderId, action, ...extra });
  };

  beforeAll(async () => {
    const { db, categories, orderItems, orders, products, sellers, stores, eq } = await load();
    const [seller] = await db.select({ id: sellers.id }).from(sellers).limit(1);
    sellerId = seller!.id;
    session.sellerId = sellerId;
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.sellerId, sellerId)).limit(1);
    await db.insert(products).values({
      id: productId,
      sellerId,
      categoryId: category!.id,
      status: "active",
      quantity: "10",
      price: 100,
      images: [],
      sku: addressName,
    });
    await db.insert(orders).values({
      id: orderId,
      orderNumber: addressName,
      userId: sellerId,
      subtotal: "200.00",
      totalAmount: "200.00",
      status: "confirmed",
      paymentStatus: "pending",
      paymentMethod: "cash_on_delivery",
      storeId: store?.id ?? null,
    });
    await db.insert(orderItems).values({
      orderId,
      productId,
      sellerId,
      sku: addressName,
      productName: "QA lamp",
      quantity: 2,
      price: "100.00",
      subtotal: "200.00",
      total: "200.00",
      commissionAmount: "0",
      commissionRate: 0,
      sellerEarning: "200.00",
      status: "confirmed",
      fulfillmentType: "seller_fulfilled",
    });
  }, 90_000);

  afterAll(async () => {
    const { db, eq, orders, orderItems, products, shipments, sql } = await load();
    await db.execute(sql`DELETE FROM stock_movements WHERE product_id = ${productId}`).catch(() => {});
    await db.delete(shipments).where(eq(shipments.orderId, orderId)).catch(() => {});
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId)).catch(() => {});
    await db.delete(orders).where(eq(orders.id, orderId)).catch(() => {});
    await db.delete(products).where(eq(products.id, productId)).catch(() => {});
  }, 90_000);

  it("a damaged return keeps the stock off the shelf", async () => {
    expect(await act("ship")).toEqual({ success: true });
    expect(await stock()).toBe(10);
    expect(await act("return", { restock: false })).toEqual({ success: true });
    expect(await stock()).toBe(10);
  });

  it("the put-back button adds the stock once", async () => {
    const { restockReturnedOrder } = await load();
    expect(await restockReturnedOrder({ orderId })).toEqual({ success: true });
    expect(await stock()).toBe(12);
    expect((await restockReturnedOrder({ orderId })).success).toBe(false);
    expect(await stock()).toBe(12);
  });

  it("cancelling a restocked return doesn't add it twice", async () => {
    expect(await act("cancel")).toEqual({ success: true });
    expect(await stock()).toBe(12);
  });

  it("a cancelled order offers to add missing stock, then carries on", async () => {
    await setStock(1);
    const first = await act("reopen");
    expect(first.success).toBe(false);
    if (first.success) throw new Error("expected a shortage");
    expect(first.shortage).toEqual([{ title: "QA lamp", need: 2, have: 1 }]);
    expect(await stock()).toBe(1);

    expect(await act("reopen", { addMissingStock: true })).toEqual({ success: true });
    // Raised to the 2 the order needs, then the order took them.
    expect(await stock()).toBe(0);
  });

  it("a restocked return goes on the shelf, and leaving it takes the stock again", async () => {
    await setStock(5);
    expect(await act("ship")).toEqual({ success: true });
    expect(await act("return", { restock: true })).toEqual({ success: true });
    expect(await stock()).toBe(7);
    expect(await act("reopen")).toEqual({ success: true });
    expect(await stock()).toBe(5);
    const { db, eq, orders } = await load();
    const [row] = await db.select({ m: orders.metadata }).from(orders).where(eq(orders.id, orderId));
    expect((row!.m as Record<string, unknown> | null)?.returnRestockedAt).toBeUndefined();
  });

  it("another seller can't touch the order", async () => {
    const { restockReturnedOrder } = await load();
    session.sellerId = randomUUID();
    try {
      expect((await act("ship")).success).toBe(false);
      expect((await restockReturnedOrder({ orderId })).success).toBe(false);
    } finally {
      session.sellerId = sellerId;
    }
    expect(await stock()).toBe(5);
  });
});
