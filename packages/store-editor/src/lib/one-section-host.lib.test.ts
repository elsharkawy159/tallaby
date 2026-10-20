import { describe, expect, it } from "vitest";
import type { ComponentNode, PageContent, SectionInstance } from "@workspace/store-sections";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import { applyDropPlan, planDrop } from "../dnd/drop-plan.lib";
import type { CanvasProbe } from "../dnd/dnd.types";
import { createEditorStore } from "../state/editor.store";
import { railEnabled } from "../shell/capabilities.lib";
import type { EditorCapabilities } from "../adapter.types";
import { createEditorCommands } from "./editor-commands.lib";

/** The admin section editor holds one tree section (`maxSections: 1`). */
const root = (): ComponentNode => ({ id: "root", type: "section", props: {}, children: [{ id: "h", type: "heading", props: { text: "x" }, children: [] }] } as ComponentNode);
const only = (): SectionInstance => ({ id: "s1", sectionId: "custom-section", version: 1, props: {}, componentTree: [root()] });
const content = (): PageContent => ({ sections: [only()] });
const probe = (over: Partial<CanvasProbe> = {}): CanvasProbe => ({ sectionIndex: 1, overSectionId: null, images: [], slots: [], ...over });

function setup(maxSections?: number) {
  const store = createEditorStore({
    pages: [{ id: "section", slug: "section", isHome: true, name: { en: "S" }, seo: {}, showInNav: false, content: content(), version: 1 }],
    header: null,
    footer: null,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
    chromeVersion: 1,
    defaultLocale: "ar",
    maxSections,
  });
  const sections = () => store.getState().pages[0]!.content.sections;
  return { store, commands: createEditorCommands(store), sections };
}

describe("one-section host", () => {
  it("refuses drops that would add a second section with the oneSection reason", () => {
    const source = { content: content(), header: null, footer: null, maxSections: 1 };
    expect(planDrop({ kind: "section", sectionId: "custom-section" }, probe(), source)).toMatchObject({ kind: "invalid", reason: "oneSection" });
    expect(planDrop({ kind: "element", elementType: "paragraph" }, probe(), source)).toMatchObject({ kind: "invalid", reason: "oneSection" });
    // A normal page still takes a new section there.
    expect(planDrop({ kind: "section", sectionId: "custom-section" }, probe(), { ...source, maxSections: undefined })).toMatchObject({ kind: "insert-section" });
  });

  it("applies no new-section plan when the host is full", () => {
    let n = 0;
    const deps = {
      makeNodeId: () => `n${n++}`,
      makeSection: (sectionId: string) => ({ id: `x${n++}`, sectionId, version: 1, props: {} }) as SectionInstance,
      maxSections: 1,
    };
    expect(applyDropPlan(content(), { kind: "new-section", index: 1 }, { kind: "element", elementType: "paragraph" }, deps)).toBeNull();
  });

  it("puts a new element inside the one section root instead of a new section", () => {
    const { store, commands, sections } = setup(1);
    expect(commands.addElement("paragraph")).toBe(true);
    expect(sections()).toHaveLength(1);
    expect(sections()[0]!.componentTree![0]!.children.map((c) => c.type)).toEqual(["heading", "paragraph"]);
    expect(store.getState().selection).toMatchObject({ target: "page", sectionId: "s1" });
    // A whole section cannot be added.
    expect(commands.addSection(storeSectionRegistry.get("custom-section")!)).toBe(false);
    expect(sections()).toHaveLength(1);
  });

  it("keeps the normal behaviour without a limit", () => {
    const { commands, sections } = setup();
    commands.addSection(storeSectionRegistry.get("custom-section")!);
    expect(sections()).toHaveLength(2);
  });

  it("hides the Brand tab when the host does not save the design system", () => {
    const caps = { designSystem: false } as EditorCapabilities;
    expect(railEnabled("brand", caps)).toBe(false);
    expect(railEnabled("brand", { ...caps, designSystem: true })).toBe(true);
  });
});
