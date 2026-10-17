import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { StoreWalletLimitError, postStoreWalletEntry } from "@workspace/db/wallet";

/**
 * Ads paid from the store wallet (PLAN.md P6-11) against the staging copy.
 * Mirrors what the dashboard createAdRequest does in its transaction, then
 * the rejection refund. Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

type Refund = typeof import("./ads.server").refundRejectedWalletAdRequest;

describe.skipIf(!TEST_DATABASE_URL)("ads paid from the store wallet (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const sellerId = randomUUID();
  let productId: string;
  let refund: Refund;

  const balance = async () =>
    (await db.select({ b: s.sellerWallet.balance }).from(s.sellerWallet).where(eq(s.sellerWallet.sellerId, sellerId)))[0]?.b ?? "0";

  async function buyAd(price: string) {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .insert(s.adCampaignRequests)
        .values({ sellerId, productId, packageKey: "weekly_full", amount: price, paymentMethod: "wallet", payerPhone: "" })
        .returning({ id: s.adCampaignRequests.id });
      await postStoreWalletEntry(tx, {
        sellerId,
        type: "service_charge",
        amount: `-${price}`,
        referenceType: "ad_request",
        referenceId: row!.id,
        description: "Product ad",
        enforceNegativeLimit: true,
      });
      return row!.id;
    });
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ({ refundRejectedWalletAdRequest: refund } = await import("./ads.server"));
    const sub = `ad-${sellerId.slice(0, 8)}`;
    await db.insert(s.users).values({ id: sellerId, isGuest: false, role: "seller" });
    await db.insert(s.sellers).values({
      id: sellerId,
      businessName: sub,
      displayName: sub,
      slug: sub,
      subdomain: sub,
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "ad@example.com",
      status: "approved",
    });
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    const [product] = await db
      .insert(s.products)
      .values({ sellerId, categoryId: category!.id, status: "active", quantity: "1", sku: sub })
      .returning({ id: s.products.id });
    productId = product!.id;
    await db.transaction((tx) =>
      postStoreWalletEntry(tx, { sellerId, type: "top_up", amount: "500.00", referenceType: "top_up", referenceId: randomUUID(), description: "t" }),
    );
  });

  afterAll(async () => {
    await db.delete(s.adCampaignRequests).where(eq(s.adCampaignRequests.sellerId, sellerId));
    await db.delete(s.users).where(eq(s.users.id, sellerId));
    await client.end();
  });

  it("a wallet ad charges the price and cannot overdraw without a limit", async () => {
    const id = await buyAd("400.00");
    expect(await balance()).toBe("100.00");
    await db.update(s.adCampaignRequests).set({ status: "completed" }).where(eq(s.adCampaignRequests.id, id));
    // 100 - 400 < 0 and no negative_limit: refused, and the request rolls back with it.
    await expect(buyAd("400.00")).rejects.toBeInstanceOf(StoreWalletLimitError);
    expect(await balance()).toBe("100.00");
    expect(await db.select().from(s.adCampaignRequests).where(eq(s.adCampaignRequests.sellerId, sellerId))).toHaveLength(1);
  });

  it("a rejected wallet ad is refunded exactly once", async () => {
    const id = await buyAd("100.00");
    expect(await balance()).toBe("0.00");
    expect(await refund(id, null)).toBe("not_applicable"); // still pending
    await db.update(s.adCampaignRequests).set({ status: "rejected" }).where(eq(s.adCampaignRequests.id, id));
    expect(await refund(id, null)).toBe("refunded");
    expect(await refund(id, null)).toBe("already_refunded");
    expect(await balance()).toBe("100.00");
  });

  it("Vodafone Cash requests and unknown ids are not refunded to the wallet", async () => {
    const [vf] = await db
      .insert(s.adCampaignRequests)
      .values({ sellerId, productId, packageKey: "weekly_full", amount: "50.00", payerPhone: "01012345678", status: "rejected" })
      .returning({ id: s.adCampaignRequests.id });
    expect(await refund(vf!.id, null)).toBe("not_applicable");
    expect(await refund(randomUUID(), null)).toBe("not_applicable");
    expect(await balance()).toBe("100.00");
  });
});
