import { describe, expect, it, vi } from "vitest";
import type { EditWithAiProposal, EditWithAiTurnView } from "./server/edit-with-ai.dto";
import {
  CHAT_MAX_MESSAGES,
  classifyFile,
  createEditWithAiChat,
  historyOf,
  restoreChat,
  type AppliedSiteTurn,
  type ChatActions,
  type ChatDeps,
  type ChatMessage,
  type SiteTurnChanges,
} from "./edit-with-ai-chat.lib";

const view = (patch: Partial<EditWithAiTurnView> = {}): EditWithAiTurnView => ({
  reply: "Done",
  route: "site",
  siteChanges: null,
  proposals: [],
  cards: [],
  rejected: [],
  creditsUsed: 0,
  creditsRemaining: null,
  ...patch,
});

const PAGE = "22222222-2222-4222-8222-222222222222";
const changes = (patch: Partial<SiteTurnChanges> = {}): SiteTurnChanges => ({
  pageId: PAGE,
  target: { kind: "page", sectionId: "s-hero" },
  ops: [{ op: "set_text", sectionId: "s-hero", nodeId: "n-title", prop: "text", text: { ar: "شتاء", en: "Winter" } }] as unknown as SiteTurnChanges["ops"],
  applied: ["Changed the hero"],
  previews: {},
  contentLocale: "en",
  ...patch,
});

const proposal = (actionId = "act_aaaaaaaaaaaaaaaaaaaaaa"): EditWithAiProposal => ({
  actionId,
  tool: "create_product",
  skill: "products",
  card: { title: "agent.card.products.create.title", params: { name: "Mug" }, lines: [{ key: "agent.card.products.staysDraft" }], risk: "low" },
  credits: 1,
  expiresAt: "2026-11-26T12:00:00Z",
});

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
}

/** Resolves the next `n` microtask turns (uploads and turns are a few awaits deep). */
const flush = async (n = 10) => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

function setup(overrides: Partial<ChatActions> = {}, deps: Partial<ChatDeps> = {}) {
  let id = 0;
  const actions: ChatActions = {
    turn: vi.fn(async () => ({ success: true as const, data: view() })),
    uploads: vi.fn(async (input: Parameters<ChatActions["uploads"]>[0]) => ({
      success: true as const,
      data: input.files.map((f, i: number) => ({ kind: f.kind, path: `seller/store/${f.name}-${i}`, bucket: "store-media", token: "tok", ...(f.kind === "image" && { url: `https://cdn/${f.name}` }) })),
    })),
    confirm: vi.fn(async () => ({ success: true as const, data: { tool: "create_product", result: { productId: "p1", status: "draft", slug: "mug" }, creditsUsed: 1, creditsRemaining: 39 } })),
    cancel: vi.fn(async () => ({ success: true as const, data: null })),
    ...overrides,
  };
  const uploadFile = vi.fn(async () => {});
  const storage = memoryStorage();
  const onStoreChanged = vi.fn();
  const onCredits = vi.fn();
  const beforeTurn = vi.fn(async () => true);
  /** The editor's undo step of each applied turn. */
  const marker = { step: "undo" };
  const applySiteTurn = vi.fn((site: SiteTurnChanges): AppliedSiteTurn => ({ applied: site.applied, undoMarker: marker, stale: false }));
  const chat = createEditWithAiChat({ uiLocale: "en", actions, uploadFile, storage, storageKey: "k", beforeTurn, applySiteTurn, onStoreChanged, onCredits, makeId: () => `id${++id}`, ...deps });
  return { chat, actions, uploadFile, storage, onStoreChanged, onCredits, beforeTurn, applySiteTurn, marker };
}

const image = (name = "hero.jpg", size = 1000) => new File([new Uint8Array(size)], name, { type: "image/jpeg" });
const csv = (name = "products.csv") => new File(["a,b"], name, { type: "text/csv" });

