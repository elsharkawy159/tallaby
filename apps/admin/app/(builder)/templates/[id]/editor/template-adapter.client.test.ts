import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/supabase/client", () => ({ createClient: () => ({ storage: { from: vi.fn(() => ({ uploadToSignedUrl: vi.fn(async () => ({ error: null })) })) } }) }));
vi.mock("@/lib/library-media.server", () => ({
  createLibraryUploadPath: vi.fn(async (mime: string) => ({ success: true, data: `library/x.${mime.split("/")[1]}` })),
  createLibrarySignedUpload: vi.fn(async (path: string) => ({ success: true, data: { path, token: "tok" } })),
  recordLibraryUpload: vi.fn(async () => ({ success: true, data: { url: "https://cdn/x.png" } })),
}));
let serverVersion = 3;
vi.mock("./template-editor.server", () => ({
  saveTemplateDraftAction: vi.fn(async (_id: string, _config: unknown, clientVersion: number) =>
    clientVersion === serverVersion ? { success: true, data: { draftVersion: ++serverVersion } } : { success: false, error: "versionConflict" },
  ),
  publishTemplateAction: vi.fn(async () => {
    serverVersion += 1;
    return { success: true, data: { revisionId: "v", revisionNumber: 4 } };
  }),
  listTemplateVersionsAction: vi.fn(async () => ({ success: true, data: [] })),
  restoreTemplateVersionAction: vi.fn(async () => ({ success: true, data: { pages: 1 } })),
}));

import { CURRENT_SITE_CONFIG_VERSION, type SiteConfig } from "@workspace/store-sections";
import { createTemplateAdapter, TEMPLATE_CAPABILITIES } from "./template-adapter.client";
import { publishTemplateAction, restoreTemplateVersionAction, saveTemplateDraftAction } from "./template-editor.server";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const catalog = { products: [], categories: [], forms: [], posts: [], brands: [], reviews: [], reviewStats: null, coupons: [], failed: [] };

function blank(): SiteConfig {
  return {
    schemaVersion: CURRENT_SITE_CONFIG_VERSION,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    header: null,
    footer: null,
    settings: { defaultLocale: "ar", locales: ["ar", "en"] },
    pages: [{ slug: "home", isHome: true, name: "الرئيسية", showInNav: true, seo: {}, content: { sections: [] } }],
  } as SiteConfig;
}

const make = (overrides: Partial<Parameters<typeof createTemplateAdapter>[0]> = {}) =>
  createTemplateAdapter({ templateId: ID, reason: "refresh hero", config: blank(), draftVersion: 3, catalog, askChangelog: async () => "", onRestored: vi.fn(), ...overrides });

const lastConfig = () => vi.mocked(saveTemplateDraftAction).mock.calls.at(-1)![1] as SiteConfig;

