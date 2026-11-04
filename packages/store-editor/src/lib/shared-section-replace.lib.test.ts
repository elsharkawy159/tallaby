import { describe, expect, it } from "vitest";
import { SECTION_PRESETS, getPreset, storeSectionRegistry, type SectionPreset } from "@workspace/store-sections/render";
import { validatePageContent, type SectionInstance } from "@workspace/store-sections";
import { planDrop } from "../dnd/drop-plan.lib";
import type { CanvasPayload, CanvasProbe } from "../dnd/dnd.types";
import { createEditorStore } from "../state/editor.store";
import { saveDirtyChrome } from "../state/chrome-save.lib";
import { createEditorCommands } from "./editor-commands.lib";
import { chromeFromPreset, presetChromePart } from "./editor-library.lib";

const HEADER = "headers.inline";
const FOOTER = "footers.line";
const OTHER_HEADER = "headers.pill";
const NOT_SHARED = "statistics.classic";

const preset = (id: string): SectionPreset => {
  const found = getPreset(id);
  if (!found) throw new Error(`No preset ${id}`);
  return found;
};
const payload = (id: string): CanvasPayload => ({ kind: "section", sectionId: preset(id).sectionId, presetId: id });
const currentChrome = (id: string, marker: string, props: Record<string, unknown> = {}): SectionInstance => ({
  id,
  sectionId: "custom-section",
  version: 1,
  props,
  componentTree: [{ id: `${id}-root`, type: "section", props: { label: marker }, children: [] }],
});

function setup(opts: { maxSections?: number; defaultLocale?: "ar" | "en"; storeName?: string } = {}) {
  const body: SectionInstance = { id: "body", sectionId: "custom-section", version: 1, props: {}, componentTree: [{ id: "b", type: "section", props: {}, children: [] }] };
  const store = createEditorStore({
    pages: [{ id: "p1", slug: "", isHome: true, name: { ar: "الرئيسية" }, seo: {}, showInNav: true, content: { sections: [body] }, version: 1 }],
    header: currentChrome("hdr-old", "old header", { languageSwitcher: false, account: true }),
    footer: currentChrome("ftr-old", "old footer"),
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
    chromeVersion: 7,
    defaultLocale: opts.defaultLocale ?? "ar",
    maxSections: opts.maxSections,
    storeName: opts.storeName,
  });
  const sections = () => store.getState().pages[0]!.content.sections;
  return { store, commands: createEditorCommands(store), sections };
}

/** Everywhere a drop can land: over the page, over a section, at both ends. */
const probes: CanvasProbe[] = [
  { sectionIndex: 0, overSectionId: null, images: [], slots: [] },
  { sectionIndex: 1, overSectionId: null, images: [], slots: [] },
  { sectionIndex: 0, overSectionId: "body", images: [], slots: [{ parentId: "b", beforeId: null }] },
];

