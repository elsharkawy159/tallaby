import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";

/**
 * Missed orders (0120, F-03) against the staging copy: one open lead per store
 * and phone, an order converts it (same cart, user or phone), sellers only
 * see and change their own stores' leads, and old leads are cleaned up.
 * Raw inserts for sellers: the schema can be ahead of staging (other sessions'
 * columns). Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("missed orders (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4, onnotice: () => {} });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const createdUsers: string[] = [];
  let leads: typeof import("./checkout-leads.server");

  async function newSeller() {
    const id = randomUUID();
    const sub = `cl-${id.slice(0, 8)}`;
    createdUsers.push(id);
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, status)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'cl@example.com', 'approved')
    `);
    const [store] = [...(await db.execute(sql`SELECT id FROM stores WHERE seller_id = ${id} LIMIT 1`))] as { id: string }[];
    return { id, storeId: store!.id };
  }

  async function newCustomer() {
    const id = randomUUID();
    createdUsers.push(id);
    await db.insert(s.users).values({ id, isGuest: true, role: "customer" });
    return id;
  }

  async function newCart(userId: string, storeId: string) {
    const [row] = [...(await db.execute(sql`
      INSERT INTO carts (user_id, store_id, status) VALUES (${userId}, ${storeId}, 'active') RETURNING id
    `))] as { id: string }[];
    return row!.id;
  }

  async function newAddress(userId: string, phone: string) {
    const [row] = [...(await db.execute(sql`
      INSERT INTO user_addresses (user_id, full_name, phone, address_line1, city, state, postal_code, country)
      VALUES (${userId}, 'Mona Ali', ${phone}, '12 El Nasr St', 'Nasr City', 'Cairo', '', 'EG') RETURNING id
    `))] as { id: string }[];
    return row!.id;
  }

  async function placeOrder(input: { userId: string; storeId: string; cartId?: string | null; addressId?: string | null }) {
    const [row] = [...(await db.execute(sql`
      INSERT INTO orders (user_id, order_number, subtotal, total_amount, store_id, cart_id, shipping_address_id)
      VALUES (${input.userId}, ${`CL-${randomUUID().slice(0, 10)}`}, 100, 100, ${input.storeId}, ${input.cartId ?? null}, ${input.addressId ?? null})
      RETURNING id
    `))] as { id: string }[];
    return row!.id;
  }

  const item = { productId: randomUUID(), title: "Lamp", quantity: 2, price: "50.00", image: null };
  const save = (seller: { id: string; storeId: string }, userId: string, cartId: string, phone: string, name = "Mona Ali") =>
    leads.saveStoreCheckoutLead(
      {
        storeId: seller.storeId,
        sellerId: seller.id,
        userId,
        cartId,
        fullName: name,
        phone,
        email: null,
        governorate: "Cairo",
        city: "Nasr City",
        items: [item],
        subtotal: 100,
        shipping: 50,
        total: 150,
      },
      db,
    );
  const list = (sellerId: string, storeId?: string) =>
    leads.listStoreCheckoutLeads(sellerId, { storeId: storeId ?? null, range: "30d", status: "all" }, db);

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    leads = await import("./checkout-leads.server");
  });

  afterAll(async () => {
    if (createdUsers.length) {
      await db.execute(sql`DELETE FROM orders WHERE user_id IN ${sql.raw(`(${createdUsers.map((u) => `'${u}'`).join(",")})`)}`);
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, createdUsers));
      await db.delete(s.users).where(inArray(s.users.id, createdUsers));
    }
    await client.end();
  });

  it("keeps one open lead per store and phone, refreshed on each save", async () => {
    const seller = await newSeller();
    const customer = await newCustomer();
    const cartId = await newCart(customer, seller.storeId);
    expect(await save(seller, customer, cartId, "+20 101 234 5678", "Mona")).toBe(true);
    expect(await save(seller, customer, cartId, "01012345678", "Mona Ali")).toBe(true);
    const rows = await list(seller.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ fullName: "Mona Ali", phone: "01012345678", subtotal: "100.00", shipping: "50.00", total: "150.00" });
    expect(rows[0]!.items).toEqual([item]);
    // Not a mobile: nothing saved.
    expect(await save(seller, customer, cartId, "0223456789")).toBe(false);
    expect(await list(seller.id)).toHaveLength(1);
  });

  it("drops the lead when an order is placed from the same cart, user or phone", async () => {
    const seller = await newSeller();

    // Same cart.
    const a = await newCustomer();
    const cartA = await newCart(a, seller.storeId);
    await save(seller, a, cartA, "01111111111");
    await placeOrder({ userId: a, storeId: seller.storeId, cartId: cartA });

    // Same phone, from another guest (new cookie) and another cart.
    const b1 = await newCustomer();
    const b2 = await newCustomer();
    await save(seller, b1, await newCart(b1, seller.storeId), "01222222222");
    await placeOrder({ userId: b2, storeId: seller.storeId, cartId: await newCart(b2, seller.storeId), addressId: await newAddress(b2, "+201222222222") });

    // Still open: a different phone.
    const c = await newCustomer();
    await save(seller, c, await newCart(c, seller.storeId), "01555555555");

    const open = await list(seller.id);
    expect(open.map((r) => r.phone)).toEqual(["01555555555"]);
  });

  it("never shows or changes another seller's leads", async () => {
    const owner = await newSeller();
    const other = await newSeller();
    const customer = await newCustomer();
    await save(owner, customer, await newCart(customer, owner.storeId), "01033333333");
    const [lead] = await list(owner.id);

    expect(await list(other.id)).toHaveLength(0);
    // The other seller naming the owner's store returns nothing.
    expect(await list(other.id, owner.storeId)).toHaveLength(0);
    // A save claiming the owner's store with the other seller's id writes nothing.
    await save({ id: other.id, storeId: owner.storeId }, customer, await newCart(customer, owner.storeId), "01044444444");
    expect((await list(owner.id)).map((r) => r.phone)).toEqual(["01033333333"]);

    expect(await leads.setStoreCheckoutLeadContacted(other.id, { storeId: owner.storeId, leadId: lead!.id, contacted: true, userId: other.id }, db)).toBe(false);
    expect(await leads.setStoreCheckoutLeadContacted(owner.id, { storeId: owner.storeId, leadId: lead!.id, contacted: true, userId: owner.id }, db)).toBe(true);
    const [after] = await list(owner.id);
    expect(after!.contactedAt).not.toBeNull();
    expect(await leads.listStoreCheckoutLeads(owner.id, { range: "30d", status: "open" }, db)).toHaveLength(0);

    expect(await leads.saveStoreLeadTemplate(other.id, { storeId: owner.storeId, template: "Hi {name}" }, db)).toEqual({ success: false, error: "not_found" });
    expect(await leads.saveStoreLeadTemplate(owner.id, { storeId: owner.storeId, template: "Hi {name}" }, db)).toEqual({ success: true });
    const settings = await leads.listStoreLeadSettings(owner.id, db);
    expect(settings.find((x) => x.storeId === owner.storeId)?.template).toBe("Hi {name}");
    expect(await leads.saveStoreLeadTemplate(owner.id, { storeId: owner.storeId, template: null }, db)).toEqual({ success: true });
    expect((await leads.listStoreLeadSettings(owner.id, db)).find((x) => x.storeId === owner.storeId)?.template).toBeNull();
  });

  it("deletes leads older than 30 days", async () => {
    const seller = await newSeller();
    const customer = await newCustomer();
    await save(seller, customer, await newCart(customer, seller.storeId), "01066666666");
    await db.execute(sql`UPDATE store_checkout_leads SET created_at = now() - interval '31 days' WHERE seller_id = ${seller.id}`);
    expect(await leads.deleteOldStoreCheckoutLeads(db)).toBeGreaterThanOrEqual(1);
    const [left] = [...(await db.execute(sql`SELECT count(*)::int AS n FROM store_checkout_leads WHERE seller_id = ${seller.id}`))] as { n: number }[];
    expect(left!.n).toBe(0);
  });
});
