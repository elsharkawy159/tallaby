import { describe, expect, it, vi } from "vitest";

const keys: string[][] = [];
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>, keyParts: string[]) => {
    keys.push(keyParts);
    return fn;
  },
}));

const { DEPLOY_ID, createCachedQuery } = await import("./cached");

describe("createCachedQuery", () => {
  it("keys a perDeploy query by the deploy, so a deploy never serves what older code built", async () => {
    keys.length = 0;
    await createCachedQuery({ name: "templates:cards", ttl: 60, tags: () => [], perDeploy: true, query: async () => 1 })();
    await createCachedQuery({ name: "plain", ttl: 60, tags: () => [], query: async () => 1 })();
    expect(keys[0]![0]).toBe(`templates:cards@${DEPLOY_ID}`);
    expect(keys[1]![0]).toBe("plain");
  });

  it("keys a store catalog read by the store and the catalog-split switch, so modes and stores never share an entry", async () => {
    keys.length = 0;
    const read = createCachedQuery({
      name: "storefront:list",
      ttl: 60,
      tags: (_filters: { sellerId: string; storeId: string }, _catalogSplit: boolean) => [],
      query: async (_filters: { sellerId: string; storeId: string }, _catalogSplit: boolean) => 1,
    });
    await read({ sellerId: "s", storeId: "a" }, false);
    await read({ sellerId: "s", storeId: "a" }, true);
    await read({ sellerId: "s", storeId: "b" }, false);
    await read({ storeId: "a", sellerId: "s" }, false);
    // Same store and mode in another property order reuses the first entry (no new key).
    expect(keys).toHaveLength(3);
    expect(new Set(keys.map((k) => k.join("|"))).size).toBe(3);
    expect(keys[0]![1]).toContain('"storeId":"a"');
    expect(keys[0]![1]).toContain("false");
    expect(keys[1]![1]).toContain("true");
  });
});
