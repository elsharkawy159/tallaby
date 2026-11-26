import { beforeEach, describe, expect, it, vi } from "vitest";
import { joinSectionFile } from "@workspace/store-sections/code-file";

const mocks = vi.hoisted(() => ({
  requireStore: vi.fn(),
  generateStructured: vi.fn(),
  checkDailyCap: vi.fn(),
  logAiUsage: vi.fn(),
  claimAiCredit: vi.fn(),
  refundAiCredit: vi.fn(),
  getBillingState: vi.fn(),
  isSwitchOn: vi.fn(),
  loadCodePreviewCatalog: vi.fn(),
}));

class FakeAccessError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const DB_ROW = { plan: "free", planExpiresAt: null, planGraceUntil: null, defaultLocale: "ar", supportedLocales: ["ar", "en"] };

vi.mock("@/lib/auth/require-seller.server", () => ({
  requireStore: mocks.requireStore,
  isAccessError: (error: unknown) => error instanceof FakeAccessError,
}));
vi.mock("@workspace/ai", () => ({
  aiConfigured: () => true,
  aiErrorKind: () => "failed",
  checkDailyCap: mocks.checkDailyCap,
  generateStructured: mocks.generateStructured,
  logAiUsage: mocks.logAiUsage,
  modelIdForTier: () => "model",
}));
vi.mock("@workspace/db", () => ({
  db: { select: () => ({ from: () => ({ where: () => Object.assign(Promise.resolve([DB_ROW]), { limit: async () => [DB_ROW] }) }) }) },
  and: () => null,
  eq: () => null,
  isNull: () => null,
  sellers: { id: "id", plan: "plan", planExpiresAt: "e", planGraceUntil: "g" },
  stores: { id: "id", sellerId: "s", deletedAt: "d", defaultLocale: "l", supportedLocales: "sl" },
}));
vi.mock("@workspace/lib", () => ({ currencyLabelText: () => "ج.م", parseStoreCurrency: () => ({ currency: "EGP", label: null }) }));
vi.mock("@workspace/lib/billing", () => ({ isProActive: () => false }));
vi.mock("@workspace/lib/billing/credits", () => ({ claimAiCredit: mocks.claimAiCredit, refundAiCredit: mocks.refundAiCredit }));
vi.mock("@workspace/lib/billing/server", () => ({ getBillingState: mocks.getBillingState }));
vi.mock("@workspace/lib/store-sites/preview-product", () => ({ getStorePreviewProduct: async () => null }));
vi.mock("@workspace/lib/storefront", () => ({ storeUrl: () => "https://shop.example" }));
vi.mock("@workspace/lib/storefront/server", () => ({ findActiveCustomDomainForSubdomain: async () => null }));
vi.mock("@/lib/stores/platform-switches.server", () => ({ isSwitchOn: mocks.isSwitchOn }));
vi.mock("./code-preview.data", () => ({
  loadCodePreviewStore: async () => ({ name: "متجري", subdomain: "shop", logoUrl: null, settings: {}, colors: { primary: "#145163" }, typography: {}, spacing: {}, pageKind: "page" }),
  loadCodePreviewCatalog: mocks.loadCodePreviewCatalog,
}));

const { editorAgentTurn } = await import("./editor-agent.server");

const STORE_ID = "11111111-1111-4111-8111-111111111111";

const hero = {
  id: "s-hero",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [{ id: "n-root", type: "section", props: {}, children: [{ id: "n-title", type: "heading", props: { text: "أهلا", level: "h2" }, children: [] }] }],
};

const EMPTY_ROW = {
  sectionId: null, nodeId: null, after: null, to: null, file: null, name: null, prop: null, ar: null, en: null,
  breakpoint: null, device: null, styleJson: null, css: null, href: null, settingsJson: null, blocksJson: null,
};
const TEXT_OP = { ...EMPTY_ROW, op: "set_text", sectionId: "s-hero", nodeId: "n-title", prop: "text", ar: "اطلب الآن", en: "Order now" };
const FILE = joinSectionFile({
  source: '<div class="sg"><h2>{{ section.settings.title }}</h2></div>',
  css: ".sg { padding-inline: 16px; }",
  schema: { name: "Size guide", settings: [{ type: "text", id: "title", label: "Title", default: { ar: "المقاسات", en: "Sizes" } }] },
});
const CODE_OP = { ...EMPTY_ROW, op: "add_code_section", file: FILE };

const input = (extra: Record<string, unknown> = {}) =>
  ({
    message: "change the button text to اطلب الآن",
    uiLocale: "ar",
    contentLocale: "ar",
    target: { kind: "page", sectionId: "s-hero" },
    section: hero,
    outline: [{ id: "s-hero", name: "Hero", kind: "tree" }],
    history: [],
    ...extra,
  }) as never;

