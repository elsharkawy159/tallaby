import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The USD switch and the money that follows it (ROADMAP.md F-56) against the
 * staging database. Each test runs inside one transaction that always rolls
 * back, so the switch never stays on. Runs only when TEST_DATABASE_URL is set
 * (it becomes DATABASE_URL for @workspace/db); never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

class Rollback extends Error {}

describe.skipIf(!TEST_DATABASE_URL)("USD switch (integration)", { timeout: 90_000 }, () => {
  const productId = randomUUID();
  let sellerId = "";
  let categoryId = "";

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("@workspace/db/wallet")),
  });

  /** Runs `fn` with the wallet at this EGP balance, then undoes everything. */
  async function inRollback(fn: (tx: any) => Promise<void>) {
    const { db } = await load();
    await db
      .transaction(async (tx) => {
        await fn(tx);
        throw new Rollback();
      })
      .catch((error: unknown) => {
        if (!(error instanceof Rollback)) throw error;
      });
  }

  async function orderWithSnapshot(tx: any, platformFee: Record<string, unknown>, commissionAmount: string) {
    const { orders, orderItems } = await load();
    const id = randomUUID();
    await tx.insert(orders).values({
      id,
      orderNumber: `QA-${id.slice(0, 8)}`,
      userId: sellerId,
      subtotal: "100.00",
      totalAmount: "100.00",
      status: "confirmed",
      paymentStatus: "pending",
      paymentMethod: "cash_on_delivery",
    });
    await tx.insert(orderItems).values({
      orderId: id,
      productId,
      sellerId,
      sku: "QA",
      productName: "QA",
      quantity: 1,
      price: "100.00",
      subtotal: "100.00",
      total: "100.00",
      commissionAmount,
      commissionRate: 0,
      sellerEarning: "95.00",
      status: "confirmed",
      metadata: { platformFee },
    });
    return id;
  }

  const walletOf = async (tx: any) => {
    const { sellerWallet, eq } = await load();
    const [row] = await tx.select().from(sellerWallet).where(eq(sellerWallet.sellerId, sellerId));
    return row;
  };
  const switchOn = async (tx: any, rate = 50) => {
    const { sql } = await load();
    await tx.execute(sql`SELECT * FROM billing_switch_to_usd(${rate})`);
  };
  const feesOn = async (tx: any, orderId: string) => {
    const { walletTransactions, eq, and } = await load();
    return tx
      .select({ amount: walletTransactions.amount, currency: walletTransactions.currency })
      .from(walletTransactions)
      .where(and(eq(walletTransactions.orderId, orderId), eq(walletTransactions.type, "fee")));
  };

  beforeAll(async () => {
    const { db, sellers, categories, products } = await load();
    sellerId = (await db.select({ id: sellers.id }).from(sellers).limit(1))[0]!.id;
    categoryId = (await db.select({ id: categories.id }).from(categories).limit(1))[0]!.id;
    await db.insert(products).values({ id: productId, sellerId, categoryId, status: "draft", quantity: "5", price: 100, images: [], sku: `QA-${productId.slice(0, 8)}` });
  }, 90_000);

  afterAll(async () => {
    const { db, products, eq } = await load();
    await db.delete(products).where(eq(products.id, productId));
  }, 90_000);

  it("converts the balance, with the ledger and mirror matching", async () => {
    const { postStoreWalletEntry, sellers, eq, sql } = await load();
    await inRollback(async (tx) => {
      const start = Number((await walletOf(tx))?.balance ?? 0);
      await postStoreWalletEntry(tx, {
        sellerId, type: "top_up", amount: "100.00", referenceType: "top_up", referenceId: randomUUID(), description: "QA",
      });
      const egp = start + 100;
      await switchOn(tx);
      const wallet = await walletOf(tx);
      expect(wallet.currency).toBe("USD");
      expect(Number(wallet.balance)).toBeCloseTo(Math.round((egp / 50) * 100) / 100, 2);
      const [seller] = await tx.select({ b: sellers.walletBalance }).from(sellers).where(eq(sellers.id, sellerId));
      expect(Number(seller.b)).toBe(Number(wallet.balance));
      const rows = await tx.execute(sql`
        SELECT currency, amount, balance_before, balance_after FROM wallet_transactions
        WHERE seller_id = ${sellerId} AND reference_type = 'usd_conversion' ORDER BY currency`);
      expect(rows.map((r: any) => r.currency)).toEqual(["EGP", "USD"]);
      expect(Number(rows[0].balance_after)).toBe(0);
      expect(Number(rows[1].balance_after)).toBe(Number(wallet.balance));
    });
  });

  it("charges 3 cents to a USD wallet from the snapshot", async () => {
    const { chargeOrderPlacementFee } = await load();
    await inRollback(async (tx) => {
      await switchOn(tx);
      const before = Number((await walletOf(tx)).balance);
      const orderId = await orderWithSnapshot(tx, { feeUsdCents: 3, rate: 50, feePiastres: 150 }, "1.50");
      await chargeOrderPlacementFee(tx, orderId);
      const fees = await feesOn(tx, orderId);
      expect(fees).toHaveLength(1);
      expect(Number(fees[0].amount)).toBe(-0.03);
      expect(fees[0].currency).toBe("USD");
      expect(Number((await walletOf(tx)).balance)).toBeCloseTo(before - 0.03, 2);
      await chargeOrderPlacementFee(tx, orderId);
      expect(await feesOn(tx, orderId)).toHaveLength(1);
    });
  });

  it("charges nothing for Pro's zero fee", async () => {
    const { chargeOrderPlacementFee } = await load();
    await inRollback(async (tx) => {
      await switchOn(tx);
      const orderId = await orderWithSnapshot(tx, { feeUsdCents: 0, rate: 50, pro: true, feePiastres: 0 }, "0.00");
      await chargeOrderPlacementFee(tx, orderId);
      expect(await feesOn(tx, orderId)).toHaveLength(0);
    });
  });

  it("cancels an old EGP 5 fee that wasn't charged before the switch", async () => {
    const { creditSellerOnDelivery, orderItems, eq } = await load();
    await inRollback(async (tx) => {
      const orderId = await orderWithSnapshot(tx, { feePiastres: 500, plan: "flat_5" }, "5.00");
      await switchOn(tx);
      await tx.update(orderItems).set({ status: "delivered" }).where(eq(orderItems.orderId, orderId));
      await creditSellerOnDelivery(tx, orderId);
      expect(await feesOn(tx, orderId)).toHaveLength(0);
    });
  });

  it("still charges EGP 5 before the switch", async () => {
    const { chargeOrderPlacementFee } = await load();
    await inRollback(async (tx) => {
      const orderId = await orderWithSnapshot(tx, { feePiastres: 500, plan: "flat_5" }, "5.00");
      await chargeOrderPlacementFee(tx, orderId);
      const fees = await feesOn(tx, orderId);
      expect(Number(fees[0].amount)).toBe(-5);
      expect(fees[0].currency).toBe("EGP");
    });
  });

  it("refuses an amount priced in the wrong currency, and leaves the balance alone", async () => {
    const { postStoreWalletEntry, StoreWalletCurrencyError } = await load();
    await inRollback(async (tx) => {
      await switchOn(tx);
      const before = (await walletOf(tx)).balance;
      await expect(
        postStoreWalletEntry(tx, {
          sellerId, type: "top_up", amount: "100.00", currency: "EGP",
          referenceType: "top_up", referenceId: randomUUID(), description: "QA",
        }),
      ).rejects.toBeInstanceOf(StoreWalletCurrencyError);
      expect((await walletOf(tx)).balance).toBe(before);
    });
  });

  it("gives a new wallet USD after the switch, and refuses a second switch", async () => {
    const { sql } = await load();
    await inRollback(async (tx) => {
      await switchOn(tx);
      const [row] = await tx.execute(sql`SELECT billing_wallet_currency() AS c`);
      expect(row.c).toBe("USD");
      await expect(
        tx.transaction((sp: any) => sp.execute(sql`SELECT * FROM billing_switch_to_usd(50)`)),
      ).rejects.toThrow();
    });
  });

  it("is still off after all of this", async () => {
    const { db, billingSettings } = await load();
    const [row] = await db.select({ live: billingSettings.usdLive }).from(billingSettings);
    expect(row!.live).toBe(false);
  });
});
