import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Wassalha tracking numbers (ROADMAP.md F-12e) against the staging database:
 * only an exported order of this store matches; the same seller's other store
 * and another seller's store are refused by order number. Rows are removed
 * afterwards. Runs only when TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("wassalha tracking (integration)", { timeout: 120_000 }, () => {
  const run = randomUUID().slice(0, 8).toUpperCase();
  const sellerId = randomUUID();
  const otherSellerId = randomUUID();
  const customerId = randomUUID();
  const storeA = randomUUID();
  const storeB = randomUUID();
  const storeOther = randomUUID();
  const orderIds: string[] = [];
  const number = (name: string) => `QA${run}${name}`;

  const load = async () => ({ ...(await import("@workspace/db")), ...(await import("./wassalha-tracking.server")) });

  async function order(name: string, storeId: string, owner: string, shipment: { carrier: string; tracking?: string } | null) {
    const { db, sql } = await load();
    const id = randomUUID();
    orderIds.push(id);
    await db.execute(sql`
      INSERT INTO orders (id, order_number, user_id, store_id, status, subtotal, total_amount)
      VALUES (${id}, ${number(name)}, ${customerId}, ${storeId}, 'confirmed', '100', '100')
    `);
    if (shipment) {
      await db.execute(sql`
        INSERT INTO shipments (order_id, seller_id, carrier, status, tracking_number)
        VALUES (${id}, ${owner}, ${shipment.carrier}, 'pending', ${shipment.tracking ?? null})
      `);
    }
    return id;
  }

  const entry = (name: string, trackingNumber: string, row = 2) => ({ row, orderNumber: number(name), trackingNumber });

  async function trackingOf(name: string) {
    const { db, sql } = await load();
    const rows = await db.execute(sql`
      SELECT s.tracking_number FROM shipments s JOIN orders o ON o.id = s.order_id WHERE o.order_number = ${number(name)}
    `);
    return ([...(rows as Iterable<Record<string, unknown>>)][0]?.tracking_number ?? null) as string | null;
  }

  beforeAll(async () => {
    const { db, sql } = await load();
    for (const id of [sellerId, otherSellerId, customerId]) {
      const email = `qa-${id.slice(0, 8)}@example.test`;
      await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${email}, 'authenticated', 'authenticated')`);
      await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${id}, ${email}, false) ON CONFLICT DO NOTHING`);
    }
    for (const id of [sellerId, otherSellerId]) {
      await db.execute(sql`
        INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email, status)
        VALUES (${id}, 'QA wassalha', 'QA wassalha', ${`qa-${id.slice(0, 8)}`}, 'individual', '{"country":"EG"}'::jsonb, 'x@example.com', 'approved')
      `);
    }
    for (const [id, owner, name] of [
      [storeA, sellerId, "a"],
      [storeB, sellerId, "b"],
      [storeOther, otherSellerId, "o"],
    ] as const) {
      await db.execute(sql`
        INSERT INTO stores (id, seller_id, name, subdomain, status)
        VALUES (${id}, ${owner}, ${`QA ${name}`}, ${`qa-${name}-${run.toLowerCase()}`}, 'active')
      `);
    }
    await order("FRESH", storeA, sellerId, { carrier: "wassalha" });
    await order("AGAIN", storeA, sellerId, { carrier: "wassalha", tracking: "EGSAME1" });
    await order("OTHERNUM", storeA, sellerId, { carrier: "wassalha", tracking: "EGOLD1" });
    await order("NOTSENT", storeA, sellerId, null);
    await order("OWNSHIP", storeA, sellerId, { carrier: "seller" });
    await order("BOSTA", storeA, sellerId, { carrier: "bosta", tracking: "B123456" });
    await order("USES", storeA, sellerId, { carrier: "wassalha" });
    await order("HOLDER", storeB, sellerId, { carrier: "wassalha", tracking: "EGHELD1" });
    await order("STOREB", storeB, sellerId, { carrier: "wassalha" });
    await order("FOREIGN", storeOther, otherSellerId, { carrier: "wassalha" });
    await order("PASTE", storeA, sellerId, { carrier: "wassalha", tracking: "EGPASTE1" });
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    // Deleting the auth users cascades to everything they own (0134).
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerId}, ${otherSellerId}, ${customerId})`);
  }, 120_000);

  it("saves a number on an exported order of this store", async () => {
    const { applyWassalhaTracking } = await load();
    const result = await applyWassalhaTracking(sellerId, storeA, [entry("FRESH", "EGNEW00001")]);
    expect(result).toEqual({ saved: 1, unchanged: 0, problems: [] });
    expect(await trackingOf("FRESH")).toBe("EGNEW00001");
  });

  it("refuses the order numbers of the seller's other store and of another seller", async () => {
    const { applyWassalhaTracking } = await load();
    const result = await applyWassalhaTracking(sellerId, storeA, [entry("STOREB", "EGX00001"), entry("FOREIGN", "EGX00002"), entry("NOSUCH", "EGX00003")]);
    expect(result.saved).toBe(0);
    expect(result.problems.map((p) => p.reason)).toEqual(["not_found", "not_found", "not_found"]);
    expect(await trackingOf("STOREB")).toBeNull();
    expect(await trackingOf("FOREIGN")).toBeNull();
  });

  it("refuses a store that isn't the seller's, even with its own order number", async () => {
    const { applyWassalhaTracking } = await load();
    const result = await applyWassalhaTracking(sellerId, storeOther, [entry("FOREIGN", "EGX00004")]);
    expect(result.problems.map((p) => p.reason)).toEqual(["not_found"]);
    expect(await trackingOf("FOREIGN")).toBeNull();
  });

  it("tells apart orders that weren't exported and orders with another carrier", async () => {
    const { applyWassalhaTracking } = await load();
    const result = await applyWassalhaTracking(sellerId, storeA, [entry("NOTSENT", "EGX00005"), entry("OWNSHIP", "EGX00006"), entry("BOSTA", "EGX00007")]);
    expect(result.saved).toBe(0);
    expect(result.problems.map((p) => p.reason)).toEqual(["not_exported", "not_exported", "other_carrier"]);
    expect(await trackingOf("BOSTA")).toBe("B123456");
  });

  it("leaves the same number alone and never overwrites a different one from a file", async () => {
    const { applyWassalhaTracking } = await load();
    const result = await applyWassalhaTracking(sellerId, storeA, [entry("AGAIN", "egsame1"), entry("OTHERNUM", "EGNEW00002")]);
    expect(result).toMatchObject({ saved: 0, unchanged: 1 });
    expect(result.problems.map((p) => p.reason)).toEqual(["has_other_number"]);
    expect(await trackingOf("OTHERNUM")).toBe("EGOLD1");
  });

  it("refuses a number already on another order of the seller, even in another store", async () => {
    const { applyWassalhaTracking } = await load();
    const result = await applyWassalhaTracking(sellerId, storeA, [entry("USES", "egheld1")]);
    expect(result.problems.map((p) => p.reason)).toEqual(["tracking_in_use"]);
    expect(await trackingOf("USES")).toBeNull();
  });

  it("lets the seller correct one order's number", async () => {
    const { applyWassalhaTracking } = await load();
    const result = await applyWassalhaTracking(sellerId, storeA, [entry("PASTE", "EGFIXED1")], { replace: true });
    expect(result).toEqual({ saved: 1, unchanged: 0, problems: [] });
    expect(await trackingOf("PASTE")).toBe("EGFIXED1");
  });
});
