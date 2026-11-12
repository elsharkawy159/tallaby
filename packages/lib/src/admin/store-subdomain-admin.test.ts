import { describe, expect, it } from "vitest";
import { changeStoreSubdomainByAdmin } from "./overrides.server";

const ADMIN = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";

/** A database that fails the test if a transaction is opened. */
const noDb = {
  transaction: () => {
    throw new Error("no transaction expected");
  },
} as never;

describe("changeStoreSubdomainByAdmin input checks", () => {
  it("rejects a bad shape, a short reason or an unknown field before any query", async () => {
    for (const input of [
      null,
      { storeId: "not-a-uuid", subdomain: "new-shop", reason: "Seller asked" },
      { storeId: STORE, subdomain: "new-shop", reason: "x" },
      { storeId: STORE, subdomain: "new-shop", reason: "Seller asked", sellerId: STORE },
    ]) {
      expect(await changeStoreSubdomainByAdmin(ADMIN, input, noDb)).toEqual({ success: false, error: "invalid_input" });
    }
  });

  it("applies the seller's subdomain rules (format, reserved) before any query", async () => {
    const base = { storeId: STORE, reason: "Seller asked" };
    expect(await changeStoreSubdomainByAdmin(ADMIN, { ...base, subdomain: "ab" }, noDb)).toEqual({ success: false, error: "tooShort" });
    expect(await changeStoreSubdomainByAdmin(ADMIN, { ...base, subdomain: "my_shop" }, noDb)).toEqual({ success: false, error: "invalid" });
    expect(await changeStoreSubdomainByAdmin(ADMIN, { ...base, subdomain: " Dashboard " }, noDb)).toEqual({ success: false, error: "reserved" });
  });
});
