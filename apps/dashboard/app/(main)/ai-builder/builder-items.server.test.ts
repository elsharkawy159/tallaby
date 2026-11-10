import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseBuilderState, type BuilderFileRow } from "./builder.dto";
import type { BuildItem } from "./builder.lib";

const mocks = vi.hoisted(() => ({
  agentSetProductStatus: vi.fn(),
  publishStoreSite: vi.fn(),
  saveStoreDesignSystem: vi.fn(),
  saveStorePageDraft: vi.fn(),
  runBulkBatch: vi.fn(),
  boundStore: vi.fn(),
  saveBuild: vi.fn(),
  checkBuildSpend: vi.fn(),
  checkModelCall: vi.fn(),
  dbRows: [] as unknown[],
}));

const chain = () => {
  const result = {
    from: () => result,
    where: () => result,
    limit: async () => mocks.dbRows,
    then: (resolve: (rows: unknown[]) => unknown) => resolve(mocks.dbRows),
  };
  return result;
};

vi.mock("@workspace/ai", () => ({ generateStructured: vi.fn() }));
vi.mock("@workspace/cache", () => ({ applyInvalidation: vi.fn(), invalidateStoreSite: vi.fn(() => ({ tags: [], paths: [] })) }));
vi.mock("@workspace/db", () => ({
  and: () => null,
  count: () => null,
  eq: () => null,
  gte: () => null,
  inArray: () => null,
  isNull: () => null,
  notInArray: () => null,
  products: {},
  storeDesignSystems: {},
  stores: {},
  db: { select: () => chain(), update: () => ({ set: () => ({ where: async () => [] }) }) },
}));
vi.mock("@workspace/lib/products/agent/server", () => ({ AgentProductError: class extends Error {}, agentSetProductStatus: mocks.agentSetProductStatus }));
vi.mock("@workspace/lib/store-sites/server", () => ({
  publishStoreSite: mocks.publishStoreSite,
  saveStoreDesignSystem: mocks.saveStoreDesignSystem,
  saveStorePageDraft: mocks.saveStorePageDraft,
}));
vi.mock("@workspace/lib/store-wallet/server", () => ({ grantWelcomeGiftSafely: vi.fn() }));
vi.mock("@workspace/lib/stores/server", () => ({ getStore: vi.fn(), getStoreShipping: vi.fn(), listStores: vi.fn() }));
vi.mock("@workspace/store-sections/config", async () => vi.importActual("@workspace/store-sections/config"));
vi.mock("@/app/(main)/stores/[storeId]/products/add/from-file/from-file-run.server", () => ({ runBulkBatch: mocks.runBulkBatch }));
vi.mock("@/app/(main)/stores/[storeId]/products/categories-brands/categories-brands.server", () => ({ ensureTaxonomyItem: vi.fn(async () => ({ success: true })) }));
vi.mock("@/lib/stock-photos/pexels.server", () => ({ pexelsConfigured: () => false, searchPexels: vi.fn() }));
vi.mock("./builder-run.server", () => ({
  ALLOWED: undefined,
  boundStore: mocks.boundStore,
  builtProductIds: (items: Map<string, BuildItem>) => [...items.values()].flatMap((item) => (item.data.productIds as string[] | undefined) ?? (item.productId ? [item.productId] : [])),
  currentPolicy: vi.fn(),
  draftPages: vi.fn(async () => []),
  draftRows: vi.fn(async () => []),
  requireStoreOf: vi.fn(async () => ({ id: STORE, subdomain: "oud", defaultLocale: "ar" })),
  storeLocale: () => "ar",
}));
vi.mock("./builder.store.server", () => ({
  buildSpendMicroUsd: async () => 0,
  checkBuildSpend: mocks.checkBuildSpend,
  checkModelCall: mocks.checkModelCall,
  giveCreditBack: vi.fn(),
  loadItems: vi.fn(),
  saveBuild: mocks.saveBuild,
}));

const STORE = "44444444-4444-4444-8444-444444444444";
const { v2SpecFor } = await import("./builder-items.server");

