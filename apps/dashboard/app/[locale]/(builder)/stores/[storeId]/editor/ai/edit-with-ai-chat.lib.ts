import {
  EDIT_AI_FILE_TYPES,
  EDIT_AI_IMAGE_TYPES,
  EDIT_WITH_AI_LIMITS,
  type EditAiFileExt,
  type EditWithAiAttachment,
  type EditWithAiCard,
  type EditWithAiError,
  type EditWithAiInput,
  type EditWithAiProposal,
  type EditWithAiResult,
  type EditWithAiTurnView,
  type EditWithAiUpload,
  type EditWithAiUploadsInput,
} from "./server/edit-with-ai.dto";

/**
 * The "Edit with AI" chat's state, outside React (owner request 2026-11-26):
 * messages, the composer's draft and attachments, a turn in flight, undo and
 * the confirm cards. The server actions and the browser upload are injected,
 * so every flow is unit-tested with mocks. The chat is kept per store in
 * `sessionStorage` (the last 50 messages and the draft), so a visit to the
 * from-file import and back restores it. Paths sent back are only the ones
 * the server signed; nothing here builds a storage path.
 */

export const CHAT_MAX_MESSAGES = 50;
export const chatStorageKey = (storeId: string) => `tallaby:edit-with-ai:${storeId}`;

export type AttachmentError = "type" | "size" | "tooMany" | "upload" | "uploadUnavailable";

/** A chip in the composer. `previewUrl` is a local object URL (never stored). */
export type PendingAttachment = {
  id: string;
  kind: "image" | "file";
  name: string;
  status: "uploading" | "ready" | "error";
  error?: AttachmentError;
  /** The server-signed path, once uploaded. */
  path?: string;
  /** Photos: the public media URL the server returned. */
  url?: string;
  previewUrl?: string;
};

export type SentAttachment = { kind: "image" | "file"; name: string; url?: string };

export type ProposalView = EditWithAiProposal & {
  status: "pending" | "confirming" | "cancelling" | "done" | "cancelled" | "failed";
  error?: EditWithAiError;
  /** create_product's new product (its id and status), when the result has one. */
  product?: { id: string; live: boolean };
  creditsUsed?: number;
};

export type UndoState = "available" | "undoing" | "done" | "expired" | "changed" | "failed";

export type ChatMessage =
  | { id: string; role: "user"; text: string; attachments: SentAttachment[] }
  | {
      id: string;
      role: "assistant";
      text: string;
      siteChanges: { lines: string[]; undoToken: string; undo: UndoState; error?: EditWithAiError } | null;
      proposals: ProposalView[];
      cards: EditWithAiCard[];
      rejected: number;
      creditsUsed: number;
    }
  | { id: string; role: "error"; error: EditWithAiError }
  | { id: string; role: "notice"; notice: "stopped" };

export type AssistantMessage = Extract<ChatMessage, { role: "assistant" }>;

export type ChatState = {
  messages: ChatMessage[];
  draft: string;
  attachments: PendingAttachment[];
  /** A turn is running. */
  pending: boolean;
  /** Send was pressed while photos or files were still uploading. */
  waitingUploads: boolean;
};

export type ChatActions = {
  turn: (input: EditWithAiInput) => Promise<EditWithAiResult<EditWithAiTurnView>>;
  uploads: (input: EditWithAiUploadsInput) => Promise<EditWithAiResult<EditWithAiUpload[]>>;
  undo: (token: string) => Promise<EditWithAiResult<{ previewUrl: string | null }>>;
  confirm: (actionId: string) => Promise<EditWithAiResult<{ tool: string; result: unknown; creditsUsed: number }>>;
  cancel: (actionId: string) => Promise<EditWithAiResult<null>>;
};

