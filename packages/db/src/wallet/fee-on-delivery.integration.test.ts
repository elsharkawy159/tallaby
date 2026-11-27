import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuthUsers } from "../testing/auth-users";
import * as DB_SCHEMA from "../drizzle/schema";
import * as DB_RELATIONS from "../drizzle/relations";
import { chargeOrderPlacementFee, creditSellerOnDelivery } from "./credit-seller-on-delivery";
import { chargeAgedOrderFees } from "./aged-order-fees";
import { FEE_ON_DELIVERY_SWITCH } from "./fee-switch";

const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

/**
 * Fee on delivery (owner, 2026-11-26; PLAN.md §13.3) against a real Postgres
 * (the staging copy). Skipped when TEST_DATABASE_URL is unset. The switch is
 * only ever turned on inside a transaction that is rolled back, so the shared
 * database never sees it on; every fee posted there rolls back with it. Test
 * orders are dated in 2100, so the 14-day job sees no real order.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

class Rollback extends Error {}

describe.skipIf(!TEST_DATABASE_URL)("fee on delivery (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema });
  const s = DB_SCHEMA;
  type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
  const tag = randomUUID().slice(0, 8);
  const buyer = randomUUID();
  const sellerIds: string[] = [];
  const orderIds: string[] = [];
  let categoryId: string;

  const SWITCHED_ON_AT = "2099-12-01T00:00:00Z";
  const NOW = new Date("2100-01-20T00:00:00Z");
  const OLD = "2100-01-01T00:00:00Z"; // 19 days before NOW
  const RECENT = "2100-01-15T00:00:00Z"; // 5 days before NOW

  async function newSeller() {
    const id = randomUUID();
    sellerIds.push(id);
    const sub = `fd-${tag}-${sellerIds.length}`;
    await createAuthUsers(id);
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await db.insert(s.sellers).values({
      id,
      businessName: sub,
      displayName: sub,
      slug: sub,
      subdomain: sub,
      supportEmail: "fd@example.com",
      status: "approved",
    });
    // A USD wallet, as every wallet is since the switch (0136).
    await db
      .insert(s.sellerWallet)
      .values({ sellerId: id, balance: "0", currency: "USD" })
      .onConflictDoUpdate({ target: s.sellerWallet.sellerId, set: { currency: "USD" } });
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: id, categoryId, status: "active", quantity: "10", sku: `fd-${tag}-${sellerIds.length}` })
      .returning({ id: s.products.id });
    return { id, productId: product!.id };
  }

  type Seller = Awaited<ReturnType<typeof newSeller>>;

  async function order(opts: {
    lines: Array<{ seller: Seller; status?: string; cents?: number }>;
    status?: string;
    createdAt?: string;
    metadata?: Record<string, unknown>;
    isTest?: boolean;
  }) {
    const [row] = await db
      .insert(s.orders)
      .values({
        orderNumber: `FD-${tag}-${orderIds.length}`,
        userId: buyer,
        subtotal: "0",
        totalAmount: "0",
        status: opts.status ?? "confirmed",
        paymentMethod: "cash_on_delivery",
        metadata: opts.metadata ?? null,
        isTest: opts.isTest ?? false,
        createdAt: opts.createdAt ?? OLD,
      } as typeof s.orders.$inferInsert)
      .returning({ id: s.orders.id });
    orderIds.push(row!.id);
    await db.insert(s.orderItems).values(
      opts.lines.map(({ seller, status, cents }) => ({
        orderId: row!.id,
        productId: seller.productId,
        sellerId: seller.id,
        sku: "sku",
        productName: "Item",
        price: "100.00",
        quantity: 1,
        subtotal: "100.00",
        total: "100.00",
        commissionAmount: "1.62",
        commissionRate: 0.0162,
        sellerEarning: "98.38",
        status: (status ?? opts.status ?? "confirmed") as "confirmed",
        metadata: { platformFee: { feeUsdCents: cents ?? 3, feePiastres: 162 } },
      }))
    );
    return row!.id;
  }

  const fees = (tx: Tx, sellerId: string, orderId?: string) =>
    tx
      .select({ amount: s.walletTransactions.amount, metadata: s.walletTransactions.metadata })
      .from(s.walletTransactions)
      .where(
        and(
          eq(s.walletTransactions.sellerId, sellerId),
          eq(s.walletTransactions.type, "fee"),
          ...(orderId ? [eq(s.walletTransactions.referenceId, orderId)] : [])
        )
      );

  /** Runs `fn` with the switch set as given, then rolls everything back. */
  async function withSwitch(on: boolean, fn: (tx: Tx) => Promise<void>) {
    await expect(
      db.transaction(async (tx) => {
        await tx.execute(sql`
          INSERT INTO platform_switches (key, enabled, changed_at)
          VALUES (${FEE_ON_DELIVERY_SWITCH}, ${on}, ${SWITCHED_ON_AT}::timestamptz)
          ON CONFLICT (key) DO UPDATE SET enabled = excluded.enabled, changed_at = excluded.changed_at
        `);
        await fn(tx);
        throw new Rollback();
      })
    ).rejects.toBeInstanceOf(Rollback);
  }

  async function deliver(tx: Tx, orderId: string, sellerId: string) {
    await tx
      .update(s.orderItems)
      .set({ status: "delivered" })
      .where(and(eq(s.orderItems.orderId, orderId), eq(s.orderItems.sellerId, sellerId)));
    await creditSellerOnDelivery(tx, orderId);
  }

  beforeAll(async () => {
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    categoryId = category!.id;
    await createAuthUsers(buyer);
    await db.insert(s.users).values({ id: buyer, isGuest: false, role: "customer" });
  });

  afterAll(async () => {
    if (orderIds.length) await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, orderIds));
    if (sellerIds.length) {
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, sellerIds));
      await db.delete(s.users).where(inArray(s.users.id, sellerIds));
    }
    if (orderIds.length) await db.delete(s.orders).where(inArray(s.orders.id, orderIds));
    await db.delete(s.users).where(eq(s.users.id, buyer));
    await client.end();
  });

  it("switch off: placement charges as today", async () => {
    const a = await newSeller();
    const id = await order({ lines: [{ seller: a }] });
    await withSwitch(false, async (tx) => {
      await chargeOrderPlacementFee(tx, id);
      expect(await fees(tx, a.id)).toEqual([expect.objectContaining({ metadata: { chargedAt: "placed" } })]);
    });
  });

  it("switch on: placement and a card payment charge nothing; delivery charges once", async () => {
    const a = await newSeller();
    const id = await order({ lines: [{ seller: a }] });
    await withSwitch(true, async (tx) => {
      await chargeOrderPlacementFee(tx, id); // checkout
      await chargeOrderPlacementFee(tx, id); // the card callback calls the same function
      expect(await fees(tx, a.id)).toEqual([]);
      await deliver(tx, id, a.id);
      await creditSellerOnDelivery(tx, id); // a second delivery event
      expect(await fees(tx, a.id)).toEqual([expect.objectContaining({ amount: "-0.03", metadata: { chargedAt: "delivered" } })]);
    });
  });

  it("a multi-seller order charges each seller on its own part's delivery", async () => {
    const a = await newSeller();
    const b = await newSeller();
    const id = await order({ lines: [{ seller: a }, { seller: b }], createdAt: RECENT });
    await withSwitch(true, async (tx) => {
      await deliver(tx, id, a.id);
      expect(await fees(tx, a.id)).toHaveLength(1);
      expect(await fees(tx, b.id)).toEqual([]);
      await deliver(tx, id, b.id);
      expect(await fees(tx, b.id)).toHaveLength(1);
      expect(await fees(tx, a.id)).toHaveLength(1);
    });
  });

  it("the 14-day job charges an open order once, idempotently, and skips everything that must not pay", async () => {
    const a = await newSeller();
    const b = await newSeller();
    const open = await order({ lines: [{ seller: a }] });
    const split = await order({ lines: [{ seller: a, status: "returned" }, { seller: b }] });
    const recent = await order({ lines: [{ seller: a }], createdAt: RECENT });
    const beforeSwitch = await order({ lines: [{ seller: a }], createdAt: "2099-11-20T00:00:00Z" });
    const cancelled = await order({ lines: [{ seller: a }], status: "cancelled" });
    const returned = await order({ lines: [{ seller: a, status: "returned" }], status: "out_for_delivery" });
    const held = await order({ lines: [{ seller: a }], metadata: { feeHolds: { [a.id]: ["junk_name"] } } });
    const testOrder = await order({ lines: [{ seller: a }], isTest: true });
    const proOrder = await order({ lines: [{ seller: b, cents: 0 }] });
    const unpaidCard = await order({ lines: [{ seller: a }], status: "payment_processing" });

    await withSwitch(true, async (tx) => {
      const first = await chargeAgedOrderFees(tx, { now: NOW });
      expect(first).toMatchObject({ switchOn: true, charged: 2, entries: 2, failed: 0 });
      expect(await fees(tx, a.id, open)).toEqual([expect.objectContaining({ metadata: { chargedAt: "aged" } })]);
      expect(await fees(tx, a.id, split)).toEqual([]); // a's part was returned
      expect(await fees(tx, b.id, split)).toHaveLength(1);
      for (const skipped of [recent, beforeSwitch, cancelled, returned, held, testOrder, unpaidCard]) {
        expect(await fees(tx, a.id, skipped)).toEqual([]);
      }
      expect(await fees(tx, b.id, proOrder)).toEqual([]);

      const second = await chargeAgedOrderFees(tx, { now: NOW });
      expect(second).toMatchObject({ scanned: 0, charged: 0 });
      expect(await fees(tx, a.id)).toHaveLength(1);

      // A held part still pays when it is delivered.
      await deliver(tx, held, a.id);
      expect(await fees(tx, a.id, held)).toEqual([expect.objectContaining({ metadata: { chargedAt: "delivered" } })]);
    });
  });

  it("the 14-day job does nothing while the switch is off", async () => {
    const a = await newSeller();
    await order({ lines: [{ seller: a }] });
    await withSwitch(false, async (tx) => {
      expect(await chargeAgedOrderFees(tx, { now: NOW })).toMatchObject({ switchOn: false, scanned: 0 });
      expect(await fees(tx, a.id)).toEqual([]);
    });
  });
});
