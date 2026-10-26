import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import {
  getBostaAccountByIntegrationId,
  getBostaOverview,
  getStoreBostaAccount,
  saveBostaKey,
  saveBostaSettings,
  testStoreBosta,
} from "./bosta.server";
import { disconnectStoreIntegration } from "./store-integrations.server";

/**
 * Per-store Bosta account (BS-05): encrypted round trip, keep-the-saved-key,
 * and store B never reading store A's key. Bosta itself is faked. Skipped
 * when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const KEY_A = "bosta-key-store-a-0001";
const KEY_A2 = "bosta-key-store-a-0002";
const KEY_B = "bosta-key-store-b-0001";

const LOCATIONS = [
  { _id: "loc-home", locationName: "Home", isDefault: false, address: { firstLine: "1 Street" } },
  { _id: "loc-main", locationName: "Main warehouse", isDefault: true, address: { firstLine: "2 Street" } },
];

/** A fake Bosta: valid keys list two pickup locations, anything else is 401. */
const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
  const key = new Headers(init?.headers).get("Authorization");
  if (key === "bosta-key-revoked-00001" || ![KEY_A, KEY_A2, KEY_B].includes(key ?? "")) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized", errorCode: 1028 }), { status: 401 });
  }
  return new Response(JSON.stringify({ success: true, data: { list: LOCATIONS } }), { status: 200 });
}) as unknown as typeof fetch;