export type ChatDeps = {
  uiLocale: "ar" | "en";
  actions: ChatActions;
  /** Puts the file at the signed path (`uploadToSignedUrl`). Throws on failure. */
  uploadFile: (upload: EditWithAiUpload, file: File) => Promise<void>;
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
  storageKey?: string;
  /** A site turn or an undo saved the drafts (a fresh preview link, or null). */
  onSiteChanged?: (previewUrl: string | null) => void;
  /** A confirmed store change ran (products, settings, shipping, theme). */
  onStoreChanged?: (tool: string) => void;
  objectUrl?: { create: (file: File) => string; revoke: (url: string) => void };
  makeId?: () => string;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function fileExtOf(name: string): EditAiFileExt | null {
  const ext = /\.([a-z0-9]{2,5})$/i.exec(name.trim())?.[1]?.toLowerCase();
  return ext === "csv" || ext === "xlsx" || ext === "xls" || ext === "pdf" ? ext : null;
}

/** What a picked file is, or why it can't be sent (the server checks again, from the bytes). */
export function classifyFile(file: { name: string; type: string; size: number }): { kind: "image" | "file" } | { error: AttachmentError; kind: "image" | "file" } {
  if ((EDIT_AI_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return file.size > EDIT_WITH_AI_LIMITS.imageBytes ? { error: "size", kind: "image" } : { kind: "image" };
  }
  const ext = fileExtOf(file.name);
  if (!ext || !(EDIT_AI_FILE_TYPES[ext] as readonly string[]).includes(file.type)) return { error: "type", kind: "file" };
  return file.size > EDIT_WITH_AI_LIMITS.fileBytes ? { error: "size", kind: "file" } : { kind: "file" };
}

/** The last turns the server reads (its caps: 8 entries, 2000 characters each). */
export function historyOf(messages: readonly ChatMessage[]): { role: "user" | "assistant"; text: string }[] {
  const turns: { role: "user" | "assistant"; text: string }[] = [];
  for (const message of messages) {
    if ((message.role === "user" || message.role === "assistant") && message.text.trim()) {
      turns.push({ role: message.role, text: message.text.slice(0, EDIT_WITH_AI_LIMITS.historyText) });
    }
  }
  return turns.slice(-EDIT_WITH_AI_LIMITS.history);
}

const PRODUCT_TOOLS = new Set(["create_product"]);

/** The product a confirmed create_product made, read defensively from its result. */
export function productOfResult(tool: string, result: unknown): { id: string; live: boolean } | undefined {
  if (!PRODUCT_TOOLS.has(tool) || !result || typeof result !== "object") return undefined;
  const { productId, status } = result as { productId?: unknown; status?: unknown };
  return typeof productId === "string" && productId ? { id: productId, live: status === "active" } : undefined;
}

/** Confirm errors after which the card can't be tried again. */
const FINAL_CONFIRM_ERRORS = new Set<EditWithAiError>(["actionExpired", "actionFailed", "notFound", "invalidInput"]);

const isRecord = (value: unknown): value is Record<string, unknown> => value != null && typeof value === "object" && !Array.isArray(value);

/** Reads a stored chat back; anything malformed is dropped. Work in flight comes back idle. */
export function restoreChat(raw: string | null): { messages: ChatMessage[]; draft: string } {
  if (!raw) return { messages: [], draft: "" };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.messages)) return { messages: [], draft: "" };
    const messages = (parsed.messages as unknown[])
      .filter((m): m is ChatMessage => isRecord(m) && typeof m.id === "string" && ["user", "assistant", "error", "notice"].includes(String(m.role)))
      .slice(-CHAT_MAX_MESSAGES)
      .map((message): ChatMessage => {
        if (message.role !== "assistant") return message;
        return {
          ...message,
          proposals: (Array.isArray(message.proposals) ? message.proposals : []).map((p) =>
            p.status === "confirming" || p.status === "cancelling" ? { ...p, status: "pending" } : p,
          ),
          cards: Array.isArray(message.cards) ? message.cards : [],
          siteChanges: message.siteChanges ? { ...message.siteChanges, undo: message.siteChanges.undo === "undoing" ? "available" : message.siteChanges.undo } : null,
        };
      });
    return { messages, draft: typeof parsed.draft === "string" ? parsed.draft.slice(0, EDIT_WITH_AI_LIMITS.message) : "" };
  } catch {
    return { messages: [], draft: "" };
  }
}

// ---------------------------------------------------------------------------
// The controller
// ---------------------------------------------------------------------------

export type EditWithAiChat = ReturnType<typeof createEditWithAiChat>;

