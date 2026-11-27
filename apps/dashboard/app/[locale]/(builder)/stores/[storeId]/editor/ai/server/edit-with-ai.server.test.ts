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
  getAiCreditStatus: vi.fn(),
  renderPreviews: vi.fn(),
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
vi.mock("@workspace/lib/billing/credits", () => ({ claimAiCredit: mocks.claimAiCredit, refundAiCredit: mocks.refundAiCredit, getAiCreditStatus: mocks.getAiCreditStatus }));
vi.mock("@workspace/lib/billing/server", () => ({ getBillingState: mocks.getBillingState }));
vi.mock("@workspace/lib/store-sites/server", () => ({ getStoreForEditor: mocks.getStoreForEditor }));
vi.mock("@/lib/stores/platform-switches.server", () => ({ isSwitchOn: mocks.isSwitchOn }));
vi.mock("@/lib/i18n/revalidate-dashboard-path.server", () => ({ revalidateDashboardPath: mocks.revalidate }));
vi.mock("../../server/agent-previews.server", () => ({ renderAgentCodePreviews: mocks.renderPreviews }));
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

const { editWithAiTurn, confirmEditWithAiAction, cancelEditWithAiAction, createEditWithAiUploads, editWithAiImportFile } = await import("./edit-with-ai.server");
const { applySectionOps } = await import("@workspace/store-sections/agent");
const serverModule = await import("./edit-with-ai.server");

