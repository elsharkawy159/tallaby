import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { EditorAdapterProvider } from "../adapter.client";
import type { EditorAdapter, EditorCapabilities } from "../adapter.types";
import en from "../messages/en.json";
import { createEditorStore } from "../state/editor.store";
import { addTabs, mediaTabs, railEnabled } from "./capabilities.lib";
import { EditorRail } from "./editor-rail.client";

const ALL: EditorCapabilities = {
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
};

const SECTION_EDITING: EditorCapabilities = { ...ALL, pages: false, forms: false, templates: false };

const LABELS = en.storeEditor.rail;

function renderRail(capabilities: EditorCapabilities): string {
  const adapter = { capabilities } as unknown as EditorAdapter;
  const store = createEditorStore({
    pages: [{ id: "home", slug: "", isHome: true, name: { en: "Home" }, seo: {}, showInNav: true, content: { sections: [] }, version: 1 }],
    header: null,
    footer: null,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
    chromeVersion: 1,
    defaultLocale: "en",
    industry: undefined,
  });
  return renderToString(
    <NextIntlClientProvider locale="en" messages={en}>
      <EditorAdapterProvider adapter={adapter}>
        <EditorRail store={store} panelOpen onToggle={() => {}} />
      </EditorAdapterProvider>
    </NextIntlClientProvider>,
  );
}

describe("EditorRail capabilities", () => {
  it("shows every tab when the host supports everything", () => {
    const html = renderRail(ALL);
    for (const key of ["add", "layers", "media", "forms", "pages", "brand"] as const) expect(html).toContain(`>${LABELS[key]}<`);
  });

  it("hides Pages and Forms when the host has neither", () => {
    const html = renderRail(SECTION_EDITING);
    expect(html).not.toContain(`>${LABELS.pages}<`);
    expect(html).not.toContain(`>${LABELS.forms}<`);
    for (const key of ["add", "layers", "media", "brand"] as const) expect(html).toContain(`>${LABELS[key]}<`);
  });

  it("maps the other capabilities to their tabs", () => {
    // Media holds the library and Explore: shown while the host has either.
    expect(railEnabled("media", { ...ALL, explore: false })).toBe(true);
    expect(railEnabled("media", { ...ALL, mediaLibrary: false })).toBe(true);
    expect(railEnabled("media", { ...ALL, mediaLibrary: false, explore: false })).toBe(false);
    expect(railEnabled("brand", SECTION_EDITING)).toBe(true);
  });
});

describe("Media panel tabs", () => {
  it("offers the library and Explore, each where the host has it", () => {
    expect(mediaTabs(ALL)).toEqual(["library", "explore"]);
    expect(mediaTabs({ ...ALL, explore: false })).toEqual(["library"]);
    expect(mediaTabs({ ...ALL, mediaLibrary: false })).toEqual(["explore"]);
  });

  it("has no separate Explore rail tab", () => {
    expect(renderRail(ALL)).not.toContain(">Explore<");
  });
});

describe("Add panel tabs", () => {
  it("shows Templates only when the host has templates", () => {
    expect(addTabs(ALL)).toEqual(["elements", "sections", "templates"]);
    expect(addTabs(SECTION_EDITING)).toEqual(["elements", "sections"]);
  });
});