export function createEditWithAiChat(deps: ChatDeps) {
  const makeId = deps.makeId ?? (() => Math.random().toString(36).slice(2, 12));
  const stored = (() => {
    try {
      return deps.storage && deps.storageKey ? deps.storage.getItem(deps.storageKey) : null;
    } catch {
      return null;
    }
  })();
  const restored = restoreChat(stored);
  let state: ChatState = { messages: restored.messages, draft: restored.draft, attachments: [], pending: false, waitingUploads: false };
  const listeners = new Set<() => void>();
  /** Bumped by every turn and by Stop: an answer for an older number is ignored. */
  let turnSeq = 0;
  const files = new Map<string, File>();

  const persist = () => {
    if (!deps.storage || !deps.storageKey) return;
    try {
      deps.storage.setItem(deps.storageKey, JSON.stringify({ messages: state.messages.slice(-CHAT_MAX_MESSAGES), draft: state.draft }));
    } catch {
      // Full or blocked storage: the chat still works, it just isn't kept.
    }
  };

  const set = (patch: Partial<ChatState>, save = true) => {
    state = { ...state, ...patch };
    if (save) persist();
    listeners.forEach((listener) => listener());
  };

  const push = (message: ChatMessage) => set({ messages: [...state.messages, message].slice(-CHAT_MAX_MESSAGES) });

  const updateMessage = (id: string, update: (message: AssistantMessage) => AssistantMessage) =>
    set({ messages: state.messages.map((m) => (m.id === id && m.role === "assistant" ? update(m) : m)) });

  const updateProposal = (messageId: string, actionId: string, patch: Partial<ProposalView>) =>
    updateMessage(messageId, (m) => ({ ...m, proposals: m.proposals.map((p) => (p.actionId === actionId ? { ...p, ...patch } : p)) }));

  const updateAttachment = (id: string, patch: Partial<PendingAttachment>) =>
    set({ attachments: state.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)) }, false);

  const uploading = () => state.attachments.some((a) => a.status === "uploading");

  async function upload(id: string, kind: "image" | "file", file: File) {
    let signed: EditWithAiResult<EditWithAiUpload[]>;
    try {
      signed = await deps.actions.uploads({ files: [{ kind, type: file.type, size: file.size, name: file.name.trim().slice(0, EDIT_WITH_AI_LIMITS.fileName) || "file" }] });
    } catch {
      signed = { success: false, error: "generic" };
    }
    if (!state.attachments.some((a) => a.id === id)) return;
    const target = signed.success ? signed.data[0] : undefined;
    if (!target) {
      const error = !signed.success && signed.error === "uploadUnavailable" ? "uploadUnavailable" : !signed.success && signed.error === "attachmentInvalid" ? "type" : "upload";
      updateAttachment(id, { status: "error", error });
    } else {
      try {
        await deps.uploadFile(target, file);
        if (state.attachments.some((a) => a.id === id)) updateAttachment(id, { status: "ready", path: target.path, ...(target.url && { url: target.url }) });
      } catch {
        if (state.attachments.some((a) => a.id === id)) updateAttachment(id, { status: "error", error: "upload" });
      }
    }
    files.delete(id);
    if (state.waitingUploads && !uploading()) void chat.send();
  }

  const chat = {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setDraft(draft: string) {
      set({ draft: draft.slice(0, EDIT_WITH_AI_LIMITS.message) });
    },

    /** Picked or dropped files: each becomes a chip and starts uploading at once. */
    addFiles(list: readonly File[]) {
      const added: PendingAttachment[] = [];
      const toUpload: { id: string; kind: "image" | "file"; file: File }[] = [];
      let count = state.attachments.filter((a) => a.status !== "error").length;
      for (const file of list) {
        const id = makeId();
        const checked = classifyFile(file);
        const name = file.name || "file";
        if ("error" in checked) {
          added.push({ id, kind: checked.kind, name, status: "error", error: checked.error });
          continue;
        }
        if (count >= EDIT_WITH_AI_LIMITS.attachments) {
          added.push({ id, kind: checked.kind, name, status: "error", error: "tooMany" });
          continue;
        }
        count += 1;
        const previewUrl = checked.kind === "image" && deps.objectUrl ? deps.objectUrl.create(file) : undefined;
        added.push({ id, kind: checked.kind, name, status: "uploading", ...(previewUrl && { previewUrl }) });
        toUpload.push({ id, kind: checked.kind, file });
        files.set(id, file);
      }
      set({ attachments: [...state.attachments, ...added] }, false);
      for (const item of toUpload) void upload(item.id, item.kind, item.file);
    },

    removeAttachment(id: string) {
      const found = state.attachments.find((a) => a.id === id);
      if (found?.previewUrl) deps.objectUrl?.revoke(found.previewUrl);
      files.delete(id);
      set({ attachments: state.attachments.filter((a) => a.id !== id) }, false);
      if (state.waitingUploads && !uploading()) void chat.send();
    },

    /** Sends the draft (or `text`). With uploads still running it waits for them, then sends. */
    async send(text?: string) {
      if (text !== undefined) set({ draft: text.slice(0, EDIT_WITH_AI_LIMITS.message) });
      const message = state.draft.trim();
      if (state.pending || !message) {
        if (state.waitingUploads) set({ waitingUploads: false }, false);
        return;
      }
      if (uploading()) {
        set({ waitingUploads: true }, false);
        return;
      }
      const ready = state.attachments.filter((a): a is PendingAttachment & { path: string } => a.status === "ready" && !!a.path);
      const attachments: EditWithAiAttachment[] = ready.map((a) => (a.kind === "image" ? { kind: "image", path: a.path } : { kind: "file", path: a.path, name: a.name.slice(0, EDIT_WITH_AI_LIMITS.fileName) }));
      const history = historyOf(state.messages);
      for (const a of state.attachments) if (a.previewUrl) deps.objectUrl?.revoke(a.previewUrl);
      const seq = ++turnSeq;
      set({
        messages: [...state.messages, { id: makeId(), role: "user" as const, text: message, attachments: ready.map((a) => ({ kind: a.kind, name: a.name, ...(a.url && { url: a.url }) })) }].slice(-CHAT_MAX_MESSAGES),
        draft: "",
        attachments: [],
        pending: true,
        waitingUploads: false,
      });

      let result: EditWithAiResult<EditWithAiTurnView>;
      try {
        result = await deps.actions.turn({ message, uiLocale: deps.uiLocale, history, attachments });
      } catch {
        result = { success: false, error: "generic" };
      }
      // Stopped, or a newer turn started: this answer is ignored.
      if (seq !== turnSeq) return;
      set({ pending: false }, false);
      if (!result.success) {
        push({ id: makeId(), role: "error", error: result.error });
        return;
      }
      const view = result.data;
      push({
        id: makeId(),
        role: "assistant",
        text: view.reply,
        siteChanges: view.siteChanges ? { lines: view.siteChanges.lines, undoToken: view.siteChanges.undoToken, undo: "available" } : null,
        proposals: view.proposals.map((p) => ({ ...p, status: "pending" as const })),
        cards: view.cards,
        rejected: view.rejected.length,
        creditsUsed: view.creditsUsed,
      });
      if (view.siteChanges) deps.onSiteChanged?.(view.siteChanges.previewUrl);
    },

    /** Stops waiting: the late answer is ignored (the server may still finish it; its Undo isn't offered). */
    stop() {
      if (!state.pending) return;
      turnSeq += 1;
      set({ pending: false }, false);
      push({ id: makeId(), role: "notice", notice: "stopped" });
    },

    async undo(messageId: string) {
      const message = state.messages.find((m): m is AssistantMessage => m.id === messageId && m.role === "assistant");
      const changes = message?.siteChanges;
      if (!changes || changes.undo !== "available") return;
      updateMessage(messageId, (m) => ({ ...m, siteChanges: m.siteChanges && { ...m.siteChanges, undo: "undoing", error: undefined } }));
      let result: EditWithAiResult<{ previewUrl: string | null }>;
      try {
        result = await deps.actions.undo(changes.undoToken);
      } catch {
        result = { success: false, error: "generic" };
      }
      const undo: UndoState = result.success ? "done" : result.error === "undoExpired" ? "expired" : result.error === "draftChanged" ? "changed" : "failed";
      updateMessage(messageId, (m) => ({
        ...m,
        siteChanges: m.siteChanges && { ...m.siteChanges, undo: undo === "failed" ? "available" : undo, ...(!result.success && { error: result.error }) },
      }));
      if (result.success) deps.onSiteChanged?.(result.data.previewUrl);
    },

    async confirm(messageId: string, actionId: string) {
      const message = state.messages.find((m): m is AssistantMessage => m.id === messageId && m.role === "assistant");
      const proposal = message?.proposals.find((p) => p.actionId === actionId);
      if (!proposal || proposal.status !== "pending") return;
      updateProposal(messageId, actionId, { status: "confirming", error: undefined });
      let result: Awaited<ReturnType<ChatActions["confirm"]>>;
      try {
        result = await deps.actions.confirm(actionId);
      } catch {
        result = { success: false, error: "generic" };
      }
      if (!result.success) {
        updateProposal(messageId, actionId, { status: FINAL_CONFIRM_ERRORS.has(result.error) ? "failed" : "pending", error: result.error });
        return;
      }
      const product = productOfResult(result.data.tool, result.data.result);
      updateProposal(messageId, actionId, { status: "done", creditsUsed: result.data.creditsUsed, ...(product && { product }) });
      deps.onStoreChanged?.(result.data.tool);
    },

    async cancel(messageId: string, actionId: string) {
      const message = state.messages.find((m): m is AssistantMessage => m.id === messageId && m.role === "assistant");
      const proposal = message?.proposals.find((p) => p.actionId === actionId);
      if (!proposal || proposal.status !== "pending") return;
      updateProposal(messageId, actionId, { status: "cancelling", error: undefined });
      let result: EditWithAiResult<null>;
      try {
        result = await deps.actions.cancel(actionId);
      } catch {
        result = { success: false, error: "generic" };
      }
      // An expired or missing action is as good as cancelled.
      if (result.success || result.error === "actionExpired" || result.error === "notFound") updateProposal(messageId, actionId, { status: "cancelled" });
      else updateProposal(messageId, actionId, { status: "pending", error: result.error });
    },

    /** Empties the chat (and its stored copy). */
    clear() {
      for (const a of state.attachments) if (a.previewUrl) deps.objectUrl?.revoke(a.previewUrl);
      turnSeq += 1;
      set({ messages: [], draft: "", attachments: [], pending: false, waitingUploads: false });
    },
  };
  return chat;
}
