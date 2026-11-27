import {
  OUT_OF_REACH_KEYS,
  EDIT_AI_FILE_TYPES,
  EDIT_AI_IMAGE_TYPES,
  EDIT_WITH_AI_LIMITS,
  type EditAiFileExt,
  type EditWithAiAttachment,
  type EditWithAiCard,
  type EditWithAiConfirmView,
  type EditWithAiError,
  type EditWithAiInput,
  type EditWithAiLink,
  type EditWithAiProposal,
  type EditWithAiResult,
  type EditWithAiTargetInput,
  type EditWithAiTurnView,
  type EditWithAiUpload,
  type EditWithAiUploadsInput,
} from "./server/edit-with-ai.dto";

/**
 * The "Edit with AI" chat's state, outside React (owner request 2026-11-26):
 * messages, the composer's draft and attachments, a turn in flight, undo and
 * the confirm cards. The server actions, the browser upload and the editor
 * (save before a turn, apply a site turn's ops) are injected, so every flow
 * is unit-tested with mocks. The chat is kept per store in `sessionStorage`
 * (the last 50 messages and the draft), so a visit to the from-file import
 * and back restores it. Paths sent back are only the ones the server signed;
 * nothing here builds a storage path.
 *
 * A site turn: the editor's pending edits are saved first (the server reads
 * the saved drafts), the answer's ops are applied to the editor's drafts as
 * one undo step, and that step's marker is kept in memory only: after a
 * reload the change stays, and Undo is simply not offered here.
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

/** What a site turn's answer changed on the canvas. */
export type SiteChangesView = {
  /** One line per op applied to the drafts. */
  lines: string[];
  /** The drafts changed while the AI worked, so nothing was applied. */
  stale?: boolean;
};

/** The turn's context, read from the editor when the seller sends. */
export type TurnContext = {
  /** The page active in the editor. */
  pageId?: string;
  /** The section selected on the canvas, when there is one. */
  target?: EditWithAiTargetInput;
  /** The language the canvas shows. */
  contentLocale?: "ar" | "en";
};

export type SiteTurnChanges = NonNullable<EditWithAiTurnView["siteChanges"]>;
export type AppliedSiteTurn = { applied: string[]; undoMarker: object | null; stale: boolean };

export type ChatMessage =
  | { id: string; role: "user"; text: string; attachments: SentAttachment[] }
  | {
      id: string;
      role: "assistant";
      text: string;
      siteChanges: SiteChangesView | null;
      proposals: ProposalView[];
      cards: EditWithAiCard[];
      rejected: number;
      creditsUsed: number;
      /** Follow-up requests to tap (shown while this is the newest message). Missing in chats stored before they existed. */
      suggestions?: string[];
      /** Dashboard pages that do what the chat couldn't. */
      links?: EditWithAiLink[];
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
  confirm: (actionId: string) => Promise<EditWithAiResult<EditWithAiConfirmView>>;
  cancel: (actionId: string) => Promise<EditWithAiResult<null>>;
};

export type ChatDeps = {
  uiLocale: "ar" | "en";
  actions: ChatActions;
  /** Puts the file at the signed path (`uploadToSignedUrl`). Throws on failure. */
  uploadFile: (upload: EditWithAiUpload, file: File) => Promise<void>;
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
  storageKey?: string;
  /** Saves the editor's pending edits before a turn; false stops the turn (`draftChanged`). */
  beforeTurn: () => Promise<boolean>;
  /** Applies a site turn's ops to the editor's drafts as one undo step. */
  applySiteTurn: (changes: SiteTurnChanges) => AppliedSiteTurn;
  /** A confirmed store change ran; `skill` says what kind (products, settings, shipping, design). */
  onStoreChanged?: (tool: string, skill: string) => void;
  /** The seller's AI credits after a turn or a confirmed card. */
  onCredits?: (remaining: number) => void;
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

/** Suggestions as plain short strings, at most 3 (the server cleaned them; a stored chat is read back defensively). */
export function cleanSuggestions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0 && item.length <= 60).slice(0, 3);
}

/** Links to dashboard pages: a known key and a path inside the dashboard (never another site). */
export function cleanLinks(value: unknown): EditWithAiLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is EditWithAiLink =>
        isRecord(item) && (OUT_OF_REACH_KEYS as readonly unknown[]).includes(item.key) && typeof item.href === "string" && /^\/(?!\/)[A-Za-z0-9/_-]{1,200}$/.test(item.href),
    )
    .slice(0, 2);
}

