import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray, sql } from "drizzle-orm";
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

  /** users.id points at auth.users; the auth trigger makes the users row, and deleting it cascades (0134). */
  async function newAuthUser(id: string) {
    await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${`qa-${id.slice(0, 8)}@example.test`}, 'authenticated', 'authenticated')`);
  }

  async function newSeller() {
    const id = randomUUID();
    const sub = `cu-${id.slice(0, 8)}`;
    createdUsers.push(id);
    await newAuthUser(id);
    await db.update(s.users).set({ isGuest: false, role: "seller" }).where(eq(s.users.id, id));
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
    await newAuthUser(id);
    await db.update(s.users).set({ isGuest: true, role: "customer", fullName: "Guest User" }).where(eq(s.users.id, id));
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
      await db.execute(sql`DELETE FROM auth.users WHERE id IN ${ids}`);
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

  it("groups, searches, sorts and pages in SQL exactly as the code does (F-43e)", async () => {
    const a = await newSeller();
    const b = await newSeller();
    const order = async (input: {
      phone: string;
      total: number;
      status?: string;
      refused?: boolean;
      name?: string;
      user?: string;
      userPhone?: string;
      email?: string;
    }) => {
      const userId = input.user ?? (await newCustomer());
      await db.execute(sql`
        UPDATE users SET phone = ${input.userPhone ?? null}, email = ${input.email ?? null},
                         is_guest = ${!input.email}
         WHERE id = ${userId}
      `);
      const [address] = [...(await db.execute(sql`
        INSERT INTO user_addresses (user_id, full_name, phone, address_line1, city, state, postal_code, country)
        VALUES (${userId}, ${input.name ?? "Guest User"}, ${input.phone}, '1 St', ' Nasr City ', 'Cairo', '', 'EG') RETURNING id
      `))] as { id: string }[];
      const [row] = [...(await db.execute(sql`
        INSERT INTO orders (user_id, order_number, subtotal, total_amount, store_id, shipping_address_id, status)
        VALUES (${userId}, ${`CU-${randomUUID().slice(0, 10)}`}, ${input.total}, ${input.total}, ${a.storeId}, ${address!.id},
                ${input.status ?? "pending"}::order_status) RETURNING id
      `))] as { id: string }[];
      if (input.refused) await db.execute(sql`INSERT INTO shipments (order_id, status) VALUES (${row!.id}, 'failed')`);
      return userId;
    };

    // Every spelling of one mobile is one customer, Arabic digits included.
    await order({ phone: "01012345678", total: 100.5, status: "delivered", name: "Mona Ali" });
    await order({ phone: "+20 101 234 5678", total: 80, status: "shipped", refused: true });
    await order({ phone: "٠١٠١٢٣٤٥٦٧٨", total: 40.25 });
    await order({ phone: "201012345678", total: 10, status: "cancelled" });
    await order({ phone: "00201012345678", total: 5, status: "returned" });
    await order({ phone: "1012345678", total: 3, status: "refund_requested", name: "Mona New" });
    // A landline in Arabic digits has no ASCII digits: falls through to the user's phone.
    await order({ phone: "٠٢٢٣٤٥٦٧٨٩", total: 20, userPhone: "01112223333", name: "Karim", email: "karim@example.com" });
    await order({ phone: "01112223333", total: 30, status: "delivered" });
    // Six digits typed is a phone; five is not, and groups by user.
    await order({ phone: "12-34-56", total: 7, name: "Short six" });
    const noPhone = await newCustomer();
    await order({ phone: "12345", total: 9, user: noPhone, name: "No phone", email: "nophone@example.com" });
    await order({ phone: "", total: 11, user: noPhone, status: "delivered", email: "nophone@example.com" });
    // A synthetic guest email never shows.
    await order({ phone: "01223334444", total: 1, email: "guest_x@temp.local" });
    // Another seller's store must not leak in.
    await placeOrder({ storeId: b.storeId, phone: "01012345678", total: 999 });

    await customers.saveStoreCustomerNote(
      a.id,
      { storeId: a.storeId, key: "p:01112223333", note: "Calls after six", tags: ["VIP"], userId: a.id },
      db,
    );

    const { selectStoreCustomers, CUSTOMER_FILTERS, CUSTOMER_SORTS } = await import("./customers.lib");
    const reference = await customers.listStoreCustomers(a.id, a.storeId, db);
    const base = { q: "", filter: "all", sort: "recent", tag: "" } as const;
    const inSql = (over: object) => customers.listFilteredStoreCustomers(a.id, a.storeId, { ...base, ...over }, db);

    expect(reference).toHaveLength(5);
    expect(await inSql({})).toEqual(reference);
    expect(reference.find((c) => c.key === "p:01012345678")).toMatchObject({
      name: "Mona New",
      orderCount: 6,
      deliveredCount: 1,
      refusedCount: 2,
      cancelledCount: 2,
      totalSpent: "140.75",
      successRate: 33,
      city: "Nasr City",
    });

    for (const filter of CUSTOMER_FILTERS) {
      for (const sort of CUSTOMER_SORTS) {
        const want = selectStoreCustomers(reference, { filter, sort }).map((c) => c.key);
        expect((await inSql({ filter, sort })).map((c) => c.key)).toEqual(want);
      }
    }
    for (const q of ["mona", "MONA", "karim@", "0101", "+20101", "١٠١", "123456", "12", "temp.local", "%", "nothing"]) {
      const want = selectStoreCustomers(reference, { query: q }).map((c) => c.key);
      expect((await inSql({ q })).map((c) => c.key).sort()).toEqual([...want].sort());
    }

    // Notes and tags are searched too, and only the tag's customer passes.
    expect((await inSql({ q: "after six" })).map((c) => c.key)).toEqual(["p:01112223333"]);
    expect((await inSql({ q: "vip" })).map((c) => c.key)).toEqual(["p:01112223333"]);
    expect((await inSql({ tag: "vip" })).map((c) => c.key)).toEqual(["p:01112223333"]);

    // Paging: the pages add up to the list, and an old page number lands on the last.
    const page = (over: object) =>
      customers.listStoreCustomersPage(a.id, a.storeId, { ...base, page: 1, size: 2, ...over }, db);
    const [p1, p2, p3] = [await page({ page: 1 }), await page({ page: 2 }), await page({ page: 99 })];
    expect([...p1.customers, ...p2.customers, ...p3.customers]).toEqual(reference);
    expect(p3).toMatchObject({ page: 3, pages: 3, matched: 5 });
    expect(p1.stats).toEqual({
      customers: reference.length,
      repeat: reference.filter((c) => c.orderCount >= 2).length,
      refused: reference.filter((c) => c.refusedCount > 0).length,
    });
    expect((await page({ q: "nothing" })).stats.customers).toBe(reference.length);

    // The drawer finds each customer by key, with the same totals as the list.
    for (const customer of reference) {
      const detail = await customers.getStoreCustomer(a.id, a.storeId, customer.key, db);
      expect(detail?.customer).toEqual(customer);
      expect(detail?.orders).toHaveLength(customer.orderCount);
    }

    // B's session sees nothing of A's store.
    expect(await customers.listFilteredStoreCustomers(b.id, a.storeId, base, db)).toEqual([]);
    expect((await customers.listStoreCustomersPage(b.id, a.storeId, { ...base, page: 1, size: 20 }, db)).matched).toBe(0);
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
