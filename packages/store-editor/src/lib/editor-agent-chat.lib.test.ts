import { describe, expect, it, vi } from "vitest";
import type { SectionInstance } from "@workspace/store-sections";
import { applySectionOps, type SectionOp } from "@workspace/store-sections/agent";
import { joinSectionFile } from "@workspace/store-sections/code-file";
import { findNode } from "@workspace/store-sections/render";
import type { EditorAgentTurnInput, EditorAgentTurnView } from "../adapter.types";
import type { EditorResult } from "../editor.dto";
import { codePreviewInput, createCodePreviewRunner, createCodePreviewStore, previewKey } from "../code/code-preview.lib";
import { createEditorStore } from "../state/editor.store";
import { createAgentChat } from "./editor-agent-chat.lib";
import { mentionOf } from "./editor-agent.lib";
import { getInstance, refOf } from "./editor-selection.lib";

const PAGE_ID = "6f1c3c7e-1f7a-4a4b-9d43-6f4c0e0d2a11";

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

const FILE = joinSectionFile({
  source: "<div class=\"faq\"><h2>{{ section.settings.title }}</h2></div>",
  css: ".faq { padding: 8px; }",
  schema: { name: "FAQ", settings: [{ type: "text", id: "title", label: "Title", default: "FAQ" }] },
});

function setup() {
  const store = createEditorStore({
    pages: [{ id: PAGE_ID, slug: "", isHome: true, name: { ar: "الرئيسية", en: "Home" }, seo: {}, showInNav: true, content: { sections: [hero("s-a"), hero("s-b")] }, version: 1 }],
    header: { ...hero("s-h"), id: "header-1" },
    footer: null,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
    chromeVersion: 1,
    defaultLocale: "ar",
  });
  const chat = createAgentChat(store);
  const contexts = { page: "Home", header: "Header", footer: "Footer" };
  const mention = () => {
    const s = store.getState();
    const sel = s.selection;
    const instance = sel ? getInstance({ content: s.pages[0]!.content, header: s.header, footer: s.footer }, refOf(sel)) : null;
    return mentionOf(sel, instance, "en", contexts);
  };
  const sections = () => store.getState().pages[0]!.content.sections;
  return { store, chat, mention, sections };
}

const view = (extra: Partial<EditorAgentTurnView> = {}): EditorAgentTurnView => ({
  reply: "Done.",
  ops: [],
  applied: [],
  rejected: [],
  previews: {},
  creditsUsed: 0,
  ...extra,
});

/** The host's side: normalises the model's ops against the sent content (as `turn.server.ts` does). */
function normalise(content: { sections: SectionInstance[] }, ops: unknown[], target: EditorAgentTurnInput["target"]): SectionOp[] {
  let n = 0;
  return applySectionOps(content, ops, { target, defaultLocale: "ar", allowCode: true, makeId: (k) => `${k === "section" ? "s" : "n"}-srv${++n}` }).applied.map((a) => a.op);
}

