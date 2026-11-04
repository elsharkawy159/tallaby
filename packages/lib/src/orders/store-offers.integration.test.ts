import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

/**
 * Store offers (ROADMAP.md F-07, F-13) through the real `placeOrderFromCart` on
 * the staging database. Creates and deletes its own rows. Runs only when
 * TEST_DATABASE_URL is the staging project; never point it at production.
 */
const STAGING_REF = "cxqjrwjianxskhzmrkla";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isStaging = Boolean(TEST_DATABASE_URL?.includes(STAGING_REF));
if (isStaging) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!isStaging)("store offers at checkout (integration)", { timeout: 120_000 }, () => {
  const sellerId = randomUUID();
  const otherSeller = randomUUID();
  const buyer = randomUUID();
  const tag = sellerId.slice(0, 8);
  let storeId = "";
  let addressId = "";
  const couponIds: string[] = [];

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./place-order")),
    ...(await import("./line-discounts.server")),
  });

  async function addSeller(id: string, sub: string) {
    const { db, sql } = await load();
    await db.execute(sql`INSERT INTO auth.users (id) VALUES (${id})`);
    await db.execute(sql`UPDATE users SET is_guest = false, role = 'seller' WHERE id = ${id}`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, support_phone, status, fee_trial_eligible)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'x@example.com', '01000000000', 'approved', false)`);
  }

  async function addProduct(key: string, price: number, extra: Record<string, unknown> = {}) {
    const { db, products, categories } = await load();
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    const [row] = await db
      .insert(products)
      .values({ sellerId, categoryId: category!.id, status: "active", quantity: "50", price, images: [], sku: `q-${tag}-${key}`, ...extra } as never)
      .returning({ id: products.id });
    return row!.id;
  }

  async function addTier(productId: string, minQuantity: number, discountValue: string, extra: Record<string, unknown> = {}) {
    const { db, productQuantityOffers } = await load();
    const [row] = await db
      .insert(productQuantityOffers)
      .values({ sellerId, productId, minQuantity, discountType: "percent", discountValue, ...extra } as never)
      .returning({ id: productQuantityOffers.id });
    return row!.id;
  }

  async function addCoupon(percent: string) {
    const { db, coupons } = await load();
    const code = `Q${randomUUID().slice(0, 8)}`.toUpperCase();
    const [coupon] = await db
      .insert(coupons)
      .values({
        code,
        name: code,
        sellerId,
        discountType: "percentage",
        discountValue: percent,
        startsAt: new Date(Date.now() - 86_400_000).toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .returning({ id: coupons.id });
    couponIds.push(coupon!.id);
    return code;
  }

  beforeAll(async () => {
    const { db, sql, users, userAddresses } = await load();
    await addSeller(sellerId, `qo-${tag}`);
    await addSeller(otherSeller, `qx-${tag}`);
    const [store] = await db.execute(sql`SELECT id FROM stores WHERE seller_id = ${sellerId} LIMIT 1`);
    storeId = (store as { id: string }).id;
    await db.insert(users).values({ id: buyer, fullName: "QA Buyer", email: `qa_${buyer}@temp.local`, isGuest: true });
    const [address] = await db
      .insert(userAddresses)
      .values({ userId: buyer, addressType: "shipping", fullName: "QA", phone: "01001112223", addressLine1: "12 St", city: "Nasr City", state: "CAIRO", postalCode: "", country: "Egypt" })
      .returning({ id: userAddresses.id });
    addressId = address!.id;
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    await db.execute(sql`DELETE FROM orders WHERE user_id = ${buyer}`);
    for (const id of couponIds) await db.execute(sql`DELETE FROM coupons WHERE id = ${id}`);
    await db.execute(sql`DELETE FROM users WHERE id = ${buyer}`);
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerId}, ${otherSeller})`);
  }, 120_000);

  type Line = { productId: string; price: string; quantity: number; crossSellId?: string | null; variant?: { id: string } | null; giftRuleId?: string | null };

  async function makeCart(lines: Line[]) {
    const { db, carts, cartItems } = await load();
    const [cart] = await db.insert(carts).values({ userId: buyer, currency: "EGP", storeId, storeSellerId: sellerId }).returning({ id: carts.id });
    await db.insert(cartItems).values(
      lines.map((line) => ({
        cartId: cart!.id,
        productId: line.productId,
        sellerId,
        price: line.price,
        quantity: line.quantity,
        crossSellId: line.crossSellId ?? null,
        variant: line.variant ?? null,
        ...(line.giftRuleId ? { giftRuleId: line.giftRuleId } : {}),
      })) as never,
    );
    return cart!.id;
  }

  async function placeCart(cartId: string, options: { couponCode?: string; orderSource?: "storefront" | "manual"; extra?: Record<string, unknown> } = {}) {
    const { placeOrderFromCart } = await load();
    return placeOrderFromCart({
      userId: buyer,
      cartId,
      shippingAddressId: addressId,
      paymentMethod: "cash_on_delivery",
      orderSource: options.orderSource ?? "storefront",
      couponCode: options.couponCode,
      sendConfirmationEmail: false,
      ...options.extra,
    });
  }

  async function read(result: Awaited<ReturnType<typeof placeCart>>) {
    const { db, orders, orderItems, eq } = await load();
    if (!result.success) throw new Error(result.error);
    const [order] = await db.select().from(orders).where(eq(orders.id, result.data.order.id));
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order!.id));
    const lines = order!.discounts as { type: string; amount: string; label: string }[];
    return { order: order!, items, lines, line: (id: string) => items.find((item) => item.productId === id)! };
  }

  async function place(lines: Line[], options: Parameters<typeof placeCart>[1] = {}) {
    return read(await placeCart(await makeCart(lines), options));
  }

  const invariants = (placed: Awaited<ReturnType<typeof read>>) => {
    const { order, lines } = placed;
    expect(Number(order.discountAmount)).toBeCloseTo(lines.reduce((sum, entry) => sum + Number(entry.amount), 0), 2);
    expect(Number(order.totalAmount)).toBeCloseTo(Number(order.subtotal) + Number(order.shippingCost) - Number(order.discountAmount), 2);
  };

  describe("quantity tiers", () => {
    it("changes nothing without a tier, and below the first tier", async () => {
      const productId = await addProduct("plain", 100);
      const none = await place([{ productId, price: "100.00", quantity: 3 }]);
      expect(Number(none.line(productId).total)).toBe(300);
      expect(Number(none.line(productId).discountAmount)).toBe(0);
      expect(none.lines.some((entry) => entry.type === "quantity_offer")).toBe(false);
      expect((none.line(productId).metadata as { quantityOffer?: unknown }).quantityOffer).toBeUndefined();

      const tiered = await addProduct("below", 100);
      await addTier(tiered, 2, "10.00");
      const below = await place([{ productId: tiered, price: "100.00", quantity: 1 }]);
      expect(Number(below.line(tiered).discountAmount)).toBe(0);
    });

    it("takes the highest tier reached off every unit, and keeps the flat fee", async () => {
      const productId = await addProduct("tier", 100);
      await addTier(productId, 2, "10.00");
      const tier3 = await addTier(productId, 3, "20.00");
      const placed = await place([{ productId, price: "100.00", quantity: 4 }]);
      const line = placed.line(productId);
      expect(Number(line.subtotal)).toBe(400);
      expect(Number(line.discountAmount)).toBe(80);
      expect(Number(line.total)).toBe(320);
      expect(line.price).toBe("100.00");
      expect(placed.lines.find((entry) => entry.type === "quantity_offer")?.amount).toBe("80.00");
      invariants(placed);
      const meta = line.metadata as { quantityOffer: { offerId: string; minQuantity: number }; platformFee: { feePiastres: number } };
      expect(meta.quantityOffer).toMatchObject({ offerId: tier3, minQuantity: 3 });
      expect(meta.platformFee.feePiastres).toBe(500);
      expect(Number(line.sellerEarning)).toBe(315);
    });

    it("counts units across variants, and takes each variant's stock", async () => {
      const { db, productVariants, eq } = await load();
      const productId = await addProduct("variants", 100);
      await addTier(productId, 2, "10.00");
      const rows = await db
        .insert(productVariants)
        .values([
          { productId, title: "Red", price: { final: 100 }, stock: 5, sku: `q-${tag}-r` },
          { productId, title: "Blue", price: { final: 200 }, stock: 5, sku: `q-${tag}-b` },
        ] as never)
        .returning({ id: productVariants.id });
      const placed = await place([
        { productId, price: "100.00", quantity: 1, variant: { id: rows[0]!.id } },
        { productId, price: "200.00", quantity: 1, variant: { id: rows[1]!.id } },
      ]);
      expect(placed.items.map((item) => Number(item.discountAmount)).sort((a, b) => a - b)).toEqual([10, 20]);
      invariants(placed);
      const [red] = await db.select({ stock: productVariants.stock }).from(productVariants).where(eq(productVariants.id, rows[0]!.id));
      expect(red?.stock).toBe(4);
    });

    it("applies on an unlimited product, and refuses a tracked one short of stock", async () => {
      const unlimited = await addProduct("unlimited", 100, { trackStock: false, quantity: "0" });
      await addTier(unlimited, 2, "10.00");
      const placed = await place([{ productId: unlimited, price: "100.00", quantity: 2 }]);
      expect(Number(placed.line(unlimited).discountAmount)).toBe(20);

      const short = await addProduct("short", 100, { quantity: "1" });
      await addTier(short, 2, "10.00");
      const refused = await placeCart(await makeCart([{ productId: short, price: "100.00", quantity: 2 }]));
      expect(refused.success).toBe(false);
    });

    it("stacks a seller coupon on the net price", async () => {
      const productId = await addProduct("coupon", 100);
      await addTier(productId, 2, "10.00");
      const placed = await place([{ productId, price: "100.00", quantity: 2 }], { couponCode: await addCoupon("10") });
      // 200 less 20 is 180; 10% of that is 18.
      expect(Number(placed.lines.find((entry) => entry.type === "coupon")?.amount)).toBeCloseTo(18, 2);
      expect(Number(placed.line(productId).total)).toBeCloseTo(162, 2);
      expect(Number(placed.line(productId).discountAmount)).toBeCloseTo(38, 2);
      invariants(placed);
    });

    it("gives a line the bigger of its tier and its cross-sell, never both", async () => {
      const { db, productCrossSells } = await load();
      const main = await addProduct("main", 500);
      const item = await addProduct("item", 100);
      await addTier(item, 2, "5.00");
      await addTier(item, 3, "20.00");
      const [offer] = await db
        .insert(productCrossSells)
        .values({ sellerId, productId: main, offerProductId: item, discountType: "percent", discountValue: "30.00" })
        .returning({ id: productCrossSells.id });
      // Tier: 2 × 5 = 10. Cross-sell: 1 unit × 30 = 30.
      const crossWins = await place([
        { productId: main, price: "500.00", quantity: 1 },
        { productId: item, price: "100.00", quantity: 2, crossSellId: offer!.id },
      ]);
      expect(Number(crossWins.line(item).discountAmount)).toBe(30);
      expect(crossWins.lines.map((entry) => entry.type)).toContain("cross_sell");
      expect(crossWins.lines.map((entry) => entry.type)).not.toContain("quantity_offer");
      invariants(crossWins);
      // Tier: 3 × 20 = 60. Cross-sell: 1 unit × 30 = 30.
      const tierWins = await place([
        { productId: main, price: "500.00", quantity: 1 },
        { productId: item, price: "100.00", quantity: 3, crossSellId: offer!.id },
      ]);
      expect(Number(tierWins.line(item).discountAmount)).toBe(60);
      expect(tierWins.lines.map((entry) => entry.type)).toContain("quantity_offer");
      expect((tierWins.line(item).metadata as { crossSell?: unknown }).crossSell).toBeUndefined();
    });

    it("charges the current tier after a change, and full price after it is off", async () => {
      const { db, productQuantityOffers, eq } = await load();
      const productId = await addProduct("changed", 100);
      const tierId = await addTier(productId, 2, "10.00");
      const lines = [{ productId, price: "100.00", quantity: 2 }];

      const changedCart = await makeCart(lines);
      await db.update(productQuantityOffers).set({ discountValue: "25.00" }).where(eq(productQuantityOffers.id, tierId));
      expect(Number((await read(await placeCart(changedCart))).line(productId).discountAmount)).toBe(50);

      const offCart = await makeCart(lines);
      await db.update(productQuantityOffers).set({ isActive: false }).where(eq(productQuantityOffers.id, tierId));
      const off = await read(await placeCart(offCart));
      expect(Number(off.line(productId).discountAmount)).toBe(0);
      expect(off.lines.some((entry) => entry.type === "quantity_offer")).toBe(false);
    });

    it("ignores another seller's tier on this product", async () => {
      const { db, productQuantityOffers } = await load();
      const productId = await addProduct("foreign", 100);
      await db.insert(productQuantityOffers).values({ sellerId: otherSeller, productId, minQuantity: 2, discountType: "percent", discountValue: "50.00" });
      const placed = await place([{ productId, price: "100.00", quantity: 2 }]);
      expect(Number(placed.line(productId).discountAmount)).toBe(0);
    });

    it("ignores values a client tries to send", async () => {
      const productId = await addProduct("tamper", 100);
      await addTier(productId, 2, "10.00");
      const placed = await place([{ productId, price: "100.00", quantity: 2 }], {
        extra: { discountAmount: "199.00", quantityOffer: { discountValue: 90 }, lineOffers: [{ amount: "199.00" }], price: "1.00" },
      });
      expect(Number(placed.line(productId).discountAmount)).toBe(20);
      expect(Number(placed.order.subtotal)).toBe(200);
    });

    it("gives a manual order no tier", async () => {
      const productId = await addProduct("manual", 100);
      await addTier(productId, 2, "10.00");
      const placed = await place([{ productId, price: "100.00", quantity: 2 }], { orderSource: "manual" });
      expect(Number(placed.line(productId).discountAmount)).toBe(0);
      expect(placed.lines.some((entry) => entry.type === "quantity_offer")).toBe(false);
    });

    it("prices the order exactly as the summary function does for the same cart", async () => {
      const { db, cartItems, eq, storeCartDiscounts } = await load();
      const productId = await addProduct("parity", 33.33);
      await addTier(productId, 3, "12.50");
      const cartId = await makeCart([{ productId, price: "33.33", quantity: 4 }]);
      const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
      const summary = await storeCartDiscounts(storeId, items);
      const placed = await read(await placeCart(cartId));
      expect(Number(placed.order.discountAmount)).toBeCloseTo(summary.totalPiastres / 100, 2);
      expect(placed.lines).toEqual(expect.arrayContaining(summary.discountLines));
    });
  });

  describe("automatic discount rules", () => {
    async function addRule(extra: Record<string, unknown>) {
      const { db, storeDiscountRules } = await load();
      const [row] = await db
        .insert(storeDiscountRules)
        .values({ sellerId, storeId, name: "Sale", ruleType: "percent_off", discountPercent: "10.00", ...extra } as never)
        .returning({ id: storeDiscountRules.id });
      return row!.id;
    }

    afterEach(async () => {
      const { db, sql } = await load();
      await db.execute(sql`DELETE FROM store_discount_rules WHERE store_id = ${storeId}`);
    });

    it("takes a percent off every product, in its name, with the fee unchanged", async () => {
      const productId = await addProduct("rule-all", 100);
      const ruleId = await addRule({ name: "Summer sale", discountPercent: "15.00" });
      const placed = await place([{ productId, price: "100.00", quantity: 2 }]);
      expect(Number(placed.line(productId).discountAmount)).toBe(30);
      expect(placed.lines.find((entry) => entry.type === "automatic_discount")).toEqual({ type: "automatic_discount", label: "Summer sale", amount: "30.00" });
      invariants(placed);
      const meta = placed.line(productId).metadata as { automaticDiscount: { ruleId: string }; platformFee: { feePiastres: number } };
      expect(meta.automaticDiscount.ruleId).toBe(ruleId);
      expect(meta.platformFee.feePiastres).toBe(500);
    });

    it("covers only the rule's own categories", async () => {
      const { db, sellerProductCategories } = await load();
      const [category] = await db.insert(sellerProductCategories).values({ sellerId, name: `c-${tag}`, slug: `c-${tag}` } as never).returning({ id: sellerProductCategories.id });
      const inside = await addProduct("rule-in", 100, { sellerCategoryId: category!.id });
      const outside = await addProduct("rule-out", 100);
      await addRule({ scope: "categories", categoryIds: [category!.id] });
      const placed = await place([
        { productId: inside, price: "100.00", quantity: 1 },
        { productId: outside, price: "100.00", quantity: 1 },
      ]);
      expect(Number(placed.line(inside).discountAmount)).toBe(10);
      expect(Number(placed.line(outside).discountAmount)).toBe(0);
    });

    it("keeps to its time window and its on switch", async () => {
      const { db, storeDiscountRules, eq } = await load();
      const productId = await addProduct("rule-time", 100);
      const line = { productId, price: "100.00", quantity: 1 };
      await addRule({ startsAt: new Date(Date.now() - 86_400_000).toISOString(), endsAt: new Date(Date.now() - 3_600_000).toISOString() });
      await addRule({ startsAt: new Date(Date.now() + 3_600_000).toISOString() });
      expect(Number((await place([line])).line(productId).discountAmount)).toBe(0);

      const live = await addRule({ endsAt: new Date(Date.now() + 3_600_000).toISOString() });
      const cart = await makeCart([line]);
      await db.update(storeDiscountRules).set({ isActive: false }).where(eq(storeDiscountRules.id, live));
      expect(Number((await read(await placeCart(cart))).line(productId).discountAmount)).toBe(0);
    });

    it("buy 2 get 1 free takes the cheapest unit, and never the whole line", async () => {
      const dear = await addProduct("bogo-dear", 300);
      const cheap = await addProduct("bogo-cheap", 100);
      await addRule({ name: "B2G1", ruleType: "buy_x_get_y", discountPercent: "100.00", buyQuantity: 2, getQuantity: 1 });
      const placed = await place([
        { productId: dear, price: "300.00", quantity: 2 },
        { productId: cheap, price: "100.00", quantity: 1 },
      ]);
      expect(Number(placed.line(cheap).total)).toBe(0);
      expect(Number(placed.line(cheap).discountAmount)).toBe(100);
      expect(Number(placed.line(dear).total)).toBe(600);
      invariants(placed);
      const short = await place([{ productId: dear, price: "300.00", quantity: 2 }]);
      expect(Number(short.line(dear).discountAmount)).toBe(0);
    });

    it("gives each line its single best offer, and a coupon on the net", async () => {
      const tiered = await addProduct("best-tier", 100);
      await addTier(tiered, 2, "30.00");
      const plain = await addProduct("best-plain", 100);
      await addRule({ name: "Small", discountPercent: "10.00" });
      await addRule({ name: "Bigger", discountPercent: "20.00" });
      const placed = await place(
        [
          { productId: tiered, price: "100.00", quantity: 2 },
          { productId: plain, price: "100.00", quantity: 1 },
        ],
        { couponCode: await addCoupon("10") },
      );
      // Tier 30% beats the rules on the first line (60); the 20% rule wins on the second (20).
      const types = placed.lines.map((entry) => entry.type);
      expect(types).toEqual(expect.arrayContaining(["quantity_offer", "automatic_discount", "coupon"]));
      expect(placed.lines.find((entry) => entry.type === "automatic_discount")).toMatchObject({ label: "Bigger", amount: "20.00" });
      // The net is 300 - 80 = 220, so a 10% coupon is 22.
      expect(Number(placed.lines.find((entry) => entry.type === "coupon")?.amount)).toBeCloseTo(22, 2);
      invariants(placed);
    });

    it("ignores a rule of another seller or store", async () => {
      const { db, sql, storeDiscountRules } = await load();
      const productId = await addProduct("rule-foreign", 100);
      const [other] = await db.execute(sql`SELECT id FROM stores WHERE seller_id = ${otherSeller} LIMIT 1`);
      await db.insert(storeDiscountRules).values([
        { sellerId: otherSeller, storeId, name: "Foreign seller", ruleType: "percent_off", discountPercent: "50.00" },
        { sellerId: otherSeller, storeId: (other as { id: string }).id, name: "Foreign store", ruleType: "percent_off", discountPercent: "50.00" },
      ]);
      const placed = await place([{ productId, price: "100.00", quantity: 1 }]);
      expect(Number(placed.line(productId).discountAmount)).toBe(0);
    });

    it("gives a manual order no rule, and ignores a value from a client", async () => {
      const productId = await addProduct("rule-manual", 100);
      await addRule({});
      const manual = await place([{ productId, price: "100.00", quantity: 1 }], { orderSource: "manual" });
      expect(Number(manual.line(productId).discountAmount)).toBe(0);
      const sent = await place([{ productId, price: "100.00", quantity: 1 }], { extra: { automaticDiscount: { discountPercent: 90 }, ruleId: "x" } });
      expect(Number(sent.line(productId).discountAmount)).toBe(10);
    });
  });
});
