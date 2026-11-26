/**
 * Server previews of code nodes (ROADMAP F-101e). The canvas never renders
 * Liquid: every code node on it shows the cleaned HTML and scoped CSS that the
 * host's `code.preview` returned for that node's current props, and the Code
 * tab sends the edited file through the same call before anything is stored.
 *
 * One runner per editor mount. Per node it keeps one debounced request for the
 * canvas and one for the Code tab, and drops any answer that is no longer the
 * newest (a slow reply never overwrites a newer one).
 */
import { createStore } from "zustand/vanilla";
import type { ComponentNode, SiteLocale } from "@workspace/store-sections";
import type { CodeIssueView, CodePreviewInput, CodePreviewView } from "../adapter.types";
import type { EditorErrorKey, EditorResult } from "../editor.dto";
import { codeFileOf, readBlocks, readSettings } from "./code-file.lib";

/** Typing pauses this long before a preview is sent. */
export const CODE_PREVIEW_DELAY = 600;

export type CodePreviewEntry = {
  /** `previewKey` of the input this entry is for. */
  key: string;
  status: "loading" | "ready" | "error";
  /** Cleaned HTML from the host ('' before the first answer). Kept while a newer preview loads. */
  html: string;
  css: string;
  issues: CodeIssueView[];
  error?: EditorErrorKey;
};

export type CodeFileCheck = {
  /** The file this check is about. */
  file: string;
  status: "checking" | "ok" | "issues" | "error";
  issues: CodeIssueView[];
  error?: EditorErrorKey;
};

export type CodePreviewState = {
  entries: Record<string, CodePreviewEntry>;
  files: Record<string, CodeFileCheck>;
};

export type CodePreviewStore = ReturnType<typeof createCodePreviewStore>;

export function createCodePreviewStore(initial: Partial<CodePreviewState> = {}) {
  return createStore<CodePreviewState>()(() => ({ entries: {}, files: {}, ...initial }));
}

export type CodePreviewTarget = { locale: SiteLocale; pageId?: string; productId?: string };

/** What the canvas sends for a code node as it is stored now. */
export function codePreviewInput(node: ComponentNode, target: CodePreviewTarget): CodePreviewInput {
  return {
    nodeId: node.id,
    file: codeFileOf(node.props),
    settings: readSettings(node.props.settings),
    blocks: readBlocks(node.props.blocks),
    locale: target.locale,
    ...(target.pageId && { pageId: target.pageId }),
    ...(target.productId && { productId: target.productId }),
  };
}

/** Two inputs with the same key render the same preview. */
export function previewKey(input: CodePreviewInput): string {
  return JSON.stringify([input.nodeId, input.file, input.settings, input.blocks, input.locale, input.pageId ?? null, input.productId ?? null]);
}

