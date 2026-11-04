import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `carts.last_activity` moves on a customer's real cart changes, through the
 * real server actions, and nowhere else. Runs against the STAGING database with
 * rows of its own, removed afterwards, and only when TEST_DATABASE_URL is the
 * staging project. Never point it at production.
 */
const STAGING_REF = "cxqjrwjianxskhzmrkla";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isStaging = Boolean(TEST_DATABASE_URL?.includes(STAGING_REF));
if (isStaging) process.env.DATABASE_URL = TEST_DATABASE_URL;

const session = vi.hoisted(() => ({ userId: "", guestUid: "" }));

vi.mock("@/lib/get-current-user-id", () => ({
  getCurrentUserId: async () => session.userId,
  getOrCreateCurrentUserId: async () => session.userId,
}));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en" }));
vi.mock("@/lib/marketplace/marketplace-host.server", () => ({ isMarketplaceRequest: async () => false }));
// The marketplace cart, as the real activeCartWhere builds it with no store.
vi.mock("@/lib/storefront.server", async () => {
  const { and, carts, eq, isNull } = await import("@workspace/db");
  return {
    getCartScope: async () => null,
    activeCartWhere: (userId: string) => and(eq(carts.userId, userId), eq(carts.status, "active"), isNull(carts.storeSellerId)),
  };
});
vi.mock("@/actions/auth", () => ({ getUser: async () => ({ user: { id: session.userId } }) }));
vi.mock("@/lib/guest-user", () => ({
  getGuestUID: async () => session.guestUid,
  clearGuestUID: async () => {},
}));

