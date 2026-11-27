"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "zustand";
import type { SiteLocale } from "@workspace/store-sections";
import type { AgentTarget } from "@workspace/store-sections/agent";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, useResizableLayout } from "@workspace/ui/components/resizable";
import { Sheet, SheetContent, SheetTitle } from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";
import { useCodePreview } from "../code/code-preview.client";
import { mentionOf, type AgentMention } from "../lib/editor-agent.lib";
import { applyAgentTurn, type AgentTurnOps, type AgentTurnRequest } from "../lib/editor-agent-chat.lib";
import { getInstance, refOf } from "../lib/editor-selection.lib";
import { nameOf } from "../panels/pages-panel.client";
import type { EditorStore, Selection } from "../state/editor.store";

/**
 * The editor's "AI layout" (ROADMAP F-83c): a host-provided assistant (a chat)
 * in a resizable panel beside the canvas, under the same top bar, with no
 * rail, panels or inspector. The host's chat talks to its own server; this
 * file gives it what it needs from the editor (`EditorAssistantApi`) and
 * never imports server or host code.
 */

export type EditorAssistantRequest = AgentTurnRequest;
export type EditorAssistantTurn = AgentTurnOps;
export type EditorAssistantApplied = { applied: string[]; undoMarker: object | null; stale: boolean };

export type EditorAssistantApi = {
  readOnly: boolean;
  /** Below `lg`: the assistant fills the screen and the canvas opens in a sheet (`showCanvas`). */
  compact: boolean;
  /** The page active in the top bar's page switcher. */
  pageId: string;
  /** The language the canvas shows. */
  contentLocale: SiteLocale;
  /**
   * The section the seller selected on the canvas (always the whole section,
   * never one element); null when nothing is selected, and for the selection
   * a turn made itself (so the next message is not tied to it).
   */
  mention: AgentMention | null;
  /** The turn's target: the mentioned section, the header or footer, else the active page. */
  target: AgentTarget;
  /** Removes the mention (deselects on the canvas). */
  clearMention: () => void;
  /** Saves every pending edit now; false when a save failed or the drafts changed elsewhere. */
  flush: () => Promise<boolean>;
  /**
   * Applies a turn's validated ops to the drafts as ONE undo step and seeds
   * the canvas with the host's code previews. `stale`: the drafts no longer
   * fitted the ops, so nothing changed.
   */
  applyTurn: (request: EditorAssistantRequest, turn: EditorAssistantTurn) => EditorAssistantApplied;
  /** Whether a turn's step is still the newest undo step. */
  canUndo: (marker: object | null) => boolean;
  /** Undoes that step, only while it is still the newest. */
  undo: (marker: object | null) => void;
  /** Reloads the store data the canvas draws (products, categories, …). */
  refreshData: () => void;
  /** Compact: opens the canvas sheet. */
  showCanvas: () => void;
};

/** Builds the assistant's API from the editor store. Must render inside the code preview provider. */
export function EditorAssistantHost({
  store,
  uiLocale,
  readOnly,
  compact,
  flush,
  refreshData,
  showCanvas,
  children,
}: {
  store: EditorStore;
  uiLocale: string;
  readOnly: boolean;
  compact: boolean;
  flush: () => Promise<boolean>;
  refreshData: () => void;
  showCanvas: () => void;
  children: (api: EditorAssistantApi) => ReactNode;
}) {
  const tLayers = useTranslations("storeEditor.layers");
  const selection = useStore(store, (s) => s.selection);
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const contentLocale = useStore(store, (s) => s.locale);
  // Re-renders when the newest undo step changes, so a reply's Undo shows only while it is still the latest.
  useStore(store, (s) => s.past.at(-1));
  const preview = useCodePreview();
  const previewRef = useRef(preview);
  useEffect(() => {
    previewRef.current = preview;
  });
  // The selection a turn made (to show its change): it is not the seller's pick, so it is no mention.
  const [autoSelection, setAutoSelection] = useState<Selection>(null);

  const page = pages.find((p) => p.id === activePageId) ?? pages[0];
  const pageId = page?.id ?? "";
  const pageName = page ? nameOf(page.name, uiLocale) || page.slug : "";
  const headerLabel = tLayers("header");
  const footerLabel = tLayers("footer");
  const mention = useMemo(() => {
    if (!selection || !page || selection === autoSelection) return null;
    const instance = getInstance({ content: page.content, header, footer }, refOf(selection));
    return mentionOf(selection, instance, uiLocale, { page: pageName, header: headerLabel, footer: footerLabel });
  }, [selection, autoSelection, page, header, footer, uiLocale, pageName, headerLabel, footerLabel]);

  const applyTurn = useCallback(
    (request: EditorAssistantRequest, turn: EditorAssistantTurn): EditorAssistantApplied => {
      const sink = previewRef.current;
      const before = store.getState().selection;
      const outcome = applyAgentTurn(store, request, turn, sink ? { runner: sink.runner, target: sink.target } : null);
      const after = store.getState().selection;
      if (after !== before) setAutoSelection(after);
      return outcome;
    },
    [store],
  );
  const canUndo = useCallback((marker: object | null) => marker !== null && store.getState().past.at(-1) === marker, [store]);
  const undo = useCallback(
    (marker: object | null) => {
      if (marker !== null && store.getState().past.at(-1) === marker) store.getState().undo();
    },
    [store],
  );
  const clearMention = useCallback(() => store.getState().select(null), [store]);

  const api = useMemo<EditorAssistantApi>(() => {
    const ref = mention?.ref;
    const target: AgentTarget = !ref ? { kind: "page" } : ref.target === "page" ? { kind: "page", sectionId: ref.sectionId } : { kind: ref.target };
    return { readOnly, compact, pageId, contentLocale, mention, target, clearMention, flush, applyTurn, canUndo, undo, refreshData, showCanvas };
  }, [readOnly, compact, pageId, contentLocale, mention, clearMention, flush, applyTurn, canUndo, undo, refreshData, showCanvas]);

  return <>{children(api)}</>;
}

