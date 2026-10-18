import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { MAX_OPEN_MANUAL_TOP_UPS } from "./top-up.lib";

/**
 * Manual top-ups (Vodafone Cash / InstaPay + receipt) against the staging copy:
 * submitting credits nothing, only an admin approval does, exactly once.
 * Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("manual store top-ups (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const sellerId = randomUUID();
  const otherSeller = randomUUID();
  const adminId = randomUUID();
  let submit: typeof import("./manual-top-up.server").submitManualStoreTopUp;
  let review: typeof import("../admin/top-ups.server").reviewManualStoreTopUp;

  const proof = (seller = sellerId) => `${seller}/${randomUUID()}.jpg`;
  const balance = async () =>
    (await db.select({ b: s.sellerWallet.balance }).from(s.sellerWallet).where(eq(s.sellerWallet.sellerId, sellerId)))[0]?.b ?? "0";
  const row = async (id: string) =>
    (await db.select().from(s.sellerWalletTopUps).where(eq(s.sellerWalletTopUps.id, id)))[0]!;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ({ submitManualStoreTopUp: submit } = await import("./manual-top-up.server"));
    ({ reviewManualStoreTopUp: review } = await import("../admin/top-ups.server"));
    await db.insert(s.users).values([
      { id: sellerId, isGuest: false, role: "seller" },
      { id: otherSeller, isGuest: false, role: "seller" },
      { id: adminId, isGuest: false, role: "admin", isVerified: true },
    ]);
    await db.insert(s.sellers).values(
      [sellerId, otherSeller].map((id) => {
        const sub = `mt-${id.slice(0, 8)}`;
        return {
          id,
          businessName: sub,
          displayName: sub,
          slug: sub,
          subdomain: sub,
          businessType: "individual",
          legalAddress: { country: "EG" },
          supportEmail: "mt@example.com",
          status: "approved" as const,
        };
      }),
    );
  });

  afterAll(async () => {
    await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, [sellerId, otherSeller]));
    await db.delete(s.users).where(inArray(s.users.id, [sellerId, otherSeller, adminId]));
    await client.end();
  });

  it("records a pending request and credits nothing", async () => {
    const result = await submit(
      { sellerId, actorId: sellerId, data: { method: "vodafone_cash", amount: "250", proofPath: proof(), senderPhone: "01012345678" } },
      db,
    );
    expect(result).toMatchObject({ success: true, amount: "250.00" });
    if (!result.success) return;
    expect(await row(result.topUpId)).toMatchObject({ status: "pending", provider: "vodafone_cash", amount: "250.00" });
    expect(await balance()).toBe("0");
  });

  it("refuses another seller's receipt, a reused receipt and amounts under EGP 100", async () => {
    const data = { method: "instapay", amount: "100", proofPath: proof(otherSeller) };
    expect(await submit({ sellerId, actorId: sellerId, data }, db)).toEqual({ success: false, error: "invalid_proof" });
    const path = proof();
    expect((await submit({ sellerId, actorId: sellerId, data: { ...data, proofPath: path } }, db)).success).toBe(true);
    expect(await submit({ sellerId, actorId: sellerId, data: { ...data, proofPath: path } }, db)).toEqual({
      success: false,
      error: "invalid_proof",
    });
    expect(await submit({ sellerId, actorId: sellerId, data: { ...data, amount: "99", proofPath: proof() } }, db)).toEqual({
      success: false,
      error: "too_small",
    });
  });

  it(`caps open requests at ${MAX_OPEN_MANUAL_TOP_UPS}`, async () => {
    const data = () => ({ method: "instapay", amount: "100", proofPath: proof() });
    // Two are already open from the tests above.
    expect((await submit({ sellerId, actorId: sellerId, data: data() }, db)).success).toBe(true);
    expect(await submit({ sellerId, actorId: sellerId, data: data() }, db)).toEqual({ success: false, error: "too_many_open" });
  });

  it("only an admin approval credits the wallet, once, with an audit row", async () => {
    const [pending] = await db
      .select({ id: s.sellerWalletTopUps.id })
      .from(s.sellerWalletTopUps)
      .where(and(eq(s.sellerWalletTopUps.sellerId, sellerId), eq(s.sellerWalletTopUps.provider, "vodafone_cash")));
    const id = pending!.id;

    expect(await review(sellerId, { topUpId: id, decision: "approve" }, db)).toEqual({ success: false, error: "not_admin" });
    expect(await review(adminId, { topUpId: id, decision: "approve" }, db)).toEqual({
      success: true,
      data: { status: "approved", balanceAfter: "250.00" },
    });
    expect(await balance()).toBe("250.00");
    expect(await review(adminId, { topUpId: id, decision: "approve" }, db)).toEqual({ success: false, error: "already_reviewed" });
    expect(await balance()).toBe("250.00");
    expect(await row(id)).toMatchObject({ status: "succeeded" });

    const audit = await db
      .select()
      .from(s.adminAuditLog)
      .where(and(eq(s.adminAuditLog.sellerId, sellerId), eq(s.adminAuditLog.action, "approve_top_up")));
    expect(audit).toHaveLength(1);
  });

  it("rejecting needs a reason and credits nothing", async () => {
    const [pending] = await db
      .select({ id: s.sellerWalletTopUps.id })
      .from(s.sellerWalletTopUps)
      .where(and(eq(s.sellerWalletTopUps.sellerId, sellerId), eq(s.sellerWalletTopUps.status, "pending")));
    const id = pending!.id;
    expect(await review(adminId, { topUpId: id, decision: "reject" }, db)).toEqual({ success: false, error: "invalid_input" });
    expect(await review(adminId, { topUpId: id, decision: "reject", reason: "No transfer received" }, db)).toEqual({
      success: true,
      data: { status: "rejected" },
    });
    expect(await row(id)).toMatchObject({ status: "failed", failureReason: "No transfer received" });
    expect(await balance()).toBe("250.00");
  });
});