/**
 * The follow-up suggestions to show: those of the newest message, while it
 * is the assistant's and no turn is running. Older ones disappear.
 */
export function activeSuggestions(state: Pick<ChatState, "messages" | "pending">): string[] {
  const last = state.messages.at(-1);
  return !state.pending && last?.role === "assistant" ? cleanSuggestions(last.suggestions) : [];
}

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
          suggestions: cleanSuggestions(message.suggestions),
          links: cleanLinks(message.links),
          siteChanges: isRecord(message.siteChanges) && Array.isArray(message.siteChanges.lines)
            ? { lines: (message.siteChanges.lines as unknown[]).filter((line): line is string => typeof line === "string"), ...(message.siteChanges.stale === true && { stale: true }) }
            : null,
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
  /** The undo step each site turn made, by message id. In memory only (never stored). */
  const undoMarkers = new Map<string, object>();
  /** The context of a Send that is waiting for uploads. */
  let waitingContext: TurnContext = {};

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
    if (state.waitingUploads && !uploading()) void chat.send(waitingContext);
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
      if (state.waitingUploads && !uploading()) void chat.send(waitingContext);
    },

    /**
     * Sends the draft (or `text`) about the page and section the editor shows
     * (`context`). With uploads still running it waits for them, then sends.
     */
    async send(context: TurnContext = {}, text?: string) {
      if (text !== undefined) set({ draft: text.slice(0, EDIT_WITH_AI_LIMITS.message) });
      const message = state.draft.trim();
      if (state.pending || !message) {
        if (state.waitingUploads) set({ waitingUploads: false }, false);
        return;
      }
      if (uploading()) {
        waitingContext = context;
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
        // The server edits the SAVED drafts, so they must be what the canvas shows.
        const saved = await deps.beforeTurn().catch(() => false);
        if (seq !== turnSeq) return;
        result = saved
          ? await deps.actions.turn({
              message,
              uiLocale: deps.uiLocale,
              history,
              attachments,
              ...(context.pageId && { pageId: context.pageId }),
              ...(context.target && { target: context.target }),
              ...(context.contentLocale && { contentLocale: context.contentLocale }),
            })
          : { success: false, error: "draftChanged" };
      } catch {
        result = { success: false, error: "generic" };
      }
      // Stopped, or a newer turn started: this answer is ignored.
      if (seq !== turnSeq) return;
      set({ pending: false }, false);
      if (!result.success) {
        if (result.error === "aiNoCredits") deps.onCredits?.(0);
        push({ id: makeId(), role: "error", error: result.error });
        return;
      }
      const view = result.data;
      // The ops go onto the canvas now, as one undo step of the editor.
      let siteChanges: SiteChangesView | null = null;
      const id = makeId();
      if (view.siteChanges) {
        let outcome: AppliedSiteTurn;
        try {
          outcome = deps.applySiteTurn(view.siteChanges);
        } catch {
          outcome = { applied: [], undoMarker: null, stale: true };
        }
        siteChanges = { lines: outcome.applied, ...(outcome.stale && { stale: true }) };
        if (outcome.undoMarker) undoMarkers.set(id, outcome.undoMarker);
      }
      if (typeof view.creditsRemaining === "number") deps.onCredits?.(view.creditsRemaining);
      push({
        id,
        role: "assistant",
        text: view.reply,
        siteChanges,
        proposals: view.proposals.map((p) => ({ ...p, status: "pending" as const })),
        cards: view.cards,
        rejected: view.rejected.length,
        creditsUsed: view.creditsUsed,
        suggestions: cleanSuggestions(view.suggestions),
        links: cleanLinks(view.links),
      });
    },

    /** Stops waiting: the late answer is ignored, so nothing is applied to the website. */
    stop() {
      if (!state.pending) return;
      turnSeq += 1;
      set({ pending: false }, false);
      push({ id: makeId(), role: "notice", notice: "stopped" });
    },

    /**
     * The undo step a site turn made (the editor says whether it is still its
     * newest step); null for other messages and after a reload.
     */
    undoMarkerOf(messageId: string): object | null {
      return undoMarkers.get(messageId) ?? null;
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
      if (typeof result.data.creditsRemaining === "number") deps.onCredits?.(result.data.creditsRemaining);
      deps.onStoreChanged?.(result.data.tool, proposal.skill);
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
      undoMarkers.clear();
      set({ messages: [], draft: "", attachments: [], pending: false, waitingUploads: false });
    },
  };
  return chat;
}