describe("agent chat turns", () => {
  it("sends the unsaved section of the selection, the outline, the page and the history", async () => {
    const { store, chat, mention, sections } = setup();
    const turn = vi.fn(async (_input: EditorAgentTurnInput): Promise<EditorResult<EditorAgentTurnView>> => ({ success: true, data: view({ reply: "First answer" }) }));
    // An unsaved edit to the section, then a click on one of its elements.
    store.getState().editSection({ target: "page", sectionId: "s-b" }, (i) => ({ ...i, customCss: "a{color:red}" }));
    store.getState().select({ target: "page", sectionId: "s-b", nodeId: "s-b-title" });
    store.getState().setLocale("en");

    await chat.send({ message: "make it bigger", turn, uiLocale: "en", mention: mention() });
    await chat.send({ message: "and red", turn, uiLocale: "en", mention: mention() });

    const first = turn.mock.calls[0]![0];
    expect(first).toMatchObject({
      message: "make it bigger",
      uiLocale: "en",
      contentLocale: "en",
      pageId: PAGE_ID,
      target: { kind: "page", sectionId: "s-b" },
      outline: [
        { id: "s-a", name: "Hero s-a", kind: "tree" },
        { id: "s-b", name: "Hero s-b", kind: "tree" },
      ],
      history: [],
    });
    expect(first.section).toEqual(sections()[1]);
    expect((first.section as SectionInstance).customCss).toBe("a{color:red}");
    const second = turn.mock.calls[1]![0];
    expect(second.history).toEqual([
      { role: "user", text: "make it bigger" },
      { role: "assistant", text: "First answer" },
    ]);
  });

  it("targets the page, with no section, when nothing is selected or the chip was removed", async () => {
    const { chat } = setup();
    const turn = vi.fn(async (_input: EditorAgentTurnInput): Promise<EditorResult<EditorAgentTurnView>> => ({ success: true, data: view() }));
    await chat.send({ message: "add an FAQ section at the end", turn, uiLocale: "ar", mention: null });
    const input = turn.mock.calls[0]![0];
    expect(input.target).toEqual({ kind: "page" });
    expect(input).not.toHaveProperty("section");
  });

  it("sends the header instance for a header selection", async () => {
    const { store, chat, mention } = setup();
    const turn = vi.fn(async (_input: EditorAgentTurnInput): Promise<EditorResult<EditorAgentTurnView>> => ({ success: true, data: view() }));
    store.getState().select({ target: "header", nodeId: "s-h-title" });
    await chat.send({ message: "hi", turn, uiLocale: "en", mention: mention() });
    const input = turn.mock.calls[0]![0];
    expect(input.target).toEqual({ kind: "header" });
    expect((input.section as SectionInstance).id).toBe("header-1");
  });

  it("applies the ops as one undo step, selects the section, and Undo reverts exactly that step", async () => {
    const { store, chat, mention, sections } = setup();
    store.getState().select({ target: "page", sectionId: "s-b", nodeId: "s-b-title" });
    const before = structuredClone(sections());
    const pastBefore = store.getState().past.length;
    const ops = [
      { op: "set_text", sectionId: "s-b", nodeId: "s-b-title", prop: "text", ar: "عنوان جديد", en: "New title" },
      { op: "set_style", sectionId: "s-b", nodeId: "s-b-title", style: { fontSize: "4xl" } },
    ];
    const normalised = normalise({ sections: before }, ops, { kind: "page", sectionId: "s-b" });
    const turn = async (): Promise<EditorResult<EditorAgentTurnView>> => ({
      success: true,
      data: view({ ops: normalised, applied: ["Changed a text", "Changed the style"], creditsUsed: 1 }),
    });
    await chat.send({ message: "bigger title", turn, uiLocale: "en", mention: mention() });

    const title = findNode(sections()[1]!.componentTree!, "s-b-title")!;
    expect(title.props.text).toBe("عنوان جديد");
    expect((title.props.translations as Record<string, Record<string, string>>).en!.text).toBe("New title");
    expect(store.getState().past.length).toBe(pastBefore + 1);
    expect(store.getState().dirtyPages[PAGE_ID]).toBe(true);
    expect(store.getState().selection).toEqual({ target: "page", sectionId: "s-b" });

    const reply = chat.store.getState().messages.at(-1)!;
    expect(reply).toMatchObject({ role: "assistant", applied: ["Changed a text", "Changed the style"], creditsUsed: 1 });
    expect(chat.canUndo(reply)).toBe(true);
    chat.undo(reply);
    expect(sections()).toEqual(before);
    expect(chat.canUndo(reply)).toBe(false);
  });

  it("hides Undo once another edit is the latest step", async () => {
    const { store, chat, sections } = setup();
    const ops = normalise({ sections: sections() }, [{ op: "remove_section", sectionId: "s-a" }], { kind: "page" });
    await chat.send({ message: "remove the first", turn: async () => ({ success: true, data: view({ ops, applied: ["Removed the section"] }) }), uiLocale: "en", mention: null });
    const reply = chat.store.getState().messages.at(-1)!;
    expect(sections().map((s) => s.id)).toEqual(["s-b"]);
    expect(chat.canUndo(reply)).toBe(true);
    store.getState().editSection({ target: "page", sectionId: "s-b" }, (i) => ({ ...i, customCss: "b{}" }));
    expect(chat.canUndo(reply)).toBe(false);
    chat.undo(reply);
    expect(sections()[0]!.customCss).toBe("b{}");
  });

  it("puts the host's code previews in the canvas's preview store (no preview call)", async () => {
    const { store, chat, sections } = setup();
    const ops = normalise({ sections: sections() }, [{ op: "add_code_section", after: "end", file: FILE, name: "FAQ" }], { kind: "page" });
    const nodeId = (ops[0] as { newNodeId: string }).newNodeId;
    const sectionId = (ops[0] as { newSectionId: string }).newSectionId;
    // The host's props for the node: what its own apply wrote.
    const hostContent = applySectionOps({ sections: sections() }, ops, { target: { kind: 'page' }, defaultLocale: 'ar', allowCode: true });
    const hostProps = findNode(hostContent.content.sections.at(-1)!.componentTree!, nodeId)!.props;
    const previewStore = createCodePreviewStore();
    const preview = vi.fn();
    const runner = createCodePreviewRunner({ preview, store: previewStore });
    const target = { locale: "ar" as const, pageId: PAGE_ID };

    await chat.send({
      message: "add an FAQ",
      turn: async () => ({
        success: true,
        data: view({ ops, applied: ["Added a new section «FAQ»"], previews: { [nodeId]: { html: "<div class=\"faq\"><h2>FAQ</h2></div>", css: "[data-node-id] .faq{padding:8px}", props: hostProps } } }),
      }),
      uiLocale: "en",
      mention: null,
      preview: { runner, target },
    });

    const added = sections().find((s) => s.id === sectionId)!;
    expect(added).toBeDefined();
    expect(store.getState().selection).toEqual({ target: "page", sectionId });
    const node = findNode(added.componentTree!, nodeId)!;
    expect(node.props).toEqual(hostProps);
    const entry = previewStore.getState().entries[nodeId]!;
    expect(entry).toMatchObject({ status: "ready", html: "<div class=\"faq\"><h2>FAQ</h2></div>", css: "[data-node-id] .faq{padding:8px}" });
    expect(entry.key).toBe(previewKey(codePreviewInput(node, target)));
    // The canvas asks for the same input: nothing is sent.
    runner.request(codePreviewInput(node, target));
    expect(preview).not.toHaveBeenCalled();
  });

  it("stores the code node's props as the host normalised them", async () => {
    const { chat, sections } = setup();
    const ops = normalise({ sections: sections() }, [{ op: "add_code_section", file: FILE }], { kind: "page" });
    const nodeId = (ops[0] as { newNodeId: string }).newNodeId;
    const hostProps = { apiVersion: 1, source: "<p>host</p>", css: "", schema: { name: "FAQ", settings: [] }, settings: {}, blocks: [], name: "FAQ" };
    await chat.send({
      message: "add",
      turn: async () => ({ success: true, data: view({ ops, applied: ["Added"], previews: { [nodeId]: { html: "<p>host</p>", css: "", props: hostProps } } }) }),
      uiLocale: "en",
      mention: null,
    });
    const node = sections().flatMap((s) => (findNode(s.componentTree ?? [], nodeId) ? [findNode(s.componentTree!, nodeId)!] : []))[0]!;
    expect(node.props).toEqual(hostProps);
  });

  it("ignores a stopped turn's late answer", async () => {
    const { chat, sections } = setup();
    const before = structuredClone(sections());
    const ops = normalise({ sections: before }, [{ op: "remove_section", sectionId: "s-a" }], { kind: "page" });
    let answer!: (value: EditorResult<EditorAgentTurnView>) => void;
    const turn = () => new Promise<EditorResult<EditorAgentTurnView>>((resolve) => (answer = resolve));
    const sending = chat.send({ message: "remove", turn, uiLocale: "en", mention: null });
    expect(chat.store.getState().pending).not.toBeNull();
    chat.stop();
    expect(chat.store.getState().pending).toBeNull();
    answer({ success: true, data: view({ ops, applied: ["Removed the section"] }) });
    await sending;
    expect(sections()).toEqual(before);
    expect(chat.store.getState().messages.map((m) => m.role)).toEqual(["user", "error"]);
    expect(chat.store.getState().messages.at(-1)).toMatchObject({ role: "error", error: "stopped" });
  });

  it("shows an error from the host and a thrown call as generic", async () => {
    const { chat } = setup();
    await chat.send({ message: "a", turn: async () => ({ success: false, error: "aiNoCredits" }), uiLocale: "en", mention: null });
    await chat.send({ message: "b", turn: async () => Promise.reject(new Error("network")), uiLocale: "en", mention: null });
    const errors = chat.store.getState().messages.filter((m) => m.role === "error");
    expect(errors).toEqual([expect.objectContaining({ error: "aiNoCredits" }), expect.objectContaining({ error: "generic" })]);
  });

  it("marks a reply stale when its ops no longer fit the draft", async () => {
    const { store, chat, sections } = setup();
    const ops = normalise({ sections: sections() }, [{ op: "remove_section", sectionId: "s-a" }], { kind: "page" });
    let answer!: (value: EditorResult<EditorAgentTurnView>) => void;
    const sending = chat.send({ message: "x", turn: () => new Promise((resolve) => (answer = resolve)), uiLocale: "en", mention: null });
    // The seller removes it meanwhile.
    store.getState().editPage(PAGE_ID, (c) => ({ ...c, sections: c.sections.filter((s) => s.id !== "s-a") }));
    answer({ success: true, data: view({ ops, applied: ["Removed the section"], rejected: [] }) });
    await sending;
    expect(chat.store.getState().messages.at(-1)).toMatchObject({ role: "assistant", stale: true, applied: [], undoMarker: null });
  });
});
