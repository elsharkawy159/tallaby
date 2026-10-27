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
});
