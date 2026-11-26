import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireStore: vi.fn(),
  isSwitchOn: vi.fn(),
  generateStructured: vi.fn(),
  checkDailyCap: vi.fn(),
  logAiUsage: vi.fn(),
  claimAiCredit: vi.fn(),
  refundAiCredit: vi.fn(),
  getBillingState: vi.fn(),
  getStoreForEditor: vi.fn(),
  saveStorePageDraft: vi.fn(),
  saveStoreChrome: vi.fn(),
  previewLink: vi.fn(),
  verify: vi.fn(),
  signUploads: vi.fn(),
  fileLink: vi.fn(async () => null),
  runStoreAgentTurn: vi.fn(),
  confirmAction: vi.fn(),
  cancelAction: vi.fn(),
  pendingPublishes: vi.fn(),
  revalidate: vi.fn(),
}));

class FakeAccessError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

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
  db: { select: () => ({ from: () => ({ where: async () => [{ plan: "free", planExpiresAt: null, planGraceUntil: null }] }) }) },
  eq: () => null,
  sellers: { id: "id", plan: "plan", planExpiresAt: "e", planGraceUntil: "g" },
}));
vi.mock("@workspace/lib", () => ({ parseStoreCurrency: () => ({ currency: "EGP", label: null }) }));
vi.mock("@workspace/lib/billing", () => ({ isProActive: () => false }));
vi.mock("@workspace/lib/billing/credits", () => ({ claimAiCredit: mocks.claimAiCredit, refundAiCredit: mocks.refundAiCredit }));
vi.mock("@workspace/lib/billing/server", () => ({ getBillingState: mocks.getBillingState }));
vi.mock("@workspace/lib/store-sites/server", () => ({
  getStoreForEditor: mocks.getStoreForEditor,
  saveStorePageDraft: mocks.saveStorePageDraft,
  saveStoreChrome: mocks.saveStoreChrome,
}));
vi.mock("@workspace/store-sections/render", () => ({ storeSectionRegistry: { allowedSections: () => undefined } }));
vi.mock("@/lib/stores/platform-switches.server", () => ({ isSwitchOn: mocks.isSwitchOn }));
vi.mock("@/lib/i18n/revalidate-dashboard-path.server", () => ({ revalidateDashboardPath: mocks.revalidate }));
vi.mock("../../server/editor.server", () => ({ previewLink: mocks.previewLink }));
vi.mock("../../server/code-preview.data", () => ({
  loadCodePreviewStore: async () => ({ name: "متجري", subdomain: "shop", settings: {}, colors: { primary: "#145163" }, typography: {}, spacing: {} }),
}));
vi.mock("../../server/agent-images.server", () => ({
  mediaPathsIn: () => [],
  ownMediaImages: async () => [],
  mediaImageCheck: (images: { path: string; src: string }[]) => (src: string) => images.find((i) => i.src === src)?.src ?? null,
}));
vi.mock("./edit-with-ai-files.server", () => ({
  verifyEditWithAiAttachments: mocks.verify,
  signEditWithAiUploads: mocks.signUploads,
  signEditWithAiFileLink: mocks.fileLink,
}));
vi.mock("./edit-with-ai-agent.server", () => ({
  agentErrorKey: () => "actionFailed",
  editWithAiContext: (input: Record<string, unknown>) => ({ ...input, source: "in_app" }),
  editWithAiRuntime: () => ({ confirmAction: mocks.confirmAction, cancelAction: mocks.cancelAction }),
  pendingPublishes: mocks.pendingPublishes,
  runStoreAgentTurn: mocks.runStoreAgentTurn,
  storeTurnSummary: (input: { images: { src: string }[] }) => `photos: ${input.images.map((i) => i.src).join(" ")}`,
  toProposalView: (p: unknown) => p,
}));

const { editWithAiTurn, undoEditWithAi, confirmEditWithAiAction, cancelEditWithAiAction, createEditWithAiUploads, editWithAiImportFile } = await import("./edit-with-ai.server");

const STORE_ID = "11111111-1111-4111-8111-111111111111";
const PAGE_ID = "22222222-2222-4222-8222-222222222222";
const PHOTO = "https://x.supabase.co/storage/v1/object/public/store-media/s/t/new.jpg";

