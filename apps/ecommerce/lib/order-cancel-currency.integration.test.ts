import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createAuthUsers } from "../../../packages/db/src/testing/auth-users";
import type { IsolationWorld } from "../../../packages/lib/src/stores/isolation.fixtures";

/**
 * Cancelling an order refunds a customer wallet only in EGP (ROADMAP.md F-61),
 * through the real cancelOrder. Runs against STAGING with rows of its own, removed
 * afterwards, and only when TEST_DATABASE_URL is the staging project.
 */
const STAGING_REF = "cxqjrwjianxskhzmrkla";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isStaging = Boolean(TEST_DATABASE_URL?.includes(STAGING_REF));
if (isStaging) process.env.DATABASE_URL = TEST_DATABASE_URL;

const session = vi.hoisted(() => ({ userId: "" }));

vi.mock("@/lib/get-current-user-id", () => ({
  getCurrentUserId: async () => session.userId,
  getOrCreateCurrentUserId: async () => session.userId,
}));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en", getTranslations: async () => (key: string) => key }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }), headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {}, updateTag: () => {}, unstable_cache: (fn: unknown) => fn }));
vi.mock("next/server", () => ({ after: () => {} }));
vi.mock("@/lib/marketplace/marketplace-host.server", () => ({ isMarketplaceRequest: async () => false }));
vi.mock("@/lib/storefront.server", () => ({
  getCartScope: async () => null,
  getStorefrontCheckoutPayments: async () => null,
  isCartStoreOffline: async () => false,
  getCartStoreCheckout: async () => ({ offline: false, testOrder: false }),
  activeCartWhere: () => undefined,
}));
vi.mock("@/actions/auth", () => ({ getUser: async () => ({ user: { id: session.userId } }) }));
vi.mock("@/lib/revalidate-cart-checkout", () => ({ revalidateCartCheckout: () => {} }));
vi.mock("@workspace/cache", async (actual) => ({
  ...(await actual<Record<string, unknown>>()),
  applyInvalidation: async () => {},
}));
vi.mock("@workspace/lib/orders", async (actual) => ({
  ...(await actual<Record<string, unknown>>()),
  sendOrderEventEmail: async () => ({ success: true }),
  sendRefundIssuedEmail: async () => ({ success: true }),
}));