describe("template adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serverVersion = 3;
  });

  it("has the template-editing capabilities", () => {
    expect(TEMPLATE_CAPABILITIES).toEqual({
      pages: true,
      templates: false,
      forms: false,
      explore: false,
      mediaLibrary: false,
      revisions: true,
      unpublish: false,
      preview: false,
      industrySwitcher: false,
      designSystem: true,
      publishLabel: "templateVersion",
    });
    const adapter = make();
    expect(adapter.links).toMatchObject({ back: "/templates", design: null, settings: null, manageForms: null, dataActions: false });
    expect(adapter.pages).toBeDefined();
    expect(adapter.revisions).toBeDefined();
    expect(adapter.templates).toBeUndefined();
    expect(adapter.forms).toBeUndefined();
  });

  it("saves every change as the whole config and tracks the draft version itself", async () => {
    const adapter = make();
    const content = { sections: [], elementStyles: { a: { color: "red" } } };
    expect(await adapter.saveDraft("page:home", content, 99)).toEqual({ success: true, data: { draftVersion: 4 } });
    expect(saveTemplateDraftAction).toHaveBeenLastCalledWith(ID, expect.anything(), 3, { home: { ar: "الرئيسية", en: "الرئيسية" } });
    expect(lastConfig().pages[0]!.content).toEqual(content);

    const designSystem = { colors: { primary: "#112233" }, typography: {}, spacing: {} };
    expect(await adapter.saveDesignSystem(designSystem, 1)).toEqual({ success: true, data: { version: 5 } });
    expect(lastConfig().designSystem.colors.primary).toBe("#112233");
    // The earlier page edit is kept in the working config.
    expect(lastConfig().pages[0]!.content).toEqual(content);
  });

  it("creates pages and keeps a renamed page addressable", async () => {
    const adapter = make();
    expect(await adapter.pages!.create({ name: { ar: "عنا" }, slug: "about" })).toEqual({ success: true, data: { id: "page:about", slug: "about" } });
    expect(await adapter.pages!.update("page:about", { slug: "about-us" })).toEqual({ success: true, data: null });
    await adapter.saveDraft("page:about", { sections: [] }, 1);
    expect(lastConfig().pages.map((p) => p.slug)).toEqual(["home", "about-us"]);
    expect(await adapter.pages!.remove("page:home")).toEqual({ success: false, error: "homePage" });
    expect(await adapter.pages!.create({ name: { ar: "x" }, slug: "about-us" })).toEqual({ success: false, error: "slugTaken" });
  });

  it("serializes concurrent saves so they do not conflict with each other", async () => {
    const adapter = make();
    const results = await Promise.all([
      adapter.saveDraft("page:home", { sections: [] }, 1),
      adapter.saveChrome("header", null, 1),
      adapter.saveDesignSystem({ colors: {}, typography: {}, spacing: {} }, 1),
    ]);
    expect(results.every((r) => r.success)).toBe(true);
    expect(vi.mocked(saveTemplateDraftAction).mock.calls.map((call) => call[2])).toEqual([3, 4, 5]);
  });

  it("stops on a conflict from another admin and keeps the working config", async () => {
    const adapter = make();
    serverVersion = 10;
    expect(await adapter.saveDraft("page:home", { sections: [] }, 1)).toEqual({ success: false, error: "versionConflict" });
  });

  it("publishes with the changelog and session reason, and the next save uses the bumped draft version", async () => {
    const adapter = make({ askChangelog: async () => "New hero" });
    await adapter.saveDraft("page:home", { sections: [] }, 1);
    expect(await adapter.publish()).toEqual({ success: true, data: { revisionId: "v", revisionNumber: 4 } });
    expect(publishTemplateAction).toHaveBeenCalledWith(ID, "New hero", "refresh hero");
    expect(await adapter.saveDraft("page:home", { sections: [] }, 1)).toEqual({ success: true, data: { draftVersion: 6 } });
  });

  it("does not publish when the changelog dialog is cancelled", async () => {
    const adapter = make({ askChangelog: async () => null });
    expect(await adapter.publish()).toEqual({ success: false, error: "cancelled" });
    expect(publishTemplateAction).not.toHaveBeenCalled();
  });

  it("restores a version into the draft with the reason and reloads", async () => {
    const onRestored = vi.fn();
    const adapter = make({ onRestored });
    expect(await adapter.revisions!.restore("ver")).toEqual({ success: true, data: { pages: 1 } });
    expect(restoreTemplateVersionAction).toHaveBeenCalledWith(ID, "ver", "refresh hero");
    expect(onRestored).toHaveBeenCalledTimes(1);
    expect(await adapter.revisions!.discard()).toEqual({ success: false, error: "notFound" });
  });

  it("is upload-only for media", async () => {
    const adapter = make();
    expect(await adapter.media.list()).toEqual({ success: false, error: "notFound" });
    expect(await adapter.media.createUploadPaths({ shared: false, types: ["image/png"] })).toEqual({ success: true, data: ["library/x.png"] });
  });
});