const heroSection = () => ({
  id: "s-hero",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    {
      id: "n-root",
      type: "section",
      props: { label: "Hero" },
      children: [
        { id: "n-title", type: "heading", props: { text: "تشكيلة الشتاء", level: "h1" }, children: [] },
        { id: "n-img", type: "image", props: { src: "https://images.example/old.jpg", alt: "" }, children: [] },
      ],
    },
  ],
});
const faqSection = () => ({
  id: "s-faq",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [{ id: "n-froot", type: "section", props: { label: "Returns" }, children: [{ id: "n-ftext", type: "text", props: { text: "Easy returns" }, children: [] }] }],
});
const headerSection = () => ({
  id: "s-header",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [{ id: "n-hroot", type: "section", props: { label: "Header" }, children: [{ id: "n-ann", type: "text", props: { text: "Welcome" }, children: [] }] }],
});

const editorData = () => ({
  store: { defaultLocale: "ar", supportedLocales: ["ar", "en"], sharedHeader: headerSection(), sharedFooter: null, chromeVersion: 4 },
  designSystem: { colors: {}, typography: {}, spacing: {}, version: 1 },
  pages: [{ id: PAGE_ID, isHome: true, draftVersion: 7, draftContent: { sections: [heroSection(), faqSection()] } }],
});

const ROW = {
  sectionId: null, nodeId: null, after: null, to: null, file: null, name: null, prop: null, src: null, ar: null, en: null,
  breakpoint: null, device: null, styleJson: null, css: null, href: null, settingsJson: null, blocksJson: null,
};
const editAnswer = (ops: Record<string, unknown>[], reply = "تم") => ({ object: { reply, ops: ops.map((op) => ({ ...ROW, ...op })) }, cached: false });
const IMAGE_OP = { op: "set_image", sectionId: "s-hero", nodeId: "n-img", src: PHOTO };

const input = (extra: Record<string, unknown> = {}) =>
  ({ message: "change the hero image to this photo", uiLocale: "en", attachments: [{ kind: "image", path: "s/t/new.jpg" }], ...extra }) as never;

