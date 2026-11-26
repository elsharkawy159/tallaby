import { describe, expect, it, vi } from "vitest";
import type { EditWithAiProposal, EditWithAiTurnView } from "./server/edit-with-ai.dto";
import { CHAT_MAX_MESSAGES, classifyFile, createEditWithAiChat, historyOf, restoreChat, type ChatActions, type ChatDeps, type ChatMessage } from "./edit-with-ai-chat.lib";

const view = (patch: Partial<EditWithAiTurnView> = {}): EditWithAiTurnView => ({
  reply: "Done",
  route: "site",
  siteChanges: null,
  proposals: [],
  cards: [],
  rejected: [],
  creditsUsed: 0,
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
    undo: vi.fn(async () => ({ success: true as const, data: { previewUrl: "https://store/preview?t=2" } })),
    confirm: vi.fn(async () => ({ success: true as const, data: { tool: "create_product", result: { productId: "p1", status: "draft", slug: "mug" }, creditsUsed: 1 } })),
    cancel: vi.fn(async () => ({ success: true as const, data: null })),
    ...overrides,
  };
  const uploadFile = vi.fn(async () => {});
  const storage = memoryStorage();
  const onSiteChanged = vi.fn();
  const onStoreChanged = vi.fn();
  const chat = createEditWithAiChat({ uiLocale: "en", actions, uploadFile, storage, storageKey: "k", onSiteChanged, onStoreChanged, makeId: () => `id${++id}`, ...deps });
  return { chat, actions, uploadFile, storage, onSiteChanged, onStoreChanged };
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
    await chat.send();
    expect(actions.turn).toHaveBeenCalledWith({
      message: "Use this photo",
      uiLocale: "en",
      history: [],
      attachments: [
        { kind: "image", path: "seller/store/hero.jpg-0" },
        { kind: "file", path: "seller/store/products.csv-0", name: "products.csv" },
      ],
    });
    const [user] = chat.getState().messages;
    expect(user).toMatchObject({ role: "user", attachments: [{ kind: "image", name: "hero.jpg", url: "https://cdn/hero.jpg" }, { kind: "file", name: "products.csv" }] });
    expect(chat.getState().attachments).toEqual([]);
  });

  it("waits for uploads still running, then sends by itself", async () => {
    let release!: () => void;
    const { chat, actions } = setup({}, { uploadFile: vi.fn(() => new Promise<void>((resolve) => (release = resolve))) });
    chat.addFiles([image()]);
    chat.setDraft("Hero");
    await chat.send();
    expect(chat.getState().waitingUploads).toBe(true);
    expect(actions.turn).not.toHaveBeenCalled();
    await flush();
    release();
    await flush();
    expect(actions.turn).toHaveBeenCalledTimes(1);
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
    await chat.send("Hello");
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
  it("shows the reply, tells the page the site changed, and keeps history for the next turn", async () => {
    const { chat, actions, onSiteChanged } = setup({
      turn: vi.fn(async () => ({
        success: true as const,
        data: view({ siteChanges: { target: { kind: "page", pageId: "p" }, lines: ["Changed the hero"], undoToken: "u".repeat(24), previewUrl: "https://s/p" }, creditsUsed: 1, rejected: [{ code: "x" }] }),
      })),
    });
    await chat.send("Change the hero");
    const reply = chat.getState().messages[1]!;
    expect(reply).toMatchObject({ role: "assistant", text: "Done", siteChanges: { lines: ["Changed the hero"], undo: "available" }, creditsUsed: 1, rejected: 1 });
    expect(onSiteChanged).toHaveBeenCalledWith("https://s/p");
    await chat.send("And the title");
    expect(actions.turn).toHaveBeenLastCalledWith(expect.objectContaining({ history: [{ role: "user", text: "Change the hero" }, { role: "assistant", text: "Done" }] }));
  });

  it("shows an error message for a refused turn", async () => {
    const { chat } = setup({ turn: vi.fn(async () => ({ success: false as const, error: "aiNoCredits" as const })) });
    await chat.send("Hi");
    expect(chat.getState().messages[1]).toMatchObject({ role: "error", error: "aiNoCredits" });
    expect(chat.getState().pending).toBe(false);
  });

  it("Stop ignores the late answer", async () => {
    let answer!: (value: Awaited<ReturnType<ChatActions["turn"]>>) => void;
    const { chat, onSiteChanged } = setup({ turn: vi.fn(() => new Promise<Awaited<ReturnType<ChatActions["turn"]>>>((resolve) => (answer = resolve))) });
    const sent = chat.send("Change the hero");
    expect(chat.getState().pending).toBe(true);
    chat.stop();
    expect(chat.getState().pending).toBe(false);
    answer({ success: true, data: view({ siteChanges: { target: { kind: "header" }, lines: ["x"], undoToken: "u".repeat(24), previewUrl: null } }) });
    await sent;
    expect(chat.getState().messages.map((m) => m.role)).toEqual(["user", "notice"]);
    expect(onSiteChanged).not.toHaveBeenCalled();
  });
});