describe("editorAgentTurn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A new seller each test, so the in-memory burst limiter never interferes.
    mocks.requireStore.mockImplementation(async () => ({ seller: { sellerId: crypto.randomUUID() }, store: { id: STORE_ID } }));
    mocks.checkDailyCap.mockResolvedValue({ allowed: true, remaining: 10 });
    mocks.getBillingState.mockResolvedValue({ usdLive: true });
    mocks.claimAiCredit.mockResolvedValue({ ok: true, reference: "ref-1" });
    mocks.refundAiCredit.mockResolvedValue(undefined);
    mocks.isSwitchOn.mockResolvedValue(true);
    mocks.loadCodePreviewCatalog.mockResolvedValue({ products: {}, categories: [] });
    mocks.generateStructured.mockResolvedValue({ object: { reply: "تم", ops: [TEXT_OP] }, cached: false });
  });

  it("returns the applied ops, charges one credit and calls the model the cheap way", async () => {
    const result = await editorAgentTurn(STORE_ID, input());
    expect(result).toMatchObject({ success: true, data: { reply: "تم", creditsUsed: 1, rejected: [] } });
    if (!result.success) throw new Error("expected success");
    expect(result.data.ops).toEqual([{ op: "set_text", sectionId: "s-hero", nodeId: "n-title", prop: "text", ar: "اطلب الآن", en: "Order now" }]);
    expect(result.data.applied).toHaveLength(1);
    expect(mocks.refundAiCredit).not.toHaveBeenCalled();
    expect(mocks.generateStructured.mock.calls[0]?.[0]).toMatchObject({ feature: "editor_agent", tier: "fast", thinkingLevel: "minimal", refId: STORE_ID, cacheMs: 600_000 });
    expect(mocks.requireStore).toHaveBeenCalledWith(STORE_ID, { forWrite: true });
  });

  it("gives the credit back when no op applied", async () => {
    mocks.generateStructured.mockResolvedValue({ object: { reply: "Which one?", ops: [] }, cached: false });
    const result = await editorAgentTurn(STORE_ID, input());
    expect(result).toMatchObject({ success: true, data: { creditsUsed: 0, ops: [] } });
    expect(mocks.refundAiCredit).toHaveBeenCalledWith(expect.any(String), "ref-1");
  });

  it("gives the credit back for a cached answer", async () => {
    mocks.generateStructured.mockResolvedValue({ object: { reply: "تم", ops: [TEXT_OP] }, cached: true });
    expect(await editorAgentTurn(STORE_ID, input())).toMatchObject({ success: true, data: { creditsUsed: 0 } });
  });

  it("refuses code ops while the code_sections switch is off", async () => {
    mocks.isSwitchOn.mockResolvedValue(false);
    mocks.generateStructured.mockResolvedValue({ object: { reply: "x", ops: [CODE_OP] }, cached: false });
    const result = await editorAgentTurn(STORE_ID, input());
    expect(result).toMatchObject({ success: true, data: { ops: [], rejected: [{ index: 0, code: "code_disabled" }], creditsUsed: 0 } });
    expect(mocks.generateStructured.mock.calls[0]?.[0].system).not.toContain("add_code_section");
  });

  it("adds a code section with its canvas preview while the switch is on", async () => {
    mocks.generateStructured.mockResolvedValue({ object: { reply: "x", ops: [CODE_OP] }, cached: false });
    const result = await editorAgentTurn(STORE_ID, input({ message: "add a size guide table" }));
    if (!result.success) throw new Error(result.error);
    const op = result.data.ops[0] as { op: string; newNodeId: string };
    expect(op.op).toBe("add_code_section");
    expect(result.data.previews[op.newNodeId]?.html).toContain("المقاسات");
    expect(result.data.previews[op.newNodeId]?.css).toContain(`[data-node-id="${op.newNodeId}"]`);
  });

  it("refuses a sent section that doesn't validate, before any AI", async () => {
    const result = await editorAgentTurn(STORE_ID, input({ section: { ...hero, componentTree: [{ id: "bad id!", type: "nope", props: {}, children: [] }] } }));
    expect(result).toEqual({ success: false, error: "invalidContent" });
    expect(mocks.generateStructured).not.toHaveBeenCalled();
    expect(mocks.claimAiCredit).not.toHaveBeenCalled();
  });

  it("refuses inputs over the caps", async () => {
    expect(await editorAgentTurn(STORE_ID, input({ message: "x".repeat(1501) }))).toEqual({ success: false, error: "invalidInput" });
    expect(await editorAgentTurn(STORE_ID, input({ history: Array.from({ length: 7 }, () => ({ role: "user", text: "a" })) }))).toEqual({ success: false, error: "invalidInput" });
    expect(await editorAgentTurn(STORE_ID, input({ section: { ...hero, props: { pad: "x".repeat(70_000) } } }))).toEqual({ success: false, error: "invalidInput" });
  });

  it("stops at the daily cap and without credits", async () => {
    mocks.checkDailyCap.mockResolvedValueOnce({ allowed: false, remaining: 0 });
    expect(await editorAgentTurn(STORE_ID, input())).toEqual({ success: false, error: "aiDailyLimit" });
    mocks.claimAiCredit.mockResolvedValueOnce({ ok: false, error: "no_credits" });
    expect(await editorAgentTurn(STORE_ID, input())).toEqual({ success: false, error: "aiNoCredits" });
    expect(mocks.generateStructured).not.toHaveBeenCalled();
  });

  it("gives the credit back when the model fails", async () => {
    mocks.generateStructured.mockRejectedValue(new Error("down"));
    expect(await editorAgentTurn(STORE_ID, input())).toEqual({ success: false, error: "aiFailed" });
    expect(mocks.refundAiCredit).toHaveBeenCalled();
  });

  it("maps access errors", async () => {
    mocks.requireStore.mockRejectedValueOnce(new FakeAccessError("store_read_only"));
    expect(await editorAgentTurn(STORE_ID, input())).toEqual({ success: false, error: "readOnly" });
    mocks.requireStore.mockRejectedValueOnce(new FakeAccessError("not_found"));
    expect(await editorAgentTurn(STORE_ID, input())).toEqual({ success: false, error: "notFound" });
  });
});
