import { beforeEach, describe, expect, it, vi } from "vitest";

const getStorefrontSite = vi.fn();
const getStoreActivationAccess = vi.fn();

vi.mock("./preview.server", () => ({ getStorefrontSite: (...args: unknown[]) => getStorefrontSite(...args) }));
vi.mock("./activation.server", () => ({
  getStoreActivationAccess: (...args: unknown[]) => getStoreActivationAccess(...args),
}));
vi.mock("@/lib/storefront.server", () => ({
  isStorefrontOffline: (store: { siteStatus: string }) => store.siteStatus !== "published",
  resolveStorefront: vi.fn(),
}));

const { isStoreOfflineForRequest, isStoreOwnerPreviewForRequest } = await import("./offline.server");

const store = (siteStatus: "draft" | "published" | "unpublished") => ({
  id: "seller-1",
  storeId: "store-1",
  subdomain: "faster",
  siteStatus,
});

describe("isStoreOfflineForRequest", () => {
  beforeEach(() => {
    getStorefrontSite.mockReset();
    getStoreActivationAccess.mockReset();
    getStoreActivationAccess.mockResolvedValue("public");
  });

  it("is false for a published store, without reading the preview", async () => {
    expect(await isStoreOfflineForRequest(store("published"))).toBe(false);
    expect(getStorefrontSite).not.toHaveBeenCalled();
    expect(getStoreActivationAccess).toHaveBeenCalledWith("seller-1", "store-1");
  });

  it("is true for a published store of a seller who isn't activated, without a pass (F-76)", async () => {
    getStoreActivationAccess.mockResolvedValue("private");
    expect(await isStoreOfflineForRequest(store("published"))).toBe(true);
    expect(await isStoreOwnerPreviewForRequest(store("published"))).toBe(false);
  });

  it("opens it for the seller's own pass, with the banner (F-76)", async () => {
    getStoreActivationAccess.mockResolvedValue("owner_preview");
    expect(await isStoreOfflineForRequest(store("published"))).toBe(false);
    expect(await isStoreOwnerPreviewForRequest(store("published"))).toBe(true);
  });

  it("never opens a draft or switched-off store with the owner pass (F-76)", async () => {
    getStoreActivationAccess.mockResolvedValue("owner_preview");
    getStorefrontSite.mockResolvedValue({ site: null, preview: null });
    expect(await isStoreOfflineForRequest(store("unpublished"))).toBe(true);
    expect(await isStoreOwnerPreviewForRequest(store("draft"))).toBe(false);
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

  it("keeps an invalid preview offline", async () => {
    getStorefrontSite.mockResolvedValue({ site: null, preview: "invalid" });
    expect(await isStoreOfflineForRequest(store("unpublished"))).toBe(true);
  });
});
