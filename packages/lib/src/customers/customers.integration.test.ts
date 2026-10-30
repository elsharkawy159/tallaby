import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";

/**
 * Store customers (F-01a) against the staging copy: a store's orders group
 * into customers by phone, refused shipments count against the success rate,
 * and a seller never sees another seller's store (or another store's orders).
 * Raw inserts for sellers: the schema can be ahead of staging. Skipped when
 * TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store customers (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4, onnotice: () => {} });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const createdUsers: string[] = [];
  let customers: typeof import("./customers.server");

  async function newSeller() {
    const id = randomUUID();
    const sub = `cu-${id.slice(0, 8)}`;
    createdUsers.push(id);
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, status)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'cu@example.com', 'approved')
    `);
    const [store] = [...(await db.execute(sql`SELECT id FROM stores WHERE seller_id = ${id} LIMIT 1`))] as { id: string }[];
    return { id, storeId: store!.id };
  }

  async function newStore(sellerId: string) {
    const sub = `cu-${randomUUID().slice(0, 8)}`;
    const [row] = [...(await db.execute(sql`
      INSERT INTO stores (seller_id, name, subdomain) VALUES (${sellerId}, ${sub}, ${sub}) RETURNING id
    `))] as { id: string }[];
    return row!.id;
  }

  async function newCustomer() {
    const id = randomUUID();
    createdUsers.push(id);
    await db.insert(s.users).values({ id, isGuest: true, role: "customer", fullName: "Guest User" });
    return id;
  }

  async function placeOrder(input: { storeId: string; phone: string; total: number; status?: string; refused?: boolean }) {
    const userId = await newCustomer();
    const [address] = [...(await db.execute(sql`
      INSERT INTO user_addresses (user_id, full_name, phone, address_line1, city, state, postal_code, country)
      VALUES (${userId}, 'Mona Ali', ${input.phone}, '12 El Nasr St', 'Nasr City', 'Cairo', '', 'EG') RETURNING id
    `))] as { id: string }[];
    const [order] = [...(await db.execute(sql`
      INSERT INTO orders (user_id, order_number, subtotal, total_amount, store_id, shipping_address_id, status)
      VALUES (${userId}, ${`CU-${randomUUID().slice(0, 10)}`}, ${input.total}, ${input.total}, ${input.storeId},
              ${address!.id}, ${input.status ?? "pending"}::order_status)
      RETURNING id
    `))] as { id: string }[];
    if (input.refused) {
      await db.execute(sql`INSERT INTO shipments (order_id, status) VALUES (${order!.id}, 'failed')`);
    }
    return order!.id;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    customers = await import("./customers.server");
  }, 60_000);

  afterAll(async () => {
    if (createdUsers.length) {
      const ids = sql.raw(`(${createdUsers.map((u) => `'${u}'`).join(",")})`);
      await db.execute(sql`DELETE FROM shipments WHERE order_id IN (SELECT id FROM orders WHERE user_id IN ${ids})`);
      await db.execute(sql`DELETE FROM orders WHERE user_id IN ${ids}`);
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, createdUsers));
      await db.delete(s.users).where(inArray(s.users.id, createdUsers));
    }
    await client.end();
  });

  it("groups a store's orders by phone with counts, spend and success rate", async () => {
    const seller = await newSeller();
    await placeOrder({ storeId: seller.storeId, phone: "01012345678", total: 150, status: "delivered" });
    await placeOrder({ storeId: seller.storeId, phone: "+20 101 234 5678", total: 80, status: "shipped", refused: true });
    await placeOrder({ storeId: seller.storeId, phone: "01199998888", total: 40 });

    const list = await customers.listStoreCustomers(seller.id, seller.storeId, db);
    expect(list).toHaveLength(2);
    const mona = list.find((c) => c.phone === "01012345678");
    expect(mona).toMatchObject({
      name: "Mona Ali",
      governorate: "Cairo",
      orderCount: 2,
      deliveredCount: 1,
      refusedCount: 1,
      totalSpent: "150.00",
      successRate: 50,
    });

    const detail = await customers.getStoreCustomer(seller.id, seller.storeId, mona!.key, db);
    expect(detail?.orders).toHaveLength(2);
    expect(await customers.getStoreCustomer(seller.id, seller.storeId, "p:01000000000", db)).toBeNull();
  });

  it("finds a phone's refusals and quick duplicates on the same store only (F-02d)", async () => {
    const a = await newSeller();
    const b = await newSeller();
    await placeOrder({ storeId: a.storeId, phone: "+20 122 333 4444", total: 50, status: "returned" });
    await placeOrder({ storeId: b.storeId, phone: "01223334444", total: 50, status: "returned" });
    const first = await placeOrder({ storeId: a.storeId, phone: "01223334444", total: 70 });
    const second = await placeOrder({ storeId: a.storeId, phone: "01223334444", total: 70 });

    const input = [first, second].map((orderId) => ({ orderId, storeId: a.storeId, addressPhone: "01223334444", userPhone: null }));
    const risks = await customers.loadStoreOrderRisks(a.id, input, db);
    expect(risks.get(first)).toMatchObject({ refused: 1, delivered: 0 });
    expect(risks.get(first)!.duplicates).toHaveLength(1);

    // B's session sees nothing of A's store.
    expect((await customers.loadStoreOrderRisks(b.id, input, db)).size).toBe(0);
  });

  it("saves, updates and clears a customer's note and tags, only on the seller's own store (F-01c)", async () => {
    const a = await newSeller();
    const b = await newSeller();
    const save = (sellerId: string, storeId: string, note: string, tags: string[]) =>
      customers.saveStoreCustomerNote(sellerId, { storeId, key: "p:01012345678", note, tags, userId: sellerId }, db);

    expect((await save(a.id, a.storeId, " Calls after 6 ", ["VIP", "vip"])).saved).toBe(true);
    expect((await save(a.id, a.storeId, "Prefers WhatsApp", ["VIP", "Wholesale"])).saved).toBe(true);
    expect((await customers.listStoreCustomerNotes(a.id, a.storeId, db)).get("p:01012345678")).toEqual({
      note: "Prefers WhatsApp",
      tags: ["VIP", "Wholesale"],
    });

    // B cannot write to or read A's store.
    expect((await save(b.id, a.storeId, "hijack", [])).saved).toBe(false);
    expect((await customers.listStoreCustomerNotes(b.id, a.storeId, db)).size).toBe(0);
    expect((await customers.listStoreCustomerNotes(a.id, a.storeId, db)).get("p:01012345678")?.note).toBe("Prefers WhatsApp");
    // Empty note and no tags from B must not delete A's row either.
    expect((await save(b.id, a.storeId, "", [])).saved).toBe(false);
    expect((await customers.listStoreCustomerNotes(a.id, a.storeId, db)).size).toBe(1);

    // A malformed key is refused.
    expect((await customers.saveStoreCustomerNote(a.id, { storeId: a.storeId, key: "p:x", note: "n", userId: a.id }, db)).saved).toBe(false);

    // Empty note and no tags delete the row.
    expect((await save(a.id, a.storeId, "  ", [])).saved).toBe(true);
    expect((await customers.listStoreCustomerNotes(a.id, a.storeId, db)).size).toBe(0);
  });

  it("keeps each store's customers apart and returns nothing for another seller's store", async () => {
    const a = await newSeller();
    const b = await newSeller();
    const a2 = await newStore(a.id);
    await placeOrder({ storeId: a.storeId, phone: "01012345678", total: 100 });
    await placeOrder({ storeId: a2, phone: "01012345678", total: 200 });
    await placeOrder({ storeId: b.storeId, phone: "01012345678", total: 300 });

    const first = await customers.listStoreCustomers(a.id, a.storeId, db);
    const second = await customers.listStoreCustomers(a.id, a2, db);
    expect(first.map((c) => c.totalSpent)).toEqual(["100.00"]);
    expect(second.map((c) => c.totalSpent)).toEqual(["200.00"]);

    // B's store id with A's session, and a malformed id: nothing.
    expect(await customers.listStoreCustomers(a.id, b.storeId, db)).toEqual([]);
    expect(await customers.listStoreCustomers(a.id, "not-a-uuid", db)).toEqual([]);
    expect(await customers.getStoreCustomer(a.id, b.storeId, "p:01012345678", db)).toBeNull();
  });
});
