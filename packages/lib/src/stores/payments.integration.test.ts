import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { desc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "./isolation.fixtures";
import { archiveStore, getStorePayments, updateStorePaymentMethod } from "./server";

/** Store payment methods (P3-07): store-scoped writes and a masked audit log. */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store payment methods (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  let w: IsolationWorld;

  beforeAll(async () => {
    w = await createIsolationWorld(db);
  }, 60_000);
  afterAll(async () => {
    await w?.cleanup();
    await client.end();
  });

  const wallet = { enabled: true, details: { holderName: "Omar Ali", phone: "0101 234 5678" } };

  it("defaults to COD only, enables a wallet and audits it masked", async () => {
    expect(await getStorePayments(w.a.sellerId, w.a.a1, db)).toEqual({ cod: { enabled: true, fee: 0 } });
    const res = await updateStorePaymentMethod(w.a.sellerId, w.a.sellerId, w.a.a1, "vodafone_cash", wallet, db);
    expect(res).toMatchObject({ success: true, data: { vodafone_cash: { enabled: true, details: { phone: "01012345678" } } } });

    const [audit] = await db
      .select()
      .from(DB_SCHEMA.storeSettingsAudit)
      .where(eq(DB_SCHEMA.storeSettingsAudit.storeId, w.a.a1))
      .orderBy(desc(DB_SCHEMA.storeSettingsAudit.createdAt));
    expect(audit).toMatchObject({ section: "payments", action: "enabled", actorId: w.a.sellerId });
    expect(JSON.stringify(audit!.changes)).not.toContain("01012345678");
    expect(audit!.changes).toMatchObject({ method: "vodafone_cash", details: { phone: "•••5678" } });
  });

  it("keeps the store's settings separate from the seller's other store", async () => {
    expect(await getStorePayments(w.a.sellerId, w.a.a2, db)).toEqual({ cod: { enabled: true, fee: 0 } });
  });

  it("refuses a foreign store as not_found and writes nothing there", async () => {
    const res = await updateStorePaymentMethod(w.a.sellerId, w.a.sellerId, w.b.b1, "vodafone_cash", wallet, db);
    expect(res).toEqual({ success: false, error: "not_found" });
    expect(await getStorePayments(w.b.sellerId, w.b.b1, db)).toEqual({ cod: { enabled: true, fee: 0 } });
  });

  it("never lets the last method be turned off", async () => {
    const res = await updateStorePaymentMethod(w.b.sellerId, w.b.sellerId, w.b.b1, "cod", { enabled: false }, db);
    expect(res).toEqual({ success: false, error: "last_method" });
  });

  it("refuses changes on an archived store", async () => {
    await archiveStore(w.a.sellerId, w.a.a2, db);
    const res = await updateStorePaymentMethod(w.a.sellerId, w.a.sellerId, w.a.a2, "vodafone_cash", wallet, db);
    expect(res).toEqual({ success: false, error: "store_read_only" });
  });

  it("the audit log is append-only", async () => {
    await expect(
      db.update(DB_SCHEMA.storeSettingsAudit).set({ action: "x" }).where(eq(DB_SCHEMA.storeSettingsAudit.storeId, w.a.a1)),
    ).rejects.toThrow();
  });
});
