import { vi } from "vitest";

/**
 * Global mocks for the agent tests: no database, no network, no model. The
 * packages/lib writers are spies, so tests check what they were called with
 * (seller and store from the context, never from model input).
 */

vi.mock("@workspace/db", async () => (await import("./fake-db")).fakeDbModule);

vi.mock("@workspace/lib/stores/server", () => ({
  getStoreShipping: vi.fn(async () => ({ settings: { freeShippingOver: null }, zones: [] })),
  saveStoreShippingZone: vi.fn(async (_s: string, _a: string, _st: string, zoneId: string | null) => ({ success: true, data: { id: zoneId ?? "11111111-1111-4111-8111-111111111111" } })),
  applyStoreShippingTemplate: vi.fn(async () => ({ success: true, data: [{ id: "z1" }] })),
  updateStoreSettings: vi.fn(async () => ({ success: true, data: { id: "s" } })),
  updateStoreSocialLinks: vi.fn(async () => ({ success: true, data: { links: [] } })),
  updateStoreSeo: vi.fn(async () => ({ success: true, data: {} })),
}));

vi.mock("@workspace/lib/products/agent/server", () => ({
  agentCreateProduct: vi.fn(async () => ({ productId: "p1", status: "draft", slug: "p1", invalidation: { tags: [], paths: [] } })),
  agentUpdateProduct: vi.fn(async () => ({ productId: "p1", status: "active", slug: "p1", invalidation: { tags: [], paths: [] } })),
  agentSetProductStatus: vi.fn(async () => ({ status: "active", changed: true, invalidation: { tags: [], paths: [] } })),
  agentSearchProducts: vi.fn(async () => ({ products: [], nextCursor: null })),
  agentSearchCategories: vi.fn(async () => []),
}));

vi.mock("@workspace/lib/store-sites/server", () => ({
  saveStoreDesignSystem: vi.fn(async (_s: string, _st: string, _input: unknown, version: number) => ({ success: true, data: { version: version + 1 } })),
}));

vi.mock("@workspace/lib/agents/server", () => ({ recordAgentToolCall: vi.fn(async () => true) }));

vi.mock("@workspace/lib/billing/credits", () => ({
  claimAiCredit: vi.fn(async () => ({ ok: true, reference: "ref" })),
  refundAiCredit: vi.fn(async () => undefined),
}));

vi.mock("@workspace/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/ai")>();
  return {
    ...actual,
    logAiUsage: vi.fn(async () => undefined),
    checkDailyCap: vi.fn(async () => ({ used: 0, limit: 100, remaining: 100, allowed: true })),
  };
});