/** localStorage that never throws (private mode, blocked storage): the layout is then just not kept. */
const LAYOUT_STORAGE = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Not kept.
    }
  },
};

const subscribeNever = () => () => {};
/** False on the server and while hydrating, true after: the split reads the viewport and localStorage. */
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

const ASSISTANT_PANEL = "assistant";
const CANVAS_PANEL = "canvas";

/**
 * The assistant beside the canvas. From `lg` up: a resizable split (the chat
 * 320–640px on the start side, its width kept in localStorage). Below: the
 * chat fills the screen and the canvas opens in a full-height sheet.
 *
 * The group is laid out left to right whatever the page direction and the
 * panels are ordered by hand, because the library measures a drag (and the
 * arrow keys) from the left; each panel's content gets the page direction back.
 */
export function EditorAssistantSplit({
  dir,
  compact,
  assistant,
  canvas,
  canvasOpen,
  onCanvasOpenChange,
  sheetClassName,
  sheetStyle,
}: {
  dir: "rtl" | "ltr";
  compact: boolean;
  assistant: ReactNode;
  canvas: ReactNode;
  canvasOpen: boolean;
  onCanvasOpenChange: (open: boolean) => void;
  sheetClassName?: string;
  sheetStyle?: CSSProperties;
}) {
  const t = useTranslations("storeEditor.assistant");
  const hydrated = useHydrated();
  const layout = useResizableLayout({ id: "tallaby-editor-ai", storage: LAYOUT_STORAGE });

  if (!hydrated) return <div className="min-w-0 flex-1 bg-(--s-surface)" aria-busy />;

  if (compact) {
    return (
      <>
        <section aria-label={t("panel")} className="flex min-h-0 min-w-0 flex-1 flex-col bg-(--s-surface)">
          {assistant}
        </section>
        <Sheet open={canvasOpen} onOpenChange={onCanvasOpenChange}>
          <SheetContent
            side="bottom"
            data-editor-sheet=""
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => event.preventDefault()}
            className={cn("h-dvh gap-0 rounded-none border-0 bg-(--s-surface) p-0", sheetClassName)}
            style={sheetStyle}
          >
            <SheetTitle className="flex h-11 shrink-0 items-center px-4 pe-12 text-[15px] font-bold text-(--s-ink)">{t("canvas")}</SheetTitle>
            <div className="flex min-h-0 flex-1 flex-col">{canvas}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  const chatPanel = (
    <ResizablePanel key={ASSISTANT_PANEL} id={ASSISTANT_PANEL} defaultSize={440} minSize={320} maxSize={640}>
      <section dir={dir} aria-label={t("panel")} className="flex h-full min-h-0 flex-col bg-(--s-surface)">
        {assistant}
      </section>
    </ResizablePanel>
  );
  const canvasPanel = (
    <ResizablePanel key={CANVAS_PANEL} id={CANVAS_PANEL} minSize={360}>
      <div dir={dir} className="flex h-full min-h-0 flex-col">
        {canvas}
      </div>
    </ResizablePanel>
  );
  const handle = (
    <ResizableHandle
      key="handle"
      withHandle
      aria-label={t("resize")}
      // The arrow keys resize here; they must not also reach the editor's canvas shortcuts.
      onKeyDown={(event) => event.stopPropagation()}
      className="w-1 bg-(--s-field) transition-colors hover:bg-(--s-field-strong) focus-visible:bg-(--s-primary) data-[separator=active]:bg-(--s-primary) data-[separator=hover]:bg-(--s-field-strong)"
    />
  );

  return (
    <ResizablePanelGroup dir="ltr" orientation="horizontal" defaultLayout={layout.defaultLayout} onLayoutChange={layout.onLayoutChange} className="min-w-0 flex-1">
      {dir === "rtl" ? [canvasPanel, handle, chatPanel] : [chatPanel, handle, canvasPanel]}
    </ResizablePanelGroup>
  );
}
