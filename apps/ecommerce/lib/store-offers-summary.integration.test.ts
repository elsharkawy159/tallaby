import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CouponData } from "./coupon-utils";

/**
 * The checkout summary and the order agree on the same cart (ROADMAP.md F-07,
 * F-13), using the real summary builders and the real `placeOrderFromCart`.
 * Runs only on the staging database, with its own rows, removed afterwards.
 *
 * Everything that reaches @workspace/db is imported dynamically in `load`, after
 * DATABASE_URL is set here: a static import would run first, and the db client's
 * dotenv would connect to whatever apps/ecommerce/.env holds, which is production.
 */
const STAGING_REF = "cxqjrwjianxskhzmrkla";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isStaging = Boolean(TEST_DATABASE_URL?.includes(STAGING_REF));
if (isStaging) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!isStaging)("checkout summary matches the order (integration)", { timeout: 120_000 }, () => {
  const sellerId = randomUUID();
  const buyer = randomUUID();
  const tag = sellerId.slice(0, 8);
  let storeId = "";
  let addressId = "";
  let productId = "";
  let couponId = "";
  let coupon: CouponData;

  const load = async () => ({
    ...(await import("./coupon-utils")),
    ...(await import("@workspace/db")),
    ...(await import("@workspace/lib/orders")),
    ...(await import("@workspace/lib/orders/line-discounts/server")),
  });

  beforeAll(async () => {
    const { db, sql, users, userAddresses, products, categories, productQuantityOffers, coupons } = await load();
    const sub = `qs-${tag}`;
    await db.execute(sql`INSERT INTO auth.users (id) VALUES (${sellerId})`);
    await db.execute(sql`UPDATE users SET is_guest = false, role = 'seller' WHERE id = ${sellerId}`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, support_phone, status, fee_trial_eligible)
      VALUES (${sellerId}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'x@example.com', '01000000000', 'approved', false)`);
    const [store] = await db.execute(sql`SELECT id FROM stores WHERE seller_id = ${sellerId} LIMIT 1`);
    storeId = (store as { id: string }).id;
    await db.insert(users).values({ id: buyer, fullName: "QA Buyer", email: `qa_${buyer}@temp.local`, isGuest: true });
    const [address] = await db
      .insert(userAddresses)
      .values({ userId: buyer, addressType: "shipping", fullName: "QA", phone: "01001112223", addressLine1: "12 St", city: "Nasr City", state: "CAIRO", postalCode: "", country: "Egypt" })
      .returning({ id: userAddresses.id });
    addressId = address!.id;
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    const [product] = await db
      .insert(products)
      .values({ sellerId, categoryId: category!.id, status: "active", quantity: "50", price: 33.33, images: [], sku: `qs-${tag}` } as never)
      .returning({ id: products.id });
    productId = product!.id;
    await db.insert(productQuantityOffers).values({ sellerId, productId, minQuantity: 3, discountType: "percent", discountValue: "12.50" });
    const code = `QS${tag}`.toUpperCase();
    const [row] = await db
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
      .returning();
    couponId = row!.id;
    coupon = row as unknown as CouponData;
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    await db.execute(sql`DELETE FROM orders WHERE user_id = ${buyer}`);
    if (couponId) await db.execute(sql`DELETE FROM coupons WHERE id = ${couponId}`);
    await db.execute(sql`DELETE FROM users WHERE id = ${buyer}`);
    await db.execute(sql`DELETE FROM auth.users WHERE id = ${sellerId}`);
  }, 120_000);

  async function cartWith(quantity: number) {
    const { db, carts, cartItems, eq } = await load();
    const [cart] = await db.insert(carts).values({ userId: buyer, currency: "EGP", storeId, storeSellerId: sellerId }).returning({ id: carts.id });
    await db.insert(cartItems).values({ cartId: cart!.id, productId, sellerId, price: "33.33", quantity });
    return { cartId: cart!.id, items: await db.select().from(cartItems).where(eq(cartItems.cartId, cart!.id)) };
  }

  /** What `recalculateCheckoutSummary` and `validateCoupon` build, with the shipping the order charged. */
  async function summaryFor(items: { id: string; productId: string; sellerId: string; quantity: number; price: string }[], shipping: number, withCoupon: boolean) {
    const { storeCartDiscounts, buildSummaryWithCoupon, calculateCouponDiscount } = await load();
    const offers = await storeCartDiscounts(storeId, items);
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const base = { subtotal, tax: 0, shippingCost: shipping, total: subtotal + shipping, itemCount: items.length, lineOffers: offers.discountLines };
    if (!withCoupon) return buildSummaryWithCoupon(base, null, null);
    const net = items.map((item, index) => ({ ...item, price: Number(item.price) - (offers.lines[index]?.discountPiastres ?? 0) / 100 / item.quantity }));
    return buildSummaryWithCoupon(base, coupon, calculateCouponDiscount(coupon, net, shipping, true));
  }

  it("agrees with an automatic rule and a coupon", async () => {
    const { db, sql, storeDiscountRules, placeOrderFromCart } = await load();
    await db.insert(storeDiscountRules).values({ sellerId, storeId, name: "Sale", ruleType: "percent_off", discountPercent: "33.00", startsAt: new Date(Date.now() - 3_600_000).toISOString() });
    try {
      const { cartId, items } = await cartWith(2);
      const result = await placeOrderFromCart({
        userId: buyer,
        cartId,
        shippingAddressId: addressId,
        paymentMethod: "cash_on_delivery",
        orderSource: "storefront",
        couponCode: coupon.code,
        sendConfirmationEmail: false,
      });
      if (!result.success) throw new Error(result.error);
      const summary = await summaryFor(items, Number(result.data.order.shippingCost), true);
      expect(summary.totalAfterDiscount).toBeCloseTo(Number(result.data.order.totalAmount), 2);
      expect((result.data.order.discounts as { type: string }[]).map((line) => line.type)).toContain("automatic_discount");
    } finally {
      await db.execute(sql`DELETE FROM store_discount_rules WHERE store_id = ${storeId}`);
    }
  });

  it.each([
    { name: "a tier", quantity: 4, withCoupon: false },
    { name: "a tier and a coupon", quantity: 4, withCoupon: true },
    { name: "no tier reached", quantity: 2, withCoupon: false },
  ])("agrees with $name", async ({ quantity, withCoupon }) => {
    const { placeOrderFromCart } = await load();
    const { cartId, items } = await cartWith(quantity);
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId,
      shippingAddressId: addressId,
      paymentMethod: "cash_on_delivery",
      orderSource: "storefront",
      couponCode: withCoupon ? coupon.code : undefined,
      sendConfirmationEmail: false,
    });
    if (!result.success) throw new Error(result.error);
    const order = result.data.order;
    const summary = await summaryFor(items, Number(order.shippingCost), withCoupon);
    expect(summary.totalAfterDiscount).toBeCloseTo(Number(order.totalAmount), 2);
    expect(summary.discountAmount).toBeCloseTo(
      (order.discounts as { type: string; amount: string }[])
        .filter((line) => ["coupon", "quantity_offer", "cross_sell", "automatic_discount"].includes(line.type))
        .reduce((sum, line) => sum + Number(line.amount), 0),
      2,
    );
  });
});
