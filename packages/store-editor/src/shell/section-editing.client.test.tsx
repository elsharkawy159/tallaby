import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { EditorAdapterProvider } from "../adapter.client";
import type { EditorAdapter, EditorCapabilities } from "../adapter.types";
import { MediaPicker } from "../media/media-picker.client";
import en from "../messages/en.json";
import { createEditorStore } from "../state/editor.store";
import { EditorTopbar } from "./editor-topbar.client";

const SELLER: EditorCapabilities = {
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

const SECTION: EditorCapabilities = {
  pages: false,
  templates: false,
  forms: false,
  explore: false,
  mediaLibrary: false,
  revisions: false,
  unpublish: false,
  preview: false,
  industrySwitcher: true,
  designSystem: false,
  publishLabel: "section",
};

const newStore = () =>
  createEditorStore({
    pages: [{ id: "section", slug: "section", isHome: true, name: { en: "Hero" }, seo: {}, showInNav: false, content: { sections: [] }, version: 3 }],
    header: null,
    footer: null,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    designVersion: 1,
    chromeVersion: 1,
    defaultLocale: "ar",
    industry: undefined,
  });

function render(capabilities: EditorCapabilities, node: React.ReactNode): string {
  const adapter = { capabilities, links: { back: "/sections" } } as unknown as EditorAdapter;
  return renderToString(
    <NextIntlClientProvider locale="en" messages={en} timeZone="Africa/Cairo">
      <EditorAdapterProvider adapter={adapter}>{node}</EditorAdapterProvider>
    </NextIntlClientProvider>,
  );
}

function topbar(capabilities: EditorCapabilities) {
  const store = newStore();
  return render(
    capabilities,
    <EditorTopbar
      store={store}
      storeId="s1"
      storeUrl="https://shop.tallaby.com"
      locales={["ar", "en"]}
      uiLocale="en"
      saveStatus="saved"
      onRetrySave={() => {}}
      previewEnabled={false}
      preview={{ open: () => {}, opening: false }}
      readOnly={false}
      publishing={false}
      isLive
      hasChanges
      onPublish={() => {}}
      onShowShortcuts={() => {}}
    />,
  );
}

describe("media picker", () => {
  it("is the library picker for a host with a media library (seller, unchanged)", () => {
    const html = render(SELLER, <MediaPicker onPick={() => {}} />);
    expect(html).toContain(en.mediaLibrary.chooseFromLibrary);
    expect(html).not.toContain(en.mediaLibrary.uploadImage);
  });

  it("is upload-only when the host has no media library", () => {
    const html = render(SECTION, <MediaPicker onPick={() => {}} />);
    expect(html).toContain(en.mediaLibrary.uploadImage);
    expect(html).not.toContain(en.mediaLibrary.chooseFromLibrary);
  });
});

describe("top bar for section editing", () => {
  it("shows the industry preview switcher and the section publish label, and no store links", () => {
    const html = topbar(SECTION);
    expect(html).toContain(`aria-label="${en.storeEditor.industryPreview.label}"`);
    expect(html).toContain(en.storeEditor.industryPreview.general);
    expect(html).toContain(en.storeEditor.publishSection);
    expect(html).not.toContain("shop.tallaby.com");
  });

  it("keeps the seller top bar as before", () => {
    const html = topbar(SELLER);
    expect(html).not.toContain(en.storeEditor.industryPreview.label);
    expect(html).toContain(en.storeEditor.publishChanges);
    expect(html).toContain("shop.tallaby.com");
  });

  it("switching the industry changes only the preview state, never the drafts", () => {
    const store = newStore();
    const before = store.getState();
    store.getState().setIndustry("fashion");
    const after = store.getState();
    expect(after.industry).toBe("fashion");
    expect(after.pages).toBe(before.pages);
    expect(after.dirtyPages).toEqual({});
    expect(after.past).toHaveLength(0);
    expect(after.saveStatus).toBe(before.saveStatus);
  });
});
