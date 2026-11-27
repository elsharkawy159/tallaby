import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createAuthUsers } from "../../../db/src/testing/auth-users";
import * as DB_SCHEMA from "@workspace/db/schema";

/**
 * The one-time download link (F-108c) against a real Postgres: fulfillment
 * makes one link per digital line even when two calls race, a GET-style read
 * changes nothing, two downloads at once give exactly one file, and a new
 * link ends the old one (only for the line's own seller). Storage is mocked:
 * no file is signed or read. Raw inserts; only this file's own rows are
 * touched. Skipped when TEST_DATABASE_URL is unset; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

vi.mock("./storage", () => ({
  getSignedUrlForPath: vi.fn(async (path: string) => `https://storage.test/${path}?signed=1`),
}));
vi.mock("./notify", () => ({ sendDigitalDeliveryEmail: vi.fn(async () => ({ success: true })) }));

describe.skipIf(!TEST_DATABASE_URL)("digital download link (integration)", { timeout: 90_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 6, onnotice: () => {} });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const createdUsers: string[] = [];
  const createdProducts: string[] = [];
  let categoryId = "";
  let access: typeof import("./access.server");
  let fulfillment: typeof import("./fulfillment");

  const rows = <T>(result: unknown) => [...(result as Iterable<T>)];

  async function newUser(role: "seller" | "customer") {
    const id = randomUUID();
    createdUsers.push(id);
    await createAuthUsers(id);
    await db.insert(s.users).values({ id, isGuest: role === "customer", role });
    if (role === "seller") {
      const sub = `dl-${id.slice(0, 8)}`;
      await db.execute(sql`
        INSERT INTO sellers (id, business_name, display_name, slug, subdomain, support_email, status)
        VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'dl@example.com', 'approved')
      `);
    }
    return id;
  }

  /** A paid order for one digital product with two files. */
  async function paidDigitalOrder() {
    const sellerId = await newUser("seller");
    const buyerId = await newUser("customer");
    const [product] = rows<{ id: string }>(
      await db.execute(sql`
        INSERT INTO products (seller_id, category_id, status, quantity, sku, images, product_type)
        VALUES (${sellerId}, ${categoryId}, 'active'::product_status, 0, ${`dl-${randomUUID().slice(0, 8)}`}, '[]'::jsonb, 'digital')
        RETURNING id
      `),
    );
    createdProducts.push(product!.id);
    const [digital] = rows<{ id: string }>(
      await db.execute(sql`
        INSERT INTO digital_products (product_id, seller_id, digital_type, delivery_method, price, status)
        VALUES (${product!.id}, ${sellerId}, 'ebook', 'automatic', 50, 'active') RETURNING id
      `),
    );
    await db.execute(sql`
      INSERT INTO digital_files (digital_product_id, file_name, file_url, file_size, file_type, sort_order)
      VALUES (${digital!.id}, 'guide.pdf', ${`${sellerId}/guide.pdf`}, 1000, 'application/pdf', 0),
             (${digital!.id}, 'bonus.zip', ${`${sellerId}/bonus.zip`}, 2000, 'application/zip', 1)
    `);
    const [order] = rows<{ id: string }>(
      await db.execute(sql`
        INSERT INTO orders (user_id, order_number, subtotal, total_amount, payment_status, payment_method)
        VALUES (${buyerId}, ${`DL-${randomUUID().slice(0, 10)}`}, 50, 50, 'paid', 'card') RETURNING id
      `),
    );
    await db.execute(sql`
      INSERT INTO order_items (order_id, product_id, seller_id, sku, product_name, price, subtotal, total, commission_amount, commission_rate, seller_earning)
      VALUES (${order!.id}, ${product!.id}, ${sellerId}, 'DL', 'Guide', 50, 50, 50, 0, 0, 50)
    `);
    return { sellerId, orderId: order!.id };
  }

  const linksOf = async (orderId: string) =>
    rows<{ id: string; download_token: string; download_count: number; max_downloads: number; expires_at: string; fulfillment_status: string }>(
      await db.execute(sql`
        SELECT id, download_token, download_count, max_downloads, expires_at, fulfillment_status
        FROM digital_orders WHERE order_id = ${orderId}
      `),
    );

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    access = await import("./access.server");
    fulfillment = await import("./fulfillment");
    const [category] = rows<{ id: string }>(await db.execute(sql`SELECT id FROM categories LIMIT 1`));
    categoryId = category!.id;
  }, 90_000);

  afterAll(async () => {
    if (createdProducts.length) {
      const ids = sql.raw(`(${createdProducts.map((p) => `'${p}'`).join(",")})`);
      await db.execute(sql`DELETE FROM order_items WHERE product_id IN ${ids}`);
      await db.execute(sql`DELETE FROM products WHERE id IN ${ids}`);
    }
    if (createdUsers.length) {
      const ids = sql.raw(`(${createdUsers.map((u) => `'${u}'`).join(",")})`);
      await db.execute(sql`DELETE FROM orders WHERE user_id IN ${ids}`);
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, createdUsers));
      await db.delete(s.users).where(inArray(s.users.id, createdUsers));
    }
    await client.end();
  });

  it("makes one one-time, 7-day link per digital line, even when two payment webhooks race", async () => {
    const { orderId } = await paidDigitalOrder();
    const [a, b] = await Promise.all([
      fulfillment.fulfillDigitalOrderItems(orderId, { notify: false }),
      fulfillment.fulfillDigitalOrderItems(orderId, { notify: false }),
    ]);
    expect(a.success && b.success).toBe(true);
    const links = await linksOf(orderId);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ max_downloads: 1, download_count: 0, fulfillment_status: "delivered" });
    const days = (new Date(links[0]!.expires_at).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThanOrEqual(7);
  });

  it("reads without using the link, and two downloads at once give exactly one file", async () => {
    const { orderId } = await paidDigitalOrder();
    await fulfillment.fulfillDigitalOrderItems(orderId, { notify: false });
    const [link] = await linksOf(orderId);
    const token = link!.download_token;

    for (let i = 0; i < 3; i++) {
      const view = await access.getDigitalDownloadView(token);
      expect(view?.files.map((f) => f.name)).toEqual(["guide.pdf", "bonus.zip"]);
    }
    expect((await linksOf(orderId))[0]!.download_count).toBe(0);

    const results = await Promise.all([access.consumeDigitalDownload(token), access.consumeDigitalDownload(token)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, reason: "unavailable" }]);
    expect((await linksOf(orderId))[0]).toMatchObject({ download_count: 1, fulfillment_status: "downloaded" });

    expect(await access.getDigitalDownloadView(token)).toBeNull();
    expect(await access.consumeDigitalDownload(token)).toEqual({ ok: false, reason: "unavailable" });
  });

  it("does nothing for an expired link", async () => {
    const { orderId } = await paidDigitalOrder();
    await fulfillment.fulfillDigitalOrderItems(orderId, { notify: false });
    const [link] = await linksOf(orderId);
    await db.execute(sql`UPDATE digital_orders SET expires_at = now() - interval '1 minute' WHERE id = ${link!.id}`);
    expect(await access.getDigitalDownloadView(link!.download_token)).toBeNull();
    expect(await access.consumeDigitalDownload(link!.download_token)).toEqual({ ok: false, reason: "unavailable" });
  });

  it("issues a new link for the line's own seller only, and the old link stops working", async () => {
    const { orderId, sellerId } = await paidDigitalOrder();
    await fulfillment.fulfillDigitalOrderItems(orderId, { notify: false });
    const [link] = await linksOf(orderId);
    const oldToken = link!.download_token;
    expect((await access.consumeDigitalDownload(oldToken)).ok).toBe(true);

    const stranger = await newUser("seller");
    expect(await access.reissueDigitalAccess(link!.id, { sellerId: stranger })).toEqual({ success: false, error: "not_found" });

    const reissued = await access.reissueDigitalAccess(link!.id, { sellerId, actorUserId: sellerId });
    expect(reissued.success).toBe(true);
    if (!reissued.success) return;
    expect(reissued.token).not.toBe(oldToken);
    expect(reissued.url).toContain(`/d/${reissued.token}`);
    expect((await linksOf(orderId))[0]).toMatchObject({ download_count: 0, max_downloads: 1, fulfillment_status: "delivered" });

    expect(await access.getDigitalDownloadView(oldToken)).toBeNull();
    expect(await access.consumeDigitalDownload(oldToken)).toEqual({ ok: false, reason: "unavailable" });
    expect((await access.consumeDigitalDownload(reissued.token)).ok).toBe(true);

    await db.execute(sql`UPDATE digital_orders SET fulfillment_status = 'revoked' WHERE id = ${link!.id}`);
    expect(await access.reissueDigitalAccess(link!.id, { sellerId })).toEqual({ success: false, error: "revoked" });
  });
});