describe("undo", () => {
  const withChanges = () =>
    setup({
      turn: vi.fn(async () => ({ success: true as const, data: view({ siteChanges: { target: { kind: "footer" }, lines: ["x"], undoToken: "t".repeat(24), previewUrl: null } }) })),
    });

  it("puts the draft back and refreshes the preview", async () => {
    const { chat, actions, onSiteChanged } = withChanges();
    await chat.send("Edit the footer");
    const id = chat.getState().messages[1]!.id;
    await chat.undo(id);
    expect(actions.undo).toHaveBeenCalledWith("t".repeat(24));
    expect(chat.getState().messages[1]).toMatchObject({ siteChanges: { undo: "done" } });
    expect(onSiteChanged).toHaveBeenLastCalledWith("https://store/preview?t=2");
    await chat.undo(id);
    expect(actions.undo).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["undoExpired", "expired"],
    ["draftChanged", "changed"],
  ] as const)("explains %s", async (error, state) => {
    const { chat, actions } = withChanges();
    vi.mocked(actions.undo).mockResolvedValueOnce({ success: false, error });
    await chat.send("Edit the footer");
    await chat.undo(chat.getState().messages[1]!.id);
    expect(chat.getState().messages[1]).toMatchObject({ siteChanges: { undo: state, error } });
  });

  it("keeps Undo available after another failure", async () => {
    const { chat, actions } = withChanges();
    vi.mocked(actions.undo).mockResolvedValueOnce({ success: false, error: "rateLimited" });
    await chat.send("Edit the footer");
    await chat.undo(chat.getState().messages[1]!.id);
    expect(chat.getState().messages[1]).toMatchObject({ siteChanges: { undo: "available", error: "rateLimited" } });
  });
});

describe("confirm cards", () => {
  const withProposal = (overrides: Partial<ChatActions> = {}) =>
    setup({ turn: vi.fn(async () => ({ success: true as const, data: view({ route: "products", proposals: [proposal()] }) })), ...overrides });

  it("Confirm runs the action, shows the product it made and tells the page", async () => {
    const { chat, actions, onStoreChanged } = withProposal();
    await chat.send("Add a mug");
    const id = chat.getState().messages[1]!.id;
    await chat.confirm(id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(actions.confirm).toHaveBeenCalledWith("act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(chat.getState().messages[1]).toMatchObject({ proposals: [{ status: "done", product: { id: "p1", live: false }, creditsUsed: 1 }] });
    expect(onStoreChanged).toHaveBeenCalledWith("create_product");
    // Once only.
    await chat.confirm(id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(actions.confirm).toHaveBeenCalledTimes(1);
  });

  it("an expired card can't be confirmed again; a busy one can", async () => {
    const { chat, actions } = withProposal();
    vi.mocked(actions.confirm).mockResolvedValueOnce({ success: false, error: "actionRunning" }).mockResolvedValueOnce({ success: false, error: "actionExpired" });
    await chat.send("Add a mug");
    const id = chat.getState().messages[1]!.id;
    await chat.confirm(id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(chat.getState().messages[1]).toMatchObject({ proposals: [{ status: "pending", error: "actionRunning" }] });
    await chat.confirm(id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(chat.getState().messages[1]).toMatchObject({ proposals: [{ status: "failed", error: "actionExpired" }] });
  });

  it("Cancel calls the cancel action", async () => {
    const { chat, actions, onStoreChanged } = withProposal();
    await chat.send("Add a mug");
    await chat.cancel(chat.getState().messages[1]!.id, "act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(actions.cancel).toHaveBeenCalledWith("act_aaaaaaaaaaaaaaaaaaaaaa");
    expect(chat.getState().messages[1]).toMatchObject({ proposals: [{ status: "cancelled" }] });
    expect(onStoreChanged).not.toHaveBeenCalled();
  });
});

describe("sessionStorage", () => {
  it("keeps the chat and draft per store and restores them, with work in flight idle again", async () => {
    const { chat, storage } = setup({ turn: vi.fn(async () => ({ success: true as const, data: view({ proposals: [proposal()] }) })) });
    await chat.send("Add a mug");
    chat.setDraft("unsent text");
    const saved = JSON.parse(storage.data.get("k")!);
    saved.messages[1].proposals[0].status = "confirming";
    const again = createEditWithAiChat({ uiLocale: "en", actions: {} as ChatActions, uploadFile: vi.fn(), storage: memoryStorage({ k: JSON.stringify(saved) }), storageKey: "k" });
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

  it("works without storage", async () => {
    const { chat } = setup({}, { storage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } });
    await chat.send("Hi");
    expect(chat.getState().messages).toHaveLength(2);
  });
});