describe("classifyFile", () => {
  it("accepts photos and product files, and refuses other types and big files", () => {
    expect(classifyFile({ name: "a.png", type: "image/png", size: 10 })).toEqual({ kind: "image" });
    expect(classifyFile({ name: "a.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 10 })).toEqual({ kind: "file" });
    expect(classifyFile({ name: "a.pdf", type: "application/pdf", size: 10 })).toEqual({ kind: "file" });
    expect(classifyFile({ name: "a.gif", type: "image/gif", size: 10 })).toMatchObject({ error: "type" });
    expect(classifyFile({ name: "a.exe", type: "application/octet-stream", size: 10 })).toMatchObject({ error: "type" });
    expect(classifyFile({ name: "a.jpg", type: "image/jpeg", size: 6 * 1024 * 1024 })).toMatchObject({ error: "size" });
    expect(classifyFile({ name: "a.csv", type: "text/csv", size: 6 * 1024 * 1024 })).toMatchObject({ error: "size" });
  });
});

describe("historyOf", () => {
  it("keeps the last 8 seller and AI texts, each capped at 2000 characters", () => {
    const messages: ChatMessage[] = Array.from({ length: 12 }, (_, i) =>
      i % 2 === 0
        ? { id: `u${i}`, role: "user" as const, text: `q${i}`, attachments: [] }
        : { id: `a${i}`, role: "assistant" as const, text: "x".repeat(2500), siteChanges: null, proposals: [], cards: [], rejected: 0, creditsUsed: 0 },
    );
    messages.push({ id: "e", role: "error", error: "generic" });
    const history = historyOf(messages);
    expect(history).toHaveLength(8);
    expect(history[0]).toEqual({ role: "user", text: "q4" });
    expect(history.every((h) => h.text.length <= 2000)).toBe(true);
  });
});

describe("sending with attachments", () => {
  it("uploads at once to the server-signed path, then sends the turn with those paths", async () => {
    const { chat, actions, uploadFile } = setup();
    chat.addFiles([image(), csv()]);
    expect(chat.getState().attachments.map((a) => a.status)).toEqual(["uploading", "uploading"]);
    await flush();
    expect(actions.uploads).toHaveBeenCalledTimes(2);
    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect(chat.getState().attachments.map((a) => a.status)).toEqual(["ready", "ready"]);

    chat.setDraft("Use this photo");
    await chat.send({ pageId: PAGE, contentLocale: "en", target: { kind: "page", sectionId: "s-hero" } });
    expect(actions.turn).toHaveBeenCalledWith({
      message: "Use this photo",
      uiLocale: "en",
      history: [],
      attachments: [
        { kind: "image", path: "seller/store/hero.jpg-0" },
        { kind: "file", path: "seller/store/products.csv-0", name: "products.csv" },
      ],
      pageId: PAGE,
      target: { kind: "page", sectionId: "s-hero" },
      contentLocale: "en",
    });
    const [user] = chat.getState().messages;
    expect(user).toMatchObject({ role: "user", attachments: [{ kind: "image", name: "hero.jpg", url: "https://cdn/hero.jpg" }, { kind: "file", name: "products.csv" }] });
    expect(chat.getState().attachments).toEqual([]);
  });

  it("waits for uploads still running, then sends by itself, about the page it was sent from", async () => {
    let release!: () => void;
    const { chat, actions } = setup({}, { uploadFile: vi.fn(() => new Promise<void>((resolve) => (release = resolve))) });
    chat.addFiles([image()]);
    chat.setDraft("Hero");
    await chat.send({ pageId: PAGE, contentLocale: "ar" });
    expect(chat.getState().waitingUploads).toBe(true);
    expect(actions.turn).not.toHaveBeenCalled();
    await flush();
    release();
    await flush();
    expect(actions.turn).toHaveBeenCalledTimes(1);
    expect(actions.turn).toHaveBeenCalledWith(expect.objectContaining({ pageId: PAGE, contentLocale: "ar" }));
    expect(chat.getState().waitingUploads).toBe(false);
  });

  it("shows type, size and count errors on their chips and never uploads them", async () => {
    const { chat, actions } = setup();
    chat.addFiles([new File(["x"], "a.gif", { type: "image/gif" }), image("big.jpg", 6 * 1024 * 1024), ...Array.from({ length: 7 }, (_, i) => image(`p${i}.jpg`))]);
    const chips = chat.getState().attachments;
    expect(chips.map((c) => c.error ?? c.status)).toEqual(["type", "size", "uploading", "uploading", "uploading", "uploading", "uploading", "uploading", "tooMany"]);
    await flush();
    expect(actions.uploads).toHaveBeenCalledTimes(6);
  });

  it("marks a chip failed when the upload fails, and a removed chip is not sent", async () => {
    const { chat, actions } = setup({}, { uploadFile: vi.fn(async () => Promise.reject(new Error("net"))) });
    chat.addFiles([image()]);
    await flush();
    expect(chat.getState().attachments[0]).toMatchObject({ status: "error", error: "upload" });
    chat.removeAttachment(chat.getState().attachments[0]!.id);
    await chat.send({}, "Hello");
    expect(actions.turn).toHaveBeenCalledWith(expect.objectContaining({ attachments: [] }));
  });

  it("reports the server's refusal of an upload", async () => {
    const { chat } = setup({ uploads: vi.fn(async () => ({ success: false as const, error: "uploadUnavailable" as const })) });
    chat.addFiles([csv()]);
    await flush();
    expect(chat.getState().attachments[0]).toMatchObject({ status: "error", error: "uploadUnavailable" });
  });
});

describe("a turn", () => {
  it("saves the editor first, applies the ops to the canvas, and keeps history for the next turn", async () => {
    const site = changes();
    const { chat, actions, beforeTurn, applySiteTurn, onCredits } = setup({
      turn: vi.fn(async () => ({ success: true as const, data: view({ siteChanges: site, creditsUsed: 1, creditsRemaining: 39, rejected: [{ code: "x" }] }) })),
    });
    await chat.send({ pageId: PAGE }, "Change the hero");
    expect(beforeTurn.mock.invocationCallOrder[0]!).toBeLessThan(vi.mocked(actions.turn).mock.invocationCallOrder[0]!);
    expect(applySiteTurn).toHaveBeenCalledWith(site);
    const reply = chat.getState().messages[1]!;
    expect(reply).toMatchObject({ role: "assistant", text: "Done", siteChanges: { lines: ["Changed the hero"] }, creditsUsed: 1, rejected: 1 });
    expect(onCredits).toHaveBeenCalledWith(39);
    await chat.send({ pageId: PAGE }, "And the title");
    expect(actions.turn).toHaveBeenLastCalledWith(expect.objectContaining({ history: [{ role: "user", text: "Change the hero" }, { role: "assistant", text: "Done" }] }));
  });

  it("doesn't call the server when the editor's edits can't be saved", async () => {
    const { chat, actions, applySiteTurn } = setup({}, { beforeTurn: vi.fn(async () => false) });
    await chat.send({}, "Change the hero");
    expect(actions.turn).not.toHaveBeenCalled();
    expect(applySiteTurn).not.toHaveBeenCalled();
    expect(chat.getState().messages[1]).toMatchObject({ role: "error", error: "draftChanged" });
    expect(chat.getState().pending).toBe(false);
  });

  it("says so when the drafts changed meanwhile and nothing could be applied", async () => {
    const { chat } = setup(
      { turn: vi.fn(async () => ({ success: true as const, data: view({ siteChanges: changes(), creditsUsed: 1 }) })) },
      { applySiteTurn: vi.fn((): AppliedSiteTurn => ({ applied: [], undoMarker: null, stale: true })) },
    );
    await chat.send({}, "Change the hero");
    const reply = chat.getState().messages[1]!;
    expect(reply).toMatchObject({ role: "assistant", siteChanges: { lines: [], stale: true }, creditsUsed: 1 });
    expect(chat.undoMarkerOf(reply.id)).toBeNull();
  });

  it("applies nothing for a store-data turn", async () => {
    const { chat, applySiteTurn } = setup({ turn: vi.fn(async () => ({ success: true as const, data: view({ route: "products", proposals: [proposal()] }) })) });
    await chat.send({}, "Add a mug");
    expect(applySiteTurn).not.toHaveBeenCalled();
    expect(chat.getState().messages[1]).toMatchObject({ siteChanges: null });
  });

  it("shows an error message for a refused turn, and no credits left", async () => {
    const { chat, onCredits } = setup({ turn: vi.fn(async () => ({ success: false as const, error: "aiNoCredits" as const })) });
    await chat.send({}, "Hi");
    expect(chat.getState().messages[1]).toMatchObject({ role: "error", error: "aiNoCredits" });
    expect(onCredits).toHaveBeenCalledWith(0);
    expect(chat.getState().pending).toBe(false);
  });

  it("Stop ignores the late answer: nothing is applied", async () => {
    let answer!: (value: Awaited<ReturnType<ChatActions["turn"]>>) => void;
    const { chat, applySiteTurn } = setup({ turn: vi.fn(() => new Promise<Awaited<ReturnType<ChatActions["turn"]>>>((resolve) => (answer = resolve))) });
    const sent = chat.send({}, "Change the hero");
    expect(chat.getState().pending).toBe(true);
    await flush();
    chat.stop();
    expect(chat.getState().pending).toBe(false);
    answer({ success: true, data: view({ siteChanges: changes({ target: { kind: "header" } }) }) });
    await sent;
    expect(chat.getState().messages.map((m) => m.role)).toEqual(["user", "notice"]);
    expect(applySiteTurn).not.toHaveBeenCalled();
  });

  it("Stop while the editor is still saving never reaches the server", async () => {
    let saved!: (ok: boolean) => void;
    const { chat, actions } = setup({}, { beforeTurn: vi.fn(() => new Promise<boolean>((resolve) => (saved = resolve))) });
    const sent = chat.send({}, "Change the hero");
    chat.stop();
    saved(true);
    await sent;
    expect(actions.turn).not.toHaveBeenCalled();
  });
});

describe("undo", () => {
  const withChanges = () => setup({ turn: vi.fn(async () => ({ success: true as const, data: view({ siteChanges: changes({ target: { kind: "footer" } }) }) })) });

  it("keeps the editor's undo step of a site turn, in memory only", async () => {
    const { chat, storage, marker } = withChanges();
    await chat.send({}, "Edit the footer");
    const id = chat.getState().messages[1]!.id;
    expect(chat.undoMarkerOf(id)).toBe(marker);
    expect(chat.undoMarkerOf("other")).toBeNull();
    // Never stored: after a reload the change stays and Undo is simply not offered.
    expect(storage.data.get("k")).not.toContain("undo");
    const again = createEditWithAiChat({ uiLocale: "en", actions: {} as ChatActions, uploadFile: vi.fn(), storage, storageKey: "k", beforeTurn: async () => true, applySiteTurn: vi.fn() });
    expect(again.getState().messages[1]).toMatchObject({ siteChanges: { lines: ["Changed the hero"] } });
    expect(again.undoMarkerOf(id)).toBeNull();
  });

  it("forgets the steps when the chat is cleared", async () => {
    const { chat } = withChanges();
    await chat.send({}, "Edit the footer");
    const id = chat.getState().messages[1]!.id;
    chat.clear();
    expect(chat.undoMarkerOf(id)).toBeNull();
  });
});

describe("confirm cards", () => {
  const withProposal = (overrides: Partial<ChatActions> = {}) =>
    setup({ turn: vi.fn(async () => ({ success: true as const, data: view({ route: "products", proposals: [proposal()] }) })), ...overrides });

  it("Confirm runs the action, shows the product it made, tells the page and updates the credits", async () => {
    const { chat, actions, onStoreChanged, onCredits } = withProposal();
    await chat.send({}, "Add a mug");
    const id = chat.getState().messages[1]!.id;
    await chat.confirm(id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(actions.confirm).toHaveBeenCalledWith("act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(chat.getState().messages[1]).toMatchObject({ proposals: [{ status: "done", product: { id: "p1", live: false }, creditsUsed: 1 }] });
    expect(onStoreChanged).toHaveBeenCalledWith("create_product", "products");
    expect(onCredits).toHaveBeenCalledWith(39);
    // Once only.
    await chat.confirm(id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(actions.confirm).toHaveBeenCalledTimes(1);
  });

  it("an expired card can't be confirmed again; a busy one can", async () => {
    const { chat, actions } = withProposal();
    vi.mocked(actions.confirm).mockResolvedValueOnce({ success: false, error: "actionRunning" }).mockResolvedValueOnce({ success: false, error: "actionExpired" });
    await chat.send({}, "Add a mug");
    const id = chat.getState().messages[1]!.id;
    await chat.confirm(id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(chat.getState().messages[1]).toMatchObject({ proposals: [{ status: "pending", error: "actionRunning" }] });
    await chat.confirm(id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(chat.getState().messages[1]).toMatchObject({ proposals: [{ status: "failed", error: "actionExpired" }] });
  });

  it("Cancel calls the cancel action", async () => {
    const { chat, actions, onStoreChanged } = withProposal();
    await chat.send({}, "Add a mug");
    await chat.cancel(chat.getState().messages[1]!.id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(actions.cancel).toHaveBeenCalledWith("act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(chat.getState().messages[1]).toMatchObject({ proposals: [{ status: "cancelled" }] });
    expect(onStoreChanged).not.toHaveBeenCalled();
  });
});

describe("sessionStorage", () => {
  it("keeps the chat and draft per store and restores them, with work in flight idle again", async () => {
    const { chat, storage } = setup({ turn: vi.fn(async () => ({ success: true as const, data: view({ proposals: [proposal()] }) })) });
    await chat.send({}, "Add a mug");
    chat.setDraft("unsent text");
    const saved = JSON.parse(storage.data.get("k")!);
    saved.messages[1].proposals[0].status = "confirming";
    const again = createEditWithAiChat({ uiLocale: "en", actions: {} as ChatActions, uploadFile: vi.fn(), storage: memoryStorage({ k: JSON.stringify(saved) }), storageKey: "k", beforeTurn: async () => true, applySiteTurn: vi.fn() });
    expect(again.getState().draft).toBe("unsent text");
    expect(again.getState().messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(again.getState().messages[1]).toMatchObject({ proposals: [{ status: "pending" }] });
  });

  it("caps the stored chat at the last 50 messages and ignores broken data", () => {
    const messages = Array.from({ length: 70 }, (_, i) => ({ id: `m${i}`, role: "user", text: `t${i}`, attachments: [] }));
    const restored = restoreChat(JSON.stringify({ messages, draft: "d" }));
    expect(restored.messages).toHaveLength(CHAT_MAX_MESSAGES);
    expect(restored.messages[0]).toMatchObject({ id: "m20" });
    expect(restoreChat("{not json")).toEqual({ messages: [], draft: "" });
    expect(restoreChat(JSON.stringify({ messages: [{ role: "admin" }, 5] }))).toEqual({ messages: [], draft: "" });
  });

  it("reads a chat stored before the canvas editor: the old undo token and state are dropped", () => {
    const old = { id: "a", role: "assistant", text: "Done", siteChanges: { lines: ["Changed the hero"], undoToken: "t".repeat(24), undo: "available" }, proposals: [], cards: [], rejected: 0, creditsUsed: 1 };
    expect(restoreChat(JSON.stringify({ messages: [old], draft: "" })).messages[0]).toMatchObject({ siteChanges: { lines: ["Changed the hero"] } });
    expect(JSON.stringify(restoreChat(JSON.stringify({ messages: [old], draft: "" })))).not.toContain("undoToken");
  });

  it("works without storage", async () => {
    const { chat } = setup({}, { storage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } });
    await chat.send({}, "Hi");
    expect(chat.getState().messages).toHaveLength(2);
  });
});
