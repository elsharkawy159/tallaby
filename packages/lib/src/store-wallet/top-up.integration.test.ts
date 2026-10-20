import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";

/**
 * Kashier store-wallet top-up webhook (PLAN.md P6-10) against a Postgres with
 * 0060 applied (the staging copy). Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

type Apply = typeof import("./top-up.server").applyStoreTopUpWebhook;

describe.skipIf(!TEST_DATABASE_URL)("store top-up webhook (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const sellerId = randomUUID();
  let apply: Apply;

  async function topUp(amount = "100.00") {
    const [row] = await db
      .insert(s.sellerWalletTopUps)
      .values({ sellerId, amount, provider: "kashier", status: "pending" })
      .returning({ id: s.sellerWalletTopUps.id });
    return row!.id;
  }

  const status = async (id: string) =>
    (await db.select().from(s.sellerWalletTopUps).where(eq(s.sellerWalletTopUps.id, id)))[0]!;
  const balance = async () =>
    (await db.select({ b: s.sellerWallet.balance }).from(s.sellerWallet).where(eq(s.sellerWallet.sellerId, sellerId)))[0]?.b ?? "0";

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ({ applyStoreTopUpWebhook: apply } = await import("./top-up.server"));
    const sub = `tu-${sellerId.slice(0, 8)}`;
    await db.insert(s.users).values({ id: sellerId, isGuest: false, role: "seller" });
    await db.insert(s.sellers).values({
      id: sellerId,
      businessName: sub,
      displayName: sub,
      slug: sub,
      subdomain: sub,
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "tu@example.com",
      status: "approved",
    });
  });

  afterAll(async () => {
    await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, [sellerId]));
    await db.delete(s.users).where(eq(s.users.id, sellerId));
    await client.end();
  });

  it("a paid top-up credits once, however often Kashier repeats it", async () => {
    const id = await topUp("150.00");
    const event = { topUpId: id, status: "SUCCESS", amount: 150, currency: "EGP", transactionId: "tx-1" };
    const outcomes = await Promise.all([apply(event), apply(event), apply(event)]);
    expect(outcomes.filter((o) => o === "credited")).toHaveLength(1);
    expect(outcomes.filter((o) => o === "duplicate")).toHaveLength(2);
    expect(await apply(event)).toBe("duplicate");
    expect(await status(id)).toMatchObject({ status: "succeeded", providerTransactionId: "tx-1" });
    expect((await status(id)).transactionId).not.toBeNull();
    expect(await balance()).toBe("150.00");
  });

  it("an amount mismatch fails the top-up and credits nothing", async () => {
    const id = await topUp("200.00");
    expect(await apply({ topUpId: id, status: "SUCCESS", amount: "20.00", currency: "EGP", transactionId: "tx-2" })).toBe("failed");
    expect((await status(id)).status).toBe("failed");
    expect((await status(id)).failureReason).toContain("amount_mismatch");
    expect(await apply({ topUpId: id, status: "SUCCESS", amount: "200.00", currency: "EGP", transactionId: "tx-2b" })).toBe("duplicate");
    expect(await balance()).toBe("150.00");
  });

  it("a wrong currency is a mismatch too", async () => {
    const id = await topUp("100.00");
    expect(await apply({ topUpId: id, status: "SUCCESS", amount: "100.00", currency: "USD", transactionId: "tx-3" })).toBe("failed");
    expect(await balance()).toBe("150.00");
  });

  it("pending then success credits; failure credits nothing", async () => {
    const ok = await topUp("50.00");
    expect(await apply({ topUpId: ok, status: "PENDING", amount: "50.00", currency: "EGP", transactionId: "tx-4" })).toBe("processing");
    expect((await status(ok)).status).toBe("processing");
    expect(await apply({ topUpId: ok, status: "SUCCESS", amount: "50.00", currency: "EGP", transactionId: "tx-4" })).toBe("credited");

    const bad = await topUp("75.00");
    expect(await apply({ topUpId: bad, status: "FAILURE", amount: "75.00", currency: "EGP", transactionId: "tx-5" })).toBe("failed");
    expect(await balance()).toBe("200.00");
  });

  it("an unknown top-up id is ignored", async () => {
    expect(await apply({ topUpId: randomUUID(), status: "SUCCESS", amount: "1.00", currency: "EGP", transactionId: "tx-6" })).toBe("ignored");
  });
});
