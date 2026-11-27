import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import type { SectionInstance } from "@workspace/store-sections";
import { applySectionOps, type SectionOp } from "@workspace/store-sections/agent";
import { EditorAdapterProvider } from "../adapter.client";
import type { EditorAdapter, EditorLinkOverrides } from "../adapter.types";
import en from "../messages/en.json";
import { createEditorStore, type EditorStore } from "../state/editor.store";
import { EditorAssistantHost, EditorAssistantSplit, type EditorAssistantApi } from "./editor-assistant.client";
import { EditorTopbar } from "./editor-topbar.client";

// The top bar's links need no app router here.
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));

const PAGE_ID = "6f1c3c7e-1f7a-4a4b-9d43-6f4c0e0d2a11";
const ABOUT_ID = "7a2d4d8f-2a8b-4b5c-8e54-7a5d1f1e3b22";

const CAPABILITIES = {
  pages: true,
  templates: true,
  forms: true,
  explore: true,
  mediaLibrary: true,
  revisions: true,
  unpublish: true,
  preview: true,
  industrySwitcher: false,
  designSystem: true,
  publishLabel: "site",
} as const;

const hero = (id: string): SectionInstance => ({
  id,
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    {
      id: `${id}-root`,
      type: "section",
      props: { label: `Hero ${id}` },
      children: [{ id: `${id}-title`, type: "heading", props: { text: "أهلا", level: "h2" }, children: [] }],
    },
  ],
});

const editor = () =>
  createEditorStore({
    pages: [
      { id: PAGE_ID, slug: "", isHome: true, name: { ar: "الرئيسية", en: "Home" }, seo: {}, showInNav: true, content: { sections: [hero("s-a"), hero("s-b")] }, version: 1 },
      { id: ABOUT_ID, slug: "about", isHome: false, name: { en: "About" }, seo: {}, showInNav: true, content: { sections: [hero("s-c")] }, version: 1 },
    ],
    header: { ...hero("s-h"), id: "header-1" },
    footer: null,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
    chromeVersion: 1,
    defaultLocale: "ar",
  });

function render(node: ReactNode, links?: EditorLinkOverrides): string {
  const adapter = { capabilities: CAPABILITIES, ...(links && { links }) } as unknown as EditorAdapter;
  return renderToString(
    <NextIntlClientProvider locale="en" messages={en} timeZone="Africa/Cairo">
      <EditorAdapterProvider adapter={adapter}>{node}</EditorAdapterProvider>
    </NextIntlClientProvider>,
  );
}

/** The API the host's assistant gets for the store as it is now. */
function apiOf(store: EditorStore, props: { readOnly?: boolean; compact?: boolean } = {}): EditorAssistantApi {
  let api: EditorAssistantApi | null = null;
  // A server render reads a zustand store's initial state; here it must read the state as it is now.
  store.getInitialState = store.getState;
  render(
    <EditorAssistantHost store={store} uiLocale="en" readOnly={props.readOnly ?? false} compact={props.compact ?? false} flush={async () => true} refreshData={() => {}} showCanvas={() => {}}>
      {(value) => {
        api = value;
        return null;
      }}
    </EditorAssistantHost>,
  );
  return api!;
}

/** The host's side: the model's ops normalised against the saved drafts. */
function serverOps(sections: SectionInstance[], ops: unknown[], target: EditorAssistantApi["target"]): SectionOp[] {
  let n = 0;
  return applySectionOps({ sections }, ops, { target, defaultLocale: "ar", allowCode: true, makeId: (k) => `${k === "section" ? "s" : "n"}-srv${++n}` }).applied.map((a) => a.op);
}

const SET_TITLE = { op: "set_text", sectionId: "s-b", nodeId: "s-b-title", prop: "text", ar: "مرحبا", en: "Hello" };
const titleOf = (store: EditorStore, index: number) => store.getState().pages[0]!.content.sections[index]!.componentTree![0]!.children[0]!.props.text;

