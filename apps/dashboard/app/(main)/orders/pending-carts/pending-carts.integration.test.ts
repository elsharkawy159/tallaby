import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Pending carts (ROADMAP.md F-67) against the staging database: only this
 * store's active carts with a line not saved for later, no placeholder contact
 * details, and another seller's store refused. Rows are removed afterwards.
 * Runs only when TEST_DATABASE_URL is set (it becomes DATABASE_URL for
 * @workspace/db); never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

const session = vi.hoisted(() => ({ userId: "", locked: false }));
vi.mock("@/lib/auth/session.server", () => ({ getSessionUser: async () => ({ id: session.userId }) }));
vi.mock("@workspace/lib/billing/order-lock", () => ({
  getOrderLock: async () => ({ locked: session.locked, pendingReview: false }),
}));

describe.skipIf(!TEST_DATABASE_URL)("pending carts (integration)", { timeout: 120_000 }, () => {
  const sellerId = randomUUID();
  const otherSellerId = randomUUID();
  const productId = randomUUID();
  const otherProductId = randomUUID();
  const storeA = randomUUID();
  const storeB = randomUUID();
  const storeOther = randomUUID();
  const storeDeleted = randomUUID();
  const authUsers: string[] = [sellerId, otherSellerId];
  const FILTERS = { page: 1, size: 20 };

  const load = async () => ({ ...(await import("@workspace/db")), ...(await import("./pending-carts.query")) });

  async function customer(over: { guest?: boolean; name?: string; phone?: string | null; email?: string }) {
    const { db, sql } = await load();
    const id = randomUUID();
    authUsers.push(id);
    await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${`qa-${id.slice(0, 8)}@example.test`}, 'authenticated', 'authenticated')`);
    await db.execute(sql`
      UPDATE users SET is_guest = ${over.guest ?? false}, full_name = ${over.name ?? "Guest User"}, phone = ${over.phone ?? null},
             email = ${over.email ?? `guest_${id}@temp.local`}
       WHERE id = ${id}
    `);
    return id;
  }

  async function cart(input: {
    userId: string;
    storeId: string;
    status?: string;
    owner?: string;
    product?: string;
    saved?: boolean;
    lines?: number;
    daysAgo?: number;
  }) {
    const { db, sql } = await load();
    const id = randomUUID();
    const at = new Date(Date.now() - (input.daysAgo ?? 0) * 86_400_000).toISOString();
    await db.execute(sql`
      INSERT INTO carts (id, user_id, store_id, status, created_at, updated_at, last_activity)
      VALUES (${id}, ${input.userId}, ${input.storeId}, ${input.status ?? "active"}, ${at}, ${at}, ${at})
    `);
    for (let i = 0; i < (input.lines ?? 1); i += 1) {
      await db.execute(sql`
        INSERT INTO cart_items (cart_id, product_id, seller_id, quantity, price, saved_for_later, created_at, updated_at)
        VALUES (${id}, ${input.product ?? productId}, ${input.owner ?? sellerId}, 2, '100.50', ${input.saved ?? false}, ${at}, ${at})
      `);
    }
    return id;
  }

  beforeAll(async () => {
    const { db, sql, products } = await load();
    for (const id of [sellerId, otherSellerId]) {
      await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${`qa-${id.slice(0, 8)}@example.test`}, 'authenticated', 'authenticated')`);
      await db.execute(sql`UPDATE users SET is_guest = false, role = 'seller' WHERE id = ${id}`);
      const sub = `pc-${id.slice(0, 8)}`;
      await db.execute(sql`
        INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, status)
        VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'pc@example.com', 'approved')
      `);
    }
    for (const [id, owner, deleted] of [
      [storeA, sellerId, false],
      [storeB, sellerId, false],
      [storeOther, otherSellerId, false],
      [storeDeleted, sellerId, true],
    ] as const) {
      await db.execute(sql`
        INSERT INTO stores (id, seller_id, name, subdomain, deleted_at)
        VALUES (${id}, ${owner}, ${`pc-${id.slice(0, 8)}`}, ${`pc-${id.slice(0, 8)}`}, ${deleted ? new Date().toISOString() : null})
      `);
    }
    const [category] = [...(await db.execute(sql`SELECT id FROM categories LIMIT 1`))] as { id: string }[];
    for (const [id, owner] of [
      [productId, sellerId],
      [otherProductId, otherSellerId],
    ] as const) {
      await db.insert(products).values({ id, sellerId: owner, categoryId: category!.id, status: "active", quantity: "1000", price: 10, images: [] });
      await db.execute(sql`INSERT INTO product_translations (product_id, locale, title) VALUES (${id}, 'ar', 'كوب'), (${id}, 'en', 'Mug')`);
    }
  });

  afterAll(async () => {
    const { db, sql } = await load();
    // Deleting the auth users cascades through users, sellers, stores, products and carts (0134).
    for (const id of authUsers) await db.execute(sql`DELETE FROM auth.users WHERE id = ${id}`);
    const [left] = [...(await db.execute(sql`SELECT count(*)::int AS n FROM stores WHERE id IN (${storeA}, ${storeB}, ${storeOther}, ${storeDeleted})`))] as { n: number }[];
    expect(left!.n).toBe(0);
  });

  it("lists only this store's pending carts, with count, value and newest first", async () => {
    const { listStorePendingCarts } = await load();
    const guest = await customer({ guest: true });
    const older = await cart({ userId: guest, storeId: storeA, daysAgo: 3, lines: 5 });
    const newer = await cart({ userId: await customer({ guest: true }), storeId: storeA, daysAgo: 1 });
    await cart({ userId: await customer({ guest: true }), storeId: storeB });
    await cart({ userId: await customer({ guest: true }), storeId: storeOther, owner: otherSellerId, product: otherProductId });
    await cart({ userId: await customer({ guest: true }), storeId: storeDeleted });

    const list = await listStorePendingCarts(sellerId, storeA, FILTERS, "en");
    expect(list.carts.map((c) => c.id)).toEqual([newer, older]);
    expect(list.total).toBe(2);
    const row = list.carts[1]!;
    expect(row.itemCount).toBe(10);
    expect(row.lineCount).toBe(5);
    expect(row.value).toBe("1005.00");
    expect(row.lines).toHaveLength(3);
    expect(row.lines[0]!.title).toBe("Mug");
    expect(row.lines[0]!.storeTitle).toBe("كوب");
  });

  it("returns nothing for another seller's store or a deleted store", async () => {
    const { listStorePendingCarts } = await load();
    expect((await listStorePendingCarts(sellerId, storeOther, FILTERS, "en")).carts).toEqual([]);
    expect((await listStorePendingCarts(otherSellerId, storeA, FILTERS, "en")).carts).toEqual([]);
    expect((await listStorePendingCarts(sellerId, storeDeleted, FILTERS, "en")).carts).toEqual([]);
    expect((await listStorePendingCarts(sellerId, "not-a-uuid", FILTERS, "en")).carts).toEqual([]);
  });

  it("refuses a foreign store id at requireOrdersStore, and every store while locked", async () => {
    const { requireOrdersStore } = await import("@/lib/auth/require-seller.server");
    session.userId = sellerId;
    await expect(requireOrdersStore(storeOther)).rejects.toMatchObject({ code: "not_found" });
    await expect(requireOrdersStore(storeDeleted)).rejects.toMatchObject({ code: "not_found" });
    await expect(requireOrdersStore(storeA)).resolves.toMatchObject({ store: { id: storeA } });
    session.locked = true;
    await expect(requireOrdersStore(storeA)).rejects.toMatchObject({ code: "orders_locked" });
    session.locked = false;
  });

  it("leaves out saved-for-later-only, empty, completed and too-old carts", async () => {
    const { db, sql, listStorePendingCarts } = await load();
    const store = randomUUID();
    await db.execute(sql`INSERT INTO stores (id, seller_id, name, subdomain) VALUES (${store}, ${sellerId}, ${`pc-${store.slice(0, 8)}`}, ${`pc-${store.slice(0, 8)}`})`);
    const u = () => customer({ guest: true });
    const saved = await cart({ userId: await u(), storeId: store, saved: true });
    await cart({ userId: await u(), storeId: store, lines: 0 });
    await cart({ userId: await u(), storeId: store, status: "completed" });
    await cart({ userId: await u(), storeId: store, daysAgo: 31 });
    expect((await listStorePendingCarts(sellerId, store, FILTERS, "en")).total).toBe(0);

    // A line not saved for later brings the same cart in, and its saved line stays out of the totals.
    await db.execute(sql`
      INSERT INTO cart_items (cart_id, product_id, seller_id, quantity, price) VALUES (${saved}, ${productId}, ${sellerId}, 1, '10.00')
    `);
    const list = await listStorePendingCarts(sellerId, store, FILTERS, "en");
    expect(list.carts.map((c) => c.id)).toEqual([saved]);
    expect(list.carts[0]!.itemCount).toBe(1);
    expect(list.carts[0]!.value).toBe("10.00");
  });

  it("counts a new line as activity on an old cart", async () => {
    const { db, sql, listStorePendingCarts } = await load();
    const store = randomUUID();
    await db.execute(sql`INSERT INTO stores (id, seller_id, name, subdomain) VALUES (${store}, ${sellerId}, ${`pc-${store.slice(0, 8)}`}, ${`pc-${store.slice(0, 8)}`})`);
    const old = await cart({ userId: await customer({ guest: true }), storeId: store, daysAgo: 60 });
    expect((await listStorePendingCarts(sellerId, store, FILTERS, "en")).total).toBe(0);
    await db.execute(sql`INSERT INTO cart_items (cart_id, product_id, seller_id, quantity, price) VALUES (${old}, ${productId}, ${sellerId}, 1, '10.00')`);
    expect((await listStorePendingCarts(sellerId, store, FILTERS, "en")).carts.map((c) => c.id)).toEqual([old]);
  });

  it("never shows placeholders, and finds details in the account and this store's lead only", async () => {
    const { db, sql, listStorePendingCarts } = await load();
    const store = randomUUID();
    await db.execute(sql`INSERT INTO stores (id, seller_id, name, subdomain) VALUES (${store}, ${sellerId}, ${`pc-${store.slice(0, 8)}`}, ${`pc-${store.slice(0, 8)}`})`);

    const guest = await customer({ guest: true });
    const guestCart = await cart({ userId: guest, storeId: store, daysAgo: 4 });

    const signedIn = await customer({ name: "Mona Ali", phone: "01012345678", email: "mona@example.com" });
    const signedInCart = await cart({ userId: signedIn, storeId: store, daysAgo: 3 });

    const leadByCart = await customer({ guest: true });
    const leadByCartId = await cart({ userId: leadByCart, storeId: store, daysAgo: 2 });
    await db.execute(sql`
      INSERT INTO store_checkout_leads (store_id, seller_id, cart_id, full_name, phone)
      VALUES (${store}, ${sellerId}, ${leadByCartId}, 'Karim', '01112223333')
    `);

    // A lead at another store of the same customer says nothing to this store.
    const leadElsewhere = await customer({ guest: true });
    const leadElsewhereCart = await cart({ userId: leadElsewhere, storeId: store, daysAgo: 1 });
    await db.execute(sql`
      INSERT INTO store_checkout_leads (store_id, seller_id, user_id, full_name, phone)
      VALUES (${storeB}, ${sellerId}, ${leadElsewhere}, 'Elsewhere', '01223334444')
    `);

    const byId = new Map((await listStorePendingCarts(sellerId, store, FILTERS, "en")).carts.map((c) => [c.id, c]));
    expect(byId.get(guestCart)).toMatchObject({ name: null, phone: null, email: null, whatsappPhone: null });
    expect(byId.get(signedInCart)).toMatchObject({ name: "Mona Ali", phone: "01012345678", email: "mona@example.com" });
    expect(byId.get(leadByCartId)).toMatchObject({ name: "Karim", phone: "01112223333", email: null });
    expect(byId.get(leadElsewhereCart)).toMatchObject({ name: null, phone: null });
    expect(JSON.stringify([...byId.values()])).not.toContain("temp.local");
    expect(JSON.stringify([...byId.values()])).not.toContain("Guest User");
  });

  it("pages on the server", async () => {
    const { db, sql, listStorePendingCarts } = await load();
    const store = randomUUID();
    await db.execute(sql`INSERT INTO stores (id, seller_id, name, subdomain) VALUES (${store}, ${sellerId}, ${`pc-${store.slice(0, 8)}`}, ${`pc-${store.slice(0, 8)}`})`);
    const ids: string[] = [];
    for (let i = 0; i < 3; i += 1) ids.push(await cart({ userId: await customer({ guest: true }), storeId: store, daysAgo: i + 1 }));

    const first = await listStorePendingCarts(sellerId, store, { page: 1, size: 2 }, "en");
    expect(first).toMatchObject({ total: 3, pages: 2, page: 1 });
    expect(first.carts.map((c) => c.id)).toEqual(ids.slice(0, 2));
    // A page past the end shows the last page.
    const last = await listStorePendingCarts(sellerId, store, { page: 9, size: 2 }, "en");
    expect(last.page).toBe(2);
    expect(last.carts.map((c) => c.id)).toEqual([ids[2]]);
  });
});