const CTX = { sellerId: "33333333-3333-4333-8333-333333333333", userId: "33333333-3333-4333-8333-333333333333", sellerStatus: "approved" };
const row = (n: number, patch: Partial<BuilderFileRow> = {}): BuilderFileRow => ({
  row: n,
  name: `Bag ${n}`,
  nameEn: null,
  price: 45000,
  compareAt: null,
  stock: 3,
  unlimited: false,
  images: [],
  category: "Bags",
  description: null,
  sku: null,
  ...patch,
});
const build = (patch: Partial<ReturnType<typeof parseBuilderState>> = {}, extra: Record<string, unknown> = {}) => ({
  id: "55555555-5555-4555-8555-555555555555",
  sellerId: CTX.sellerId,
  storeId: STORE,
  targetStoreId: STORE,
  intakeId: null,
  source: "hero" as const,
  publishedAt: null as string | null,
  status: "building" as const,
  free: true,
  state: { ...parseBuilderState({}), flow: "v2" as const, name: "Oud", ...patch },
  chatTurns: 0,
  siteCopyRuns: 0,
  stopReason: null as string | null,
  createdAt: "2026-11-08T00:00:00.000Z",
  ...extra,
});
const item = (key: string, data: Record<string, unknown>, productId: string | null = null): [string, BuildItem] => [key, { key, status: "done", attempts: 0, data, productId }];
const run = async (key: string, b = build(), items = new Map<string, BuildItem>()) => (await v2SpecFor(CTX, b, key, items))!.apply(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.dbRows = [];
  mocks.boundStore.mockResolvedValue("ok");
  mocks.publishStoreSite.mockResolvedValue({ success: true, data: { revisionId: "r", revisionNumber: 1 } });
  mocks.agentSetProductStatus.mockResolvedValue({ status: "active", changed: true, invalidation: { tags: [], paths: [] } });
  mocks.checkBuildSpend.mockResolvedValue(true);
  mocks.checkModelCall.mockResolvedValue({ ok: false, reason: "budget" });
});

describe("publish (D1, D3, D4)", () => {
  it("publishes the site of a store with zero products (D3), only if never published, and records it", async () => {
    const outcome = await run("publish");
    expect(mocks.publishStoreSite).toHaveBeenCalledWith(CTX.sellerId, STORE, CTX.userId, expect.objectContaining({ onlyIfNeverPublished: true, requireTemplateChoice: true }));
    expect(outcome.data).toMatchObject({ live: 0, published: true, publishError: null });
    expect(mocks.saveBuild).toHaveBeenCalledWith(CTX.sellerId, expect.any(String), { publishedAt: expect.any(String) });
  });

  it("sets only complete products live; drafts missing a photo or stock stay drafts (D4)", async () => {
    const items = new Map([
      item("products_file:0", { products: [{ id: "a", missing: [] }, { id: "b", missing: ["photo"] }, { id: "c", missing: ["stock"] }], productIds: ["a", "b", "c"] }),
      item("product:x", { missing: [] }, "d"),
      item("product:y", { missing: ["photo"] }, "e"),
    ]);
    const outcome = await run("publish", build(), items);
    expect(mocks.agentSetProductStatus.mock.calls.map((call) => call[1])).toEqual(["a", "d"]);
    expect(outcome.data).toMatchObject({ live: 2 });
  });

  it("never publishes a store the seller published or switched off, and never fails the build on a publish error", async () => {
    mocks.boundStore.mockResolvedValue("published");
    expect((await run("publish")).data).toMatchObject({ published: false, publishError: "already_published" });
    expect(mocks.publishStoreSite).not.toHaveBeenCalled();

    mocks.boundStore.mockResolvedValue("ok");
    mocks.publishStoreSite.mockResolvedValue({ success: false, error: "publish_blocked" });
    const blocked = await run("publish");
    expect(blocked.status).toBeUndefined();
    expect(blocked.data).toMatchObject({ published: false, publishError: "publish_blocked" });
  });

  it("does not publish twice when the step runs again after it published", async () => {
    await run("publish", build({}, { publishedAt: "2026-11-08T01:00:00.000Z" }));
    expect(mocks.publishStoreSite).not.toHaveBeenCalled();
  });
});

