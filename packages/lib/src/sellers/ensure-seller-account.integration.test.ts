import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { ensureSellerAccount } from "./ensure-seller-account";

/** Against the staging copy (migrations 0050+). Skipped without TEST_DATABASE_URL. */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("ensureSellerAccount (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 6 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;

  const u1 = randomUUID();
  const u2 = randomUUID();
  const u3 = randomUUID();
  const u4 = randomUUID();
  // Fresh users for the refusal tests: the race above makes u3 or u4 (randomly) a seller.
  const u5 = randomUUID();
  const u6 = randomUUID();
  const tag = u1.slice(0, 8);
  const users = [u1, u2, u3, u4, u5, u6];

  beforeAll(async () => {
    await db.insert(s.users).values(users.map((id) => ({ id, isGuest: false, role: "customer" as const })));
  });

  afterAll(async () => {
    await db.delete(s.users).where(inArray(s.users.id, users));
    await client.end();
  });

  it("creates the account and its primary store in one go", async () => {
    const result = await ensureSellerAccount(
      { userId: u1, email: "one@example.com", subdomain: `su-${tag}-one`, phone: "01012345678" },
      db,
    );
    expect(result).toMatchObject({ success: true, data: { created: true, sellerId: u1 } });
    const [seller] = await db.select().from(s.sellers).where(eq(s.sellers.id, u1));
    expect(seller).toMatchObject({
      slug: `su-${tag}-one`,
      subdomain: `su-${tag}-one`,
      displayName: `Su ${tag} One`.replace(/\b\w/g, (c) => c.toUpperCase()),
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "one@example.com",
      supportPhone: "01012345678",
      status: "approved",
      onboardingComplete: false,
      plan: "free",
      feePlan: "flat_5",
      feeTrialEligible: true,
      // 0067: the first store starts the 7-day trial at signup.
      feeTrialStartedAt: expect.any(String),
    });
    const stores = await db.select().from(s.stores).where(eq(s.stores.sellerId, u1));
    expect(stores).toEqual([expect.objectContaining({ isPrimary: true, subdomain: `su-${tag}-one`, status: "active" })]);
    const pages = await db.select().from(s.storePages).where(eq(s.storePages.storeId, stores[0]!.id));
    expect(pages).toHaveLength(1);
    const [user] = await db.select({ role: s.users.role }).from(s.users).where(eq(s.users.id, u1));
    expect(user!.role).toBe("seller");
  });

  it("is idempotent: a second call creates nothing and keeps the slug", async () => {
    const again = await ensureSellerAccount(
      { userId: u1, email: "one@example.com", subdomain: `su-${tag}-other`, phone: "01012345678" },
      db,
    );
    expect(again).toMatchObject({ success: true, data: { created: false, sellerId: u1 } });
    expect(await db.select().from(s.stores).where(eq(s.stores.sellerId, u1))).toHaveLength(1);
    const [seller] = await db.select({ slug: s.sellers.slug }).from(s.sellers).where(eq(s.sellers.id, u1));
    expect(seller!.slug).toBe(`su-${tag}-one`);
  });

  it("survives concurrent calls for the same user (one seller, one primary store)", async () => {
    const input = { userId: u2, email: "two@example.com", subdomain: `su-${tag}-two`, phone: "01112345678" };
    const results = await Promise.all([ensureSellerAccount(input, db), ensureSellerAccount(input, db)]);
    expect(results.every((r) => r.success)).toBe(true);
    expect(results.filter((r) => r.success && r.data.created)).toHaveLength(1);
    expect(await db.select().from(s.sellers).where(eq(s.sellers.id, u2))).toHaveLength(1);
    expect(await db.select().from(s.stores).where(eq(s.stores.sellerId, u2))).toHaveLength(1);
  });

  it("gives exactly one of two users racing for the same subdomain the store; the other gets taken", async () => {
    const sub = `su-${tag}-race`;
    const results = await Promise.all([
      ensureSellerAccount({ userId: u3, email: "three@example.com", subdomain: sub, phone: "01212345678" }, db),
      ensureSellerAccount({ userId: u4, email: "four@example.com", subdomain: sub, phone: "01512345678" }, db),
    ]);
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.find((r) => !r.success)).toEqual({ success: false, error: "taken" });
  });

  it("refuses a subdomain that is already used", async () => {
    const result = await ensureSellerAccount(
      { userId: u5, email: "five@example.com", subdomain: `su-${tag}-one`, phone: "01512345678" },
      db,
    );
    expect(result).toEqual({ success: false, error: "taken" });
  });

  it("validates input", async () => {
    expect(
      await ensureSellerAccount({ userId: u6, email: "six@example.com", subdomain: "admin", phone: "01512345678" }, db),
    ).toEqual({ success: false, error: "invalid_input" });
    expect(
      await ensureSellerAccount({ userId: u6, email: "six@example.com", subdomain: `su-${tag}-x`, phone: "123" }, db),
    ).toEqual({ success: false, error: "invalid_input" });
  });

  it("fails cleanly when the users row does not exist", async () => {
    const result = await ensureSellerAccount(
      { userId: randomUUID(), email: "ghost@example.com", subdomain: `su-${tag}-ghost`, phone: "01012345678" },
      db,
    );
    expect(result).toEqual({ success: false, error: "no_user" });
  });
});
