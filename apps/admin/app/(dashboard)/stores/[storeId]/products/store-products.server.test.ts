import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@workspace/cache", () => ({ applyInvalidation: vi.fn() }));
vi.mock("@workspace/db/supabase/service", () => ({ getServiceClient: vi.fn() }));
vi.mock("@workspace/lib/products/agent/server", () => {
  class AgentProductError extends Error {
    constructor(readonly code: string, message: string) {
      super(message);
    }
  }
  return {
    AgentProductError,
    agentCreateProduct: vi.fn(),
    agentRestoreProducts: vi.fn(),
    agentSearchCategories: vi.fn(),
    agentSetProductStatus: vi.fn(),
    agentTrashProducts: vi.fn(),
  };
});
vi.mock("./store-products-access.server", () => {
  class StoreProductsAccessError extends Error {
    constructor(readonly code: "not_admin" | "not_found") {
      super(code);
    }
  }
  return {
    StoreProductsAccessError,
    requireStoreProductsAccess: vi.fn(),
    auditStoreProducts: vi.fn(),
    sellerFolderImageUploader: vi.fn(() => "uploader"),
  };
});

import { applyInvalidation } from "@workspace/cache";
import { AgentProductError, agentCreateProduct, agentSetProductStatus, agentTrashProducts } from "@workspace/lib/products/agent/server";
import { StoreProductsAccessError, auditStoreProducts, requireStoreProductsAccess, sellerFolderImageUploader } from "./store-products-access.server";
import { emptyStoreProductForm } from "./store-products.lib";
import { createStoreProductAction, setStoreProductStatusAction, trashStoreProductsAction } from "./store-products.server";

const STORE = "11111111-1111-4111-8111-111111111111";
const SELLER = "22222222-2222-4222-8222-222222222222";
const ADMIN = "33333333-3333-4333-8333-333333333333";
const CATEGORY = "44444444-4444-4444-8444-444444444444";
const PRODUCT = "55555555-5555-4555-8555-555555555555";
const invalidation = { tags: ["t"], paths: [] };

const access = {
  adminId: ADMIN,
  canWrite: true,
  store: { id: STORE, name: "Mugs", sellerId: SELLER, subdomain: "mugs", status: "active", currencyLabel: "جنيه" },
  ctx: { sellerId: SELLER, userId: ADMIN, sellerStatus: "approved", storeId: STORE },
};

const form = () => ({
  ...emptyStoreProductForm(),
  titleAr: "مج",
  titleEn: "Mug",
  price: "120",
  quantity: "3",
  categoryId: CATEGORY,
  images: [`https://abc.supabase.co/storage/v1/object/public/products/${SELLER}/2026-11-12/1731400000000-mug.jpg`],
});

describe("Admin store product actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireStoreProductsAccess).mockResolvedValue(access as never);
  });

  it("creates through the shared command as the store's seller, with the store's own photo check, then audits", async () => {
    vi.mocked(agentCreateProduct).mockResolvedValueOnce({ productId: PRODUCT, status: "active", slug: "mug", invalidation } as never);
    const result = await createStoreProductAction(STORE, form());
    expect(result).toMatchObject({ success: true, data: { productId: PRODUCT, status: "active" } });
    expect(requireStoreProductsAccess).toHaveBeenCalledWith(STORE, { forWrite: true });
    const [ctx, input, uploader] = vi.mocked(agentCreateProduct).mock.calls[0]!;
    expect(ctx).toBe(access.ctx);
    expect(input).toMatchObject({ storeId: STORE, title: { ar: "مج", en: "Mug" }, price: 120, quantity: 3, publish: true });
    expect(sellerFolderImageUploader).toHaveBeenCalledWith(SELLER);
    expect(uploader).toBe("uploader");
    expect(applyInvalidation).toHaveBeenCalledWith(invalidation, { from: "admin", mode: "action" });
    expect(auditStoreProducts).toHaveBeenCalledWith(access, "create_store_product", expect.objectContaining({ productId: PRODUCT }));
  });

  it("uses the route's store id, never one inside the form values", async () => {
    vi.mocked(agentCreateProduct).mockResolvedValueOnce({ productId: PRODUCT, status: "active", slug: "mug", invalidation } as never);
    await createStoreProductAction(STORE, { ...form(), storeId: "99999999-9999-4999-8999-999999999999" } as never);
    expect(vi.mocked(agentCreateProduct).mock.calls[0]![1].storeId).toBe(STORE);
  });

  it("says a product saved as a draft could not go live when the seller can't publish", async () => {
    vi.mocked(agentCreateProduct).mockResolvedValueOnce({ productId: PRODUCT, status: "draft", slug: "mug", invalidation } as never);
    const result = await createStoreProductAction(STORE, form());
    expect(result).toMatchObject({ success: true, message: expect.stringMatching(/draft/) });
  });

  it("refuses an invalid form before any write", async () => {
    const result = await createStoreProductAction(STORE, { ...form(), titleEn: "" });
    expect(result.success).toBe(false);
    expect(agentCreateProduct).not.toHaveBeenCalled();
    expect(auditStoreProducts).not.toHaveBeenCalled();
  });

  it("refuses a non-admin and a missing store", async () => {
    vi.mocked(requireStoreProductsAccess).mockRejectedValueOnce(new StoreProductsAccessError("not_admin"));
    expect(await createStoreProductAction(STORE, form())).toMatchObject({ success: false, error: expect.stringMatching(/admins/) });
    vi.mocked(requireStoreProductsAccess).mockRejectedValueOnce(new StoreProductsAccessError("not_found"));
    expect(await setStoreProductStatusAction(STORE, PRODUCT, "active")).toMatchObject({ success: false });
    expect(agentCreateProduct).not.toHaveBeenCalled();
    expect(agentSetProductStatus).not.toHaveBeenCalled();
  });

  it("maps a product outside the store to a clear message and writes no audit", async () => {
    vi.mocked(agentSetProductStatus).mockRejectedValueOnce(new AgentProductError("not_found", "x"));
    expect(await setStoreProductStatusAction(STORE, PRODUCT, "draft")).toEqual({ success: false, error: "That product is not in this store." });
    expect(auditStoreProducts).not.toHaveBeenCalled();
  });

  it("only accepts active or draft", async () => {
    expect(await setStoreProductStatusAction(STORE, PRODUCT, "rejected" as never)).toMatchObject({ success: false });
    expect(requireStoreProductsAccess).not.toHaveBeenCalled();
  });

  it("trashes only what the shared command found in the store, and caps the list", async () => {
    vi.mocked(agentTrashProducts).mockResolvedValueOnce({ trashed: [PRODUCT], invalidation } as never);
    const ids = Array.from({ length: 60 }, () => PRODUCT);
    const result = await trashStoreProductsAction(STORE, [...ids, 5 as never]);
    expect(result).toEqual({ success: true, message: "Moved to Trash" });
    expect(vi.mocked(agentTrashProducts).mock.calls[0]![1]).toHaveLength(50);
    expect(auditStoreProducts).toHaveBeenCalledWith(access, "trash_store_products", { productIds: [PRODUCT] });
  });
});
