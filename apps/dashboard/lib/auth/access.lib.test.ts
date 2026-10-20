import { describe, expect, it } from "vitest";
import { checkSellerAccess, checkStoreAccess, isUuid, type StoreRecord } from "./access.lib";

const SELLER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const store = (over: Partial<StoreRecord> = {}): StoreRecord => ({
  id: "33333333-3333-4333-8333-333333333333",
  sellerId: SELLER,
  status: "active",
  deletedAt: null,
  ...over,
});

describe("checkSellerAccess", () => {
  it("refuses a missing seller row", () => {
    expect(checkSellerAccess(null, {})).toEqual({ ok: false, code: "no_seller" });
  });

  it("lets approved sellers read and write", () => {
    expect(checkSellerAccess("approved", { forWrite: true })).toEqual({ ok: true });
  });

  it("lets restricted sellers read and write (they keep the dashboard)", () => {
    expect(checkSellerAccess("restricted", {})).toEqual({ ok: true });
    expect(checkSellerAccess("restricted", { forWrite: true })).toEqual({ ok: true });
  });

  it("blocks pending and suspended sellers", () => {
    expect(checkSellerAccess("pending", {})).toEqual({ ok: false, code: "seller_blocked" });
    expect(checkSellerAccess("suspended", { forWrite: true })).toEqual({ ok: false, code: "seller_blocked" });
  });

  it("treats an unknown or null status as pending", () => {
    expect(checkSellerAccess("weird", {})).toEqual({ ok: false, code: "seller_blocked" });
  });
});

describe("checkStoreAccess", () => {
  it("allows the owner on an active store", () => {
    expect(checkStoreAccess(store(), SELLER, "approved", { forWrite: true, forPublish: true })).toEqual({ ok: true });
  });

  it("hides a missing store as not_found", () => {
    expect(checkStoreAccess(null, SELLER, "approved", {})).toEqual({ ok: false, code: "not_found" });
  });

  it("hides another seller's store as not_found (never reveals existence)", () => {
    expect(checkStoreAccess(store({ sellerId: OTHER }), SELLER, "approved", {})).toEqual({
      ok: false,
      code: "not_found",
    });
  });

  it("hides a soft-deleted store as not_found", () => {
    expect(checkStoreAccess(store({ deletedAt: "2026-10-01T00:00:00Z" }), SELLER, "approved", {})).toEqual({
      ok: false,
      code: "not_found",
    });
  });

  it("keeps archived stores readable but read-only", () => {
    const archived = store({ status: "archived" });
    expect(checkStoreAccess(archived, SELLER, "approved", {})).toEqual({ ok: true });
    expect(checkStoreAccess(archived, SELLER, "approved", { forWrite: true })).toEqual({
      ok: false,
      code: "store_read_only",
    });
  });

  it("keeps admin-suspended stores read-only", () => {
    expect(checkStoreAccess(store({ status: "suspended" }), SELLER, "approved", { forWrite: true })).toEqual({
      ok: false,
      code: "store_read_only",
    });
  });

  it("lets restricted sellers edit but not publish (A5)", () => {
    expect(checkStoreAccess(store(), SELLER, "restricted", { forWrite: true })).toEqual({ ok: true });
    expect(checkStoreAccess(store(), SELLER, "restricted", { forPublish: true })).toEqual({
      ok: false,
      code: "publish_blocked",
    });
  });
});

describe("isUuid", () => {
  it("accepts uuids and rejects anything else", () => {
    expect(isUuid(SELLER)).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid("33333333-3333-4333-8333-333333333333' OR 1=1")).toBe(false);
  });
});
