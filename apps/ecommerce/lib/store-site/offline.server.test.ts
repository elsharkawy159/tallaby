import { beforeEach, describe, expect, it, vi } from "vitest";

const getStorefrontSite = vi.fn();

vi.mock("./preview.server", () => ({ getStorefrontSite: (...args: unknown[]) => getStorefrontSite(...args) }));
vi.mock("@/lib/storefront.server", () => ({
  isStorefrontOffline: (store: { siteStatus: string }) => store.siteStatus === "unpublished",
  resolveStorefront: vi.fn(),
}));

const { isStoreOfflineForRequest } = await import("./offline.server");

const store = (siteStatus: "draft" | "published" | "unpublished") => ({
  id: "seller-1",
  storeId: "store-1",
  subdomain: "faster",
  siteStatus,
});

describe("isStoreOfflineForRequest", () => {
  beforeEach(() => getStorefrontSite.mockReset());

  it("is false for published and never-published stores, without reading the preview", async () => {
    expect(await isStoreOfflineForRequest(store("published"))).toBe(false);
    expect(await isStoreOfflineForRequest(store("draft"))).toBe(false);
    expect(getStorefrontSite).not.toHaveBeenCalled();
  });

  it("is true for an unpublished store", async () => {
    getStorefrontSite.mockResolvedValue({ site: null, preview: null });
    expect(await isStoreOfflineForRequest(store("unpublished"))).toBe(true);
  });

  it("lets a verified draft preview through", async () => {
    getStorefrontSite.mockResolvedValue({ site: {}, preview: "active" });
    expect(await isStoreOfflineForRequest(store("unpublished"))).toBe(false);
  });

  it("keeps an invalid preview offline", async () => {
    getStorefrontSite.mockResolvedValue({ site: null, preview: "invalid" });
    expect(await isStoreOfflineForRequest(store("unpublished"))).toBe(true);
  });
});
