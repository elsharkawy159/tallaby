import { beforeEach, describe, expect, it, vi } from "vitest";

const getStorefrontSite = vi.fn();
const billingOffline = vi.fn(async () => false);

vi.mock("./preview.server", () => ({ getStorefrontSite: (...args: unknown[]) => getStorefrontSite(...args) }));
vi.mock("@/lib/storefront.server", () => ({
  isStorefrontOfflineForVisitors: async (store: { siteStatus: string }) =>
    store.siteStatus !== "published" || (await billingOffline()),
  resolveStorefront: vi.fn(),
}));

const { isStoreOfflineForRequest } = await import("./offline.server");

const store = (siteStatus: "draft" | "published" | "unpublished") => ({
  id: "seller-1",
  storeId: "store-1",
  subdomain: "faster",
  siteStatus,
  sellerCreatedAt: null,
});

describe("isStoreOfflineForRequest", () => {
  beforeEach(() => {
    getStorefrontSite.mockReset();
    billingOffline.mockReset();
    billingOffline.mockResolvedValue(false);
  });

  it("is false for a published store, whatever its seller's activation, without reading the preview (F-84)", async () => {
    expect(await isStoreOfflineForRequest(store("published"))).toBe(false);
    expect(getStorefrontSite).not.toHaveBeenCalled();
  });

  it("is true for a never-published (new) store", async () => {
    getStorefrontSite.mockResolvedValue({ site: null, preview: null });
    expect(await isStoreOfflineForRequest(store("draft"))).toBe(true);
  });

  it("lets a verified draft preview of a never-published store through", async () => {
    getStorefrontSite.mockResolvedValue({ site: {}, preview: "active" });
    expect(await isStoreOfflineForRequest(store("draft"))).toBe(false);
  });

  it("is true for an unpublished store", async () => {
    getStorefrontSite.mockResolvedValue({ site: null, preview: null });
    expect(await isStoreOfflineForRequest(store("unpublished"))).toBe(true);
  });

  it("lets a verified draft preview through", async () => {
    getStorefrontSite.mockResolvedValue({ site: {}, preview: "active" });
    expect(await isStoreOfflineForRequest(store("unpublished"))).toBe(false);
  });

  it("is true for a published store offline for billing, and a verified preview still gets through", async () => {
    billingOffline.mockResolvedValue(true);
    getStorefrontSite.mockResolvedValue({ site: null, preview: null });
    expect(await isStoreOfflineForRequest(store("published"))).toBe(true);
    getStorefrontSite.mockResolvedValue({ site: {}, preview: "active" });
    expect(await isStoreOfflineForRequest(store("published"))).toBe(false);
  });

  it("keeps an invalid preview offline", async () => {
    getStorefrontSite.mockResolvedValue({ site: null, preview: "invalid" });
    expect(await isStoreOfflineForRequest(store("unpublished"))).toBe(true);
  });
});
