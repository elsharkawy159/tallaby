import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";

/**
 * Back-in-stock alerts (0126, F-23a) against the staging copy: subscribe only
 * to this store's out-of-stock products, one open alert per email, the cron
 * claim takes a restocked alert once (and only on a published store), a
 * released claim comes back, and the unsubscribe token cancels open alerts.
 * Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("back-in-stock alerts (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4, onnotice: () => {} });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const createdUsers: string[] = [];
  let alerts: typeof import("./stock-alerts.server");

  const rows = <T,>(r: unknown) => [...(r as Iterable<T>)];

  async function newSeller(published = true) {
    const id = randomUUID();
    const sub = `sa-${id.slice(0, 8)}`;
    createdUsers.push(id);
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, status)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'sa@example.com', 'approved')
    `);
    const [store] = rows<{ id: string }>(await db.execute(sql`SELECT id FROM stores WHERE seller_id = ${id} LIMIT 1`));
    if (published) await db.execute(sql`UPDATE stores SET site_status = 'published' WHERE id = ${store!.id}`);
    return { id, storeId: store!.id };
  }

  async function newProduct(sellerId: string, quantity: number) {
    const [row] = rows<{ id: string }>(await db.execute(sql`
      INSERT INTO products (seller_id, category_id, quantity, status)
      VALUES (${sellerId}, (SELECT id FROM categories LIMIT 1), ${quantity}, 'active') RETURNING id
    `));
    return row!.id;
  }

  const subscribe = (seller: { id: string; storeId: string }, productId: string, email = "Visitor@Example.com") =>
    alerts.subscribeToStockAlert({ storeId: seller.storeId, sellerId: seller.id, productId, variantId: null, email, locale: "en" }, db);

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    alerts = await import("./stock-alerts.server");
  });

  afterAll(async () => {
    if (createdUsers.length) {
      await db.delete(s.users).where(inArray(s.users.id, createdUsers));
    }
    await client.end();
  });

  it("subscribes once per email, only to this store's out-of-stock products", async () => {
    const seller = await newSeller();
    const other = await newSeller();
    const out = await newProduct(seller.id, 0);
    const inStock = await newProduct(seller.id, 4);
    const foreign = await newProduct(other.id, 0);

    expect(await subscribe(seller, out)).toEqual({ ok: true, status: "created" });
    expect(await subscribe(seller, out, " visitor@example.com ")).toEqual({ ok: true, status: "exists" });
    expect(await subscribe(seller, inStock)).toEqual({ ok: false, error: "inStock" });
    expect(await subscribe(seller, foreign)).toEqual({ ok: false, error: "notFound" });
    expect(await subscribe(seller, out, "nope")).toEqual({ ok: false, error: "invalid" });
  });

  it("claims a restocked alert once, releases it on failure, and only on a published store", async () => {
    const seller = await newSeller();
    const offline = await newSeller(false);
    const product = await newProduct(seller.id, 0);
    const hidden = await newProduct(offline.id, 0);
    await subscribe(seller, product);
    await subscribe(offline, hidden);

    const before = await alerts.claimStockAlerts({ limit: 500 }, db);
    const [mine] = rows<{ id: string }>(await db.execute(sql`SELECT id FROM store_stock_subscriptions WHERE product_id = ${product}`));
    expect(before).not.toContain(mine!.id); // still out of stock

    await db.execute(sql`UPDATE products SET quantity = 3 WHERE id IN (${product}, ${hidden})`);
    const claimed = await alerts.claimStockAlerts({ limit: 500 }, db);
    expect(claimed).toContain(mine!.id);
    const [offlineSub] = rows<{ id: string }>(await db.execute(sql`SELECT id FROM store_stock_subscriptions WHERE product_id = ${hidden}`));
    expect(claimed).not.toContain(offlineSub!.id);
    expect(await alerts.claimStockAlerts({ limit: 500 }, db)).not.toContain(mine!.id);

    await alerts.releaseStockAlertClaim(mine!.id, db);
    expect(await alerts.claimStockAlerts({ limit: 500 }, db)).toContain(mine!.id);
  });

  it("cancels the visitor's open alerts on that store by token", async () => {
    const seller = await newSeller();
    const a = await newProduct(seller.id, 0);
    const b = await newProduct(seller.id, 0);
    await subscribe(seller, a);
    await subscribe(seller, b);
    const [row] = rows<{ unsubscribe_token: string }>(
      await db.execute(sql`SELECT unsubscribe_token FROM store_stock_subscriptions WHERE product_id = ${a}`),
    );
    expect(await alerts.cancelStockAlertsByToken("0".repeat(48), db)).toBeNull();
    const result = await alerts.cancelStockAlertsByToken(row!.unsubscribe_token, db);
    expect(result?.cancelled).toBe(2);
    // Cancelled alerts free the slot: subscribing again creates a new one.
    expect(await subscribe(seller, a)).toEqual({ ok: true, status: "created" });
  });
});
