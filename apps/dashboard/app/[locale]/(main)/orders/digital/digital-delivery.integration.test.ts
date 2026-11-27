import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Digital delivery on the order screen (ROADMAP.md F-108d) against a real
 * Postgres: "Payment received" pressed twice at once marks the order paid
 * once and makes one link per digital line; a seller of another store can't
 * confirm, read, send or renew a link of it. Emails are off (no backend env).
 * Only this file's rows are touched and removed. Runs only when
 * TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("digital delivery (integration)", { timeout: 120_000 }, () => {
  const run = randomUUID().slice(0, 8);
  const sellerId = randomUUID();
  const otherSellerId = randomUUID();
  const customerId = randomUUID();
  const storeId = randomUUID();
  const otherStoreId = randomUUID();
  const productId = randomUUID();
  const orderId = randomUUID();

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./digital-delivery.query")),
  });

  beforeAll(async () => {
    delete process.env.BACKEND_API_URL;
    const { db, sql, categories, eq, users } = await load();
    for (const id of [sellerId, otherSellerId, customerId]) {
      await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${`dd-${id.slice(0, 8)}@example.test`}, 'authenticated', 'authenticated')`);
    }
    await db.update(users).set({ isGuest: true, fullName: "Mona Adel" }).where(eq(users.id, customerId));
    for (const id of [sellerId, otherSellerId]) {
      const sub = `dd-${id.slice(0, 8)}`;
      await db.execute(sql`
        INSERT INTO sellers (id, business_name, display_name, slug, subdomain, support_email, status)
        VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'dd@example.com', 'approved')
      `);
    }
    for (const [id, owner] of [[storeId, sellerId], [otherStoreId, otherSellerId]] as const) {
      const sub = `dd-${id.slice(0, 8)}`;
      await db.execute(sql`INSERT INTO stores (id, seller_id, name, subdomain) VALUES (${id}, ${owner}, ${sub}, ${sub})`);
    }
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    await db.execute(sql`
      INSERT INTO products (id, seller_id, store_id, category_id, status, quantity, sku, images, product_type)
      VALUES (${productId}, ${sellerId}, ${storeId}, ${category!.id}, 'draft'::product_status, 0, ${`dd-${run}`}, '[]'::jsonb, 'digital')
    `);
    await db.execute(sql`
      INSERT INTO digital_products (product_id, seller_id, digital_type, delivery_method, price, status)
      VALUES (${productId}, ${sellerId}, 'ebook', 'automatic', 50, 'active')
    `);
    const [address] = [
      ...((await db.execute(sql`
        INSERT INTO user_addresses (user_id, full_name, phone, address_line1, city, state, postal_code, country)
        VALUES (${customerId}, 'Mona Adel', '01001234567', '-', 'Cairo', 'Cairo', '', 'EG') RETURNING id
      `)) as unknown as Iterable<{ id: string }>),
    ];
    await db.execute(sql`
      INSERT INTO orders (id, user_id, store_id, order_number, subtotal, total_amount, status, payment_status, payment_method, is_digital_only, shipping_address_id)
      VALUES (${orderId}, ${customerId}, ${storeId}, ${`DD-${run}`}, 50, 50, 'pending', 'pending', 'instapay', true, ${address!.id})
    `);
    await db.execute(sql`
      INSERT INTO order_items (order_id, product_id, seller_id, sku, product_name, price, subtotal, total, commission_amount, commission_rate, seller_earning)
      VALUES (${orderId}, ${productId}, ${sellerId}, 'DD', 'Guide', 50, 50, 50, 0, 0, 50)
    `);
  });

  afterAll(async () => {
    const { db, sql } = await load();
    await db.execute(sql`DELETE FROM orders WHERE id = ${orderId}`);
    await db.execute(sql`DELETE FROM products WHERE id = ${productId}`);
    for (const id of [sellerId, otherSellerId, customerId]) {
      await db.execute(sql`DELETE FROM stores WHERE seller_id = ${id}`);
      await db.execute(sql`DELETE FROM auth.users WHERE id = ${id}`);
      await db.execute(sql`DELETE FROM users WHERE id = ${id}`);
    }
  });

  const linkRows = async () => {
    const { db, sql } = await load();
    return [
      ...((await db.execute(sql`SELECT id, download_token FROM digital_orders WHERE order_id = ${orderId}`)) as unknown as Iterable<{
        id: string;
        download_token: string;
      }>),
    ];
  };

  it("waits for the seller to confirm a transfer", async () => {
    const { getDigitalDeliveryView } = await load();
    const view = await getDigitalDeliveryView(sellerId, storeId, orderId);
    expect(view).toMatchObject({ stage: "awaiting_payment", links: [], hasPhone: true });
  });

  it("refuses a seller of another store, whatever store id they send", async () => {
    const { confirmDigitalOrderPayment, getDigitalDeliveryView } = await load();
    expect(await getDigitalDeliveryView(otherSellerId, storeId, orderId)).toBeNull();
    expect(await getDigitalDeliveryView(otherSellerId, otherStoreId, orderId)).toBeNull();
    expect(await confirmDigitalOrderPayment(otherSellerId, storeId, orderId, otherSellerId)).toEqual({ ok: false, error: "not_found" });
    expect(await confirmDigitalOrderPayment(otherSellerId, otherStoreId, orderId, otherSellerId)).toEqual({ ok: false, error: "not_found" });
    // The owner with the wrong store id is refused too.
    expect(await getDigitalDeliveryView(sellerId, otherStoreId, orderId)).toBeNull();
    expect(await linkRows()).toHaveLength(0);
  });

  it("marks the order paid once and makes one link, even when pressed twice at once", async () => {
    const { confirmDigitalOrderPayment, db, eq, orders } = await load();
    const [a, b] = await Promise.all([
      confirmDigitalOrderPayment(sellerId, storeId, orderId, sellerId),
      confirmDigitalOrderPayment(sellerId, storeId, orderId, sellerId),
    ]);
    expect(a.ok && b.ok).toBe(true);
    expect(await linkRows()).toHaveLength(1);
    const again = await confirmDigitalOrderPayment(sellerId, storeId, orderId, sellerId);
    expect(again.ok && again.view.stage).toBe("ready");
    expect(await linkRows()).toHaveLength(1);
    const [order] = await db.select({ paymentStatus: orders.paymentStatus, paidAt: orders.paidAt }).from(orders).where(eq(orders.id, orderId));
    expect(order?.paymentStatus).toBe("paid");
    expect(order?.paidAt).toBeTruthy();
  });

  it("gives the link only to the order's seller, and a new link ends the old one", async () => {
    const { buildDigitalWhatsAppLink, issueNewDigitalLink, readDigitalLink } = await load();
    const [row] = await linkRows();

    const wa = await buildDigitalWhatsAppLink(sellerId, storeId, orderId);
    expect(wa.ok && wa.url.startsWith("https://wa.me/201001234567?text=")).toBe(true);
    expect(wa.ok && decodeURIComponent(wa.url)).toContain(row!.download_token);

    expect(await readDigitalLink(otherSellerId, otherStoreId, orderId, row!.id)).toEqual({ ok: false, error: "not_found" });
    expect(await buildDigitalWhatsAppLink(otherSellerId, storeId, orderId)).toEqual({ ok: false, error: "not_found" });
    expect(await issueNewDigitalLink(otherSellerId, otherStoreId, orderId, row!.id, otherSellerId)).toEqual({ ok: false, error: "not_found" });
    expect((await linkRows())[0]!.download_token).toBe(row!.download_token);

    const renewed = await issueNewDigitalLink(sellerId, storeId, orderId, row!.id, sellerId);
    expect(renewed.ok && renewed.view.links[0]?.status).toBe("ready");
    const [after] = await linkRows();
    expect(after!.download_token).not.toBe(row!.download_token);
    const copied = await readDigitalLink(sellerId, storeId, orderId, row!.id);
    expect(copied.ok && copied.url).toContain(after!.download_token);
  });
});
