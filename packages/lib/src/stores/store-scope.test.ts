import { describe, expect, it } from "vitest";
import { PLATFORM_SWITCHES, isPlatformSwitchKey, switchEnabled } from "./platform-switches.lib";
import { isSwitchOn } from "./platform-switches.server";
import { primaryStoreId, storeHasProduct, storeOwnedBy, assertStoreProduct, StoreScopeError } from "./store-scope.server";

type Q = NonNullable<Parameters<typeof isSwitchOn>[1]>;

/** A Drizzle stand-in: select().from().where().limit() / innerJoin() resolve to `rows`, or throw. */
function fakeQ(result: unknown[] | Error, calls: { n: number } = { n: 0 }): Q {
  const chain: Record<string, unknown> = {};
  const step = () => chain;
  chain.from = step;
  chain.where = step;
  chain.innerJoin = step;
  chain.limit = async () => {
    calls.n += 1;
    if (result instanceof Error) throw result;
    return result;
  };
  return { select: () => chain } as unknown as Q;
}

/** Fails the test if any query runs. */
const noQuery = { select: () => { throw new Error("no query expected"); } } as unknown as Q;

const pgError = (code: string) => Object.assign(new Error("db"), { cause: { code } });

const S1 = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const PRODUCT = "33333333-3333-4333-8333-333333333333";

describe("platform switch keys", () => {
  it("knows exactly the two F-87 switches", () => {
    expect(PLATFORM_SWITCHES).toEqual(["stores_catalog_split", "stores_wallet_split"]);
    expect(isPlatformSwitchKey("stores_catalog_split")).toBe(true);
    expect(isPlatformSwitchKey("stores_wallet_split")).toBe(true);
    expect(isPlatformSwitchKey("usd_live")).toBe(false);
    expect(isPlatformSwitchKey(undefined)).toBe(false);
  });

  it("is on only for a stored true", () => {
    expect(switchEnabled({ enabled: true })).toBe(true);
    expect(switchEnabled({ enabled: false })).toBe(false);
    expect(switchEnabled({ enabled: "true" })).toBe(false);
    expect(switchEnabled({ enabled: null })).toBe(false);
    expect(switchEnabled(null)).toBe(false);
    expect(switchEnabled(undefined)).toBe(false);
  });
});

describe("isSwitchOn", () => {
  it("reads the row on every call (no cache across calls)", async () => {
    const calls = { n: 0 };
    const q = fakeQ([{ enabled: true }], calls);
    expect(await isSwitchOn("stores_catalog_split", q)).toBe(true);
    expect(await isSwitchOn("stores_catalog_split", q)).toBe(true);
    expect(calls.n).toBe(2);
  });

  it("is off for a missing row or a false row", async () => {
    expect(await isSwitchOn("stores_wallet_split", fakeQ([]))).toBe(false);
    expect(await isSwitchOn("stores_wallet_split", fakeQ([{ enabled: false }]))).toBe(false);
  });

  it("is off when the table does not exist yet (before 0160)", async () => {
    expect(await isSwitchOn("stores_catalog_split", fakeQ(pgError("42P01")))).toBe(false);
    expect(await isSwitchOn("stores_catalog_split", fakeQ(Object.assign(new Error("db"), { code: "42P01" })))).toBe(false);
  });

  it("throws any other database error", async () => {
    await expect(isSwitchOn("stores_catalog_split", fakeQ(pgError("57014")))).rejects.toThrow("db");
  });

  it("never queries for an unknown key", async () => {
    expect(await isSwitchOn("nope" as never, noQuery)).toBe(false);
  });
});

describe("store scope guards", () => {
  it("primaryStoreId returns the row id or null", async () => {
    expect(await primaryStoreId(fakeQ([{ id: STORE }]), S1)).toBe(STORE);
    expect(await primaryStoreId(fakeQ([]), S1)).toBeNull();
    expect(await primaryStoreId(noQuery, "not-a-uuid")).toBeNull();
  });

  it("storeOwnedBy rejects malformed ids without a query", async () => {
    expect(await storeOwnedBy("x", STORE, noQuery)).toBe(false);
    expect(await storeOwnedBy(S1, "x", noQuery)).toBe(false);
    expect(await storeOwnedBy(S1, STORE, fakeQ([{ id: STORE }]))).toBe(true);
    expect(await storeOwnedBy(S1, STORE, fakeQ([]))).toBe(false);
  });

  it("storeHasProduct rejects malformed ids without a query", async () => {
    expect(await storeHasProduct("x", PRODUCT, { q: noQuery, catalogSplit: false })).toBe(false);
    expect(await storeHasProduct(STORE, "'; drop table products; --", { q: noQuery, catalogSplit: false })).toBe(false);
  });

  it("storeHasProduct reads the switch when the caller does not pass it", async () => {
    const calls = { n: 0 };
    // First limit() is the switch read, second the membership read.
    expect(await storeHasProduct(STORE, PRODUCT, { q: fakeQ([{ enabled: false, ok: true }], calls) })).toBe(true);
    expect(calls.n).toBe(2);
    const passed = { n: 0 };
    expect(await storeHasProduct(STORE, PRODUCT, { q: fakeQ([], passed), catalogSplit: true })).toBe(false);
    expect(passed.n).toBe(1);
  });

  it("storeHasProduct passes the scope through to the one condition", async () => {
    expect(await storeHasProduct(STORE, PRODUCT, { q: fakeQ([{ ok: true }]), catalogSplit: false, scope: "managed" })).toBe(true);
    expect(await storeHasProduct(STORE, PRODUCT, { q: fakeQ([]), catalogSplit: true, scope: "managed" })).toBe(false);
  });

  it("assertStoreProduct throws product_not_in_store", async () => {
    await expect(assertStoreProduct(STORE, PRODUCT, { q: fakeQ([]), catalogSplit: false })).rejects.toMatchObject({
      code: "product_not_in_store",
    });
    await expect(assertStoreProduct(STORE, PRODUCT, { q: fakeQ([]), catalogSplit: false })).rejects.toBeInstanceOf(
      StoreScopeError,
    );
    await expect(assertStoreProduct(STORE, PRODUCT, { q: fakeQ([{ ok: true }]), catalogSplit: false })).resolves.toBeUndefined();
  });
});
