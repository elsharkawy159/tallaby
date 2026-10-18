import { describe, expect, it } from "vitest";
import { LAYOUT_PRESETS, storeSectionRegistry } from "@workspace/store-sections/render";
import { createEditorCommands } from "./editor-commands.lib";
import { createEditorStore } from "./editor.store";

function setup() {
  const store = createEditorStore({
    pages: [{ id: "p1", slug: "", isHome: true, name: { ar: "الرئيسية" }, seo: {}, showInNav: true, content: { sections: [] }, version: 1 }],
    header: null,
    footer: null,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
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
    commands.addElement("heading");
    expect(sections()[0]!.componentTree![0]!.id).toBe(flexId);
    expect(sections()[0]!.componentTree![0]!.children[0]!.type).toBe("heading");
    // A heading is not a container: the next element goes after it.
    commands.addElement("paragraph");
    expect(sections()[0]!.componentTree![0]!.children.map((n) => n.type)).toEqual(["heading", "paragraph"]);
  });

  it("inserts sections after the selection and duplicates with fresh element ids", () => {
    const { store, commands, sections } = setup();
    commands.addSection(storeSectionRegistry.get("hero-banner")!);
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
    commands.addSection(storeSectionRegistry.get("features")!);
    expect(commands.copy()).toBe(true);
    commands.paste();
    expect(sections()).toHaveLength(2);
    expect(sections()[0]!.id).not.toBe(sections()[1]!.id);
    store.getState().undo();
    expect(sections()).toHaveLength(1);
  });

  it("hides on the current device only", () => {
    const { store, commands, sections } = setup();
    commands.addSection(storeSectionRegistry.get("hero-banner")!);
    store.getState().setDevice("mobile");
    store.getState().select({ target: "page", sectionId: sections()[0]!.id, part: "title" });
    commands.toggleHidden();
    expect(sections()[0]!.breakpointStyles).toEqual({ mobile: { parts: { title: { hidden: true } } } });
    commands.toggleHidden();
    expect(sections()[0]!.breakpointStyles).toEqual({ mobile: { parts: {} } });
  });

  it("coalesces quick edits with the same key into one undo step", () => {
    const { store, sections } = setup();
    const { addSection } = createEditorCommands(store);
    addSection(storeSectionRegistry.get("rich-text")!);
    const ref = { target: "page" as const, sectionId: sections()[0]!.id };
    for (const text of ["a", "ab", "abc"]) store.getState().editSection(ref, (i) => ({ ...i, props: { ...i.props, title: text } }), "title");
    store.getState().undo();
    expect(sections()[0]!.props.title).not.toBe("ab");
    expect(sections()[0]!.props.title).not.toBe("abc");
  });
});

describe("forms tab", () => {
  it("adds a contact-form section bound to the form, after the selection", () => {
    const { store, commands, sections } = setup();
    commands.addSection(storeSectionRegistry.get("hero-banner")!);
    const formId = "6f1c2b0e-8d3a-4c1b-9e2f-0a1b2c3d4e5f";
    expect(commands.addFormSection(formId, "تواصل معنا")).toBe(true);
    expect(sections().map((s) => s.sectionId)).toEqual(["hero-banner", "contact-form"]);
    expect(sections()[1]!.props).toMatchObject({ formId, title: "تواصل معنا" });
    expect(store.getState().selection).toMatchObject({ target: "page", sectionId: sections()[1]!.id });
  });
});

describe("canvas drops through commands (P4B-12)", () => {
  it("inserts a dropped section as one undo step and selects it", () => {
    const { store, commands, sections } = setup();
    commands.addSection(storeSectionRegistry.get("faq")!);
    expect(commands.applyDrop({ kind: "section", sectionId: "features" }, { kind: "insert-section", index: 0 })).toBe(true);
    expect(sections().map((s) => s.sectionId)).toEqual(["features", "faq"]);
    expect(store.getState().selection).toEqual({ target: "page", sectionId: sections()[0]!.id });
    store.getState().undo();
    expect(sections().map((s) => s.sectionId)).toEqual(["faq"]);
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
    const image = () => sections()[0]!.componentTree![0]!;
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

describe("moving parts of pre-built sections (P4B-16)", () => {
  it("arrows and drops move parts and items, one undo step each", () => {
    const { store, commands, sections } = setup();
    commands.addSection(storeSectionRegistry.get("image-with-text")!);
    const about = sections()[0]!;
    const ref = { target: "page" as const, sectionId: about.id };

    store.getState().select({ ...ref, part: "title" });
    commands.move(1);
    expect(sections()[0]!.slots?.text?.order).toEqual(["body", "title", "ctaLabel"]);
    expect(store.getState().selection).toEqual({ ...ref, part: "title" });

    expect(commands.applyDrop({ kind: "move-part", ref, part: "body" }, { kind: "move-part", ref, part: "body", slot: "media", index: 0 })).toBe(true);
    expect(sections()[0]!.slots).toEqual({ media: { order: ["body", "image"] }, text: { order: ["title", "ctaLabel"] } });
    store.getState().undo();
    expect(sections()[0]!.slots?.text?.order).toEqual(["body", "title", "ctaLabel"]);
    store.getState().undo();
    expect(sections()[0]!.slots).toBeUndefined();

    commands.addSection(storeSectionRegistry.get("features")!);
    const hl = sections()[1]!;
    const hlRef = { target: "page" as const, sectionId: hl.id };
    store.getState().select({ ...hlRef, part: "items.0.title" });
    const plan = { kind: "move-item" as const, ref: hlRef, collection: "items", from: 0, to: 2 };
    expect(commands.applyDrop({ kind: "move-item", ref: hlRef, collection: "items", index: 0 }, plan)).toBe(true);
    expect((sections()[1]!.props.items as { icon: string }[]).map((i) => i.icon)).toEqual(["shield", "support", "truck"]);
    expect(store.getState().selection).toEqual({ ...hlRef, part: "items.2.title" });
  });
});
