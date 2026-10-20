"use client";

import { createStore } from "zustand/vanilla";
import type { DesignSystem, PageContent, SectionInstance, SiteLocale } from "@workspace/store-sections";
import type { SectionPreset } from "@workspace/store-sections/render";
import { MAX_HISTORY } from "../lib/editor.lib";

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

/** A section on the page, or the shared header/footer. */
export type SectionRef = { target: "page"; sectionId: string } | { target: "header" } | { target: "footer" };

/**
 * What is selected (P4B-04): a section, one of its editable parts
 * (`part` = prop key or `collection.index.field`), or an element of a
 * custom section (`nodeId`).
 */
export type Selection = (SectionRef & { part?: string; nodeId?: string }) | null;
export type Rail = "add" | "layers" | "media" | "explore" | "forms" | "pages" | "brand";
/** Add panel tabs; Templates opens by itself after a new page is created. */
export type AddTab = "elements" | "sections" | "templates";
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
  /** Version of the saved header/footer (shared by both); sent with every chrome save. */
  chromeVersion: number;
  dirtyPages: Record<string, true>;
  dirtyChrome: { header?: true; footer?: true };
  dirtyDesign: boolean;
  selection: Selection;
  locale: SiteLocale;
  defaultLocale: SiteLocale;
  /** Store industry id (Store settings › General); picks the default photos of inserted sections. */
  industry?: string;
  /** Add › Sections presets (`library_sections`, Task 10); the built-in library when unset. */
  presets?: readonly SectionPreset[];
  device: Device;
  past: Snapshot[];
  future: Snapshot[];
  saveStatus: SaveStatus;
  rail: Rail;
  addTab: AddTab;
  /** Add › Sections is browsing a library category or search results; the panel widens to two columns. */
  libraryWide: boolean;
  inspectorTab: "content" | "style";
  /** Inspector shows only the selected part's field ("Selected element only"). */
  focusSelected: boolean;
  gridOverlay: boolean;
  /** Last undoable change, so bursts of the same edit (typing) share one undo step. */
  lastCommit: { key: string; at: number } | null;
  /** A picture hovered in Images/Explore, shown on the selection's image only (never saved, not in history). */
  imagePreview: string | null;
};

/** Edits with the same key within this window are one undo step. */
const COALESCE_MS = 1000;

