/**
 * The editor AI agent's chat (ROADMAP F-83c, F-101g/j): one chat per editor
 * mount, kept in memory only. A turn sends the targeted section as it is in
 * the seller's unsaved draft; the answer's ops (already validated and
 * normalised by the host) are applied with `applySectionOps` to the current
 * draft as one undo step, and the code previews the host rendered go straight
 * to the canvas's preview store. The editor writes nothing else; autosave
 * saves the draft as for any other edit.
 */
import { createStore } from "zustand/vanilla";
import type { ComponentNode, SectionInstance, SiteLocale } from "@workspace/store-sections";
import { applySectionOps, type AgentTarget, type AppliedOp } from "@workspace/store-sections/agent";
import { findNode, updateNode } from "@workspace/store-sections/render";
import type { EditorAgentTurnInput, EditorAgentTurnView } from "../adapter.types";
import type { EditorErrorKey, EditorResult } from "../editor.dto";
import type { EditorStore } from "../state/editor.store";
import { codePreviewInput, type CodePreviewRunner, type CodePreviewTarget } from "../code/code-preview.lib";
import { AGENT_MAX_MESSAGE, agentHistory, agentOutline, type AgentMention } from "./editor-agent.lib";
import { getInstance } from "./editor-selection.lib";

export type AgentChatMessage =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      text: string;
      /** One line per op applied to the draft. */
      applied: string[];
      /** Reject codes of the ops the host refused. */
      rejected: string[];
      creditsUsed: number;
      /** The undo step this turn made (the snapshot it pushed); null when nothing changed. */
      undoMarker: object | null;
      /** The host's ops no longer fitted the draft (it changed meanwhile), so nothing was applied. */
      stale?: boolean;
    }
  | { id: string; role: "error"; error: EditorErrorKey | "stopped" };

export type AgentChatState = {
  messages: AgentChatMessage[];
  /** The waiting turn's token; null when idle. */
  pending: string | null;
  open: boolean;
  draft: string;
  /** The mention key the seller removed. */
  dismissed: string | null;
};

type Turn = (input: EditorAgentTurnInput) => Promise<EditorResult<EditorAgentTurnView>>;

/** The canvas's code preview engine (from `useCodePreview`), when the host previews code. */
export type AgentPreviewSink = { runner: CodePreviewRunner; target: CodePreviewTarget } | null;

export type AgentSendArgs = {
  message: string;
  turn: Turn;
  uiLocale: SiteLocale;
  /** The section the chip names; null targets the page. */
  mention: AgentMention | null;
  preview?: AgentPreviewSink;
};

/** Where a turn's ops go: the page (or one of its sections), or the shared header or footer. */
export type AgentTurnRequest = { pageId: string; target: AgentTarget; contentLocale: SiteLocale };
type Request = AgentTurnRequest;

/** What `applyAgentTurn` reads of a turn's answer. */
export type AgentTurnOps = Pick<EditorAgentTurnView, "ops" | "applied" | "previews">;

export function createAgentChat(editor: EditorStore) {
  const store = createStore<AgentChatState>()(() => ({ messages: [], pending: null, open: false, draft: "", dismissed: null }));
  let seq = 0;
  const nextId = () => `m${++seq}`;
  const push = (message: AgentChatMessage) => store.setState((s) => ({ messages: [...s.messages, message] }));

  /** Builds the turn's input from the draft as it is now (unsaved edits included). */
  function buildInput(message: string, uiLocale: SiteLocale, mention: AgentMention | null): { input: EditorAgentTurnInput; request: Request } | null {
    const s = editor.getState();
    const page = s.pages.find((p) => p.id === s.activePageId) ?? s.pages[0];
    if (!page) return null;
    const ref = mention?.ref ?? null;
    const instance = ref ? getInstance({ content: page.content, header: s.header, footer: s.footer }, ref) : null;
    const target: AgentTarget =
      ref && instance ? (ref.target === "page" ? { kind: "page", sectionId: ref.sectionId } : { kind: ref.target }) : { kind: "page" };
    const history = agentHistory(
      store.getState().messages.flatMap((m): { role: "user" | "assistant"; text: string }[] => (m.role === "error" ? [] : [{ role: m.role, text: m.text }])),
    );
    return {
      request: { pageId: page.id, target, contentLocale: s.locale },
      input: {
        message,
        uiLocale,
        contentLocale: s.locale,
        pageId: page.id,
        target,
        // A section target sends that section; the page target sends none.
        ...(instance && { section: instance }),
        outline: agentOutline(page.content, uiLocale),
        history,
      },
    };
  }

  async function send(args: AgentSendArgs): Promise<void> {
    const message = args.message.trim().slice(0, AGENT_MAX_MESSAGE);
    if (!message || store.getState().pending) return;
    const built = buildInput(message, args.uiLocale, args.mention);
    if (!built) return;
    const token = nextId();
    store.setState((s) => ({ messages: [...s.messages, { id: nextId(), role: "user", text: message }], pending: token, draft: "" }));

    let result: EditorResult<EditorAgentTurnView>;
    try {
      result = await args.turn(built.input);
    } catch {
      result = { success: false, error: "generic" };
    }
    // Stopped (or another turn started): the late answer is ignored.
    if (store.getState().pending !== token) return;
    store.setState({ pending: null });
    if (!result.success) return push({ id: nextId(), role: "error", error: result.error });
    const outcome = applyAgentTurn(editor, built.request, result.data, args.preview ?? null);
    push({
      id: nextId(),
      role: "assistant",
      text: result.data.reply,
      applied: outcome.applied,
      rejected: result.data.rejected.map((r) => r.code),
      creditsUsed: result.data.creditsUsed,
      undoMarker: outcome.undoMarker,
      ...(outcome.stale && { stale: true }),
    });
  }

  return {
    store,
    send,
    /** Ignores the waiting turn's answer when it arrives. */
    stop() {
      if (!store.getState().pending) return;
      store.setState({ pending: null });
      push({ id: nextId(), role: "error", error: "stopped" });
    },
    setOpen: (open: boolean) => store.setState({ open }),
    setDraft: (draft: string) => store.setState({ draft }),
    dismiss: (key: string | null) => store.setState({ dismissed: key }),
    /** Whether the turn's step is still the newest undo step. */
    canUndo: (message: AgentChatMessage) => message.role === "assistant" && message.undoMarker !== null && editor.getState().past.at(-1) === message.undoMarker,
    undo(message: AgentChatMessage) {
      if (message.role === "assistant" && message.undoMarker && editor.getState().past.at(-1) === message.undoMarker) editor.getState().undo();
    },
  };
}

