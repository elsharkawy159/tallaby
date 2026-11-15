import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseEgpAmount, parseStoreMinOrderInput } from "./min-order.dto";

describe("parseEgpAmount", () => {
  it("reads EGP with up to two decimals as piastres", () => {
    expect(parseEgpAmount("250")).toBe(25_000);
    expect(parseEgpAmount(" 250.5 ")).toBe(25_050);
    expect(parseEgpAmount("250.05")).toBe(25_005);
    expect(parseEgpAmount(99.99)).toBe(9_999);
    expect(parseEgpAmount("٣٠٠")).toBe(30_000);
  });

  it("refuses anything else", () => {
    for (const value of ["", "-5", "1e3", "12.345", "abc", "1,000", ".5"]) {
      expect(parseEgpAmount(value)).toBeNull();
    }
  });
});

describe("parseStoreMinOrderInput", () => {
  it("accepts an on minimum", () => {
    expect(parseStoreMinOrderInput({ enabled: true, amount: "300" })).toEqual({
      ok: true,
      value: { enabled: true, amountPiastres: 30_000 },
    });
  });

  it("needs a positive amount within the cap when on", () => {
    expect(parseStoreMinOrderInput({ enabled: true, amount: "" })).toEqual({ ok: false, error: "amountRequired" });
    expect(parseStoreMinOrderInput({ enabled: true, amount: "0" })).toEqual({ ok: false, error: "amountRequired" });
    expect(parseStoreMinOrderInput({ enabled: true, amount: "1000000.01" })).toEqual({ ok: false, error: "amountTooHigh" });
    expect(parseStoreMinOrderInput({ enabled: true, amount: "abc" })).toEqual({ ok: false, error: "invalid" });
  });

  it("saves off with the amount kept when valid", () => {
    expect(parseStoreMinOrderInput({ enabled: false, amount: "150" })).toEqual({ ok: true, value: { enabled: false, amountPiastres: 15_000 } });
    expect(parseStoreMinOrderInput({ enabled: false, amount: "" })).toEqual({ ok: true, value: { enabled: false, amountPiastres: 0 } });
    expect(parseStoreMinOrderInput({ enabled: false, amount: "x" })).toEqual({ ok: true, value: { enabled: false, amountPiastres: 0 } });
  });

  it("refuses unknown shapes and extra keys", () => {
    expect(parseStoreMinOrderInput(null)).toEqual({ ok: false, error: "invalid" });
    expect(parseStoreMinOrderInput({ enabled: "yes", amount: "1" })).toEqual({ ok: false, error: "invalid" });
    expect(parseStoreMinOrderInput({ enabled: true, amount: "1", storeId: "x" })).toEqual({ ok: false, error: "invalid" });
  });
});

// The save action: explicit storeId checked with requireStore(forWrite), the
// update filtered by store and seller, only the minOrder key merged.
const calls = vi.hoisted(() => ({
  requireStore: [] as unknown[][],
  set: [] as unknown[],
  where: [] as unknown[],
  invalidations: [] as unknown[],
  denied: false,
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/rate-limit.lib", () => ({ createRateLimiter: () => ({ check: () => true }) }));
vi.mock("@/lib/auth/require-seller.server", () => ({
  requireStore: async (...args: unknown[]) => {
    calls.requireStore.push(args);
    if (calls.denied) throw Object.assign(new Error("denied"), { code: "store_not_found" });
    return { seller: { sellerId: "seller-1" }, store: { id: String(args[0]), subdomain: "shop" } };
  },
  isAccessError: (error: unknown) => (error as { code?: string })?.code === "store_not_found",
}));
vi.mock("@workspace/cache", () => ({
  applyInvalidation: async (inv: unknown) => {
    calls.invalidations.push(inv);
  },
  invalidateStorefront: (subdomains: string[]) => ({ subdomains }),
}));
vi.mock("@workspace/db", () => ({
  stores: { id: "stores.id", sellerId: "stores.seller_id", settings: "stores.settings" },
  and: (...parts: unknown[]) => ({ and: parts }),
  eq: (column: unknown, value: unknown) => ({ eq: [column, value] }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ sql: strings.join("?"), values }),
  db: {
    update: () => ({
      set: (value: unknown) => {
        calls.set.push(value);
        return {
          where: async (condition: unknown) => {
            calls.where.push(condition);
          },
        };
      },
    }),
  },
}));

describe("saveStoreMinOrder", () => {
  beforeEach(() => {
    calls.requireStore.length = 0;
    calls.set.length = 0;
    calls.where.length = 0;
    calls.invalidations.length = 0;
    calls.denied = false;
  });

  it("checks the store for write and filters the update by store and seller", async () => {
    const { saveStoreMinOrder } = await import("./min-order.server");
    const result = await saveStoreMinOrder("store-9", { enabled: true, amount: "250" });

    expect(result).toEqual({ success: true, minOrder: { enabled: true, amountPiastres: 25_000 } });
    expect(calls.requireStore).toEqual([["store-9", { forWrite: true }]]);
    expect(calls.where).toEqual([{ and: [{ eq: ["stores.id", "store-9"] }, { eq: ["stores.seller_id", "seller-1"] }] }]);
    const set = calls.set[0] as { settings: { sql: string; values: unknown[] } };
    expect(set.settings.sql).toContain("jsonb_build_object('minOrder'");
    expect(set.settings.values).toContain(JSON.stringify({ enabled: true, amountPiastres: 25_000 }));
    expect(calls.invalidations).toEqual([{ subdomains: ["shop"] }]);
  });

  it("writes nothing for a bad input or a store the seller does not own", async () => {
    const { saveStoreMinOrder } = await import("./min-order.server");
    expect(await saveStoreMinOrder("store-9", { enabled: true, amount: "" })).toEqual({ success: false, error: "amountRequired" });
    calls.denied = true;
    expect(await saveStoreMinOrder("other", { enabled: true, amount: "10" })).toEqual({ success: false, error: "notFound" });
    expect(calls.set).toEqual([]);
  });
});