describe("Header and footer designs in Add > Sections", () => {
  it("knows every header and footer design, and nothing else, as a shared section", () => {
    for (const p of SECTION_PRESETS) {
      expect(presetChromePart(p), p.id).toBe(p.category === "headers" ? "header" : p.category === "footers" ? "footer" : null);
    }
    expect(SECTION_PRESETS.filter((p) => presetChromePart(p) === "header").length).toBeGreaterThan(1);
    expect(SECTION_PRESETS.filter((p) => presetChromePart(p) === "footer").length).toBeGreaterThan(1);
  });

  describe.each([
    ["header", HEADER, "header-inline@1"],
    ["footer", FOOTER, "footer-line@1"],
  ] as const)("%s", (part, id, source) => {
    const other = part === "header" ? "footer" : "header";

    it("a click replaces the current one and leaves the page alone", () => {
      const { store, commands, sections } = setup();
      const pageBefore = store.getState().pages;
      const otherBefore = store.getState()[other];
      expect(commands.addLibraryPreset(preset(id))).toBe("chrome");
      expect(store.getState()[part]!.source).toBe(source);
      expect(store.getState().pages).toBe(pageBefore);
      expect(sections()).toHaveLength(1);
      expect(store.getState()[other]).toBe(otherBefore);
      expect(store.getState().selection).toEqual({ target: part });
    });

    it.each(probes.map((p, i) => [i, p] as const))("a drop replaces the current one wherever it lands (%i)", (_i, probe) => {
      const { store, commands, sections } = setup();
      const s = store.getState();
      const plan = planDrop(payload(id), probe, { content: s.pages[0]!.content, header: s.header, footer: s.footer, presets: s.presets });
      expect(plan).toEqual({ kind: "replace-chrome", part });
      expect(commands.applyDrop(payload(id), plan!)).toBe(true);
      expect(store.getState()[part]!.source).toBe(source);
      expect(sections().map((x) => x.id)).toEqual(["body"]);
      expect(store.getState().selection).toEqual({ target: part });
    });

    it("is planned even when the page is full (no section is added)", () => {
      const { store } = setup({ maxSections: 1 });
      const s = store.getState();
      expect(planDrop(payload(id), probes[0]!, { content: s.pages[0]!.content, header: s.header, footer: s.footer, maxSections: 1 })).toEqual({ kind: "replace-chrome", part });
    });

    it("is one undo step, marks only the draft dirty and saves through the chrome path", async () => {
      const { store, commands } = setup();
      const before = store.getState()[part];
      const steps = store.getState().past.length;
      commands.addLibraryPreset(preset(id));
      expect(store.getState().past.length).toBe(steps + 1);
      expect(store.getState().dirtyChrome).toEqual({ [part]: true });
      expect(store.getState().dirtyPages).toEqual({});
      expect(store.getState().saveStatus).toBe("unsaved");

      const calls: unknown[][] = [];
      const adapter = {
        saveChrome: async (...args: unknown[]) => {
          calls.push(args);
          return { success: true as const, data: { version: 8 } };
        },
      };
      await expect(saveDirtyChrome(store, adapter as never)).resolves.toBe("ok");
      expect(calls).toEqual([[part, store.getState()[part], 7]]);
      expect(store.getState().chromeVersion).toBe(8);

      store.getState().undo();
      expect(store.getState()[part]).toBe(before);
      expect(store.getState().dirtyChrome).toEqual({ [part]: true });
      store.getState().redo();
      expect(store.getState()[part]!.source).toBe(source);
    });

    it("fills in a header or footer the store removed", () => {
      const { store, commands } = setup();
      store.getState().editChrome(part, null);
      expect(commands.addLibraryPreset(preset(id))).toBe("chrome");
      expect(store.getState()[part]!.source).toBe(source);
    });
  });

  it("replacing twice still leaves exactly one header", () => {
    const { store, commands, sections } = setup();
    commands.addLibraryPreset(preset(HEADER));
    commands.addLibraryPreset(preset(OTHER_HEADER));
    expect(store.getState().header!.source).toMatch(/^header-pill@/);
    expect(sections()).toHaveLength(1);
  });

  it("keeps the seller's header options and the instance id", () => {
    const { store, commands } = setup();
    commands.addLibraryPreset(preset(HEADER));
    expect(store.getState().header!.props).toEqual({ languageSwitcher: false, account: true });
    expect(store.getState().header!.id).toBe("hdr-old");
  });

  it("does not carry the old design's other props over", () => {
    const next = chromeFromPreset(currentChrome("h", "x", { stale: 1, logo: false }), preset(HEADER), "hdr");
    expect(next!.props).toEqual({ logo: false });
  });

  it("uses the store's name and default language, never the design's placeholder", () => {
    const { store, commands } = setup({ storeName: "متجر $& نور" });
    commands.addLibraryPreset(preset(FOOTER));
    const ar = JSON.stringify(store.getState().footer!.componentTree);
    expect(ar).toContain("متجر $& نور");
    expect(ar).not.toContain("اسم متجرك");
    expect(ar).not.toContain("Your store");

    const en = setup({ storeName: "Noor", defaultLocale: "en" });
    en.commands.addLibraryPreset(preset(HEADER));
    const tree = JSON.stringify(en.store.getState().header!.componentTree);
    expect(tree).toContain('"text":"Home"');
    expect(tree).toContain("Noor");
    expect(tree).not.toContain("Your store");
  });

  it("every header and footer design passes the validation the draft save runs, with no placeholder left", () => {
    const allowed = storeSectionRegistry.allowedSections();
    for (const p of SECTION_PRESETS.filter((x) => presetChromePart(x))) {
      const next = chromeFromPreset(null, p, "hdr", { storeName: "Noor" })!;
      const validated = validatePageContent({ sections: [next] }, { allowedSections: allowed });
      expect(validated.success, p.id).toBe(true);
      const text = JSON.stringify(next.componentTree);
      expect(text, p.id).not.toContain("اسم متجرك");
      expect(text, p.id).not.toContain("Your store");
    }
  });
});

describe("sections that are not shared keep their behaviour", () => {
  it("a click still inserts after the selection and leaves the header and footer alone", () => {
    const { store, commands, sections } = setup();
    const { header, footer } = store.getState();
    store.getState().select({ target: "page", sectionId: "body" });
    expect(commands.addLibraryPreset(preset(NOT_SHARED))).toBe("inserted");
    expect(sections()).toHaveLength(2);
    expect(sections()[0]!.id).toBe("body");
    expect(store.getState().header).toBe(header);
    expect(store.getState().footer).toBe(footer);
    expect(store.getState().dirtyChrome).toEqual({});
  });

  it("a drop still inserts at the pointer, and is refused when a one-section host is full", () => {
    const { store, commands, sections } = setup();
    const s = store.getState();
    const source = { content: s.pages[0]!.content, header: s.header, footer: s.footer };
    const plan = planDrop(payload(NOT_SHARED), probes[0]!, source);
    expect(plan).toEqual({ kind: "insert-section", index: 0 });
    expect(commands.applyDrop(payload(NOT_SHARED), plan!)).toBe(true);
    expect(sections()).toHaveLength(2);
    expect(sections()[1]!.id).toBe("body");
    expect(planDrop(payload(NOT_SHARED), probes[0]!, { ...source, maxSections: 1 })).toMatchObject({ kind: "invalid", reason: "oneSection" });
  });

  it("a stale chrome plan for another part writes nothing", () => {
    const { store, commands } = setup();
    const before = store.getState().past.length;
    expect(commands.applyDrop(payload(HEADER), { kind: "replace-chrome", part: "footer" })).toBe(false);
    expect(commands.applyDrop(payload(NOT_SHARED), { kind: "replace-chrome", part: "header" })).toBe(false);
    expect(store.getState().past.length).toBe(before);
  });
});
