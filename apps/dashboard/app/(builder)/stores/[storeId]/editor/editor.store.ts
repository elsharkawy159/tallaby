"use client";

import { createStore } from "zustand/vanilla";
import type { DesignSystem, PageContent, SectionInstance, SiteLocale } from "@workspace/store-sections";
import { MAX_HISTORY } from "./editor.lib";

/**
 * Editor state (PLAN.md P4-01/P4-06), modelled on the reference
 * `lib/builder/store.ts`: immutable updates, a snapshot history for
 * undo/redo, and per-page dirty flags that autosave drains. One store per
 * editor mount, so two stores open in two tabs never share state.
 */

export type EditorPage = {
  id: string;
  slug: string;
  isHome: boolean;
  name: { ar?: string; en?: string };
  seo: Record<string, unknown>;
  showInNav: boolean;
  content: PageContent;
  version: number;
};

export type Selection = { target: "page"; sectionId: string } | { target: "header" } | { target: "footer" } | null;
export type Device = "desktop" | "tablet" | "mobile";
export type SaveStatus = "saved" | "saving" | "unsaved" | "conflict" | "error";

type Snapshot = {
  contents: Record<string, PageContent>;
  header: SectionInstance | null;
  footer: SectionInstance | null;
  designSystem: DesignSystem;
};

export type EditorState = {
  pages: EditorPage[];
  activePageId: string;
  header: SectionInstance | null;
  footer: SectionInstance | null;
  designSystem: DesignSystem;
  designVersion: number;
  dirtyPages: Record<string, true>;
  dirtyChrome: { header?: true; footer?: true };
  dirtyDesign: boolean;
  selection: Selection;
  locale: SiteLocale;
  defaultLocale: SiteLocale;
  device: Device;
  past: Snapshot[];
  future: Snapshot[];
  saveStatus: SaveStatus;
  panel: "sections" | "theme" | "pages";
};

export type EditorActions = {
  editPage: (pageId: string, update: (content: PageContent) => PageContent) => void;
  editChrome: (part: "header" | "footer", value: SectionInstance | null) => void;
  editDesign: (update: (ds: DesignSystem) => DesignSystem) => void;
  undo: () => void;
  redo: () => void;
  select: (selection: Selection) => void;
  setActivePage: (pageId: string) => void;
  setLocale: (locale: SiteLocale) => void;
  setDevice: (device: Device) => void;
  setPanel: (panel: EditorState["panel"]) => void;
  setSaveStatus: (status: SaveStatus) => void;
  markPageSaved: (pageId: string, version: number, content: PageContent) => void;
  markChromeSaved: (part: "header" | "footer", value: SectionInstance | null) => void;
  markDesignSaved: (version: number, ds: DesignSystem) => void;
  /** Page list changes from the page manager (not part of undo history). */
  setPages: (pages: EditorPage[]) => void;
};

export type EditorStore = ReturnType<typeof createEditorStore>;

function snapshot(state: EditorState): Snapshot {
  return {
    contents: Object.fromEntries(state.pages.map((p) => [p.id, p.content])),
    header: state.header,
    footer: state.footer,
    designSystem: state.designSystem,
  };
}

function restore(state: EditorState, snap: Snapshot): Partial<EditorState> {
  const dirtyPages = { ...state.dirtyPages };
  const pages = state.pages.map((page) => {
    const content = snap.contents[page.id];
    if (!content || content === page.content) return page;
    dirtyPages[page.id] = true;
    return { ...page, content };
  });
  const dirtyChrome = { ...state.dirtyChrome };
  if (snap.header !== state.header) dirtyChrome.header = true;
  if (snap.footer !== state.footer) dirtyChrome.footer = true;
  return {
    pages,
    header: snap.header,
    footer: snap.footer,
    designSystem: snap.designSystem,
    dirtyPages,
    dirtyChrome,
    dirtyDesign: state.dirtyDesign || snap.designSystem !== state.designSystem,
    saveStatus: "unsaved",
  };
}

export function createEditorStore(initial: Pick<EditorState, "pages" | "header" | "footer" | "designSystem" | "designVersion" | "defaultLocale">) {
  const home = initial.pages.find((p) => p.isHome) ?? initial.pages[0]!;
  return createStore<EditorState & EditorActions>()((set, get) => {
    /** Applies an undoable change. */
    const commit = (change: (state: EditorState) => Partial<EditorState>) => {
      const state = get();
      set({
        ...change(state),
        past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
        future: [],
        saveStatus: "unsaved",
      });
    };

    return {
      ...initial,
      activePageId: home.id,
      dirtyPages: {},
      dirtyChrome: {},
      dirtyDesign: false,
      selection: null,
      locale: initial.defaultLocale,
      device: "desktop",
      past: [],
      future: [],
      saveStatus: "saved",
      panel: "sections",

      editPage: (pageId, update) =>
        commit((state) => ({
          pages: state.pages.map((p) => (p.id === pageId ? { ...p, content: update(p.content) } : p)),
          dirtyPages: { ...state.dirtyPages, [pageId]: true },
        })),
      editChrome: (part, value) =>
        commit((state) => ({ [part]: value, dirtyChrome: { ...state.dirtyChrome, [part]: true } })),
      editDesign: (update) => commit((state) => ({ designSystem: update(state.designSystem), dirtyDesign: true })),

      undo: () => {
        const state = get();
        const previous = state.past.at(-1);
        if (!previous) return;
        set({ ...restore(state, previous), past: state.past.slice(0, -1), future: [snapshot(state), ...state.future] });
      },
      redo: () => {
        const state = get();
        const next = state.future[0];
        if (!next) return;
        set({ ...restore(state, next), future: state.future.slice(1), past: [...state.past, snapshot(state)] });
      },

      select: (selection) => set({ selection }),
      setActivePage: (pageId) => set({ activePageId: pageId, selection: null }),
      setLocale: (locale) => set({ locale }),
      setDevice: (device) => set({ device }),
      setPanel: (panel) => set({ panel }),
      setSaveStatus: (saveStatus) => set({ saveStatus }),

      markPageSaved: (pageId, version, content) =>
        set((state) => {
          const pages = state.pages.map((p) => (p.id === pageId ? { ...p, version } : p));
          const page = state.pages.find((p) => p.id === pageId);
          // Only clean when nothing changed while the save was in flight.
          const dirtyPages = { ...state.dirtyPages };
          if (page?.content === content) delete dirtyPages[pageId];
          return { pages, dirtyPages };
        }),
      markChromeSaved: (part, value) =>
        set((state) => {
          if (state[part] !== value) return {};
          const dirtyChrome = { ...state.dirtyChrome };
          delete dirtyChrome[part];
          return { dirtyChrome };
        }),
      markDesignSaved: (version, ds) =>
        set((state) => ({ designVersion: version, dirtyDesign: state.designSystem === ds ? false : state.dirtyDesign })),
      setPages: (pages) =>
        set((state) => ({
          pages,
          activePageId: pages.some((p) => p.id === state.activePageId) ? state.activePageId : (pages.find((p) => p.isHome) ?? pages[0]!).id,
        })),
    };
  });
}

export function hasPendingChanges(state: EditorState): boolean {
  return Object.keys(state.dirtyPages).length > 0 || Boolean(state.dirtyChrome.header || state.dirtyChrome.footer) || state.dirtyDesign;
}
