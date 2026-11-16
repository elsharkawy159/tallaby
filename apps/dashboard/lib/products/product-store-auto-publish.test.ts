import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The main product status path (`setProductPublished`, also behind the list's
 * bulk publish and the file imports) asks the store to go live after a product
 * was published, and only then (owner, 2026-11-17).
 */
const mocks = vi.hoisted(() => ({
  product: null as Record<string, unknown> | null,
  updates: [] as Record<string, unknown>[],
  autoPublishStoreIfReady: vi.fn(),
  requireStoreProduct: vi.fn(),
  access: { allowed: true, status: "approved" } as { allowed: boolean; status?: string },
}));

vi.mock("@workspace/db", () => ({
  db: {
    query: { products: { findFirst: async () => (mocks.product ? { ...mocks.product, productTranslations: [] } : undefined) } },
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => {
            mocks.updates.push(values);
            mocks.product = { ...mocks.product, ...values };
            return [mocks.product];
          },
        }),
      }),
    }),
  },
  products: {},
  productVariants: {},
  productTranslations: {},
  productQuestions: {},
  productAnswers: {},
}));
vi.mock("drizzle-orm", () => ({ eq: () => null, and: () => null, desc: () => null, asc: () => null, sql: () => null, inArray: () => null, isNull: () => null }));
vi.mock("@workspace/cache", () => ({ applyInvalidation: vi.fn(), invalidateProduct: vi.fn(() => ({ tags: [], paths: [] })) }));
vi.mock("@workspace/db/categories", () => ({
  syncCategoryProductCountForProductChange: vi.fn(),
  syncCategoryProductCountForProductMutation: vi.fn(),
  syncCategoryProductCountOnDelete: vi.fn(),
}));
vi.mock("@workspace/db/products", () => ({ syncProductVariants: vi.fn() }));
vi.mock("@workspace/db/inventory", () => ({ setStockContext: vi.fn() }));
vi.mock("@workspace/lib", () => ({ normalizePrice: vi.fn() }));
vi.mock("@workspace/lib/products/slug/server", () => ({ resolveProductSlug: vi.fn() }));
vi.mock("@workspace/tiptap", () => ({ isRichTextEmpty: () => true, sanitizeRichTextHtml: (html: string) => html }));
vi.mock("xlsx", () => ({}));
vi.mock("@/actions/auth", () => ({ getUser: async () => ({ user: { id: SELLER } }) }));
vi.mock("@/lib/i18n/revalidate-dashboard-path.server", () => ({ revalidateDashboardPath: vi.fn() }));
vi.mock("@/lib/auth/seller-access", () => ({ getSellerAccess: async () => mocks.access }));
vi.mock("@/lib/products/product-store.server", () => ({
  assertProductTaxonomyInStore: vi.fn(),
  requireProductStore: vi.fn(),
  requireStoreProduct: mocks.requireStoreProduct,
}));
vi.mock("@/lib/stores/auto-publish-store.server", () => ({ autoPublishStoreIfReady: mocks.autoPublishStoreIfReady }));

import { setProductPublished } from "@/actions/products";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const PRODUCT = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updates = [];
  mocks.access = { allowed: true, status: "approved" };
  mocks.product = { id: PRODUCT, sellerId: SELLER, storeId: STORE, categoryId: "c1", status: "draft", images: ["a.jpg"] };
  mocks.requireStoreProduct.mockResolvedValue({ seller: { sellerId: SELLER, userId: SELLER }, store: { id: STORE } });
  mocks.autoPublishStoreIfReady.mockResolvedValue(false);
});

describe("setProductPublished and the store going live", () => {
  it("asks once, for the product's checked store, after publishing a product", async () => {
    expect(await setProductPublished(STORE, PRODUCT, true)).toMatchObject({ success: true });

    expect(mocks.updates).toEqual([expect.objectContaining({ status: "active" })]);
    expect(mocks.autoPublishStoreIfReady).toHaveBeenCalledExactlyOnceWith(SELLER, STORE, SELLER);
  });

  it("does not ask when a product is hidden: a live store stays live, an offline one stays offline", async () => {
    mocks.product = { ...mocks.product, status: "active" };

    expect(await setProductPublished(STORE, PRODUCT, false)).toMatchObject({ success: true });
    expect(mocks.updates).toEqual([expect.objectContaining({ status: "draft" })]);
    expect(mocks.autoPublishStoreIfReady).not.toHaveBeenCalled();
  });

  it("does not ask when nothing changed or the product could not be published", async () => {
    mocks.product = { ...mocks.product, status: "active" };
    await setProductPublished(STORE, PRODUCT, true);

    mocks.product = { ...mocks.product, status: "draft", images: [] };
    expect(await setProductPublished(STORE, PRODUCT, true)).toMatchObject({ success: false });

    mocks.product = { ...mocks.product, images: ["a.jpg"] };
    mocks.access = { allowed: true, status: "restricted" };
    expect(await setProductPublished(STORE, PRODUCT, true)).toMatchObject({ success: false });

    expect(mocks.updates).toEqual([]);
    expect(mocks.autoPublishStoreIfReady).not.toHaveBeenCalled();
  });

  it("does not ask for a product outside the store", async () => {
    mocks.requireStoreProduct.mockRejectedValue(new Error("not_found"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(await setProductPublished(STORE, PRODUCT, true)).toMatchObject({ success: false });
    expect(mocks.autoPublishStoreIfReady).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