const STORE_ID = "11111111-1111-4111-8111-111111111111";
const PAGE_ID = "22222222-2222-4222-8222-222222222222";
const ABOUT_ID = "33333333-3333-4333-8333-333333333333";
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
const aboutSection = () => ({
  id: "s-about",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [{ id: "n-aroot", type: "section", props: { label: "Our story" }, children: [{ id: "n-atext", type: "text", props: { text: "Since 2020" }, children: [] }] }],
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
  pages: [
    { id: PAGE_ID, isHome: true, kind: "page", name: { ar: "الرئيسية", en: "Home" }, draftVersion: 7, draftContent: { sections: [heroSection(), faqSection()] } },
    { id: ABOUT_ID, isHome: false, kind: "page", draftVersion: 2, draftContent: { sections: [aboutSection()] } },
  ],
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
    mocks.getAiCreditStatus.mockResolvedValue({ total: 41 });
    mocks.renderPreviews.mockResolvedValue({});
    mocks.verify.mockResolvedValue({ ok: true, images: [{ path: "s/t/new.jpg", src: PHOTO, label: "photo 1" }], files: [], recorded: true });
    mocks.generateStructured.mockResolvedValue(editAnswer([IMAGE_OP]));
  });

  it("returns the ops for the editor to apply, writes nothing and charges one credit", async () => {
    const result = await editWithAiTurn(STORE_ID, input());
    if (!result.success) throw new Error(result.error);
    expect(result.data).toMatchObject({ route: "site", creditsUsed: 1, creditsRemaining: 41, rejected: [], proposals: [], cards: [] });
    const changes = result.data.siteChanges!;
    expect(changes).toMatchObject({ pageId: PAGE_ID, target: { kind: "page", sectionId: "s-hero" }, applied: ["Changed a photo"], previews: {}, contentLocale: "ar" });
    // Code picked the hero: one model call (the edit), no router call.
    expect(mocks.generateStructured).toHaveBeenCalledTimes(1);
    expect(mocks.generateStructured.mock.calls[0]![0]).toMatchObject({ feature: "edit_with_ai", tier: "fast", thinkingLevel: "minimal" });
    expect(mocks.generateStructured.mock.calls[0]![0].content[0].text).toContain(PHOTO);
    // The ops are what the editor applies to its own drafts (`applyAgentTurn`): the same result, no other section touched.
    const drafts = { sections: [heroSection(), faqSection()] } as unknown as Parameters<typeof applySectionOps>[0];
    const applied = applySectionOps(drafts, changes.ops, { target: changes.target, defaultLocale: "ar", allowCode: true });
    expect(applied.applied).toHaveLength(1);
    expect((applied.content.sections[0] as unknown as ReturnType<typeof heroSection>).componentTree[0]!.children[1]!.props.src).toBe(PHOTO);
    expect(applied.content.sections[1]).toEqual(faqSection());
    expect(mocks.claimAiCredit).toHaveBeenCalledTimes(1);
    expect(mocks.refundAiCredit).not.toHaveBeenCalled();
    // The credits left are read after the claim settled.
    expect(mocks.getAiCreditStatus.mock.invocationCallOrder[0]!).toBeGreaterThan(mocks.claimAiCredit.mock.invocationCallOrder[0]!);
    expect(mocks.revalidate).toHaveBeenCalledWith(`/stores/${STORE_ID}/website/media`);
  });

  it("has no action that saves a draft or undoes one any more", () => {
    expect(Object.keys(serverModule).sort()).toEqual(["cancelEditWithAiAction", "confirmEditWithAiAction", "createEditWithAiUploads", "editWithAiImportFile", "editWithAiTurn"]);
  });

  it("refuses a photo that isn't the seller's, returns no ops and gives the credit back", async () => {
    mocks.generateStructured.mockResolvedValue(editAnswer([{ ...IMAGE_OP, src: "https://evil.example/x.jpg" }]));
    const result = await editWithAiTurn(STORE_ID, input());
    expect(result).toMatchObject({ success: true, data: { siteChanges: null, creditsUsed: 0, creditsRemaining: 41, rejected: [{ index: 0, code: "image_not_allowed" }] } });
    expect(mocks.refundAiCredit).toHaveBeenCalledWith(expect.any(String), "ref-1");
    // Read after the refund, so the number is the one the seller has.
    expect(mocks.getAiCreditStatus.mock.invocationCallOrder[0]!).toBeGreaterThan(mocks.refundAiCredit.mock.invocationCallOrder[0]!);
  });

  it("a turn answered from the result cache is free", async () => {
    mocks.generateStructured.mockResolvedValue({ ...editAnswer([IMAGE_OP]), cached: true });
    const result = await editWithAiTurn(STORE_ID, input());
    expect(result).toMatchObject({ success: true, data: { creditsUsed: 0, siteChanges: { applied: ["Changed a photo"] } } });
    expect(mocks.refundAiCredit).toHaveBeenCalledWith(expect.any(String), "ref-1");
  });

  it("edits the header for the announcement", async () => {
    mocks.generateStructured.mockResolvedValue(editAnswer([{ op: "set_text", sectionId: "s-header", nodeId: "n-ann", prop: "text", ar: "شحن مجاني فوق ١٠٠٠", en: "Free shipping over 1000" }]));
    const result = await editWithAiTurn(STORE_ID, input({ message: "make the announcement text: free shipping over 1000", attachments: [] }));
    expect(result).toMatchObject({ success: true, data: { siteChanges: { pageId: PAGE_ID, target: { kind: "header" }, ops: [expect.objectContaining({ op: "set_text", sectionId: "s-header" })] } } });
  });

  it("edits the page the editor shows", async () => {
    mocks.verify.mockResolvedValue({ ok: true, images: [], files: [], recorded: false });
    mocks.generateStructured.mockResolvedValue(editAnswer([{ op: "set_text", sectionId: "s-about", nodeId: "n-atext", prop: "text", ar: "منذ 2015", en: "Since 2015" }]));
    const result = await editWithAiTurn(STORE_ID, input({ message: "change the Our story section text to say since 2015", attachments: [], pageId: ABOUT_ID }));
    expect(result).toMatchObject({ success: true, data: { siteChanges: { pageId: ABOUT_ID, target: { kind: "page", sectionId: "s-about" } } } });
    // A page of another store is not found.
    expect(await editWithAiTurn(STORE_ID, input({ pageId: "44444444-4444-4444-8444-444444444444" }))).toEqual({ success: false, error: "notFound" });
  });

  it("targets the section selected on the canvas, without asking the router where", async () => {
    mocks.verify.mockResolvedValue({ ok: true, images: [], files: [], recorded: false });
    mocks.generateStructured.mockResolvedValue(editAnswer([{ op: "set_text", sectionId: "s-faq", nodeId: "n-ftext", prop: "text", ar: "استرجاع سهل", en: "Returns in 14 days" }]));
    // "section" makes it a site request by code; the selection says which one.
    const result = await editWithAiTurn(STORE_ID, input({ message: "make this section say 14 days", attachments: [], target: { kind: "page", sectionId: "s-faq" }, contentLocale: "en" }));
    expect(result).toMatchObject({ success: true, data: { siteChanges: { target: { kind: "page", sectionId: "s-faq" }, contentLocale: "en" } } });
    expect(mocks.generateStructured).toHaveBeenCalledTimes(1);
  });

  it("still asks the router for the route when it is unknown, and keeps the selection as the target", async () => {
    mocks.verify.mockResolvedValue({ ok: true, images: [], files: [], recorded: false });
    mocks.generateStructured
      .mockResolvedValueOnce({ object: { route: "site", target: "page", sectionId: "s-hero", reply: null }, cached: false })
      .mockResolvedValueOnce(editAnswer([{ op: "set_text", sectionId: "s-faq", nodeId: "n-ftext", prop: "text", ar: "استرجاع سهل", en: "Returns in 14 days" }]));
    const result = await editWithAiTurn(STORE_ID, input({ message: "make it say 14 days instead", attachments: [], target: { kind: "page", sectionId: "s-faq" } }));
    expect(result).toMatchObject({ success: true, data: { siteChanges: { target: { kind: "page", sectionId: "s-faq" } } } });
    expect(mocks.generateStructured).toHaveBeenCalledTimes(2);
  });

  it("never trusts a selection that is not in the saved drafts, or a language the store doesn't have", async () => {
    // A made-up section id is no selection: code picks the hero as before.
    const madeUp = await editWithAiTurn(STORE_ID, input({ target: { kind: "page", sectionId: "s-made-up" } }));
    expect(madeUp).toMatchObject({ success: true, data: { siteChanges: { target: { kind: "page", sectionId: "s-hero" } } } });
    // The store has no footer: the selection is dropped.
    const footer = await editWithAiTurn(STORE_ID, input({ target: { kind: "footer" } }));
    expect(footer).toMatchObject({ success: true, data: { siteChanges: { target: { kind: "page", sectionId: "s-hero" } } } });
    // Malformed ids never reach the drafts.
    expect(await editWithAiTurn(STORE_ID, input({ target: { kind: "page", sectionId: "../x" } }))).toEqual({ success: false, error: "invalidInput" });
    expect(await editWithAiTurn(STORE_ID, input({ target: { kind: "header", sectionId: "s-hero" } }))).toEqual({ success: false, error: "invalidInput" });

    mocks.getStoreForEditor.mockImplementation(async () => ({ ...editorData(), store: { ...editorData().store, supportedLocales: ["ar"] } }));
    const locale = await editWithAiTurn(STORE_ID, input({ contentLocale: "en" }));
    expect(locale).toMatchObject({ success: true, data: { siteChanges: { contentLocale: "ar" } } });
  });

  it("renders the previews of the code a turn wrote, as the editor's own agent does", async () => {
    const FILE = '<div class="x">Hi</div>\n{% schema %}\n{"name":"Hello","settings":[]}\n{% endschema %}';
    mocks.verify.mockResolvedValue({ ok: true, images: [], files: [], recorded: false });
    mocks.generateStructured.mockResolvedValue(editAnswer([{ op: "add_code_section", file: FILE, name: "Hello" }]));
    mocks.renderPreviews.mockImplementation(async (_seller: string, _store: string, _row: unknown, _locale: string, _default: string, nodes: { nodeId: string }[]) =>
      Object.fromEntries(nodes.map((node) => [node.nodeId, { html: "<div>Hi</div>", css: "", props: {} }])),
    );
    const result = await editWithAiTurn(STORE_ID, input({ message: "add a new section that says hi", attachments: [], contentLocale: "en" }));
    if (!result.success || !result.data.siteChanges) throw new Error("expected ops");
    expect(Object.values(result.data.siteChanges.previews)).toEqual([{ html: "<div>Hi</div>", css: "", props: {} }]);
    const [, storeId, row, locale, defaultLocale] = mocks.renderPreviews.mock.calls[0]!;
    expect([storeId, locale, defaultLocale]).toEqual([STORE_ID, "en", "ar"]);
    expect(row).toMatchObject({ pageKind: "page" });
  });

  it("asks the router when code can't pick the section, and uses only an id of the outline", async () => {
    mocks.verify.mockResolvedValue({ ok: true, images: [], files: [], recorded: false });
    mocks.generateStructured
      .mockResolvedValueOnce({ object: { route: "site", target: "page", sectionId: "s-faq", reply: null }, cached: false })
      .mockResolvedValueOnce(editAnswer([{ op: "set_text", sectionId: "s-faq", nodeId: "n-ftext", prop: "text", ar: "استرجاع سهل", en: "Returns in 14 days" }]));
    const result = await editWithAiTurn(STORE_ID, input({ message: "make it say 14 days instead", attachments: [] }));
    expect(result).toMatchObject({ success: true, data: { siteChanges: { target: { kind: "page", sectionId: "s-faq" } }, creditsUsed: 1 } });
    expect(mocks.generateStructured.mock.calls[0]![0].content[0].text).toContain('1. s-faq | "Returns" | tree | photo: no | "Easy returns"');
    expect(mocks.claimAiCredit).toHaveBeenCalledTimes(1);

    mocks.generateStructured.mockReset();
    mocks.generateStructured.mockResolvedValueOnce({ object: { route: "site", target: "page", sectionId: "s-made-up", reply: null }, cached: false });
    const none = await editWithAiTurn(STORE_ID, input({ message: "make it say 14 days instead", attachments: [] }));
    expect(none).toMatchObject({ success: true, data: { siteChanges: null, creditsUsed: 0 } });
    expect(mocks.generateStructured).toHaveBeenCalledTimes(1);
  });

  describe("page scope", () => {
    const noFiles = () => mocks.verify.mockResolvedValue({ ok: true, images: [], files: [], recorded: false });
    const BOTH = [
      { op: "set_text", sectionId: "s-hero", nodeId: "n-title", prop: "text", ar: "شتاء دافئ", en: "A warm winter" },
      { op: "set_text", sectionId: "s-faq", nodeId: "n-ftext", prop: "text", ar: "استرجاع سهل", en: "Easy returns in 14 days" },
    ];

    it("code tells a page-wide request: one call that reads every section and edits several", async () => {
      noFiles();
      mocks.generateStructured.mockResolvedValue({ object: { ...editAnswer(BOTH).object, suggestions: ["Make the headline shorter", "x".repeat(61), "Make the headline shorter", "<b>Add</b> trust points", "Four", "Five"] }, cached: false });
      const result = await editWithAiTurn(STORE_ID, input({ message: "make all buttons and texts clearer", attachments: [] }));
      if (!result.success || !result.data.siteChanges) throw new Error("expected ops");
      // No router call: code knew it was the website and the whole page.
      expect(mocks.generateStructured).toHaveBeenCalledTimes(1);
      const call = mocks.generateStructured.mock.calls[0]![0];
      expect(call).toMatchObject({ feature: "edit_with_ai", tier: "fast", thinkingLevel: "minimal" });
      const text: string = call.content[0].text;
      expect(text).toContain("The request is about the whole page.");
      expect(text).toContain("TREE SECTION s-hero");
      expect(text).toContain("TREE SECTION s-faq");
      expect(text).toContain('Page: "الرئيسية", the store\'s home page.');
      expect(result.data.siteChanges.target).toEqual({ kind: "page", scope: "page" });
      expect(result.data.siteChanges.ops.map((op) => (op as { sectionId: string }).sectionId)).toEqual(["s-hero", "s-faq"]);
      // Still one credit, and the suggestions are cleaned, capped and deduplicated.
      expect(result.data).toMatchObject({ creditsUsed: 1, suggestions: ["Make the headline shorter", "Add trust points", "Four"], links: [] });
      expect(mocks.claimAiCredit).toHaveBeenCalledTimes(1);
      // The editor applies the same ops to its drafts with the returned target.
      const drafts = { sections: [heroSection(), faqSection()] } as unknown as Parameters<typeof applySectionOps>[0];
      expect(applySectionOps(drafts, result.data.siteChanges.ops, { target: result.data.siteChanges.target, defaultLocale: "ar", allowCode: true }).applied).toHaveLength(2);
    });

    it("a section selected on the canvas always wins: the turn stays on it", async () => {
      noFiles();
      mocks.generateStructured.mockResolvedValue(editAnswer(BOTH));
      const result = await editWithAiTurn(STORE_ID, input({ message: "make all the texts in this section clearer", attachments: [], target: { kind: "page", sectionId: "s-faq" } }));
      if (!result.success || !result.data.siteChanges) throw new Error("expected ops");
      const text: string = mocks.generateStructured.mock.calls[0]![0].content[0].text;
      expect(text).not.toContain("TREE SECTION s-hero");
      expect(text).not.toContain("whole page");
      expect(result.data.siteChanges.target).toEqual({ kind: "page", sectionId: "s-faq" });
      // The op on the other section is refused.
      expect(result.data.siteChanges.ops).toHaveLength(1);
      expect(result.data.rejected).toEqual([{ index: 0, code: "outside_target" }]);
    });

    it("the router decides the scope when code can't: page reads the sections, section adds from the outline", async () => {
      noFiles();
      mocks.generateStructured
        .mockResolvedValueOnce({ object: { route: "site", target: "page", sectionId: null, scope: "page", reply: null }, cached: false })
        .mockResolvedValueOnce(editAnswer(BOTH));
      const page = await editWithAiTurn(STORE_ID, input({ message: "make it feel more premium", attachments: [] }));
      expect(page).toMatchObject({ success: true, data: { siteChanges: { target: { kind: "page", scope: "page" } }, creditsUsed: 1 } });
      const routerText: string = mocks.generateStructured.mock.calls[0]![0].content[0].text;
      expect(routerText).toContain('The seller is on: "الرئيسية", the home page.');
      expect(routerText).toContain("No section is selected on the canvas.");
      expect(mocks.generateStructured.mock.calls[1]![0].content[0].text).toContain("TREE SECTION s-faq");

      mocks.generateStructured.mockReset();
      mocks.generateStructured
        .mockResolvedValueOnce({ object: { route: "site", target: "page", sectionId: null, scope: "section", reply: null }, cached: false })
        .mockResolvedValueOnce(editAnswer(BOTH));
      const add = await editWithAiTurn(STORE_ID, input({ message: "make it feel more premium", attachments: [] }));
      const editText: string = mocks.generateStructured.mock.calls[1]![0].content[0].text;
      expect(editText).toContain("No section is selected");
      expect(editText).not.toContain("TREE SECTION");
      // Without page scope the target carries no scope (the op cap stays the section one).
      expect(add).toMatchObject({ success: true, data: { siteChanges: { target: { kind: "page" } } } });
      if (add.success) expect(add.data.siteChanges!.target).not.toHaveProperty("scope");
    });
  });

  describe("advice", () => {
    beforeEach(() => mocks.verify.mockResolvedValue({ ok: true, images: [], files: [], recorded: false }));

    it("answers a question about the page: one fast call, no ops, no credit, counted by the daily cap", async () => {
      mocks.generateStructured.mockResolvedValue({ object: { reply: `1. ${"a".repeat(1200)}`, suggestions: ["Rewrite the hero headline", "Add trust points under the button", "", "Move products up", "One more"] }, cached: false });
      const result = await editWithAiTurn(STORE_ID, input({ message: "review my page, what should I improve?", attachments: [] }));
      if (!result.success) throw new Error(result.error);
      expect(result.data).toMatchObject({ route: "advice", siteChanges: null, proposals: [], creditsUsed: 0, creditsRemaining: 41, links: [] });
      expect(result.data.reply).toHaveLength(900);
      expect(result.data.suggestions).toEqual(["Rewrite the hero headline", "Add trust points under the button", "Move products up"]);
      // Code knew it was a question: no router call.
      expect(mocks.generateStructured).toHaveBeenCalledTimes(1);
      const call = mocks.generateStructured.mock.calls[0]![0];
      // The same feature name, so `generateStructured` logs it and the daily cap counts it.
      expect(call).toMatchObject({ feature: "edit_with_ai", tier: "fast", thinkingLevel: "minimal", refId: STORE_ID });
      expect(call.maxOutputTokens).toBeLessThanOrEqual(1000);
      expect(call.cacheMs).toBeGreaterThan(0);
      const text: string = call.content[0].text;
      expect(text).toContain('0. s-hero | "Hero" | tree | photo: yes');
      expect(text).toContain("Counted by code: 2 sections (0 custom-code), 0 buttons, 1 photos; the first section has a photo.");
      expect(text).toContain("<seller_input>\nreview my page, what should I improve?\n</seller_input>");
      // The outline only: no section's elements, no catalog.
      expect(text).not.toContain("TREE SECTION");
      expect(mocks.checkDailyCap).toHaveBeenCalledTimes(1);
      expect(mocks.claimAiCredit).not.toHaveBeenCalled();
      expect(mocks.refundAiCredit).not.toHaveBeenCalled();
    });

    it("stops at the daily cap before any call, and reports a failed call", async () => {
      mocks.checkDailyCap.mockResolvedValueOnce({ allowed: false, remaining: 0 });
      expect(await editWithAiTurn(STORE_ID, input({ message: "review my page", attachments: [] }))).toEqual({ success: false, error: "aiDailyLimit" });
      expect(mocks.generateStructured).not.toHaveBeenCalled();
      mocks.generateStructured.mockRejectedValue(new Error("busy"));
      expect(await editWithAiTurn(STORE_ID, input({ message: "review my page", attachments: [] }))).toEqual({ success: false, error: "aiFailed" });
      expect(mocks.claimAiCredit).not.toHaveBeenCalled();
    });

    it("is reached through the router too", async () => {
      mocks.generateStructured
        .mockResolvedValueOnce({ object: { route: "advice", target: null, sectionId: null, scope: null, reply: null }, cached: false })
        .mockResolvedValueOnce({ object: { reply: "1. Make the headline say what you sell.", suggestions: null }, cached: false });
      const result = await editWithAiTurn(STORE_ID, input({ message: "is it good enough to launch", attachments: [] }));
      expect(result).toMatchObject({ success: true, data: { route: "advice", reply: "1. Make the headline say what you sell.", suggestions: [], creditsUsed: 0 } });
      expect(mocks.generateStructured).toHaveBeenCalledTimes(2);
      expect(mocks.claimAiCredit).not.toHaveBeenCalled();
    });
  });

  describe("out of reach", () => {
    beforeEach(() => mocks.verify.mockResolvedValue({ ok: true, images: [], files: [], recorded: false }));

    it("answers by code with the page that does it: no model, no cap, no credit", async () => {
      const result = await editWithAiTurn(STORE_ID, input({ message: "create a new page for our story", attachments: [] }));
      expect(result).toMatchObject({ success: true, data: { route: "help", links: [{ key: "pages", href: `/stores/${STORE_ID}/website/pages` }], siteChanges: null, creditsUsed: 0, suggestions: [] } });
      const coupon = await editWithAiTurn(STORE_ID, input({ message: "اعمل كوبون خصم ١٠٪", uiLocale: "ar", attachments: [] }));
      expect(coupon).toMatchObject({ success: true, data: { route: "help", links: [{ key: "coupons", href: "/coupons" }] } });
      expect(mocks.generateStructured).not.toHaveBeenCalled();
      expect(mocks.checkDailyCap).not.toHaveBeenCalled();
      expect(mocks.claimAiCredit).not.toHaveBeenCalled();
      expect(mocks.runStoreAgentTurn).not.toHaveBeenCalled();
    });

    it("a website edit that only mentions such a thing is still an edit", async () => {
      mocks.generateStructured.mockResolvedValue(editAnswer([{ op: "set_text", sectionId: "s-hero", nodeId: "n-title", prop: "text", ar: "الدفع عند الاستلام", en: "Cash on delivery" }]));
      const result = await editWithAiTurn(STORE_ID, input({ message: "write cash on delivery in the hero heading", attachments: [] }));
      expect(result).toMatchObject({ success: true, data: { route: "site", links: [], siteChanges: { target: { kind: "page", sectionId: "s-hero" } } } });
    });

    it("adds the link when the router or the edit ends with nothing done", async () => {
      mocks.generateStructured.mockResolvedValueOnce({ object: { route: "none", target: null, sectionId: null, scope: null, reply: "I can't do that here." }, cached: false });
      const none = await editWithAiTurn(STORE_ID, input({ message: "what about a coupon for my customers", attachments: [] }));
      expect(none).toMatchObject({ success: true, data: { route: "none", reply: "I can't do that here.", links: [{ key: "coupons", href: "/coupons" }] } });

      mocks.generateStructured.mockReset();
      mocks.generateStructured.mockResolvedValue(editAnswer([], "I can't add a coupon from here."));
      const empty = await editWithAiTurn(STORE_ID, input({ message: "put a coupon box in the hero banner", attachments: [] }));
      expect(empty).toMatchObject({ success: true, data: { route: "site", siteChanges: null, creditsUsed: 0, links: [{ key: "coupons", href: "/coupons" }] } });
      expect(mocks.refundAiCredit).toHaveBeenCalled();
    });
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

  it("reports no credits before the USD switch", async () => {
    mocks.getBillingState.mockResolvedValue({ usdLive: false });
    const result = await editWithAiTurn(STORE_ID, input());
    expect(result).toMatchObject({ success: true, data: { creditsUsed: 0, creditsRemaining: null } });
    expect(mocks.claimAiCredit).not.toHaveBeenCalled();
    expect(mocks.getAiCreditStatus).not.toHaveBeenCalled();
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

describe("confirmEditWithAiAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStore.mockImplementation(async () => ({ seller: { sellerId: crypto.randomUUID(), userId: "u1" }, store: { id: STORE_ID, name: "x" } }));
    mocks.isSwitchOn.mockResolvedValue(true);
    mocks.getBillingState.mockResolvedValue({ usdLive: true });
    mocks.getAiCreditStatus.mockResolvedValue({ total: 40 });
  });

  it("runs the seller's own pending action through the core, which charges its credit", async () => {
    mocks.pendingPublishes.mockResolvedValue(true);
    mocks.confirmAction.mockResolvedValue({ actionId: "act_x", tool: "create_product", result: { productId: "p" }, creditsCharged: 1, replayed: false });
    const result = await confirmEditWithAiAction(STORE_ID, "act_abcdefghijklmnopqrstuvwx");
    expect(result).toEqual({ success: true, data: { tool: "create_product", result: { productId: "p" }, creditsUsed: 1, creditsRemaining: 40 } });
    // The credits left are read after the core charged the confirmed write.
    expect(mocks.getAiCreditStatus.mock.invocationCallOrder[0]!).toBeGreaterThan(mocks.confirmAction.mock.invocationCallOrder[0]!);
    expect(mocks.confirmAction.mock.calls[0]![0]).toMatchObject({ publishProducts: true, source: "in_app" });
  });

  it("treats another seller's or store's action as missing", async () => {
    mocks.pendingPublishes.mockResolvedValue(null);
    expect(await confirmEditWithAiAction(STORE_ID, "act_abcdefghijklmnopqrstuvwx")).toEqual({ success: false, error: "notFound" });
    expect(mocks.confirmAction).not.toHaveBeenCalled();
  });
});