describe.skipIf(!isStaging)("cart last activity (integration)", { timeout: 120_000 }, () => {
  const HOOK_TIMEOUT = 120_000;
  const OLD = "2026-01-01T00:00:00.000Z";
  const sellerId = randomUUID();
  const productId = randomUUID();
  const secondProductId = randomUUID();
  const customerId = randomUUID();
  const otherCustomerId = randomUUID();
  const guestId = randomUUID();
  const guestUid = randomUUID();
  const cartId = randomUUID();
  const otherCartId = randomUUID();

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("@/actions/cart")),
    ...(await import("@/actions/merge-guest-account")),
    ...(await import("./cart-activity.server")),
  });

  async function state(id: string) {
    const { db, sql } = await load();
    const [row] = [
      ...(await db.execute(sql`
        SELECT last_activity = ${OLD}::timestamptz AS unchanged,
               now() - last_activity < interval '1 minute' AS recent
          FROM carts WHERE id = ${id}
      `)),
    ] as { unchanged: boolean; recent: boolean }[];
    return row!;
  }

  async function addLine(id: string, product: string): Promise<string> {
    const { db, sql } = await load();
    const [row] = [
      ...(await db.execute(sql`
        INSERT INTO cart_items (cart_id, product_id, seller_id, quantity, price)
        VALUES (${id}, ${product}, ${sellerId}, 1, '10.00') RETURNING id
      `)),
    ] as { id: string }[];
    return row!.id;
  }

  async function expectMoved() {
    expect(await state(cartId)).toEqual({ unchanged: false, recent: true });
    expect((await state(otherCartId)).unchanged).toBe(true);
  }

  async function expectNotMoved() {
    expect((await state(cartId)).unchanged).toBe(true);
    expect((await state(otherCartId)).unchanged).toBe(true);
  }

  beforeAll(async () => {
    const { db, sql, products } = await load();
    for (const id of [sellerId, customerId, otherCustomerId, guestId]) {
      await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${`qa-${id}@example.test`}, 'authenticated', 'authenticated')`);
    }
    await db.execute(sql`UPDATE users SET is_guest = false, role = 'seller' WHERE id = ${sellerId}`);
    await db.execute(sql`UPDATE users SET is_guest = true, email = ${`guest_${guestUid}@temp.local`} WHERE id = ${guestId}`);
    const sub = `ca-${sellerId.slice(0, 8)}`;
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, status)
      VALUES (${sellerId}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'ca@example.com', 'approved')
    `);
    const [category] = [...(await db.execute(sql`SELECT id FROM categories LIMIT 1`))] as { id: string }[];
    for (const id of [productId, secondProductId]) {
      await db.insert(products).values({ id, sellerId, categoryId: category!.id, status: "active", quantity: "100", price: 10, images: [] });
    }
    for (const [id, userId] of [
      [cartId, customerId],
      [otherCartId, otherCustomerId],
    ] as const) {
      await db.execute(sql`INSERT INTO carts (id, user_id, status, created_at, updated_at, last_activity) VALUES (${id}, ${userId}, 'active', ${OLD}, ${OLD}, ${OLD})`);
    }
  }, HOOK_TIMEOUT);

  beforeEach(async () => {
    const { db, sql } = await load();
    session.userId = customerId;
    session.guestUid = "";
    await db.execute(sql`DELETE FROM cart_items WHERE cart_id IN (${cartId}, ${otherCartId})`);
    await db.execute(sql`UPDATE carts SET status = 'active', updated_at = ${OLD}, last_activity = ${OLD} WHERE id IN (${cartId}, ${otherCartId})`);
    await addLine(otherCartId, productId);
  }, HOOK_TIMEOUT);

  afterAll(async () => {
    const { db, sql } = await load();
    // Deleting the auth users cascades through users, sellers, products and carts (0134).
    for (const id of [customerId, otherCustomerId, guestId, sellerId]) {
      await db.execute(sql`DELETE FROM auth.users WHERE id = ${id}`);
    }
    const [left] = [...(await db.execute(sql`SELECT count(*)::int AS n FROM carts WHERE id IN (${cartId}, ${otherCartId})`))] as { n: number }[];
    expect(left!.n).toBe(0);
  }, HOOK_TIMEOUT);

  it("adding a new line moves it", async () => {
    const { addToCart } = await load();
    expect((await addToCart(productId)).success).toBe(true);
    await expectMoved();
  });

  it("adding more of a line moves it", async () => {
    const { addToCart } = await load();
    await addLine(cartId, productId);
    const result = await addToCart(productId);
    expect(result).toMatchObject({ success: true, message: "Cart updated" });
    await expectMoved();
  });

  it("an add that's refused doesn't move it", async () => {
    const { addToCart } = await load();
    expect((await addToCart(productId, 5000)).success).toBe(false);
    await expectNotMoved();
  });

  it("changing a quantity moves it", async () => {
    const { updateCartItem } = await load();
    const line = await addLine(cartId, productId);
    expect((await updateCartItem(line, 3)).success).toBe(true);
    await expectMoved();
  });

  it("a quantity of zero removes the line and moves it", async () => {
    const { updateCartItem } = await load();
    const line = await addLine(cartId, productId);
    expect((await updateCartItem(line, 0)).success).toBe(true);
    await expectMoved();
  });

  it("removing a line moves it", async () => {
    const { removeFromCart } = await load();
    const line = await addLine(cartId, productId);
    expect((await removeFromCart(line)).success).toBe(true);
    await expectMoved();
  });

  it("removing a line that isn't there, or isn't yours, moves nothing", async () => {
    const { db, removeFromCart, sql } = await load();
    await removeFromCart(randomUUID());
    const [theirs] = [...(await db.execute(sql`SELECT id FROM cart_items WHERE cart_id = ${otherCartId} LIMIT 1`))] as { id: string }[];
    await removeFromCart(theirs!.id);
    await expectNotMoved();
    const [still] = [...(await db.execute(sql`SELECT count(*)::int AS n FROM cart_items WHERE id = ${theirs!.id}`))] as { n: number }[];
    expect(still!.n).toBe(1);
  });

  it("clearing the cart moves it, and clearing an empty one doesn't", async () => {
    const { clearCart } = await load();
    await clearCart();
    await expectNotMoved();
    await addLine(cartId, productId);
    await clearCart();
    await expectMoved();
  });

  it("merging a guest cart moves the customer's cart", async () => {
    const { db, mergeGuestAccount, sql } = await load();
    await addLine(cartId, productId);
    const guestCart = randomUUID();
    await db.execute(sql`INSERT INTO carts (id, user_id, status) VALUES (${guestCart}, ${guestId}, 'active')`);
    await addLine(guestCart, secondProductId);
    session.guestUid = guestUid;
    const result = await mergeGuestAccount();
    expect(result.success).toBe(true);
    expect(result.merged?.cartItems).toBe(1);
    await expectMoved();
  });

  it("never changes a completed cart", async () => {
    const { db, sql, touchCartActivity } = await load();
    await db.execute(sql`UPDATE carts SET status = 'completed' WHERE id = ${cartId}`);
    await touchCartActivity(cartId);
    await expectNotMoved();
  });

  it("never throws when the write fails", async () => {
    const { touchCartActivity } = await load();
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(touchCartActivity("not-a-uuid")).resolves.toBeUndefined();
    expect(quiet).toHaveBeenCalledOnce();
    quiet.mockRestore();
  });
});