describe.skipIf(!TEST_DATABASE_URL)("Bosta integration (integration)", { timeout: 30_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  let w: IsolationWorld;
  const previousKey = process.env.INTEGRATIONS_ENCRYPTION_KEY;

  beforeAll(async () => {
    process.env.INTEGRATIONS_ENCRYPTION_KEY ||= randomBytes(32).toString("hex");
    w = await createIsolationWorld(db);
  }, 60_000);

  afterAll(async () => {
    await w?.cleanup();
    await client.end();
    process.env.INTEGRATIONS_ENCRYPTION_KEY = previousKey;
  });

  const opts = () => ({ q: db, fetchImpl });

  it("verifies the key with Bosta before saving it, and preselects the default pickup location", async () => {
    expect(await saveBostaKey(w.a.sellerId, w.a.sellerId, w.a.a1, "bosta-key-revoked-00001", opts())).toMatchObject({
      success: false,
      error: "key_rejected",
    });
    expect(await getBostaOverview(w.a.sellerId, w.a.a1, db)).toBeNull();

    const saved = await saveBostaKey(w.a.sellerId, w.a.sellerId, w.a.a1, KEY_A, opts());
    expect(saved).toMatchObject({
      success: true,
      data: {
        overview: {
          summary: { provider: "bosta", status: "connected", credentialsSaved: true, details: { keyHint: "0001" } },
          settings: { pickupLocationId: "loc-main", pickupLocationName: "Main warehouse", autoShip: "manual" },
        },
      },
    });
    if (!saved.success) return;
    expect(saved.data.pickupLocations).toHaveLength(2);

    const [row] = await db
      .select()
      .from(DB_SCHEMA.storeIntegrations)
      .where(and(eq(DB_SCHEMA.storeIntegrations.storeId, w.a.a1), eq(DB_SCHEMA.storeIntegrations.provider, "bosta")));
    expect(row?.credentialsEncrypted).toBeTruthy();
    expect(row?.credentialsEncrypted).not.toContain(KEY_A);
    expect(JSON.stringify(row?.config)).not.toContain(KEY_A);
  });

  it("decrypts the account for the shipping code, with a stable webhook token", async () => {
    const account = await getStoreBostaAccount(w.a.a1, db);
    expect(account).toMatchObject({ storeId: w.a.a1, sellerId: w.a.sellerId, apiKey: KEY_A });
    expect(account?.webhookToken.length).toBeGreaterThanOrEqual(40);
    expect(await getBostaAccountByIntegrationId(account!.integrationId, db)).toEqual(account);

    // Replacing the key keeps the webhook token, so shipments already at Bosta still report back.
    await saveBostaKey(w.a.sellerId, w.a.sellerId, w.a.a1, KEY_A2, opts());
    const replaced = await getStoreBostaAccount(w.a.a1, db);
    expect(replaced?.apiKey).toBe(KEY_A2);
    expect(replaced?.webhookToken).toBe(account?.webhookToken);
  });

  it("an empty key re-checks and keeps the saved one", async () => {
    const result = await saveBostaKey(w.a.sellerId, w.a.sellerId, w.a.a1, "", opts());
    expect(result).toMatchObject({ success: true });
    expect((await getStoreBostaAccount(w.a.a1, db))?.apiKey).toBe(KEY_A2);
    expect(await saveBostaKey(w.a.sellerId, w.a.sellerId, w.a.a2, "", opts())).toMatchObject({ success: false, error: "key_required" });
  });

  it("saves settings, checking the pickup location against the account", async () => {
    expect(await saveBostaSettings(w.a.sellerId, w.a.a1, { autoShip: "on_confirm", size: "MEDIUM" }, opts())).toMatchObject({
      success: true,
      data: { settings: { autoShip: "on_confirm", size: "MEDIUM", pickupLocationId: "loc-main" } },
    });
    expect(await saveBostaSettings(w.a.sellerId, w.a.a1, { pickupLocationId: "loc-home" }, opts())).toMatchObject({
      success: true,
      data: { settings: { pickupLocationId: "loc-home", pickupLocationName: "Home", autoShip: "on_confirm" } },
    });
    expect(await saveBostaSettings(w.a.sellerId, w.a.a1, { pickupLocationId: "elsewhere" }, opts())).toEqual({
      success: false,
      error: "unknown_pickup_location",
    });
    expect(await saveBostaSettings(w.a.sellerId, w.a.a2, { autoShip: "manual" }, opts())).toEqual({
      success: false,
      error: "not_connected",
    });
  });

  it("store B can't read, test, change or use store A's key", async () => {
    await saveBostaKey(w.b.sellerId, w.b.sellerId, w.b.b1, KEY_B, opts());

    expect(await getBostaOverview(w.b.sellerId, w.a.a1, db)).toBeNull();
    expect(await testStoreBosta(w.b.sellerId, w.a.a1, opts())).toEqual({ success: false, error: "not_found" });
    expect(await saveBostaSettings(w.b.sellerId, w.a.a1, { autoShip: "manual" }, opts())).toEqual({ success: false, error: "not_found" });
    expect(await saveBostaKey(w.b.sellerId, w.b.sellerId, w.a.a1, KEY_B, opts())).toEqual({ success: false, error: "not_found" });
    expect((await getStoreBostaAccount(w.a.a1, db))?.apiKey).toBe(KEY_A2);
    expect((await getStoreBostaAccount(w.b.b1, db))?.apiKey).toBe(KEY_B);
    // Another store of the same seller has its own (no) account.
    expect(await getStoreBostaAccount(w.a.a2, db)).toBeNull();
  });

  it("test connection records a revoked key as an error", async () => {
    const revokedFetch = (async () =>
      new Response(JSON.stringify({ success: false, message: `bad key ${KEY_A2}`, errorCode: 1028 }), { status: 401 })) as unknown as typeof fetch;
    const result = await testStoreBosta(w.a.sellerId, w.a.a1, { q: db, fetchImpl: revokedFetch });
    expect(result).toMatchObject({ success: false, error: "failed" });
    expect(result.message).not.toContain(KEY_A2);
    expect((await getBostaOverview(w.a.sellerId, w.a.a1, db))?.summary.status).toBe("error");

    expect(await testStoreBosta(w.a.sellerId, w.a.a1, opts())).toMatchObject({ success: true, data: { status: "connected" } });
  });

  it("disconnecting deletes the key", async () => {
    expect(await disconnectStoreIntegration(w.a.sellerId, w.a.a1, "bosta", db)).toEqual({ success: true, data: null });
    expect(await getStoreBostaAccount(w.a.a1, db)).toBeNull();
    expect(await getBostaOverview(w.a.sellerId, w.a.a1, db)).toBeNull();
  });
});
