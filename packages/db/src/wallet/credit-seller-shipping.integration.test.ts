import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "../drizzle/schema";
import * as DB_RELATIONS from "../drizzle/relations";
import { creditSellerOnDelivery } from "./credit-seller-on-delivery";
import { getStoreWalletSummary } from "./store-wallet";

const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

/**
 * Store wallet (PLAN.md §11.10, §13.4, P6-05) against a real Postgres with
 * 0060/0061 applied (the staging copy). Skipped when TEST_DATABASE_URL is
 * unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store shipping credit (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 6 });
  const db = drizzle(client, { schema });
  const s = DB_SCHEMA;
  const tag = randomUUID().slice(0, 8);
  const buyer = randomUUID();
  const sellerIds: string[] = [];
  const orderIds: string[] = [];
  let categoryId: string;

  async function newSeller() {
    const id = randomUUID();
    sellerIds.push(id);
    const sub = `ss-${tag}-${sellerIds.length}`;
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    await db.insert(s.sellers).values({
      id,
      businessName: sub,
      displayName: sub,
      slug: sub,
      subdomain: sub,
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "sw@example.com",
      status: "approved",
    });
    const [store] = await db.select({ id: s.stores.id }).from(s.stores).where(eq(s.stores.sellerId, id));
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: id, categoryId, status: "active", quantity: "10", sku: `ss-${tag}-${sellerIds.length}` })
      .returning({ id: s.products.id });
    return { id, storeId: store!.id, productId: product!.id };
  }

  /** A delivered order. `lines`: [seller, total, fee]; `snapshot` false = a pre-P6-04 order. */
  async function deliveredOrder(opts: {
    lines: Array<[{ id: string; productId: string }, string, string]>;
    paymentMethod?: string;
    storeId?: string;
    shipmentSellerId?: string | null;
    snapshot?: boolean;
    metadata?: Record<string, unknown>;
  }) {
    const [order] = await db
      .insert(s.orders)
      .values({
        orderNumber: `SS-${tag}-${orderIds.length}`,
        userId: buyer,
        subtotal: "0",
        totalAmount: "0",
        status: "delivered",
        paymentMethod: opts.paymentMethod ?? "cash_on_delivery",
        storeId: opts.storeId ?? null,
        metadata: opts.metadata ?? null,
      } as typeof s.orders.$inferInsert)
      .returning({ id: s.orders.id });
    orderIds.push(order!.id);
    await db.insert(s.orderItems).values(
      opts.lines.map(([seller, total, fee]) => ({
        orderId: order!.id,
        productId: seller.productId,
        sellerId: seller.id,
        sku: "sku",
        productName: "Item",
        price: total,
        quantity: 1,
        subtotal: total,
        total,
        commissionAmount: fee,
        commissionRate: 0.02,
        sellerEarning: (Number(total) - Number(fee)).toFixed(2),
        status: "delivered" as const,
        metadata: opts.snapshot === false ? null : { platformFee: { feePiastres: Math.round(Number(fee) * 100) } },
      }))
    );
    if (opts.shipmentSellerId !== undefined) {
      await db.insert(s.shipments).values({
        orderId: order!.id,
        sellerId: opts.shipmentSellerId,
        status: "delivered",
      });
    }
    return order!.id;
  }

  const entries = (sellerId: string) =>
    db
      .select({
        type: s.walletTransactions.type,
        amount: s.walletTransactions.amount,
        storeId: s.walletTransactions.storeId,
        before: s.walletTransactions.balanceBefore,
        after: s.walletTransactions.balanceAfter,
      })
      .from(s.walletTransactions)
      .where(eq(s.walletTransactions.sellerId, sellerId))
      .orderBy(s.walletTransactions.createdAt);

  async function balance(sellerId: string) {
    const summary = await getStoreWalletSummary(db, sellerId);
    const [mirror] = await db.select({ b: s.sellers.walletBalance }).from(s.sellers).where(eq(s.sellers.id, sellerId));
    expect(summary?.ledgerTotal).toBe(summary?.balance);
    expect(mirror?.b).toBe(summary?.balance);
    return summary?.balance;
  }

  beforeAll(async () => {
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    categoryId = category!.id;
    await db.insert(s.users).values({ id: buyer, isGuest: false, role: "customer" });
  });

  afterAll(async () => {
    if (orderIds.length) {
      await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, orderIds));
      await db.delete(s.shipments).where(inArray(s.shipments.orderId, orderIds));
    }
    // Deleting the seller accounts cascades their ledger (the one allowed delete).
    if (sellerIds.length) {
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, sellerIds));
      await db.delete(s.users).where(inArray(s.users.id, sellerIds));
    }
    if (orderIds.length) await db.delete(s.orders).where(inArray(s.orders.id, orderIds));
    await db.delete(s.users).where(eq(s.users.id, buyer));
    await client.end();
  });


  const own = (billedPiastres: unknown, collector: unknown = "tallaby", withCollector = true) => ({
    storeShipping: {
      method: "own",
      pricedBy: "zone",
      place: "x",
      billedPiastres,
      ...(withCollector ? { collector } : {}),
    },
  });
  const run = async (orderId: string) => {
    await db.transaction((tx) => creditSellerOnDelivery(tx, orderId));
    await db.transaction((tx) => creditSellerOnDelivery(tx, orderId));
  };

  it("credits billed shipping in the sale, once, with the fee unchanged", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({
      lines: [[a, "300.00", "6.00"]],
      paymentMethod: "online_payment",
      storeId: a.storeId,
      metadata: own(5500),
    });
    await run(orderId);
    const e = await entries(a.id);
    expect(e.map((x) => `${x.type}:${x.amount}`)).toEqual(["sale:355.00", "fee:-6.00"]);
    const [sale] = await db
      .select({ m: s.walletTransactions.metadata })
      .from(s.walletTransactions)
      .where(and(eq(s.walletTransactions.orderId, orderId), eq(s.walletTransactions.type, "sale")));
    expect(sale?.m).toMatchObject({ shippingPiastres: 5500, collectedBy: "tallaby" });
    expect(await balance(a.id)).toBe("349.00");
  });

  it("snapshot collector 'seller' credits goods only (seller already holds the shipping)", async () => {
    const a = await newSeller();
    // A seller receiving method (InstaPay) with no shipment row resolves the
    // party to tallaby; the snapshot collector still keeps shipping out.
    const orderId = await deliveredOrder({
      lines: [[a, "300.00", "6.00"]],
      paymentMethod: "instapay",
      storeId: a.storeId,
      metadata: own(5500, "seller"),
    });
    await run(orderId);
    expect((await entries(a.id)).map((x) => `${x.type}:${x.amount}`)).toEqual(["sale:300.00", "fee:-6.00"]);
    expect(await balance(a.id)).toBe("294.00");
  });

  it("COD delivered without a seller shipment row and collector 'seller' credits goods only", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({
      lines: [[a, "200.00", "4.00"]],
      storeId: a.storeId,
      metadata: own(3000, "seller"),
    });
    await run(orderId);
    expect((await entries(a.id)).map((x) => `${x.type}:${x.amount}`)).toEqual(["sale:200.00", "fee:-4.00"]);
    expect(await balance(a.id)).toBe("196.00");
  });

  it("snapshot without a collector credits goods only", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({
      lines: [[a, "300.00", "6.00"]],
      paymentMethod: "online_payment",
      storeId: a.storeId,
      metadata: own(5500, undefined, false),
    });
    await run(orderId);
    expect((await entries(a.id)).map((x) => `${x.type}:${x.amount}`)).toEqual(["sale:300.00", "fee:-6.00"]);
    expect(await balance(a.id)).toBe("294.00");
  });

  it("seller's own COD delivery posts no sale, only the fee", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({
      lines: [[a, "300.00", "6.00"]],
      storeId: a.storeId,
      shipmentSellerId: a.id,
      metadata: own(5500),
    });
    await run(orderId);
    expect((await entries(a.id)).map((x) => `${x.type}:${x.amount}`)).toEqual(["fee:-6.00"]);
    expect(await balance(a.id)).toBe("-6.00");
  });

  it("zero, missing, malformed or non-own snapshots add no shipping", async () => {
    const a = await newSeller();
    const bad: Array<Record<string, unknown> | null> = [
      own(0),
      own(-100),
      own(12.5),
      own("5500"),
      { storeShipping: { method: "tallaby", billedPiastres: 5500 } },
      { storeShipping: "nope" },
      null,
    ];
    for (const metadata of bad) {
      const orderId = await deliveredOrder({
        lines: [[a, "100.00", "2.00"]],
        paymentMethod: "online_payment",
        storeId: a.storeId,
        metadata: metadata ?? undefined,
      });
      await run(orderId);
    }
    const sales = (await entries(a.id)).filter((x) => x.type === "sale");
    expect(sales).toHaveLength(bad.length);
    expect(sales.every((x) => x.amount === "100.00")).toBe(true);
    await balance(a.id);
  });

  it("marketplace order without a store gets no shipping, even with a snapshot", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({ lines: [[a, "100.00", "2.00"]], paymentMethod: "online_payment", metadata: own(5500) });
    await run(orderId);
    expect((await entries(a.id)).map((x) => `${x.type}:${x.amount}`)).toEqual(["sale:100.00", "fee:-2.00"]);
    expect(await balance(a.id)).toBe("98.00");
  });

  it("another seller's line on a store order gets no shipping", async () => {
    const a = await newSeller();
    const b = await newSeller();
    const orderId = await deliveredOrder({
      lines: [[a, "100.00", "2.00"], [b, "40.00", "1.00"]],
      paymentMethod: "online_payment",
      storeId: a.storeId,
      metadata: own(2000),
    });
    await run(orderId);
    expect((await entries(a.id))[0]).toMatchObject({ type: "sale", amount: "120.00" });
    expect((await entries(b.id))[0]).toMatchObject({ type: "sale", amount: "40.00" });
    expect(await balance(a.id)).toBe("118.00");
    expect(await balance(b.id)).toBe("39.00");
  });
});