describe("the assistant's API", () => {
  it("targets the active page and the canvas language with nothing selected", () => {
    const store = editor();
    expect(apiOf(store)).toMatchObject({ pageId: PAGE_ID, contentLocale: "ar", mention: null, target: { kind: "page" }, readOnly: false, compact: false });
    store.getState().setActivePage(ABOUT_ID);
    store.getState().setLocale("en");
    expect(apiOf(store, { readOnly: true, compact: true })).toMatchObject({ pageId: ABOUT_ID, contentLocale: "en", readOnly: true, compact: true });
  });

  it("mentions the selected section, never one element, and the header as itself", () => {
    const store = editor();
    store.getState().select({ target: "page", sectionId: "s-b", nodeId: "s-b-title" });
    const api = apiOf(store);
    expect(api.mention).toMatchObject({ key: "page:s-b", label: "Hero s-b", context: "Home" });
    expect(api.target).toEqual({ kind: "page", sectionId: "s-b" });
    store.getState().select({ target: "header" });
    expect(apiOf(store).target).toEqual({ kind: "header" });
  });

  it("clearing the mention deselects on the canvas", () => {
    const store = editor();
    store.getState().select({ target: "page", sectionId: "s-a" });
    apiOf(store).clearMention();
    expect(store.getState().selection).toBeNull();
    expect(apiOf(store).mention).toBeNull();
  });

  it("applies a turn's ops as one undo step that the turn's marker can undo while it is the newest", () => {
    const store = editor();
    const api = apiOf(store);
    const before = store.getState().past.length;
    const ops = serverOps(store.getState().pages[0]!.content.sections, [SET_TITLE, { ...SET_TITLE, sectionId: "s-a", nodeId: "s-a-title" }], { kind: "page" });
    const outcome = api.applyTurn({ pageId: PAGE_ID, target: { kind: "page" }, contentLocale: "ar" }, { ops, applied: ["Changed a text", "Changed a text"], previews: {} });
    expect(outcome).toMatchObject({ applied: ["Changed a text", "Changed a text"], stale: false });
    expect(titleOf(store, 0)).toBe("مرحبا");
    expect(titleOf(store, 1)).toBe("مرحبا");
    // One step for the whole turn; the page is dirty, so autosave saves it.
    expect(store.getState().past).toHaveLength(before + 1);
    expect(store.getState().dirtyPages[PAGE_ID]).toBeTruthy();
    expect(api.canUndo(outcome.undoMarker)).toBe(true);
    expect(api.canUndo(null)).toBe(false);

    api.undo(outcome.undoMarker);
    expect(titleOf(store, 0)).toBe("أهلا");
    expect(titleOf(store, 1)).toBe("أهلا");
    expect(api.canUndo(outcome.undoMarker)).toBe(false);
  });

  it("stops offering a turn's undo after a newer edit", () => {
    const store = editor();
    const api = apiOf(store);
    const ops = serverOps(store.getState().pages[0]!.content.sections, [SET_TITLE], { kind: "page" });
    const outcome = api.applyTurn({ pageId: PAGE_ID, target: { kind: "page" }, contentLocale: "ar" }, { ops, applied: ["Changed a text"], previews: {} });
    store.getState().editPage(PAGE_ID, (content) => ({ ...content, sections: content.sections.slice(0, 1) }));
    expect(api.canUndo(outcome.undoMarker)).toBe(false);
    api.undo(outcome.undoMarker);
    expect(store.getState().pages[0]!.content.sections).toHaveLength(1);
  });

  it("applies to the turn's page even when another page is open, and reports a section that is gone as stale", () => {
    const store = editor();
    const api = apiOf(store);
    const ops = serverOps(store.getState().pages[0]!.content.sections, [SET_TITLE], { kind: "page", sectionId: "s-b" });
    store.getState().setActivePage(ABOUT_ID);
    expect(api.applyTurn({ pageId: PAGE_ID, target: { kind: "page", sectionId: "s-b" }, contentLocale: "ar" }, { ops, applied: ["Changed a text"], previews: {} }).stale).toBe(false);
    expect(titleOf(store, 1)).toBe("مرحبا");

    store.getState().editPage(PAGE_ID, (content) => ({ ...content, sections: content.sections.filter((s) => s.id !== "s-b") }));
    const stale = api.applyTurn({ pageId: PAGE_ID, target: { kind: "page", sectionId: "s-b" }, contentLocale: "ar" }, { ops, applied: ["Changed a text"], previews: {} });
    expect(stale).toEqual({ applied: [], undoMarker: null, stale: true });
  });
});

describe("the assistant split", () => {
  it("renders nothing of the chat or the canvas before the browser knows the viewport", () => {
    const html = render(
      <EditorAssistantSplit dir="rtl" compact={false} assistant={<p>chat</p>} canvas={<p>canvas</p>} canvasOpen={false} onCanvasOpenChange={() => {}} />,
    );
    expect(html).toContain("aria-busy");
    expect(html).not.toContain("chat");
  });
});

describe("the top bar's mode switch", () => {
  const bar = (mode: "manual" | "ai", links?: EditorLinkOverrides) =>
    render(
      <EditorTopbar
        store={editor()}
        storeId="s1"
        storeUrl="https://shop.example"
        locales={["ar", "en"]}
        uiLocale="en"
        saveStatus="saved"
        onRetrySave={() => {}}
        previewEnabled
        preview={{ open: () => {}, opening: false }}
        readOnly={false}
        publishing={false}
        isLive
        hasChanges
        onPublish={() => {}}
        onShowShortcuts={() => {}}
        mode={mode}
        onSwitchMode={() => {}}
      />,
      links,
    );

  it("is hidden until the host gives the other editor's link", () => {
    expect(bar("manual")).not.toContain("Way to edit");
    expect(bar("ai")).not.toContain("Way to edit");
    // The AI editor's own link is not a link to somewhere else.
    expect(bar("ai", { aiEditor: "/stores/s1/editor/ai" })).not.toContain("Way to edit");
  });

  it("in the manual editor: Manual is current and AI links to the AI editor", () => {
    const html = bar("manual", { aiEditor: "/stores/s1/editor/ai", manualEditor: "/stores/s1/editor?mode=manual" });
    expect(html).toContain('aria-label="Way to edit"');
    expect(html).toMatch(/<a[^>]*href="\/stores\/s1\/editor\/ai"[^>]*aria-label="Edit with AI"/);
    expect(html).toMatch(/<span[^>]*aria-current="true"[^>]*>(?:(?!<\/span>)[\s\S])*Manual<\/span>/);
    expect(html).not.toContain('href="/stores/s1/editor?mode=manual"');
  });

  it("in the AI layout: AI is current, Manual links back, and the page switcher has no Manage pages", () => {
    const html = bar("ai", { aiEditor: "/stores/s1/editor/ai", manualEditor: "/stores/s1/editor?mode=manual" });
    expect(html).toMatch(/<a[^>]*href="\/stores\/s1\/editor\?mode=manual"[^>]*aria-label="Edit manually"/);
    expect(html).toMatch(/<span[^>]*aria-current="true"[^>]*>(?:(?!<\/span>)[\s\S])*AI<\/span>/);
    // The same bar as the manual editor's: page switcher, undo, redo, publish.
    for (const label of ["Undo", "Redo"]) expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain("Publish changes");
  });
});