describe("products from the file (F-82f)", () => {
  it("runs one batch through the importer: the build id on the log, no credits on the free build, saved hidden", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(i + 2));
    mocks.runBulkBatch.mockResolvedValue({
      ok: true,
      results: [{ row: 12, outcome: "draft", sku: "IMP-1-12", title: "Bag 12", notes: ["noImage"] }],
      creditsUsed: 0,
      stop: null,
      retryable: false,
    });
    mocks.dbRows = [{ id: "p2", sku: "IMP-1-12", images: [] }];
    const outcome = await run("products_file:1", build({ fileKey: "a".repeat(32), fileRows: rows }));
    const [sellerId, input, options] = mocks.runBulkBatch.mock.calls[0]!;
    expect(sellerId).toBe(CTX.sellerId);
    // Batch 1 is rows 12 and 13 (the second 10).
    expect(input.rows.map((r: { row: number }) => r.row)).toEqual([12, 13]);
    expect(input.rows[0]).toMatchObject({ name: "Bag 12", price: "450", stock: "3", category: "Bags" });
    expect(options).toMatchObject({ refId: build().id, credits: false, ai: true, keepDraft: true });
    expect(outcome.data).toMatchObject({ products: [{ id: "p2", missing: ["photo"] }], productIds: ["p2"] });
  });

  it("run again, finds what it made before by its fixed SKUs ('already') and adds nothing twice", async () => {
    mocks.runBulkBatch.mockResolvedValue({ ok: true, results: [{ row: 2, outcome: "already", sku: "IMP-1-2" }], creditsUsed: 0, stop: null, retryable: false });
    mocks.dbRows = [{ id: "p2", sku: "IMP-1-2", images: ["x.jpg"] }];
    const outcome = await run("products_file:0", build({ fileKey: "a".repeat(32), fileRows: [row(2)], paid: true }));
    expect(mocks.runBulkBatch.mock.calls[0]![2]).toMatchObject({ credits: true });
    expect(outcome.data).toMatchObject({ products: [{ id: "p2", missing: [] }], notAdded: 0 });
  });

  it("past the spend stop, adds the rows that need no copy and records the stop", async () => {
    mocks.checkBuildSpend.mockResolvedValue(false);
    mocks.runBulkBatch.mockResolvedValue({ ok: true, results: [{ row: 2, outcome: "remaining", sku: "IMP-1-2" }], creditsUsed: 0, stop: "disabled", retryable: false });
    const b = build({ fileKey: "a".repeat(32), fileRows: [row(2)] });
    const outcome = await run("products_file:0", b);
    expect(mocks.runBulkBatch.mock.calls[0]![2]).toMatchObject({ ai: false });
    expect(mocks.saveBuild).toHaveBeenCalledWith(CTX.sellerId, b.id, { stopReason: "budget" });
    expect(outcome.data).toMatchObject({ notAdded: 1, stop: "budget" });
  });

  it("passes the seller's 'always in stock' rows, and never a row without a price", async () => {
    mocks.runBulkBatch.mockResolvedValue({ ok: true, results: [], creditsUsed: 0, stop: null, retryable: false });
    await run("products_file:0", build({ fileKey: "a".repeat(32), fileRows: [row(2, { unlimited: true, stock: null }), row(3, { price: null })] }));
    const [, input, options] = mocks.runBulkBatch.mock.calls[0]!;
    expect(input.rows.map((r: { row: number }) => r.row)).toEqual([2]);
    expect([...options.unlimitedRows]).toEqual([2]);
  });
});

describe("brand", () => {
  it("saves the template's design system wearing the seller's colour, at its version", async () => {
    mocks.dbRows = [{ colors: { primary: "#000000", background: "#ffffff" }, typography: {}, spacing: {}, version: 4 }];
    mocks.saveStoreDesignSystem.mockResolvedValue({ success: true, data: { version: 5 } });
    const outcome = await run("brand", build({ primaryColor: "#1e5bb8" }));
    expect(mocks.saveStoreDesignSystem).toHaveBeenCalledWith(CTX.sellerId, STORE, expect.objectContaining({ colors: expect.objectContaining({ primary: "#1e5bb8", background: "#ffffff" }) }), 4);
    expect(outcome.data).toMatchObject({ primary: "#1e5bb8" });
  });

  it("keeps the template's colours when the seller chose them", async () => {
    mocks.dbRows = [{ colors: { primary: "#000000" }, typography: {}, spacing: {}, version: 1 }];
    const outcome = await run("brand", build({ primaryColor: null }));
    expect(mocks.saveStoreDesignSystem).not.toHaveBeenCalled();
    expect(outcome.data).toEqual({ kept: "template_colors" });
  });
});
