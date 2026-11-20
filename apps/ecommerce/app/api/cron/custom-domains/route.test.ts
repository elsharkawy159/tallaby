import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rows: [] as { row: Record<string, unknown>; subdomain: string }[],
  refresh: vi.fn(),
  invalidations: [] as unknown[],
}));

vi.mock("@workspace/db", () => ({
  db: { select: () => ({ from: () => ({ innerJoin: async () => mocks.rows }) }) },
  sellers: { id: "id", subdomain: "subdomain" },
  sellerCustomDomains: { sellerId: "seller_id" },
  eq: () => null,
}));
vi.mock("@workspace/lib/storefront/server", () => ({ refreshCustomDomain: mocks.refresh }));
vi.mock("@workspace/cache", () => ({
  invalidateCustomDomain: (subdomain: string, domain: string) => ({ subdomain, domain }),
  applyInvalidation: async (plan: unknown) => {
    mocks.invalidations.push(plan);
  },
}));
vi.mock("@/lib/auth-handoff.server", () => ({ purgeExpiredHandoffCodes: async () => undefined }));

import { GET } from "./route";

const request = (auth?: string) =>
  new Request("http://localhost/api/cron/custom-domains", { headers: auth ? { authorization: auth } : {} }) as never;

beforeEach(() => {
  process.env.CRON_SECRET = "s3cret";
  mocks.refresh.mockReset();
  mocks.invalidations.length = 0;
  mocks.rows = [
    { row: { id: "a", domain: "old-shop.com", status: "active", provider: "vercel", providerMeta: null }, subdomain: "old" },
    { row: { id: "b", domain: "new-shop.com", status: "pending", provider: "cloudflare", providerMeta: { hostnames: {} } }, subdomain: "new" },
  ];
});

describe("custom-domains cron", () => {
  it("refuses a call without the secret", async () => {
    expect((await GET(request())).status).toBe(401);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("refreshes every row as stored, so each is checked with its own provider", async () => {
    mocks.refresh.mockImplementation(async (row: { status: string; provider: string }) =>
      row.provider === "cloudflare" ? { ...row, status: "active" } : row,
    );
    const response = await GET(request("Bearer s3cret"));
    expect(await response.json()).toEqual({ checked: 2, changed: 1, errors: 0 });
    expect(mocks.refresh.mock.calls.map(([row]) => row)).toEqual(mocks.rows.map((r) => r.row));
    expect(mocks.invalidations).toEqual([{ subdomain: "new", domain: "new-shop.com" }]);
  });

  it("keeps going when one provider fails", async () => {
    mocks.refresh.mockImplementation(async (row: { provider: string }) => {
      if (row.provider === "vercel") throw new Error("vercel down");
      return row;
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await GET(request("Bearer s3cret"));
    expect(await response.json()).toEqual({ checked: 1, changed: 0, errors: 1 });
    spy.mockRestore();
  });
});