describe("editWithAiTurn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A new seller each test, so the in-memory burst limiter never interferes.
    mocks.requireStore.mockImplementation(async () => ({ seller: { sellerId: crypto.randomUUID(), userId: "u1" }, store: { id: STORE_ID, name: "متجري" } }));
    mocks.isSwitchOn.mockResolvedValue(true);
    mocks.checkDailyCap.mockResolvedValue({ allowed: true, remaining: 10 });
    mocks.getBillingState.mockResolvedValue({ usdLive: true });
    mocks.claimAiCredit.mockResolvedValue({ ok: true, reference: "ref-1" });
    mocks.refundAiCredit.mockResolvedValue(undefined);
    mocks.getStoreForEditor.mockImplementation(async () => editorData());
    mocks.saveStorePageDraft.mockResolvedValue({ success: true, data: { draftVersion: 8 } });
    mocks.saveStoreChrome.mockResolvedValue({ success: true, data: { version: 5 } });
    mocks.previewLink.mockResolvedValue({ success: true, data: { url: "https://shop.example/api/store-preview?token=t", expiresAt: 1 } });
    mocks.verify.mockResolvedValue({ ok: true, images: [{ path: "s/t/new.jpg", src: PHOTO, label: "photo 1" }], files: [], recorded: true });
    mocks.generateStructured.mockResolvedValue(editAnswer([IMAGE_OP]));
  });

  it("puts the uploaded photo in the hero, saves the draft with the loaded version and charges one credit", async () => {
    const result = await editWithAiTurn(STORE_ID, input());
    if (!result.success) throw new Error(result.error);
    expect(result.data).toMatchObject({ route: "site", creditsUsed: 1, rejected: [], proposals: [], cards: [] });
    expect(result.data.siteChanges).toMatchObject({ target: { kind: "page", pageId: PAGE_ID, sectionId: "s-hero" }, lines: ["Changed a photo"], previewUrl: expect.stringContaining("store-preview") });
    // Code picked the hero: one model call (the edit), no router call.
    expect(mocks.generateStructured).toHaveBeenCalledTimes(1);
    expect(mocks.generateStructured.mock.calls[0]![0]).toMatchObject({ feature: "edit_with_ai", tier: "fast", thinkingLevel: "minimal" });
    expect(mocks.generateStructured.mock.calls[0]![0].content[0].text).toContain(PHOTO);
    const [, , pageId, content, version] = mocks.saveStorePageDraft.mock.calls[0]!;
    expect([pageId, version]).toEqual([PAGE_ID, 7]);
    expect(content.sections[0].componentTree[0].children[1].props.src).toBe(PHOTO);
    expect(content.sections[1]).toEqual(faqSection());
    expect(mocks.claimAiCredit).toHaveBeenCalledTimes(1);
    expect(mocks.refundAiCredit).not.toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalledWith(`/stores/${STORE_ID}/website/media`);
  });

  it("refuses a photo that isn't the seller's, saves nothing and gives the credit back", async () => {
    mocks.generateStructured.mockResolvedValue(editAnswer([{ ...IMAGE_OP, src: "https://evil.example/x.jpg" }]));
    const result = await editWithAiTurn(STORE_ID, input());
    expect(result).toMatchObject({ success: true, data: { siteChanges: null, creditsUsed: 0, rejected: [{ index: 0, code: "image_not_allowed" }] } });
    expect(mocks.saveStorePageDraft).not.toHaveBeenCalled();
    expect(mocks.refundAiCredit).toHaveBeenCalledWith(expect.any(String), "ref-1");
  });

  it("never overwrites a draft edited meanwhile", async () => {
    mocks.saveStorePageDraft.mockResolvedValue({ success: false, error: "version_conflict" });
    expect(await editWithAiTurn(STORE_ID, input())).toEqual({ success: false, error: "draftChanged" });
    expect(mocks.refundAiCredit).toHaveBeenCalled();
  });

  it("edits the header for the announcement, with the chrome version", async () => {
    mocks.generateStructured.mockResolvedValue(editAnswer([{ op: "set_text", sectionId: "s-header", nodeId: "n-ann", prop: "text", ar: "شحن مجاني فوق ١٠٠٠", en: "Free shipping over 1000" }]));
    const result = await editWithAiTurn(STORE_ID, input({ message: "make the announcement text: free shipping over 1000", attachments: [] }));
    expect(result).toMatchObject({ success: true, data: { siteChanges: { target: { kind: "header" } } } });
    expect(mocks.saveStoreChrome.mock.calls[0]!.slice(2, 5)).toEqual(["header", expect.objectContaining({ id: "s-header" }), 4]);
  });

  it("asks the router when code can't pick the section, and uses only an id of the outline", async () => {
    mocks.verify.mockResolvedValue({ ok: true, images: [], files: [], recorded: false });
    mocks.generateStructured
      .mockResolvedValueOnce({ object: { route: "site", target: "page", sectionId: "s-faq", reply: null }, cached: false })
      .mockResolvedValueOnce(editAnswer([{ op: "set_text", sectionId: "s-faq", nodeId: "n-ftext", prop: "text", ar: "استرجاع سهل", en: "Returns in 14 days" }]));
    const result = await editWithAiTurn(STORE_ID, input({ message: "make it say 14 days instead", attachments: [] }));
    expect(result).toMatchObject({ success: true, data: { siteChanges: { target: { sectionId: "s-faq" } }, creditsUsed: 1 } });
    expect(mocks.generateStructured.mock.calls[0]![0].content[0].text).toContain('1. s-faq | "Returns" | tree | photo: no | "Easy returns"');
    expect(mocks.claimAiCredit).toHaveBeenCalledTimes(1);

    mocks.generateStructured.mockReset();
    mocks.generateStructured.mockResolvedValueOnce({ object: { route: "site", target: "page", sectionId: "s-made-up", reply: null }, cached: false });
    const none = await editWithAiTurn(STORE_ID, input({ message: "make it say 14 days instead", attachments: [] }));
    expect(none).toMatchObject({ success: true, data: { siteChanges: null, creditsUsed: 0 } });
    expect(mocks.generateStructured).toHaveBeenCalledTimes(1);
  });

  it("charges one credit even when the edit retries", async () => {
    const SCRIPT = "<div><script>alert(1)</script></div>\n{% schema %}\n{\"name\":\"X\",\"settings\":[]}\n{% endschema %}";
    mocks.generateStructured.mockResolvedValue(editAnswer([{ op: "add_code_section", file: SCRIPT }, IMAGE_OP]));
    const result = await editWithAiTurn(STORE_ID, input());
    expect(mocks.generateStructured).toHaveBeenCalledTimes(2);
    expect(mocks.claimAiCredit).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ success: true, data: { creditsUsed: 1 } });
  });

  it("routes a product to the store agent: confirm cards only, no draft save and no turn credit", async () => {
    const proposal = { actionId: "act_abcdefghijklmnopqrstuvwx", tool: "create_product", skill: "products", card: { title: "agent.card.products.create.title", lines: [], risk: "low" }, credits: 1, expiresAt: "x" };
    mocks.runStoreAgentTurn.mockResolvedValue({ text: "Proposed", proposals: [proposal], rejected: [], reads: [], steps: 2 });
    const result = await editWithAiTurn(STORE_ID, input({ message: "add this product, price 450" }));
    expect(result).toMatchObject({ success: true, data: { route: "products", proposals: [proposal], siteChanges: null, creditsUsed: 0 } });
    const [, ctx, turn] = mocks.runStoreAgentTurn.mock.calls[0]!;
    expect(ctx).toMatchObject({ source: "in_app", publishProducts: false });
    expect(turn).toMatchObject({ skillId: "products", stateSummary: `photos: ${PHOTO}` });
    expect(mocks.generateStructured).not.toHaveBeenCalled();
    expect(mocks.claimAiCredit).not.toHaveBeenCalled();
    expect(mocks.saveStorePageDraft).not.toHaveBeenCalled();
    expect(mocks.confirmAction).not.toHaveBeenCalled();
  });

  it("turns a products file into an import card without any model or credit", async () => {
    const path = `${"a".repeat(8)}/b/c.csv`;
    mocks.verify.mockResolvedValue({ ok: true, images: [], files: [{ path, ext: "csv", name: "stock.csv" }], recorded: false });
    const result = await editWithAiTurn(STORE_ID, input({ message: "import these products", attachments: [{ kind: "file", path, name: "stock.csv" }] }));
    expect(result).toMatchObject({
      success: true,
      data: { route: "import", cards: [{ kind: "import_products", fileRef: path, fileName: "stock.csv", href: `/stores/${STORE_ID}/products/add/from-file?aiFile=${encodeURIComponent(path)}` }], creditsUsed: 0 },
    });
    expect(mocks.generateStructured).not.toHaveBeenCalled();
    expect(mocks.checkDailyCap).not.toHaveBeenCalled();
    expect(mocks.claimAiCredit).not.toHaveBeenCalled();
  });

  it("refuses attachments that aren't the seller's own uploads, before any AI", async () => {
    mocks.verify.mockResolvedValue({ ok: false });
    expect(await editWithAiTurn(STORE_ID, input({ attachments: [{ kind: "image", path: "other-seller/x/y.jpg" }] }))).toEqual({ success: false, error: "attachmentInvalid" });
    expect(mocks.generateStructured).not.toHaveBeenCalled();
  });

  it("refuses inputs over the caps", async () => {
    expect(await editWithAiTurn(STORE_ID, input({ message: "x".repeat(2001) }))).toEqual({ success: false, error: "invalidInput" });
    expect(await editWithAiTurn(STORE_ID, input({ attachments: Array.from({ length: 7 }, () => ({ kind: "image", path: "p" })) }))).toEqual({ success: false, error: "invalidInput" });
    expect(await editWithAiTurn(STORE_ID, input({ history: Array.from({ length: 9 }, () => ({ role: "user", text: "a" })) }))).toEqual({ success: false, error: "invalidInput" });
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("is off while the editor_agent switch is off", async () => {
    mocks.isSwitchOn.mockImplementation(async (key: string) => key !== "editor_agent");
    expect(await editWithAiTurn(STORE_ID, input())).toEqual({ success: false, error: "notFound" });
    expect(await createEditWithAiUploads(STORE_ID, { files: [{ kind: "image", type: "image/jpeg", size: 10, name: "a.jpg" }] })).toEqual({ success: false, error: "notFound" });
    expect(await editWithAiImportFile(STORE_ID, "s/t/products.csv")).toEqual({ success: false, error: "notFound" });
    expect(await cancelEditWithAiAction(STORE_ID, "act_x")).toEqual({ success: false, error: "notFound" });
    expect(mocks.fileLink).not.toHaveBeenCalled();
    expect(mocks.cancelAction).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.generateStructured).not.toHaveBeenCalled();
  });

  it("stops at the daily cap", async () => {
    mocks.checkDailyCap.mockResolvedValueOnce({ allowed: false, remaining: 0 });
    expect(await editWithAiTurn(STORE_ID, input())).toEqual({ success: false, error: "aiDailyLimit" });
    expect(mocks.claimAiCredit).not.toHaveBeenCalled();
  });

  it("maps access errors", async () => {
    mocks.requireStore.mockRejectedValueOnce(new FakeAccessError("store_read_only"));
    expect(await editWithAiTurn(STORE_ID, input())).toEqual({ success: false, error: "readOnly" });
    expect(mocks.requireStore).toHaveBeenCalledWith(STORE_ID, { forWrite: true });
  });
});