type Timers = { set: (run: () => void, ms: number) => unknown; clear: (handle: unknown) => void };
const DEFAULT_TIMERS: Timers = {
  set: (run, ms) => setTimeout(run, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

type Preview = (input: CodePreviewInput) => Promise<EditorResult<CodePreviewView>>;

async function call(preview: Preview, input: CodePreviewInput): Promise<EditorResult<CodePreviewView>> {
  try {
    return await preview(input);
  } catch {
    return { success: false, error: "generic" };
  }
}

export function createCodePreviewRunner({
  preview,
  store,
  delay = CODE_PREVIEW_DELAY,
  timers = DEFAULT_TIMERS,
}: {
  preview: Preview;
  store: CodePreviewStore;
  delay?: number;
  timers?: Timers;
}) {
  const canvasTimers = new Map<string, unknown>();
  const fileTimers = new Map<string, unknown>();
  const fileSeq = new Map<string, number>();

  const setEntry = (nodeId: string, entry: CodePreviewEntry) => store.setState((s) => ({ entries: { ...s.entries, [nodeId]: entry } }));
  const setFile = (nodeId: string, check: CodeFileCheck) => store.setState((s) => ({ files: { ...s.files, [nodeId]: check } }));

  const entryFrom = (key: string, result: EditorResult<CodePreviewView>, previous: CodePreviewEntry | undefined): CodePreviewEntry => {
    if (!result.success) return { key, status: "error", html: previous?.html ?? "", css: previous?.css ?? "", issues: [], error: result.error };
    const { html, css, issues } = result.data;
    return { key, status: issues.length ? "error" : "ready", html, css, issues };
  };

  async function runCanvas(input: CodePreviewInput, key: string) {
    const result = await call(preview, input);
    const current = store.getState().entries[input.nodeId];
    // A newer input (an edit, a Code tab answer) replaced this one meanwhile.
    if (current?.key !== key) return;
    setEntry(input.nodeId, entryFrom(key, result, current));
  }

  return {
    /**
     * The canvas asks for a node's preview. Nothing is sent when the entry is
     * already for this input; the first request of a node goes out at once,
     * later ones after `delay`.
     */
    request(input: CodePreviewInput) {
      const key = previewKey(input);
      const current = store.getState().entries[input.nodeId];
      if (current?.key === key) return;
      const pending = canvasTimers.get(input.nodeId);
      if (pending !== undefined) timers.clear(pending);
      canvasTimers.delete(input.nodeId);
      setEntry(input.nodeId, { key, status: "loading", html: current?.html ?? "", css: current?.css ?? "", issues: [] });
      const run = () => {
        canvasTimers.delete(input.nodeId);
        void runCanvas(input, key);
      };
      if (!current) run();
      else canvasTimers.set(input.nodeId, timers.set(run, delay));
    },

    /**
     * The Code tab's file changed. After `delay` the file is previewed; when it
     * has no issues, `apply` gets the host's normalised props (and the canvas
     * shows the answer), otherwise the issues are kept and `apply` isn't called.
     * `inputFor` gives the canvas input of the applied props, so the canvas
     * doesn't ask again for what it just got.
     */
    editFile(
      input: CodePreviewInput,
      apply: (props: Record<string, unknown>) => void,
      inputFor: (props: Record<string, unknown>) => CodePreviewInput,
    ) {
      const { nodeId } = input;
      const pending = fileTimers.get(nodeId);
      if (pending !== undefined) timers.clear(pending);
      const seq = (fileSeq.get(nodeId) ?? 0) + 1;
      fileSeq.set(nodeId, seq);
      setFile(nodeId, { file: input.file, status: "checking", issues: store.getState().files[nodeId]?.issues ?? [] });
      fileTimers.set(
        nodeId,
        timers.set(() => {
          fileTimers.delete(nodeId);
          void (async () => {
            const result = await call(preview, input);
            if (fileSeq.get(nodeId) !== seq) return;
            if (!result.success) {
              setFile(nodeId, { file: input.file, status: "error", issues: [], error: result.error });
              return;
            }
            const { props, issues, html, css } = result.data;
            if (issues.length) {
              // Blocking: the node keeps its last good props; only the issues show.
              setFile(nodeId, { file: input.file, status: "issues", issues });
              return;
            }
            setFile(nodeId, { file: input.file, status: "ok", issues: [] });
            const key = previewKey(inputFor(props));
            const pendingCanvas = canvasTimers.get(nodeId);
            if (pendingCanvas !== undefined) timers.clear(pendingCanvas);
            canvasTimers.delete(nodeId);
            setEntry(nodeId, { key, status: "ready", html, css, issues: [] });
            apply(props);
          })();
        }, delay),
      );
    },

    /**
     * Shows a preview the host already rendered for this input (the AI agent's
     * turn returns one per code node it wrote), so the canvas doesn't ask again.
     */
    seed(input: CodePreviewInput, view: { html: string; css: string }) {
      const pending = canvasTimers.get(input.nodeId);
      if (pending !== undefined) timers.clear(pending);
      canvasTimers.delete(input.nodeId);
      setEntry(input.nodeId, { key: previewKey(input), status: "ready", html: view.html, css: view.css, issues: [] });
    },

    /** Forgets a node's Code tab check (the file was put back to the stored one). */
    resetFile(nodeId: string) {
      const pending = fileTimers.get(nodeId);
      if (pending !== undefined) timers.clear(pending);
      fileTimers.delete(nodeId);
      fileSeq.set(nodeId, (fileSeq.get(nodeId) ?? 0) + 1);
      store.setState((s) => {
        if (!s.files[nodeId]) return s;
        const files = { ...s.files };
        delete files[nodeId];
        return { files };
      });
    },

    dispose() {
      for (const handle of [...canvasTimers.values(), ...fileTimers.values()]) timers.clear(handle);
      canvasTimers.clear();
      fileTimers.clear();
      fileSeq.clear();
    },
  };
}

export type CodePreviewRunner = ReturnType<typeof createCodePreviewRunner>;
