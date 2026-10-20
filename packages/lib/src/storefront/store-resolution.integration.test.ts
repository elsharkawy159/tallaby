import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createStore } from "../stores/server";
import { findActiveCustomDomainForSubdomain, findSubdomainForCustomDomain } from "./custom-domains.server";

/**
 * Host → store resolution for custom domains (PLAN.md P5-00). Against the
 * staging copy; skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("custom domain → store (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 2 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const sellerId = randomUUID();
  const tag = sellerId.slice(0, 8);
  const domain = `res-${tag}.example`;
  let secondStore: string;

  beforeAll(async () => {
    await db.insert(s.users).values({ id: sellerId, isGuest: false, role: "seller" });
    await db.insert(s.sellers).values({
      id: sellerId,
      businessName: "Res",
      displayName: "Res",
      slug: `res-${tag}`,
      subdomain: `res-${tag}`,
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "res@example.com",
      status: "approved",
    });
    const created = await createStore(sellerId, { name: "Second", subdomain: `res-${tag}-two` }, db);
    if (!created.success) throw new Error(created.error);
    secondStore = created.data.id;
    // The domain belongs to the SECOND store, not the primary one.
    await db.insert(s.sellerCustomDomains).values({ sellerId, storeId: secondStore, domain, status: "active" });
  });

  afterAll(async () => {
    await db.delete(s.users).where(inArray(s.users.id, [sellerId]));
    await client.end();
  });

  it("resolves a custom domain to the store it belongs to", async () => {
    expect(await findSubdomainForCustomDomain(domain, db)).toBe(`res-${tag}-two`);
  });

  it("finds the custom domain of that store, and none for the seller's other store", async () => {
    expect(await findActiveCustomDomainForSubdomain(`res-${tag}-two`, db)).toBe(domain);
    expect(await findActiveCustomDomainForSubdomain(`res-${tag}`, db)).toBeNull();
  });

  it("stops resolving when the store is archived", async () => {
    await db.update(s.stores).set({ status: "archived" }).where(eq(s.stores.id, secondStore));
    expect(await findSubdomainForCustomDomain(domain, db)).toBeNull();
    expect(await findActiveCustomDomainForSubdomain(`res-${tag}-two`, db)).toBeNull();
    await db.update(s.stores).set({ status: "active" }).where(eq(s.stores.id, secondStore));
  });

  it("stops resolving when the seller is not approved", async () => {
    await db.update(s.sellers).set({ status: "suspended" }).where(eq(s.sellers.id, sellerId));
    expect(await findSubdomainForCustomDomain(domain, db)).toBeNull();
    await db.update(s.sellers).set({ status: "approved" }).where(eq(s.sellers.id, sellerId));
  });

  it("ignores domains that are not active", async () => {
    await db.update(s.sellerCustomDomains).set({ status: "pending" }).where(eq(s.sellerCustomDomains.domain, domain));
    expect(await findSubdomainForCustomDomain(domain, db)).toBeNull();
  });
});
