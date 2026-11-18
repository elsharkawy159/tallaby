import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  publishNewStoreIfReady: vi.fn(),
  applyInvalidation: vi.fn(),
  revalidateDashboardPath: vi.fn(),
  limit: vi.fn(),
  findActiveCustomDomainForSubdomain: vi.fn(),
}));

vi.mock("@workspace/cache", () => ({ applyInvalidation: mocks.applyInvalidation }));
vi.mock("@workspace/db", () => {
  const chain = { select: () => chain, from: () => chain, where: () => chain, limit: mocks.limit };
  return { db: chain, and: vi.fn(), eq: vi.fn(), stores: { id: "id", sellerId: "seller_id", subdomain: "subdomain" } };
});
vi.mock("@workspace/lib/storefront", () => ({
  storeUrl: (subdomain: string, domain?: string | null) => (domain ? `https://${domain}` : `https://${subdomain}.tallaby.com`),
  storeHostname: (subdomain: string, domain?: string | null) => domain ?? `${subdomain}.tallaby.com`,
}));
vi.mock("@workspace/lib/storefront/server", () => ({ findActiveCustomDomainForSubdomain: mocks.findActiveCustomDomainForSubdomain }));
vi.mock("@workspace/lib/store-sites/auto-publish", () => ({ publishNewStoreIfReady: mocks.publishNewStoreIfReady }));
vi.mock("@workspace/store-sections/render", () => ({ storeSectionRegistry: { allowedSections: () => ({ hero: 1 }) } }));
vi.mock("@/lib/i18n/revalidate-dashboard-path.server", () => ({ revalidateDashboardPath: mocks.revalidateDashboardPath }));

import { autoPublishStore, autoPublishStoreIfReady } from "./auto-publish-store.server";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";
const INVALIDATION = { tags: ["store-site"], paths: [] };
const LIVE = { url: "https://shop.tallaby.com", hostname: "shop.tallaby.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.publishNewStoreIfReady.mockResolvedValue({ published: true, invalidation: INVALIDATION });
  mocks.applyInvalidation.mockResolvedValue(undefined);
  mocks.limit.mockResolvedValue([{ subdomain: "shop" }]);
  mocks.findActiveCustomDomainForSubdomain.mockResolvedValue(null);
});

describe("autoPublishStoreIfReady", () => {
  it("asks the shared rule with the section registry, clears the store's caches once it is live and returns its live site", async () => {
    expect(await autoPublishStoreIfReady(SELLER, STORE, USER)).toEqual(LIVE);

    expect(mocks.publishNewStoreIfReady).toHaveBeenCalledExactlyOnceWith(SELLER, STORE, USER, { allowedSections: { hero: 1 } });
    expect(mocks.applyInvalidation).toHaveBeenCalledExactlyOnceWith(INVALIDATION, { from: "dashboard", mode: "action" });
    expect(mocks.revalidateDashboardPath).toHaveBeenCalledWith("/stores/[storeId]/website", "layout");
  });

  it.each(["no_active_product", "template_not_chosen", "already_published", "not_draft", "failed"] as const)(
    "clears nothing when the store stays as it is (%s)",
    async (reason) => {
      mocks.publishNewStoreIfReady.mockResolvedValue({ published: false, reason });

      expect(await autoPublishStoreIfReady(SELLER, STORE, USER)).toBeNull();
      expect(await autoPublishStore(SELLER, STORE, USER)).toEqual({ published: false, reason });
      expect(mocks.applyInvalidation).not.toHaveBeenCalled();
      expect(mocks.revalidateDashboardPath).not.toHaveBeenCalled();
      expect(mocks.limit).not.toHaveBeenCalled();
    },
  );

  it("returns the store's own domain once one is active", async () => {
    mocks.findActiveCustomDomainForSubdomain.mockResolvedValue("shop-eg.com");

    expect(await autoPublishStore(SELLER, STORE, USER)).toEqual({ published: true, live: { url: "https://shop-eg.com", hostname: "shop-eg.com" } });
  });

  it("stays published with no live site when the store's link can't be read", async () => {
    mocks.limit.mockRejectedValue(new Error("db down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(await autoPublishStore(SELLER, STORE, USER)).toEqual({ published: true, live: null });
    expect(await autoPublishStoreIfReady(SELLER, STORE, USER)).toBeNull();
    error.mockRestore();
  });

  it("never throws into the caller's action", async () => {
    mocks.applyInvalidation.mockRejectedValue(new Error("outside a server action"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(await autoPublishStore(SELLER, STORE, USER)).toEqual({ published: false, reason: "failed" });
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});