describe.skipIf(!isStaging)("cancelling an order and the customer wallet (integration)", { timeout: 120_000 }, () => {
  // Loaded after DATABASE_URL is set: it is the shared client.
  type Db = typeof import("@workspace/db");
  let db: Db["db"];
  let s: Db;
  const buyer = randomUUID();
  let w: IsolationWorld;
  let productId = "";

  /** An order paid from the wallet: forged for the SAR store, where place-order refuses that. */
  async function paidOrder(storeId: string, currency: string, quantity: number) {
    const { eq } = s;
    const { placeOrderFromCart } = await import("@workspace/lib/orders");
    const { getOrCreateUserWallet, postWalletTransaction, WALLET_REFERENCE_TYPES } = await import("@workspace/db/wallet");
    const [address] = await db
      .insert(s.userAddresses)
      .values({ userId: buyer, fullName: "Sara Ahmed", phone: "+966512345678", addressLine1: "12 King Fahd Road", city: "Riyadh", state: "Riyadh", country: "Saudi Arabia", postalCode: "" })
      .returning({ id: s.userAddresses.id });
    const [cart] = await db.insert(s.carts).values({ userId: buyer, currency: "EGP", storeId, storeSellerId: w.a.sellerId }).returning({ id: s.carts.id });
    await db.insert(s.cartItems).values({ cartId: cart!.id, productId, sellerId: w.a.sellerId, price: "10.00", quantity });
    const placed = await placeOrderFromCart({ userId: buyer, cartId: cart!.id, shippingAddressId: address!.id, paymentMethod: "cash_on_delivery", orderSource: "storefront", sendConfirmationEmail: false });
    if (!placed.success) throw new Error(placed.error);
    expect(placed.data.order.currency).toBe(currency);
    const orderId = placed.data.order.id;
    await db.transaction(async (tx) => {
      const wallet = await getOrCreateUserWallet(tx, buyer);
      await postWalletTransaction(tx, { walletId: wallet.id, userId: buyer, type: "top_up", amount: "100.00", direction: "credit", referenceType: WALLET_REFERENCE_TYPES.topUp, referenceId: randomUUID(), description: "test" });
      await postWalletTransaction(tx, { walletId: wallet.id, userId: buyer, type: "order_payment", amount: "10.00", direction: "debit", referenceType: WALLET_REFERENCE_TYPES.order, referenceId: orderId, description: "test" });
    });
    await db.update(s.orders).set({ status: "confirmed" }).where(eq(s.orders.id, orderId));
    return orderId;
  }

  const refunds = async (orderId: string) => {
    const { and, eq } = s;
    return db
      .select()
      .from(s.userWalletTransactions)
      .where(and(eq(s.userWalletTransactions.referenceId, orderId), eq(s.userWalletTransactions.type, "refund")));
  };

  beforeAll(async () => {
    s = await import("@workspace/db");
    db = s.db;
    const { eq, sql } = s;
    const { createIsolationWorld } = await import("../../../packages/lib/src/stores/isolation.fixtures");
    w = await createIsolationWorld(db as never);
    session.userId = buyer;
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, categoryId: category!.id, status: "active", quantity: "100", sku: `cxl-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id });
    productId = product!.id;
    await createAuthUsers(buyer);
    await db.insert(s.users).values({ id: buyer, isGuest: false, role: "customer" });
    const shipping = { method: "own", handlingDays: 1, freeShippingOver: null, otherPlaces: "tallaby_rates" };
    await db
      .update(s.stores)
      .set({ settings: sql`coalesce(${s.stores.settings}, '{}'::jsonb) || ${JSON.stringify({ currency: "SAR", shipping })}::jsonb` })
      .where(eq(s.stores.id, w.a.a1));
    await db
      .update(s.stores)
      .set({ settings: sql`coalesce(${s.stores.settings}, '{}'::jsonb) || ${JSON.stringify({ shipping })}::jsonb` })
      .where(eq(s.stores.id, w.a.a2));
    for (const storeId of [w.a.a1, w.a.a2]) {
      await db.insert(s.storeShippingZones).values({ storeId, name: { ar: "الرياض", en: "Riyadh" }, places: ["SA/RIYADH"], price: "30", codEnabled: true });
    }
  }, 180_000);

  afterAll(async () => {
    const { eq, inArray, sql } = s;
    const rows = await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer));
    const ids = rows.map((row) => row.id);
    if (ids.length) {
      await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, ids));
      await db.delete(s.orders).where(inArray(s.orders.id, ids));
    }
    await db.delete(s.carts).where(eq(s.carts.userId, buyer));
    if (productId) await db.delete(s.products).where(eq(s.products.id, productId));
    await db.delete(s.userAddresses).where(eq(s.userAddresses.userId, buyer));
    // Deleting the auth user removes the wallet and its ledger (0134).
    await db.execute(sql`DELETE FROM auth.users WHERE id = ${buyer}`);
    await w?.cleanup();
  }, 120_000);

  it("refunds the wallet on an EGP order", async () => {
    const { cancelOrder } = await import("@/actions/order");
    const orderId = await paidOrder(w.a.a2, "EGP", 1);
    expect(await cancelOrder(orderId)).toMatchObject({ success: true });
    expect((await refunds(orderId)).map((row) => Number(row.amount))).toEqual([10]);
  });

  it("never credits the wallet for an order in another currency", async () => {
    const { cancelOrder } = await import("@/actions/order");
    const orderId = await paidOrder(w.a.a1, "SAR", 2);
    expect(await cancelOrder(orderId)).toMatchObject({ success: true });
    expect(await refunds(orderId)).toEqual([]);
  });
});
