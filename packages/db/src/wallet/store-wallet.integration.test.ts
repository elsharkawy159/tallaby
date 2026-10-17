import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "../drizzle/schema";
import * as DB_RELATIONS from "../drizzle/relations";
import { creditSellerOnDelivery } from "./credit-seller-on-delivery";
import {
  DuplicateStoreWalletEntryError,
  InvalidStoreWalletEntryError,
  StoreWalletLimitError,
  StoreWalletNotActiveError,
  getStoreWalletSummary,
  postStoreWalletEntry,
} from "./store-wallet";

const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

/**
 * Store wallet (PLAN.md §11.10, §13.4, P6-05) against a real Postgres with
 * 0060/0061 applied (the staging copy). Skipped when TEST_DATABASE_URL is
 * unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store wallet (integration)", { timeout: 60_000 }, () => {
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
    const sub = `sw-${tag}-${sellerIds.length}`;
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
      .values({ sellerId: id, categoryId, status: "active", quantity: "10", sku: `sw-${tag}-${sellerIds.length}` })
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
        orderNumber: `SW-${tag}-${orderIds.length}`,
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

  it("Tallaby-collected delivery posts a gross sale and the fee, once", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({ lines: [[a, "300.00", "6.00"], [a, "50.00", "1.00"]], paymentMethod: "online_payment" });

    await db.transaction((tx) => creditSellerOnDelivery(tx, orderId));
    await db.transaction((tx) => creditSellerOnDelivery(tx, orderId));

    expect(await entries(a.id)).toEqual([
      expect.objectContaining({ type: "sale", amount: "350.00", before: "0.00", after: "350.00" }),
      expect.objectContaining({ type: "fee", amount: "-7.00", before: "350.00", after: "343.00" }),
    ]);
    expect(await balance(a.id)).toBe("343.00");
  });

  it("concurrent deliveries post each entry exactly once", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({ lines: [[a, "1000.00", "20.00"]], paymentMethod: "online_payment" });
    await Promise.all(Array.from({ length: 5 }, () => db.transaction((tx) => creditSellerOnDelivery(tx, orderId))));
    expect((await entries(a.id)).map((e) => e.type)).toEqual(["sale", "fee"]);
    expect(await balance(a.id)).toBe("980.00");
  });

  it("seller-collected cash posts only the fee, and the wallet may go negative", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({ lines: [[a, "200.00", "5.00"]], shipmentSellerId: a.id, storeId: a.storeId });
    await db.transaction((tx) => creditSellerOnDelivery(tx, orderId));
    expect(await entries(a.id)).toEqual([expect.objectContaining({ type: "fee", amount: "-5.00", storeId: a.storeId })]);
    expect(await balance(a.id)).toBe("-5.00");
  });

  it("COD delivered by a Tallaby rider is Tallaby-collected; paymentCollector=seller is fee-only", async () => {
    const a = await newSeller();
    const tallabyRider = await deliveredOrder({ lines: [[a, "100.00", "5.00"]], shipmentSellerId: null });
    const sellerMethod = await deliveredOrder({
      lines: [[a, "100.00", "5.00"]],
      paymentMethod: "vodafone_cash",
      metadata: { paymentCollector: "seller" },
    });
    await db.transaction((tx) => creditSellerOnDelivery(tx, tallabyRider));
    await db.transaction((tx) => creditSellerOnDelivery(tx, sellerMethod));
    expect((await entries(a.id)).map((e) => `${e.type}:${e.amount}`)).toEqual(["sale:100.00", "fee:-5.00", "fee:-5.00"]);
    expect(await balance(a.id)).toBe("90.00");
  });

  it("each seller of a marketplace order gets its own entries and no store id", async () => {
    const a = await newSeller();
    const b = await newSeller();
    const orderId = await deliveredOrder({ lines: [[a, "100.00", "5.00"], [b, "500.00", "10.00"]], paymentMethod: "online_payment" });
    await db.transaction((tx) => creditSellerOnDelivery(tx, orderId));
    expect(await balance(a.id)).toBe("95.00");
    expect(await balance(b.id)).toBe("490.00");
    expect((await entries(b.id)).every((e) => e.storeId === null)).toBe(true);
  });

  it("orders without a fee snapshot keep the legacy single net sale", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({ lines: [[a, "100.00", "5.00"]], snapshot: false });
    await db.transaction((tx) => creditSellerOnDelivery(tx, orderId));
    await db.transaction((tx) => creditSellerOnDelivery(tx, orderId));
    expect(await entries(a.id)).toEqual([expect.objectContaining({ type: "sale", amount: "95.00" })]);
  });

  it("never posts over a legacy sale row written before the store wallet", async () => {
    const a = await newSeller();
    const orderId = await deliveredOrder({ lines: [[a, "100.00", "2.00"]], paymentMethod: "online_payment" });
    await db.insert(s.walletTransactions).values({ sellerId: a.id, type: "sale", amount: "98.00", orderId });
    await db.transaction((tx) => creditSellerOnDelivery(tx, orderId));
    expect((await entries(a.id)).map((e) => e.type)).toEqual(["sale"]);
  });

  it("a replayed reference changes nothing and leaves the caller's transaction usable", async () => {
    const a = await newSeller();
    const entry = {
      sellerId: a.id,
      type: "top_up" as const,
      amount: "50.00",
      referenceType: "top_up" as const,
      referenceId: randomUUID(),
      description: "Top-up",
    };
    await db.transaction((tx) => postStoreWalletEntry(tx, entry));
    await db.transaction(async (tx) => {
      await expect(postStoreWalletEntry(tx, entry)).rejects.toBeInstanceOf(DuplicateStoreWalletEntryError);
      await tx.execute(sql`SELECT 1`);
    });
    expect(await balance(a.id)).toBe("50.00");
  });

  it("validates amounts and directions", async () => {
    const a = await newSeller();
    const base = { sellerId: a.id, referenceType: "admin" as const, referenceId: randomUUID(), description: "x" };
    await db.transaction(async (tx) => {
      for (const bad of [
        { ...base, type: "fee" as const, amount: "5.00" },
        { ...base, type: "sale" as const, amount: "-5.00" },
        { ...base, type: "adjustment" as const, amount: "0.00" },
        { ...base, type: "adjustment" as const, amount: "1.234" },
        { ...base, type: "adjustment" as const, amount: "abc" },
      ]) {
        await expect(postStoreWalletEntry(tx, bad)).rejects.toBeInstanceOf(InvalidStoreWalletEntryError);
      }
    });
  });

  it("optional purchases respect the negative limit; fees ignore it; frozen wallets refuse", async () => {
    const a = await newSeller();
    await db.transaction((tx) =>
      postStoreWalletEntry(tx, { sellerId: a.id, type: "top_up", amount: "10.00", referenceType: "top_up", referenceId: randomUUID(), description: "t" })
    );
    await db.update(s.sellerWallet).set({ negativeLimit: "20.00" }).where(eq(s.sellerWallet.sellerId, a.id));
    const charge = (amount: string, enforce: boolean, type: "service_charge" | "fee" = "service_charge") =>
      db.transaction((tx) =>
        postStoreWalletEntry(tx, {
          sellerId: a.id,
          type,
          amount,
          referenceType: "ad_request",
          referenceId: randomUUID(),
          description: "c",
          enforceNegativeLimit: enforce,
        })
      );
    await db.update(s.sellerWallet).set({ negativeLimit: null }).where(eq(s.sellerWallet.sellerId, a.id));
    await expect(charge("-10.01", true)).rejects.toBeInstanceOf(StoreWalletLimitError); // no limit set = no overdraft
    await db.update(s.sellerWallet).set({ negativeLimit: "20.00" }).where(eq(s.sellerWallet.sellerId, a.id));
    await charge("-30.00", true); // 10 - 30 = -20, at the limit
    await expect(charge("-0.01", true)).rejects.toBeInstanceOf(StoreWalletLimitError);
    await charge("-100.00", false, "fee");
    expect(await balance(a.id)).toBe("-120.00");

    await db.update(s.sellerWallet).set({ status: "frozen" }).where(eq(s.sellerWallet.sellerId, a.id));
    await expect(charge("-1.00", false, "fee")).rejects.toBeInstanceOf(StoreWalletNotActiveError);
  });

  it("the ledger is append-only and entries cannot point at another seller's store", async () => {
    const a = await newSeller();
    const b = await newSeller();
    await db.transaction((tx) =>
      postStoreWalletEntry(tx, { sellerId: a.id, type: "top_up", amount: "5.00", referenceType: "top_up", referenceId: randomUUID(), description: "t" })
    );
    await expect(db.update(s.walletTransactions).set({ amount: "500.00" }).where(eq(s.walletTransactions.sellerId, a.id))).rejects.toThrow();
    await expect(db.delete(s.walletTransactions).where(eq(s.walletTransactions.sellerId, a.id))).rejects.toThrow();
    await expect(
      db.transaction((tx) =>
        postStoreWalletEntry(tx, {
          sellerId: a.id,
          storeId: b.storeId,
          type: "top_up",
          amount: "5.00",
          referenceType: "top_up",
          referenceId: randomUUID(),
          description: "t",
        })
      )
    ).rejects.toThrow();
    expect(await balance(a.id)).toBe("5.00");
  });
});
