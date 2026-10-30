import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";

/**
 * Product Trash (0123, F-35) against the staging copy: trash hides the
 * product (draft) and empties carts, restore puts the status back, another
 * seller can do nothing, and deleting for good keeps a sold product's row
 * (stamped purged_at) but removes an unsold one. Raw inserts: the schema can
 * be ahead of staging. Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("product trash (integration)", { timeout: 90_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4, onnotice: () => {} });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const createdUsers: string[] = [];
  const createdProducts: string[] = [];
  let categoryId = "";
  let trash: typeof import("./trash.server");

  const rows = <T>(result: unknown) => [...(result as Iterable<T>)];

  async function newSeller() {
    const id = randomUUID();
    const sub = `tr-${id.slice(0, 8)}`;
    createdUsers.push(id);
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, status)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'tr@example.com', 'approved')
    `);
    return id;
  }

  async function newProduct(sellerId: string, status = "active") {
    const [row] = rows<{ id: string }>(
      await db.execute(sql`
        INSERT INTO products (seller_id, category_id, status, quantity, sku, images)
        VALUES (${sellerId}, ${categoryId}, ${status}::product_status, 3, ${`tr-${randomUUID().slice(0, 8)}`}, '["p/a.jpg"]'::jsonb)
        RETURNING id
      `),
    );
    createdProducts.push(row!.id);
    return row!.id;
  }

  async function addToCart(sellerId: string, productId: string) {
    const userId = randomUUID();
    createdUsers.push(userId);
    await db.insert(s.users).values({ id: userId, isGuest: true, role: "customer" });
    const [cart] = rows<{ id: string }>(await db.execute(sql`INSERT INTO carts (user_id, status) VALUES (${userId}, 'active') RETURNING id`));
    await db.execute(sql`INSERT INTO cart_items (cart_id, product_id, seller_id, quantity, price) VALUES (${cart!.id}, ${productId}, ${sellerId}, 1, 100)`);
  }

  async function addOrder(sellerId: string, productId: string) {
    const userId = randomUUID();
    createdUsers.push(userId);
    await db.insert(s.users).values({ id: userId, isGuest: true, role: "customer" });
    const [order] = rows<{ id: string }>(
      await db.execute(sql`
        INSERT INTO orders (user_id, order_number, subtotal, total_amount) VALUES (${userId}, ${`TR-${randomUUID().slice(0, 10)}`}, 100, 100) RETURNING id
      `),
    );
    await db.execute(sql`
      INSERT INTO order_items (order_id, product_id, seller_id, sku, product_name, price, subtotal, total, commission_amount, commission_rate, seller_earning)
      VALUES (${order!.id}, ${productId}, ${sellerId}, 'TR', 'Trash test', 100, 100, 100, 0, 0, 100)
    `);
  }

  const product = async (id: string) =>
    rows<{ status: string; deleted_at: string | null; trashed_status: string | null; purged_at: string | null }>(
      await db.execute(sql`SELECT status, deleted_at, trashed_status, purged_at FROM products WHERE id = ${id}`),
    )[0];
  const cartCount = async (id: string) =>
    rows<{ n: number }>(await db.execute(sql`SELECT count(*)::int AS n FROM cart_items WHERE product_id = ${id}`))[0]!.n;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    trash = await import("./trash.server");
    const [category] = rows<{ id: string }>(await db.execute(sql`SELECT id FROM categories LIMIT 1`));
    categoryId = category!.id;
  }, 90_000);

  afterAll(async () => {
    if (createdProducts.length) {
      const ids = sql.raw(`(${createdProducts.map((p) => `'${p}'`).join(",")})`);
      await db.execute(sql`DELETE FROM cart_items WHERE product_id IN ${ids}`);
      await db.execute(sql`DELETE FROM order_items WHERE product_id IN ${ids}`);
      await db.execute(sql`DELETE FROM products WHERE id IN ${ids}`);
    }
    if (createdUsers.length) {
      const ids = sql.raw(`(${createdUsers.map((u) => `'${u}'`).join(",")})`);
      await db.execute(sql`DELETE FROM orders WHERE user_id IN ${ids}`);
      await db.execute(sql`DELETE FROM carts WHERE user_id IN ${ids}`);
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, createdUsers));
      await db.delete(s.users).where(inArray(s.users.id, createdUsers));
    }
    await client.end();
  });

  it("trashes, lists and restores a live product; carts drop it", async () => {
    const seller = await newSeller();
    const id = await newProduct(seller);
    await addToCart(seller, id);

    const { trashed } = await trash.trashProducts(seller, seller, [id]);
    expect(trashed).toEqual([id]);
    expect(await product(id)).toMatchObject({ status: "draft", trashed_status: "active", purged_at: null });
    expect((await product(id))!.deleted_at).not.toBeNull();
    expect(await cartCount(id)).toBe(0);
    expect((await trash.listTrashedProducts(seller, "en")).map((p) => p.id)).toEqual([id]);
    expect(await trash.countTrashedProducts(seller)).toBe(1);

    // Trashing again changes nothing.
    expect((await trash.trashProducts(seller, seller, [id])).trashed).toEqual([]);

    expect((await trash.restoreProducts(seller, [id], { canPublish: true })).restored).toEqual([id]);
    expect(await product(id)).toMatchObject({ status: "active", deleted_at: null, trashed_status: null });
    expect(await trash.countTrashedProducts(seller)).toBe(0);
  });

  it("restores a live product as a draft when the seller can't publish now", async () => {
    const seller = await newSeller();
    const id = await newProduct(seller);
    await trash.trashProducts(seller, seller, [id]);
    await trash.restoreProducts(seller, [id], { canPublish: false });
    expect((await product(id))!.status).toBe("draft");
  });

  it("refuses another seller's ids everywhere", async () => {
    const owner = await newSeller();
    const other = await newSeller();
    const id = await newProduct(owner);

    expect((await trash.trashProducts(other, other, [id])).trashed).toEqual([]);
    expect((await product(id))!.deleted_at).toBeNull();

    await trash.trashProducts(owner, owner, [id]);
    expect(await trash.listTrashedProducts(other, "en")).toEqual([]);
    expect((await trash.restoreProducts(other, [id], { canPublish: true })).restored).toEqual([]);
    expect((await trash.deleteTrashedProductsForever(other, [id])).deleted).toEqual([]);
    expect(await product(id)).toMatchObject({ status: "draft", trashed_status: "active" });
  });

  it("deletes for good: an unsold product goes, a sold one stays for its orders", async () => {
    const seller = await newSeller();
    const unsold = await newProduct(seller);
    const sold = await newProduct(seller);
    await addOrder(seller, sold);

    // Not in Trash yet: delete forever does nothing.
    expect((await trash.deleteTrashedProductsForever(seller, [unsold])).deleted).toEqual([]);
    await trash.trashProducts(seller, seller, [unsold, sold]);
    expect((await trash.deleteTrashedProductsForever(seller, [unsold, sold])).deleted.sort()).toEqual([unsold, sold].sort());

    expect(await product(unsold)).toBeUndefined();
    expect((await product(sold))!.purged_at).not.toBeNull();
    expect(await trash.listTrashedProducts(seller, "en")).toEqual([]);
    expect((await trash.restoreProducts(seller, [sold], { canPublish: true })).restored).toEqual([]);
  });

  it("the daily job deletes only products trashed over 30 days ago", async () => {
    const seller = await newSeller();
    const old = await newProduct(seller);
    const recent = await newProduct(seller);
    await trash.trashProducts(seller, seller, [old, recent]);
    await db.execute(sql`UPDATE products SET deleted_at = now() - interval '31 days' WHERE id = ${old}`);

    // Bounded so a staging run never touches other test rows beyond the due ones.
    const result = await trash.purgeExpiredTrash({ limit: 500 });
    expect(result.deleted).toBeGreaterThanOrEqual(1);
    expect(await product(old)).toBeUndefined();
    expect((await product(recent))!.deleted_at).not.toBeNull();
  });
});
