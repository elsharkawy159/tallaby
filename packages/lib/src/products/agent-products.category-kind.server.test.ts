import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * F-108e: the agent tools refuse a Tallaby category of the other kind. The db
 * is a fake whose every query chain resolves to the next queued rows, in the
 * order the code reads them.
 */
const fake = vi.hoisted(() => {
  const queue: unknown[][] = [];
  const chain = (): unknown =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") {
            const rows = queue.shift() ?? [];
            return (resolve: (value: unknown) => void) => resolve(rows);
          }
          return () => chain();
        },
      },
    );
  const snapshots: unknown[] = [];
  return { queue, snapshots, db: { select: () => chain(), query: { products: { findFirst: async () => snapshots.shift() ?? null } } } };
});

vi.mock("@workspace/db", async (importOriginal) => ({ ...(await importOriginal<typeof import("@workspace/db")>()), db: fake.db }));
vi.mock("../stores/platform-switches.server", () => ({ isSwitchOn: async () => true }));

const { agentCreateProduct, agentUpdateProduct, AgentProductError } = await import("./agent-products.server");

const ctx = { sellerId: "11111111-1111-4111-8111-111111111111", userId: "u", sellerStatus: "approved", storeId: "22222222-2222-4222-8222-222222222222" };
const store = { id: ctx.storeId, status: "active", catalogMode: "own", subdomain: "shop" };
const categoryId = "33333333-3333-4333-8333-333333333333";
const noUpload = async () => ({ ok: false as const, reason: "unused" });

beforeEach(() => {
  fake.queue.length = 0;
  fake.snapshots.length = 0;
});

describe("agent products and category kinds (F-108e)", () => {
  it("refuses a digital category for a new (physical) product", async () => {
    fake.queue.push([store], [{ id: categoryId, kind: "digital" }]);
    const input = { storeId: ctx.storeId, categoryId, title: { ar: "كتاب", en: "Book" }, price: 10, images: [] } as never;
    const error = await agentCreateProduct(ctx, input, noUpload).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AgentProductError);
    expect(error).toMatchObject({ code: "invalid_category", details: { reason: "category_kind_mismatch" } });
  });

  it("refuses a physical category for a digital product", async () => {
    const productId = "44444444-4444-4444-8444-444444444444";
    fake.queue.push(
      [store],
      // requireProduct
      [{ id: productId, status: "active", images: [], deletedAt: null, sku: "S", isBundle: false, productType: "digital" }],
      // resolveCategories
      [{ id: categoryId, kind: "physical" }],
    );
    fake.snapshots.push({ id: productId, sellerId: ctx.sellerId, storeId: ctx.storeId, categoryId: null, productTranslations: [] });
    const input = { storeId: ctx.storeId, productId, categoryId } as never;
    const error = await agentUpdateProduct(ctx, input, noUpload).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "invalid_category", details: { reason: "category_kind_mismatch" } });
  });
});
