import { describe, expect, it } from "vitest";
import { LAYOUT_PRESETS, storeSectionRegistry } from "@workspace/store-sections/render";
import { createEditorCommands } from "./editor-commands.lib";
import { createEditorStore } from "../state/editor.store";

function setup() {
  const store = createEditorStore({
    pages: [{ id: "p1", slug: "", isHome: true, name: { ar: "الرئيسية" }, seo: {}, showInNav: true, content: { sections: [] }, version: 1 }],
    header: null,
    footer: null,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
    chromeVersion: 1,
    defaultLocale: "ar",
  });
  const sections = () => store.getState().pages[0]!.content.sections;
  return { store, commands: createEditorCommands(store), sections };
}

describe("editor commands", () => {
  it("puts a new element in a new custom section, then inside the selected container", () => {
    const { store, commands, sections } = setup();
    commands.addElement("vFlex");
    expect(sections()).toHaveLength(1);
    expect(sections()[0]!.sectionId).toBe("custom-section");
    const flexId = store.getState().selection!.nodeId!;
    // The new section is a tree section: everything sits inside its section root.
    const root = () => sections()[0]!.componentTree![0]!;
    expect(sections()[0]!.componentTree).toHaveLength(1);
    expect(root().type).toBe("section");
    commands.addElement("heading");
    expect(root().children[0]!.id).toBe(flexId);
    expect(root().children[0]!.children[0]!.type).toBe("heading");
    // A heading is not a container: the next element goes after it.
    commands.addElement("paragraph");
    expect(root().children[0]!.children.map((n) => n.type)).toEqual(["heading", "paragraph"]);
  });

  it("inserts sections after the selection and duplicates with fresh element ids", () => {
    const { store, commands, sections } = setup();
    commands.addSection(storeSectionRegistry.get("custom-section")!);
    // Nothing selected: the layout preset starts its own section.
    store.getState().select(null);
    commands.addPreset(LAYOUT_PRESETS[1]!);
    const custom = sections()[1]!;
    store.getState().select({ target: "page", sectionId: custom.id });
    commands.duplicate();
    expect(sections()).toHaveLength(3);
    expect(sections()[2]!.componentTree![0]!.id).not.toBe(custom.componentTree![0]!.id);
    commands.move(-1);
    expect(sections()[1]!.id).toBe(store.getState().selection && (store.getState().selection as { sectionId: string }).sectionId);
  });

  it("copies and pastes sections and elements with new ids, one undo step each", () => {
    const { store, commands, sections } = setup();
    commands.addSection(storeSectionRegistry.get("custom-section")!);
    expect(commands.copy()).toBe(true);
    commands.paste();
    expect(sections()).toHaveLength(2);
    expect(sections()[0]!.id).not.toBe(sections()[1]!.id);
    store.getState().undo();
    expect(sections()).toHaveLength(1);
  });

  it("hides an element on the current device only", () => {
    const { store, commands, sections } = setup();
    commands.addElement("heading");
    store.getState().setDevice("mobile");
    const heading = () => sections()[0]!.componentTree![0]!.children[0]!;
    commands.toggleHidden();
    expect(heading().breakpointStyles?.mobile?.hidden).toBe(true);
    expect(heading().style?.hidden).toBeUndefined();
    commands.toggleHidden();
    expect(heading().breakpointStyles?.mobile?.hidden).toBeFalsy();
  });

  it("coalesces quick edits with the same key into one undo step", () => {
    const { store, sections } = setup();
    const { addSection } = createEditorCommands(store);
    addSection(storeSectionRegistry.get("custom-section")!);
    const ref = { target: "page" as const, sectionId: sections()[0]!.id };
    for (const text of ["a", "ab", "abc"]) store.getState().editSection(ref, (i) => ({ ...i, props: { ...i.props, title: text } }), "title");
    store.getState().undo();
    expect(sections()[0]!.props.title).not.toBe("ab");
    expect(sections()[0]!.props.title).not.toBe("abc");
  });
});

describe("canvas drops through commands (P4B-12)", () => {
  it("inserts a dropped section as one undo step and selects it", () => {
    const { store, commands, sections } = setup();
    commands.addSection(storeSectionRegistry.get("custom-section")!);
    const first = sections()[0]!.id;
    expect(commands.applyDrop({ kind: "section", sectionId: "custom-section", presetId: "hero.classic" }, { kind: "insert-section", index: 0 })).toBe(true);
    expect(sections()).toHaveLength(2);
    expect(sections()[0]!.source).toBe("hero-classic@1");
    expect(store.getState().selection).toEqual({ target: "page", sectionId: sections()[0]!.id });
    store.getState().undo();
    expect(sections().map((s) => s.id)).toEqual([first]);
  });

  it("refuses a stale plan without writing anything", () => {
    const { store, commands } = setup();
    const before = store.getState().past.length;
    expect(commands.applyDrop({ kind: "move-section", instanceId: "gone" }, { kind: "move-section", instanceId: "gone", to: 0 })).toBe(false);
    expect(commands.applyDrop({ kind: "photo", photo: { photoId: "1", thumbUrl: "", alt: "" } }, { kind: "new-section", index: 0 })).toBe(false);
    expect(store.getState().past.length).toBe(before);
  });

  it("replaces only the image src of the target element", () => {
    const { store, commands, sections } = setup();
    commands.addElement("image");
    const sel = store.getState().selection as { sectionId: string; nodeId: string };
    const image = () => sections()[0]!.componentTree![0]!.children[0]!;
    const style = image().style;
    const ok = commands.applyDrop(
      { kind: "media", src: "https://cdn/new.jpg", thumbUrl: "", alt: "New" },
      { kind: "replace-image", target: { ref: { target: "page", sectionId: sel.sectionId }, nodeId: sel.nodeId }, candidate: 0 },
    );
    expect(ok).toBe(true);
    expect(image().props).toMatchObject({ src: "https://cdn/new.jpg", alt: "New" });
    expect(image().style).toEqual(style);
    expect(sections()).toHaveLength(1);
  });
});
