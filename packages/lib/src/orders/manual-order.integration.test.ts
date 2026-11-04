import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Manual orders (ROADMAP.md F-05) through the real `placeOrderFromCart` on the
 * staging database. Creates and deletes its own rows. Runs only when
 * TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("manual orders (integration)", { timeout: 120_000 }, () => {
  const sellerId = randomUUID();
  const otherSeller = randomUUID();
  const tag = sellerId.slice(0, 8);
  let storeId = "";
  let productId = "";
  let foreignProduct = "";
  const orderIds: string[] = [];
  const guestIds: string[] = [];

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("@workspace/db/wallet")),
    ...(await import("./manual-order.server")),
    ...(await import("./manual-order.lib")),
  });

  async function addSeller(id: string, sub: string) {
    const { db, sql } = await load();
    await db.execute(sql`INSERT INTO auth.users (id) VALUES (${id})`);
    await db.execute(sql`UPDATE users SET is_guest = false, role = 'seller' WHERE id = ${id}`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, support_phone, status, fee_trial_eligible)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'm@example.com', '01000000000', 'approved', false)`);
  }

  async function addProduct(owner: string, key: string) {
    const { db, products, categories } = await load();
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    const [row] = await db
      .insert(products)
      .values({ sellerId: owner, categoryId: category!.id, status: "active", quantity: "10", price: 100, images: [], sku: `m-${tag}-${key}` })
      .returning({ id: products.id });
    return row!.id;
  }

  beforeAll(async () => {
    const { db, sql } = await load();
    await addSeller(sellerId, `man-${tag}`);
    await addSeller(otherSeller, `mao-${tag}`);
    const [store] = await db.execute(sql`SELECT id FROM stores WHERE seller_id = ${sellerId} LIMIT 1`);
    storeId = (store as { id: string }).id;
    productId = await addProduct(sellerId, "a");
    foreignProduct = await addProduct(otherSeller, "b");
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    const rows = await db.execute(sql`SELECT id, user_id FROM orders WHERE store_id = ${storeId}`);
    const orders = rows as unknown as { id: string; user_id: string }[];
    for (const order of orders) {
      await db.execute(sql`DELETE FROM orders WHERE id = ${order.id}`);
      guestIds.push(order.user_id);
    }
    for (const id of guestIds) await db.execute(sql`DELETE FROM users WHERE id = ${id} AND is_guest = true`);
    await db.execute(sql`DELETE FROM users WHERE email LIKE ${`manual_%@temp.local`} AND id NOT IN (SELECT user_id FROM orders) AND full_name = 'QA Manual'`);
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerId}, ${otherSeller})`);
  }, 120_000);

  const input = (extra: Record<string, unknown> = {}) => {
    return {
      requestId: randomUUID(),
      lines: [{ productId, quantity: 2 }],
      // A new phone each time: repeats look duplicated, and their fee is held until delivery.
      customer: { name: "QA Manual", phone: `010${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}` },
      address: { state: "CAIRO", city: "Nasr City", addressLine1: "12 Abbas St" },
      discountEgp: 0,
      payment: "cod" as const,
      sendLink: false,
      ...extra,
    };
  };
  const actor = () => ({ sellerId, actorId: sellerId, storeId });
  const stock = async () => {
    const { db, products, eq } = await load();
    const [row] = await db.select({ q: products.quantity }).from(products).where(eq(products.id, productId));
    return Number(row!.q);
  };
  const feesOn = async (orderId: string) => {
    const { db, walletTransactions, and, eq } = await load();
    return db
      .select({ amount: walletTransactions.amount })
      .from(walletTransactions)
      .where(and(eq(walletTransactions.orderId, orderId), eq(walletTransactions.type, "fee")));
  };
  const created = async (extra: Record<string, unknown> = {}) => {
    const { createManualOrder } = await load();
    const result = await createManualOrder(actor(), input(extra) as never);
    if (!result.success) throw new Error(result.error);
    orderIds.push(result.orderId);
    return result;
  };

  it("makes a confirmed store order with a seller-funded discount, and the preview matches", async () => {
    const { db, orders, orderItems, eq, previewManualOrder, sql } = await load();
    const before = await stock();
    const body = input({ discountEgp: 30 });
    const preview = await previewManualOrder(actor(), body as never);
    expect(preview.success).toBe(true);

    const { createManualOrder } = await load();
    const result = await createManualOrder(actor(), body as never);
    if (!result.success) throw new Error(result.error);

    const [order] = await db.select().from(orders).where(eq(orders.id, result.orderId));
    expect(order!.storeId).toBe(storeId);
    expect(order!.orderSource).toBe("manual");
    expect(order!.status).toBe("confirmed");
    expect(Number(order!.subtotal)).toBe(200);
    const discounts = order!.discounts as { type: string; amount: string }[];
    expect(discounts.find((line) => line.type === "seller_discount")?.amount).toBe("30.00");
    expect(Number(order!.discountAmount)).toBe(discounts.reduce((sum, line) => sum + Number(line.amount), 0));

    const [line] = await db.select().from(orderItems).where(eq(orderItems.orderId, result.orderId));
    expect(Number(line!.discountAmount)).toBe(30);
    expect(Number(line!.total)).toBe(170);
    if (preview.success) {
      expect(preview.totals.totalPiastres).toBe(Math.round(Number(order!.totalAmount) * 100));
    }

    expect(await stock()).toBe(before - 2);
    const movements = await db.execute(sql`
      SELECT reason, actor_user_id, order_id FROM stock_movements WHERE order_id = ${result.orderId}`);
    const moved = (movements as unknown as { reason: string; actor_user_id: string }[])[0];
    expect(moved?.reason).toBe("order");
    expect(moved?.actor_user_id).toBe(sellerId);
    expect(await feesOn(result.orderId)).toHaveLength(1);
  });

  it("doesn't make two orders from a double click", async () => {
    const { createManualOrder } = await load();
    const before = await stock();
    const body = input();
    const first = await createManualOrder(actor(), body as never);
    const second = await createManualOrder(actor(), body as never);
    if (!first.success || !second.success) throw new Error("create failed");
    expect(second.orderId).toBe(first.orderId);
    expect(second.duplicate).toBe(true);
    expect(await stock()).toBe(before - 2);
  });

  it("refuses another seller's product and stock it doesn't have", async () => {
    const { createManualOrder } = await load();
    const before = await stock();
    expect(await createManualOrder(actor(), input({ lines: [{ productId: foreignProduct, quantity: 1 }] }) as never)).toEqual({
      success: false,
      error: "productUnavailable",
    });
    expect(await createManualOrder(actor(), input({ lines: [{ productId, quantity: 99 }] }) as never)).toEqual({
      success: false,
      error: "insufficientStock",
    });
    expect(await stock()).toBe(before);
  });

  it("refuses a phone the seller blocked and leaves no active cart", async () => {
    const { createManualOrder, db, sql, carts, eq } = await load();
    await db.execute(sql`INSERT INTO store_blocked_phones (store_id, phone) VALUES (${storeId}, '01112223334')`);
    const before = await stock();
    const body = input({ customer: { name: "QA Manual", phone: "01112223334" } });
    expect(await createManualOrder(actor(), body as never)).toEqual({ success: false, error: "customerBlocked" });
    expect(await stock()).toBe(before);
    const [cart] = await db.select({ status: carts.status }).from(carts).where(eq(carts.id, body.requestId));
    expect(cart!.status).toBe("abandoned");
  });

  it("treats already-paid money as the seller's: fee only on delivery, never a sale", async () => {
    const { db, orders, orderItems, walletTransactions, and, eq, creditSellerOnDelivery } = await load();
    const result = await created({ payment: "paid", paidVia: "instapay" });
    const [order] = await db.select().from(orders).where(eq(orders.id, result.orderId));
    expect(order!.paymentMethod).toBe("seller_collected");
    expect(order!.paymentStatus).toBe("paid");
    expect((order!.metadata as { paymentCollector?: string }).paymentCollector).toBe("seller");

    await db.transaction(async (tx) => {
      await tx.update(orderItems).set({ status: "delivered" }).where(eq(orderItems.orderId, result.orderId));
      await creditSellerOnDelivery(tx, result.orderId);
    });
    const sales = await db
      .select()
      .from(walletTransactions)
      .where(and(eq(walletTransactions.orderId, result.orderId), eq(walletTransactions.type, "sale")));
    expect(sales).toHaveLength(0);
    expect(await feesOn(result.orderId)).toHaveLength(1);
  });

  it("holds a link order without a fee until the customer confirms, once", async () => {
    const { db, orders, eq, confirmManualOrderLink } = await load();
    const result = await created({ sendLink: true });
    expect(result.awaitingCustomer).toBe(true);
    const [waiting] = await db.select().from(orders).where(eq(orders.id, result.orderId));
    expect(waiting!.status).toBe("pending");
    expect(await feesOn(result.orderId)).toHaveLength(0);

    expect(await confirmManualOrderLink(result.orderId)).toEqual({ confirmed: true });
    const [done] = await db.select().from(orders).where(eq(orders.id, result.orderId));
    expect(done!.status).toBe("confirmed");
    expect(await feesOn(result.orderId)).toHaveLength(1);

    expect(await confirmManualOrderLink(result.orderId)).toEqual({ confirmed: false });
    expect(await feesOn(result.orderId)).toHaveLength(1);
  });

  it("cancels an old unconfirmed link, puts the stock back and charges nothing", async () => {
    const { db, orders, eq, sql, expireManualOrderLinks, confirmManualOrderLink } = await load();
    const before = await stock();
    const result = await created({ sendLink: true });
    expect(await stock()).toBe(before - 2);
    await db.execute(sql`UPDATE orders SET created_at = now() - interval '49 hours' WHERE id = ${result.orderId}`);

    const counts = await expireManualOrderLinks();
    expect(counts.expired).toBeGreaterThanOrEqual(1);
    const [order] = await db.select().from(orders).where(eq(orders.id, result.orderId));
    expect(order!.status).toBe("cancelled");
    expect(await stock()).toBe(before);
    expect(await feesOn(result.orderId)).toHaveLength(0);
    expect(await confirmManualOrderLink(result.orderId)).toEqual({ confirmed: false });
  });

  it("leaves a fresh link alone", async () => {
    const { db, orders, eq, expireManualOrderLinks } = await load();
    const result = await created({ sendLink: true });
    await expireManualOrderLinks();
    const [order] = await db.select().from(orders).where(eq(orders.id, result.orderId));
    expect(order!.status).toBe("pending");
  });
});