describe("undoEditWithAi", () => {
  const seller = crypto.randomUUID();
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStore.mockImplementation(async () => ({ seller: { sellerId: seller, userId: "u1" }, store: { id: STORE_ID, name: "متجري" } }));
    mocks.isSwitchOn.mockResolvedValue(true);
    mocks.checkDailyCap.mockResolvedValue({ allowed: true, remaining: 10 });
    mocks.getBillingState.mockResolvedValue({ usdLive: false });
    mocks.getStoreForEditor.mockImplementation(async () => editorData());
    mocks.saveStorePageDraft.mockResolvedValue({ success: true, data: { draftVersion: 8 } });
    mocks.previewLink.mockResolvedValue({ success: false, error: "previewUnavailable" });
    mocks.verify.mockResolvedValue({ ok: true, images: [{ path: "s/t/new.jpg", src: PHOTO, label: "photo 1" }], files: [], recorded: true });
    mocks.generateStructured.mockResolvedValue(editAnswer([IMAGE_OP]));
  });

  const saveTurn = async () => {
    const result = await editWithAiTurn(STORE_ID, input());
    if (!result.success || !result.data.siteChanges) throw new Error("expected a saved turn");
    return result.data.siteChanges.undoToken;
  };

  it("puts the previous draft back while the draft is still the turn's version, once", async () => {
    const token = await saveTurn();
    mocks.saveStorePageDraft.mockClear();
    expect(await undoEditWithAi(STORE_ID, token)).toEqual({ success: true, data: { previewUrl: null } });
    expect(mocks.saveStorePageDraft.mock.calls[0]!.slice(2, 5)).toEqual([PAGE_ID, editorData().pages[0]!.draftContent, 8]);
    expect(await undoEditWithAi(STORE_ID, token)).toEqual({ success: false, error: "undoExpired" });
  });

  it("refuses after a newer edit", async () => {
    const token = await saveTurn();
    mocks.saveStorePageDraft.mockResolvedValue({ success: false, error: "version_conflict" });
    expect(await undoEditWithAi(STORE_ID, token)).toEqual({ success: false, error: "draftChanged" });
  });

  it("knows no token of another seller", async () => {
    const token = await saveTurn();
    mocks.requireStore.mockImplementationOnce(async () => ({ seller: { sellerId: crypto.randomUUID(), userId: "u2" }, store: { id: STORE_ID, name: "x" } }));
    expect(await undoEditWithAi(STORE_ID, token)).toEqual({ success: false, error: "undoExpired" });
  });
});

