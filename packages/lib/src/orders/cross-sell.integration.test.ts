import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Cross-sell offers (ROADMAP.md F-32) through the real `placeOrderFromCart` on the
 * staging database. Creates and deletes its own rows. Runs only when
 * TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("cross-sell at checkout (integration)", { timeout: 120_000 }, () => {
  const sellerId = randomUUID();
  const otherSeller = randomUUID();
  const buyer = randomUUID();
  const tag = sellerId.slice(0, 8);
  let storeId = "";
  let mainId = "";
  let cableId = "";
  let otherCable = "";
  let offerId = "";
  let foreignOffer = "";
  let addressId = "";
  const couponIds: string[] = [];

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("@workspace/db/wallet")),
    ...(await import("./place-order")),
    ...(await import("./cross-sell.server")),
  });

  async function addSeller(id: string, sub: string) {
    const { db, sql } = await load();
    await db.execute(sql`INSERT INTO auth.users (id) VALUES (${id})`);
    await db.execute(sql`UPDATE users SET is_guest = false, role = 'seller' WHERE id = ${id}`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, support_phone, status, fee_trial_eligible)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'x@example.com', '01000000000', 'approved', false)`);
  }

  async function addProduct(owner: string, key: string, price: number) {
    const { db, products, categories } = await load();
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    const [row] = await db
      .insert(products)
      .values({ sellerId: owner, categoryId: category!.id, status: "active", quantity: "50", price, images: [], sku: `x-${tag}-${key}` })
      .returning({ id: products.id });
    return row!.id;
  }

  async function offer(owner: string, main: string, item: string) {
    const { db, productCrossSells } = await load();
    const [row] = await db
      .insert(productCrossSells)
      .values({ sellerId: owner, productId: main, offerProductId: item, discountType: "percent", discountValue: "10.00" })
      .returning({ id: productCrossSells.id });
    return row!.id;
  }

  beforeAll(async () => {
    const { db, sql, users, userAddresses } = await load();
    await addSeller(sellerId, `xs-${tag}`);
    await addSeller(otherSeller, `xo-${tag}`);
    const [store] = await db.execute(sql`SELECT id FROM stores WHERE seller_id = ${sellerId} LIMIT 1`);
    storeId = (store as { id: string }).id;
    await db.insert(users).values({ id: buyer, fullName: "QA Buyer", email: `qa_${buyer}@temp.local`, isGuest: true });
    const [address] = await db
      .insert(userAddresses)
      .values({ userId: buyer, addressType: "shipping", fullName: "QA", phone: "01001112223", addressLine1: "12 St", city: "Nasr City", state: "CAIRO", postalCode: "", country: "Egypt" })
      .returning({ id: userAddresses.id });
    addressId = address!.id;
    mainId = await addProduct(sellerId, "main", 500);
    cableId = await addProduct(sellerId, "cable", 100);
    otherCable = await addProduct(otherSeller, "cable", 100);
    offerId = await offer(sellerId, mainId, cableId);
    foreignOffer = await offer(otherSeller, otherCable, await addProduct(otherSeller, "extra", 50));
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    await db.execute(sql`DELETE FROM orders WHERE user_id = ${buyer}`);
    for (const id of couponIds) await db.execute(sql`DELETE FROM coupons WHERE id = ${id}`);
    await db.execute(sql`DELETE FROM users WHERE id = ${buyer}`);
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerId}, ${otherSeller})`);
  }, 120_000);

  type Line = { productId: string; price: string; quantity: number; crossSellId?: string | null };

  async function place(lines: Line[], couponCode?: string) {
    const { db, carts, cartItems, orders, orderItems, eq, placeOrderFromCart } = await load();
    const [cart] = await db
      .insert(carts)
      .values({ userId: buyer, currency: "EGP", storeId, storeSellerId: sellerId })
      .returning({ id: carts.id });
    await db.insert(cartItems).values(
      lines.map((line) => ({
        cartId: cart!.id,
        productId: line.productId,
        sellerId,
        price: line.price,
        quantity: line.quantity,
        crossSellId: line.crossSellId ?? null,
      })),
    );
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId: cart!.id,
      shippingAddressId: addressId,
      paymentMethod: "cash_on_delivery",
      orderSource: "storefront",
      couponCode,
      sendConfirmationEmail: false,
    });
    if (!result.success) throw new Error(result.error);
    const [order] = await db.select().from(orders).where(eq(orders.id, result.data.order.id));
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order!.id));
    return { order: order!, line: (id: string) => items.find((item) => item.productId === id)! };
  }

  const main = (quantity = 1): Line => ({ productId: mainId, price: "500.00", quantity });
  const cable = (quantity = 1, crossSellId: string | null = offerId): Line => ({ productId: cableId, price: "100.00", quantity, crossSellId });

  it("changes nothing without an offer", async () => {
    const { order, line } = await place([main(), cable(1, null)]);
    expect((order.discounts as { type: string }[]).some((entry) => entry.type === "cross_sell")).toBe(false);
    expect(Number(line(cableId).total)).toBe(100);
    expect(Number(line(cableId).discountAmount)).toBe(0);
    expect((line(cableId).metadata as { crossSell?: unknown }).crossSell).toBeUndefined();
  });

  it("takes the discount from the offer line, one unit per main unit, and keeps the fee", async () => {
    const { order, line } = await place([main(), cable(2)]);
    expect(Number(line(cableId).discountAmount)).toBe(10);
    expect(Number(line(cableId).total)).toBe(190);
    expect(Number(line(mainId).total)).toBe(500);
    const lines = order.discounts as { type: string; amount: string }[];
    expect(lines.find((entry) => entry.type === "cross_sell")?.amount).toBe("10.00");
    expect(Number(order.subtotal)).toBe(700);
    expect(Number(order.discountAmount)).toBe(lines.reduce((sum, entry) => sum + Number(entry.amount), 0));
    expect(Number(order.totalAmount)).toBe(Number(order.subtotal) + Number(order.shippingCost) - Number(order.discountAmount));
    const meta = line(cableId).metadata as { crossSell: { offerId: string; discountedUnits: number }; platformFee: unknown };
    expect(meta.crossSell).toMatchObject({ offerId, discountedUnits: 1 });
    expect(meta.platformFee).toBeTruthy();
  });

  it("stacks a seller coupon on the net price", async () => {
    const { db, coupons } = await load();
    const code = `XS${tag}`.toUpperCase();
    const [coupon] = await db
      .insert(coupons)
      .values({
        code,
        name: code,
        sellerId,
        discountType: "percentage",
        discountValue: "10",
        startsAt: new Date(Date.now() - 86_400_000).toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .returning({ id: coupons.id });
    couponIds.push(coupon!.id);

    const { order, line } = await place([main(), cable(1)], code);
    // 600 less the 10 offer is 590; 10% of that is 59.
    const lines = order.discounts as { type: string; amount: string }[];
    expect(lines.find((entry) => entry.type === "cross_sell")?.amount).toBe("10.00");
    expect(Number(lines.find((entry) => entry.type === "coupon")?.amount)).toBeCloseTo(59, 2);
    expect(Number(order.discountAmount)).toBeCloseTo(lines.reduce((sum, entry) => sum + Number(entry.amount), 0), 2);
    expect(Number(line(mainId).total) + Number(line(cableId).total)).toBeCloseTo(531, 2);
    expect(Number(line(cableId).discountAmount)).toBeGreaterThan(10);
  });

  it("charges full price with the main product gone, another seller's offer, or the store switch off", async () => {
    const { db, stores, eq } = await load();
    expect(Number((await place([cable(1)])).line(cableId).discountAmount)).toBe(0);
    expect(Number((await place([main(), cable(1, foreignOffer)])).line(cableId).discountAmount)).toBe(0);

    await db.update(stores).set({ crossSellEnabled: false }).where(eq(stores.id, storeId));
    expect(Number((await place([main(), cable(1)])).line(cableId).discountAmount)).toBe(0);
    await db.update(stores).set({ crossSellEnabled: true }).where(eq(stores.id, storeId));
  });

  it("ignores the offer on a marketplace order", async () => {
    const { crossSellForCart } = await load();
    const result = await crossSellForCart(null, [
      { productId: mainId, quantity: 1, price: "500.00" },
      { productId: cableId, quantity: 1, price: "100.00", crossSellId: offerId },
    ]);
    expect(result.totalPiastres).toBe(0);
  });

  it("credits the net amount on delivery when Tallaby collected the money", async () => {
    const { db, orderItems, walletTransactions, and, eq, creditSellerOnDelivery } = await load();
    const { order } = await place([main(), cable(1)]);
    await db.transaction(async (tx) => {
      await tx.update(orderItems).set({ status: "delivered" }).where(eq(orderItems.orderId, order.id));
      await creditSellerOnDelivery(tx, order.id);
    });
    const sales = await db
      .select({ amount: walletTransactions.amount })
      .from(walletTransactions)
      .where(and(eq(walletTransactions.orderId, order.id), eq(walletTransactions.type, "sale")));
    // Sellers no longer get order money on the wallet (owner, 2026-10-31); if any sale posts, it's the net.
    for (const sale of sales) expect(Number(sale.amount)).toBeLessThanOrEqual(590);
  });
});
