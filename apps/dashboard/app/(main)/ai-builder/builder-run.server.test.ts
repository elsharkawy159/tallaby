import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseBuilderState } from "./builder.dto";

const mocks = vi.hoisted(() => ({
  autofillProduct: vi.fn(),
  agentCreateProduct: vi.fn(),
  agentSetProductStatus: vi.fn(),
  existingSku: [] as { id: string }[],
  items: new Map<string, unknown>(),
  saveBuild: vi.fn(),
  saveItem: vi.fn(),
  checkModelCall: vi.fn(),
  publishStoreSite: vi.fn(),
  getStore: vi.fn(),
  listStores: vi.fn(),
  createStore: vi.fn(),
  setStoreCatalog: vi.fn(),
}));

vi.mock("@workspace/ai", () => ({ generateStructured: vi.fn() }));
vi.mock("@workspace/cache", () => ({ applyInvalidation: vi.fn(), invalidateStorefront: vi.fn(() => ({ tags: [], paths: [] })) }));
vi.mock("@workspace/db", () => ({
  and: () => null,
  asc: () => null,
  eq: () => null,
  inArray: () => null,
  isNull: () => null,
  or: () => null,
  sql: () => null,
  products: { id: "id", sellerId: "s", sku: "k" },
  sellers: {},
  storePages: {},
  stores: {},
  templateInstalls: {},
  db: { select: () => ({ from: () => ({ where: () => ({ limit: async () => mocks.existingSku }) }) }) },
}));
vi.mock("@workspace/lib/store-forms", () => ({ buildTemplateForm: vi.fn(), getFormTemplate: vi.fn() }));
vi.mock("@workspace/lib/orders", () => ({ sendStoreCreatedEmail: vi.fn() }));
vi.mock("@workspace/lib/products/agent", async () => vi.importActual("@workspace/lib/products/agent"));
vi.mock("@workspace/lib/products/agent/server", () => ({
  AgentProductError: class extends Error {},
  agentCreateProduct: mocks.agentCreateProduct,
  agentSetProductStatus: mocks.agentSetProductStatus,
}));
vi.mock("@workspace/lib/shipping/store-zones", () => ({ templateZones: () => [] }));
vi.mock("@workspace/lib/store-sites/server", () => ({ applyStoreTemplate: vi.fn(), saveStorePageDraft: vi.fn(), publishStoreSite: mocks.publishStoreSite }));
vi.mock("@workspace/lib/stores/server", () => ({
  applyStoreShippingTemplate: vi.fn(),
  checkStoreSubdomain: vi.fn(),
  createStore: mocks.createStore,
  getStore: mocks.getStore,
  getStoreShipping: vi.fn(),
  listStores: mocks.listStores,
  saveStoreShippingZone: vi.fn(),
  setStoreCatalog: mocks.setStoreCatalog,
  updateStoreSeo: vi.fn(),
  updateStoreSettings: vi.fn(),
  updateStoreSocialLinks: vi.fn(),
}));
vi.mock("@workspace/store-sections/config", () => ({ pageContentSchema: { safeParse: () => ({ success: false }) }, validatePageContent: () => ({ success: true }) }));
vi.mock("@workspace/store-sections/render", () => ({ contentOverrideKeys: () => ({}), storeSectionRegistry: { allowedSections: () => ({}) } }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));
vi.mock("@/actions/categories", () => ({ getAllCategories: async () => ({ data: [{ id: "22222222-2222-4222-8222-222222222222", name: "Candles", nameAr: "شموع", slug: "candles", level: 1 }] }) }));
vi.mock("@/app/(main)/products/add/ai/ai-autofill.server", () => ({ autofillProduct: mocks.autofillProduct }));
vi.mock("@/app/(main)/stores/[storeId]/shipping/ai/ai-zones.server", () => ({ proposeZones: vi.fn() }));
vi.mock("./builder.store.server", () => ({
  buildSpendMicroUsd: async () => 0,
  checkModelCall: mocks.checkModelCall,
  giveCreditBack: vi.fn(),
  loadItems: async () => mocks.items,
  saveBuild: mocks.saveBuild,
  saveItem: mocks.saveItem,
}));

const { runBuildStep, builderSku } = await import("./builder-run.server");

const CTX = { sellerId: "33333333-3333-4333-8333-333333333333", userId: "33333333-3333-4333-8333-333333333333", sellerStatus: "approved" };
const STORE = "44444444-4444-4444-8444-444444444444";
const PHOTO = `ai-builder/${CTX.sellerId}/b/p.jpg`;

const product = { id: "abc123", name: "Vanilla candle", details: "soy wax", price: 150, compareAtPrice: null, stock: 20, unlimited: false, photos: [PHOTO] };
const build = () => ({
  id: "55555555-5555-4555-8555-555555555555",
  sellerId: CTX.sellerId,
  storeId: STORE,
  status: "building" as const,
  free: true,
  state: { ...parseBuilderState({}), name: "Noor", industryId: "handmade", products: [product] },
  chatTurns: 0,
  siteCopyRuns: 0,
  stopReason: null,
  createdAt: "2026-11-03T00:00:00.000Z",
});