export type EditorActions = {
  editPage: (pageId: string, update: (content: PageContent) => PageContent, coalesceKey?: string) => void;
  editChrome: (part: "header" | "footer", value: SectionInstance | null, coalesceKey?: string) => void;
  /** Edits one section of the active page, or the header/footer. */
  editSection: (ref: SectionRef, update: (instance: SectionInstance) => SectionInstance, coalesceKey?: string) => void;
  editDesign: (update: (ds: DesignSystem) => DesignSystem, coalesceKey?: string) => void;
  undo: () => void;
  redo: () => void;
  select: (selection: Selection) => void;
  setActivePage: (pageId: string) => void;
  setLocale: (locale: SiteLocale) => void;
  setDevice: (device: Device) => void;
  setRail: (rail: Rail) => void;
  setAddTab: (tab: EditorState["addTab"]) => void;
  setLibraryWide: (value: boolean) => void;
  setInspectorTab: (tab: EditorState["inspectorTab"]) => void;
  setFocusSelected: (value: boolean) => void;
  toggleGridOverlay: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setImagePreview: (src: string | null) => void;
  markPageSaved: (pageId: string, version: number, content: PageContent) => void;
  markChromeSaved: (part: "header" | "footer", value: SectionInstance | null, version: number) => void;
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

export function createEditorStore(initial: Pick<EditorState, "pages" | "header" | "footer" | "designSystem" | "designVersion" | "chromeVersion" | "defaultLocale" | "industry" | "presets">) {
  const home = initial.pages.find((p) => p.isHome) ?? initial.pages[0]!;
  return createStore<EditorState & EditorActions>()((set, get) => {
    /** Applies an undoable change; the same `coalesceKey` in quick succession reuses the last undo step. */
    const commit = (change: (state: EditorState) => Partial<EditorState>, coalesceKey?: string) => {
      const state = get();
      const now = Date.now();
      const merge = Boolean(coalesceKey && state.lastCommit?.key === coalesceKey && now - state.lastCommit.at < COALESCE_MS);
      set({
        ...change(state),
        past: merge ? state.past : [...state.past, snapshot(state)].slice(-MAX_HISTORY),
        future: [],
        saveStatus: "unsaved",
        lastCommit: coalesceKey ? { key: coalesceKey, at: now } : null,
        imagePreview: null,
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
      rail: "add",
      addTab: "elements",
      libraryWide: false,
      inspectorTab: "content",
      focusSelected: false,
      gridOverlay: false,
      lastCommit: null,
      imagePreview: null,

      editPage: (pageId, update, coalesceKey) =>
        commit(
          (state) => ({
            pages: state.pages.map((p) => (p.id === pageId ? { ...p, content: update(p.content) } : p)),
            dirtyPages: { ...state.dirtyPages, [pageId]: true },
          }),
          coalesceKey,
        ),
      editChrome: (part, value, coalesceKey) =>
        commit((state) => ({ [part]: value, dirtyChrome: { ...state.dirtyChrome, [part]: true } }), coalesceKey),
      editSection: (ref, update, coalesceKey) => {
        const state = get();
        if (ref.target === "page") {
          const page = state.pages.find((p) => p.id === state.activePageId);
          if (!page?.content.sections.some((s) => s.id === ref.sectionId)) return;
          state.editPage(
            page.id,
            (content) => ({ ...content, sections: content.sections.map((s) => (s.id === ref.sectionId ? update(s) : s)) }),
            coalesceKey,
          );
          return;
        }
        const current = state[ref.target];
        if (current) state.editChrome(ref.target, update(current), coalesceKey);
      },
      editDesign: (update, coalesceKey) => commit((state) => ({ designSystem: update(state.designSystem), dirtyDesign: true }), coalesceKey),

      undo: () => {
        const state = get();
        const previous = state.past.at(-1);
        if (!previous) return;
        set({ ...restore(state, previous), past: state.past.slice(0, -1), future: [snapshot(state), ...state.future], lastCommit: null });
      },
      redo: () => {
        const state = get();
        const next = state.future[0];
        if (!next) return;
        set({ ...restore(state, next), future: state.future.slice(1), past: [...state.past, snapshot(state)], lastCommit: null });
      },

      select: (selection) => set({ selection, lastCommit: null, imagePreview: null }),
      setActivePage: (pageId) => set({ activePageId: pageId, selection: null, imagePreview: null }),
      setLocale: (locale) => set({ locale }),
      setDevice: (device) => set({ device }),
      setRail: (rail) => set({ rail }),
      setAddTab: (addTab) => set({ addTab }),
      setLibraryWide: (libraryWide) => set({ libraryWide }),
      setInspectorTab: (inspectorTab) => set({ inspectorTab }),
      setFocusSelected: (focusSelected) => set({ focusSelected }),
      toggleGridOverlay: () => set((state) => ({ gridOverlay: !state.gridOverlay })),
      setSaveStatus: (saveStatus) => set({ saveStatus }),
      setImagePreview: (imagePreview) => set((state) => (state.imagePreview === imagePreview ? {} : { imagePreview })),

      markPageSaved: (pageId, version, content) =>
        set((state) => {
          const pages = state.pages.map((p) => (p.id === pageId ? { ...p, version } : p));
          const page = state.pages.find((p) => p.id === pageId);
          // Only clean when nothing changed while the save was in flight.
          const dirtyPages = { ...state.dirtyPages };
          if (page?.content === content) delete dirtyPages[pageId];
          return { pages, dirtyPages };
        }),
      markChromeSaved: (part, value, version) =>
        set((state) => {
          // The server bumped the version even if the seller kept editing meanwhile.
          if (state[part] !== value) return { chromeVersion: version };
          const dirtyChrome = { ...state.dirtyChrome };
          delete dirtyChrome[part];
          return { chromeVersion: version, dirtyChrome };
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
