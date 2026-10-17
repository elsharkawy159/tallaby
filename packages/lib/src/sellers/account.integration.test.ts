import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { getSellerAccountView, updateSellerLegalDetails, updateSellerPayoutDetails } from "./account.server";

/** Against the staging copy; skipped without TEST_DATABASE_URL. */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("seller account (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 2 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const sellerId = randomUUID();

  beforeAll(async () => {
    await db.insert(s.users).values({ id: sellerId, isGuest: false, role: "seller" });
    await db.insert(s.sellers).values({
      id: sellerId,
      businessName: "Acct",
      displayName: "Acct",
      slug: `acct-${sellerId.slice(0, 8)}`,
      subdomain: `acct-${sellerId.slice(0, 8)}`,
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "acct@example.com",
      status: "approved",
    });
  });

  afterAll(async () => {
    await db.delete(s.users).where(eq(s.users.id, sellerId));
    await client.end();
  });

  it("starts with no payout details and the signup address", async () => {
    expect(await getSellerAccountView(sellerId, db)).toMatchObject({
      businessType: "individual",
      legalAddress: { country: "EG" },
      payout: null,
    });
  });

  it("saves the business type and legal address", async () => {
    const result = await updateSellerLegalDetails(
      sellerId,
      { businessType: "company", legalAddress: { street: "12 Tahrir St", city: "Dokki", state: "GIZA", country: "EG" } },
      db,
    );
    expect(result).toEqual({ success: true });
    expect(await getSellerAccountView(sellerId, db)).toMatchObject({
      businessType: "company",
      legalAddress: { street: "12 Tahrir St", state: "GIZA" },
    });
  });

  it("rejects an invalid legal address without writing", async () => {
    expect(
      await updateSellerLegalDetails(sellerId, { legalAddress: { street: "x", city: "y", state: "MARS", country: "EG" } }, db),
    ).toEqual({ success: false, error: "invalid_input" });
    expect((await getSellerAccountView(sellerId, db))?.legalAddress.state).toBe("GIZA");
  });

  it("saves payout details and only ever reads them back masked", async () => {
    expect(
      await updateSellerPayoutDetails(
        sellerId,
        { method: "mobile_wallet", accountHolder: "Acct Owner", provider: "vodafone_cash", phone: "01012345678" },
        db,
      ),
    ).toEqual({ success: true });
    const view = await getSellerAccountView(sellerId, db);
    expect(view?.payout).toEqual({ method: "mobile_wallet", accountHolder: "Acct Owner", provider: "vodafone_cash", last4: "5678" });
    expect(JSON.stringify(view)).not.toContain("01012345678");
  });

  it("rejects invalid payout details", async () => {
    expect(await updateSellerPayoutDetails(sellerId, { method: "bank_transfer", iban: "nope" }, db)).toEqual({
      success: false,
      error: "invalid_input",
    });
  });
});