const copy = {
  title: "Vanilla candle",
  description: "A soy wax candle.",
  bulletPoints: ["Soy wax"],
  metaTitle: "Vanilla candle",
  metaDescription: "A soy wax candle.",
  metaKeywords: ["candle"],
  contentBlocks: [],
};
const autofill = {
  localized: { ar: { ...copy, title: "شمعة فانيليا" }, en: copy },
  categoryHint: "candles",
  brandName: null,
  storeCategoryName: "شموع",
  // The model's figures: they must never reach the product.
  price: { list: 9999, final: null, discountPercent: null, discountEndsAt: null },
  quantity: 777,
  condition: "new",
  variantTypes: [],
  reviews: [],
  productPhotos: [0],
  missing: [],
  warnings: [],
  dimensions: {},
  sku: "MODEL-SKU",
  showLiveViews: null,
};

const doneBefore = ["store", "settings", "template", "site_copy"];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.existingSku = [];
  mocks.items = new Map(doneBefore.map((key) => [key, { key, status: "done", attempts: 0, data: {}, productId: null }]));
  mocks.checkModelCall.mockResolvedValue({ ok: true, creditReference: null });
  mocks.getStore.mockResolvedValue({ id: STORE, name: "Noor", subdomain: "noor", defaultLocale: "ar" });
  mocks.autofillProduct.mockResolvedValue({ output: autofill, cached: false });
  mocks.agentCreateProduct.mockResolvedValue({ productId: "p1", status: "draft", slug: "s", invalidation: { tags: [], paths: [] } });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1, 2]), { headers: { "content-type": "image/jpeg" } })));
});

describe("building a product", () => {
  it("writes copy under its own feature name, and creates a draft with the seller's figures", async () => {
    await runBuildStep(CTX, build());
    expect(mocks.autofillProduct.mock.calls[0]![2]).toEqual({ feature: "store_builder_product" });
    expect(mocks.checkModelCall).toHaveBeenCalledWith(expect.anything(), "store_builder_product");

    const [context, input] = mocks.agentCreateProduct.mock.calls[0]!;
    expect(context).toMatchObject({ sellerId: CTX.sellerId, storeId: STORE });
    expect(input).toMatchObject({
      storeId: STORE,
      publish: false,
      price: 150,
      quantity: 20,
      sku: builderSku(build().id, product.id),
      categoryId: "22222222-2222-4222-8222-222222222222",
      title: { ar: "شمعة فانيليا", en: "Vanilla candle" },
    });
  });

  it("takes only this seller's own stored photos", async () => {
    await runBuildStep(CTX, build());
    const upload = mocks.agentCreateProduct.mock.calls[0]![2] as (url: string) => Promise<{ ok: boolean; path?: string }>;
    const [url] = mocks.agentCreateProduct.mock.calls[0]![1].images;
    await expect(upload(url)).resolves.toEqual({ ok: true, path: PHOTO });
    await expect(upload("https://evil.example/x.jpg")).resolves.toMatchObject({ ok: false });
    await expect(upload(url.replace(CTX.sellerId, "other-seller"))).resolves.toMatchObject({ ok: false });
  });

  it("finds the product on a retry instead of creating it twice", async () => {
    mocks.existingSku = [{ id: "already-there" }];
    await runBuildStep(CTX, build());
    expect(mocks.agentCreateProduct).not.toHaveBeenCalled();
    expect(mocks.items.get("product:abc123")).toMatchObject({ status: "done", productId: "already-there" });
  });

  it("never pays again for copy it saved", async () => {
    mocks.agentCreateProduct.mockRejectedValueOnce(new Error("db down"));
    await runBuildStep(CTX, build());
    expect(mocks.autofillProduct).toHaveBeenCalledTimes(1);
    expect((mocks.items.get("product:abc123") as { data: { generated?: unknown } }).data.generated).toBeDefined();
    await runBuildStep(CTX, build());
    expect(mocks.autofillProduct).toHaveBeenCalledTimes(1);
    expect(mocks.items.get("product:abc123")).toMatchObject({ status: "done", productId: "p1" });
  });

  it("skips it at the hard stop and says why", async () => {
    mocks.checkModelCall.mockResolvedValue({ ok: false, reason: "budget" });
    const b = build();
    await runBuildStep(CTX, b);
    expect(mocks.autofillProduct).not.toHaveBeenCalled();
    expect(mocks.agentCreateProduct).not.toHaveBeenCalled();
    expect(mocks.items.get("product:abc123")).toMatchObject({ status: "skipped", data: { skipped: "budget" } });
    expect(mocks.saveBuild).toHaveBeenCalledWith(CTX.sellerId, b.id, { stopReason: "budget" });
  });
});

describe("the end of a build", () => {
  it("goes to review and never publishes anything", async () => {
    mocks.items = new Map(
      ["store", "settings", "template", "site_copy", "product:abc123", "catalog", "shipping", "policy", "notes"].map((key) => [key, { key, status: "done", attempts: 0, data: {}, productId: null }]),
    );
    const result = await runBuildStep(CTX, build());
    expect(result.finished).toBe(true);
    expect(result.build.status).toBe("review");
    expect(mocks.publishStoreSite).not.toHaveBeenCalled();
    expect(mocks.agentSetProductStatus).not.toHaveBeenCalled();
  });

  it("ends at the review when the plan's store limit is reached", async () => {
    mocks.items = new Map();
    mocks.listStores.mockResolvedValue([]);
    mocks.createStore.mockResolvedValue({ success: false, error: "limit_reached" });
    const { checkStoreSubdomain } = await import("@workspace/lib/stores/server");
    vi.mocked(checkStoreSubdomain).mockResolvedValue({ status: "available", subdomain: "noor", suggestions: [] });
    const result = await runBuildStep(CTX, { ...build(), storeId: null });
    expect(result.finished).toBe(true);
    expect(result.build).toMatchObject({ status: "review", stopReason: "store_limit" });
  });
});