export type AgentChat = ReturnType<typeof createAgentChat>;

const chats = new WeakMap<EditorStore, AgentChat>();

/** The chat of this editor mount (it survives the sidebar re-mounting as the selection changes). */
export function agentChatOf(editor: EditorStore): AgentChat {
  let chat = chats.get(editor);
  if (!chat) {
    chat = createAgentChat(editor);
    chats.set(editor, chat);
  }
  return chat;
}

/** The code elements' props as the host normalised them (what the Code tab stores too). */
function withPreviewProps(sections: SectionInstance[], applied: readonly AppliedOp[], previews: EditorAgentTurnView["previews"]): SectionInstance[] {
  let next = sections;
  for (const { sectionId, codeNodeId } of applied) {
    const preview = codeNodeId ? previews[codeNodeId] : undefined;
    if (!codeNodeId || !preview) continue;
    next = next.map((section) => {
      if (section.id !== sectionId) return section;
      const node = findNode(section.componentTree ?? [], codeNodeId);
      if (!node || JSON.stringify(node.props) === JSON.stringify(preview.props)) return section;
      return { ...section, componentTree: updateNode(section.componentTree ?? [], codeNodeId, (n: ComponentNode) => ({ ...n, props: { ...preview.props } })) };
    });
  }
  return next;
}

/**
 * Applies a turn's ops to the current draft of its target as one undo step,
 * selects the first section it touched and seeds the canvas previews.
 */
export function applyAgentTurn(
  editor: EditorStore,
  request: Request,
  view: AgentTurnOps,
  preview: AgentPreviewSink,
): { applied: string[]; undoMarker: object | null; stale: boolean } {
  if (!view.ops.length) return { applied: [], undoMarker: null, stale: false };
  const s = editor.getState();
  const opts = { target: request.target, defaultLocale: s.defaultLocale, allowCode: true };
  const chrome = request.target.kind === "page" ? null : request.target.kind;

  let before: SectionInstance[];
  if (chrome) {
    const instance = s[chrome];
    if (!instance) return { applied: [], undoMarker: null, stale: true };
    before = [instance];
  } else {
    const page = s.pages.find((p) => p.id === request.pageId);
    if (!page) return { applied: [], undoMarker: null, stale: true };
    before = page.content.sections;
  }
  const result = applySectionOps({ sections: before }, view.ops, opts);
  if (!result.applied.length) return { applied: [], undoMarker: null, stale: true };
  const sections = withPreviewProps(result.content.sections, result.applied, view.previews);

  if (chrome) s.editChrome(chrome, sections[0] ?? null);
  else s.editPage(request.pageId, (content) => ({ ...content, sections }));
  const after = editor.getState();
  const undoMarker = (after.past.at(-1) as object | undefined) ?? null;

  // Show the first section the turn touched (the canvas scrolls to a new selection).
  const first = result.applied[0]!.sectionId;
  const onCanvas = chrome !== null || after.activePageId === request.pageId;
  if (onCanvas && sections.some((x) => x.id === first)) after.select(chrome ? { target: chrome } : { target: "page", sectionId: first });

  // The host's previews, rendered for the language and page the canvas shows now.
  if (preview && onCanvas && preview.target.locale === request.contentLocale && !preview.target.productId) {
    for (const { codeNodeId, sectionId } of result.applied) {
      const rendered = codeNodeId ? view.previews[codeNodeId] : undefined;
      const node = codeNodeId ? findNode(sections.find((x) => x.id === sectionId)?.componentTree ?? [], codeNodeId) : null;
      if (!rendered || !node || !rendered.html) continue;
      preview.runner.seed(codePreviewInput(node, preview.target), { html: rendered.html, css: rendered.css });
    }
  }

  const applied = result.applied.map((a) => view.applied[a.index]).filter((line): line is string => Boolean(line));
  return { applied, undoMarker, stale: false };
}