describe("confirmEditWithAiAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStore.mockImplementation(async () => ({ seller: { sellerId: crypto.randomUUID(), userId: "u1" }, store: { id: STORE_ID, name: "x" } }));
    mocks.isSwitchOn.mockResolvedValue(true);
  });

  it("runs the seller's own pending action through the core, which charges its credit", async () => {
    mocks.pendingPublishes.mockResolvedValue(true);
    mocks.confirmAction.mockResolvedValue({ actionId: "act_x", tool: "create_product", result: { productId: "p" }, creditsCharged: 1, replayed: false });
    const result = await confirmEditWithAiAction(STORE_ID, "act_abcdefghijklmnopqrstuvwx");
    expect(result).toEqual({ success: true, data: { tool: "create_product", result: { productId: "p" }, creditsUsed: 1 } });
    expect(mocks.confirmAction.mock.calls[0]![0]).toMatchObject({ publishProducts: true, source: "in_app" });
  });

  it("treats another seller's or store's action as missing", async () => {
    mocks.pendingPublishes.mockResolvedValue(null);
    expect(await confirmEditWithAiAction(STORE_ID, "act_abcdefghijklmnopqrstuvwx")).toEqual({ success: false, error: "notFound" });
    expect(mocks.confirmAction).not.toHaveBeenCalled();
  });
});
