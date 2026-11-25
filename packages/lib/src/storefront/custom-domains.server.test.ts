import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  providerIds: [] as string[],
  updates: [] as Record<string, unknown>[],
}));

vi.mock("@workspace/db", () => ({
  db: {
    update: () => ({
      set: (values: Record<string, unknown>) => {
        mocks.updates.push(values);
        return { where: () => ({ returning: async () => [{ ...values, id: "row" }] }) };
      },
    }),
  },
  and: () => null,
  eq: () => null,
  isNull: () => null,
  or: () => null,
  sql: () => null,
  sellerCustomDomains: { id: "id" },
  sellers: {},
  stores: {},
}));

vi.mock("./custom-domain-provider", () => ({
  customDomainProvider: (id: string) => {
    mocks.providerIds.push(id);
    return { id, check: mocks.check };
  },
}));

import { refreshCustomDomain, type CustomDomainRow } from "./custom-domains.server";

const row = (provider: string, providerMeta: unknown = null): CustomDomainRow =>
  ({
    id: `row-${provider}`,
    sellerId: "s",
    storeId: "st",
    domain: "faster-eg.com",
    status: "pending",
    verification: null,
    lastError: null,
    verifiedAt: null,
    lastCheckedAt: null,
    createdAt: "",
    updatedAt: "",
    provider,
    providerMeta,
  }) as CustomDomainRow;

beforeEach(() => {
  mocks.check.mockReset();
  mocks.providerIds.length = 0;
  mocks.updates.length = 0;
});

describe("refreshCustomDomain", () => {
  it("checks each row with its own provider and meta (what the cron and Verify run)", async () => {
    mocks.check.mockResolvedValue({ status: "active", verification: null, lastError: null });
    const meta = { hostnames: { "faster-eg.com": "id-apex" } };

    await refreshCustomDomain(row("vercel"));
    await refreshCustomDomain(row("cloudflare", meta));

    expect(mocks.providerIds).toEqual(["vercel", "cloudflare"]);
    expect(mocks.check).toHaveBeenNthCalledWith(1, "faster-eg.com", "pending", { meta: null });
    expect(mocks.check).toHaveBeenNthCalledWith(2, "faster-eg.com", "pending", { meta });
    expect(mocks.updates[0]).toMatchObject({ status: "active", lastError: null, verifiedAt: expect.any(String) });
  });

  it("saves the provider's records while pending", async () => {
    const verification = [{ type: "TXT", domain: "_cf-custom-hostname.faster-eg.com", value: "x", reason: "ownership" }];
    mocks.check.mockResolvedValue({ status: "pending", verification, lastError: "dns" });
    await refreshCustomDomain(row("cloudflare"));
    expect(mocks.updates[0]).toMatchObject({ status: "pending", verification, lastError: "dns" });
    expect(mocks.updates[0]).not.toHaveProperty("verifiedAt");
    expect(mocks.updates[0]).not.toHaveProperty("providerMeta");
  });

  it("saves the meta only when the check returns one (Cloudflare www-primary), never for Vercel", async () => {
    const meta = { hostnames: { "faster-eg.com": "id-apex" }, primary: "www" };
    mocks.check.mockResolvedValueOnce({ status: "active", verification: null, lastError: null, meta });
    await refreshCustomDomain(row("cloudflare", { hostnames: { "faster-eg.com": "id-apex" } }));
    expect(mocks.updates[0]).toMatchObject({ status: "active", providerMeta: meta });

    mocks.check.mockResolvedValueOnce({ status: "active", verification: null, lastError: null });
    await refreshCustomDomain(row("vercel"));
    expect(mocks.updates[1]).not.toHaveProperty("providerMeta");
  });
});
