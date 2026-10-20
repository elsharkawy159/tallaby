/**
 * The admin template editor's mapping between a template's multi-page
 * `SiteConfig` and the website editor's state (spec 2026-10-20-admin-website-builder
 * §5.4, Task 15). Pure: the page builds the editor's initial state with
 * `siteConfigToEditorInitial`, and the adapter applies every editor save to
 * its working config with `applyEditorChange` before sending the whole
 * config as the template draft.
 *
 * Editor page ids are `page:<slug>`. A page keeps its editor id when its slug
 * changes (`pageIds` maps each editor id to the page's current slug).
 */
import { RESERVED_PAGE_SLUGS, MAX_PAGES, validateSiteConfig, type SiteConfig } from "@workspace/store-sections";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import type { TemplateMeta } from "@workspace/store-sections/templates";
import type { EditorInitial } from "@workspace/store-editor/editor.client";
import type { EditorErrorKey } from "@workspace/store-editor/editor.dto";
import { demoCatalogSnapshot } from "@/app/(builder)/sections/[id]/editor/section-editor.lib";

type Localized = { ar?: string; en?: string };
type EditorPageView = EditorInitial["pages"][number];

/** Editor page id → the page's current slug. */
export type TemplatePageIds = Record<string, string>;

/** What the adapter holds: the last saved config and its page id map. */
export type TemplateWorking = { config: SiteConfig; pageIds: TemplatePageIds };

export type TemplateEditorChange =
  | { kind: "page"; pageId: string; content: unknown }
  | { kind: "design"; designSystem: unknown }
  | { kind: "chrome"; part: "header" | "footer"; instance: unknown }
  | { kind: "pages"; op: "create"; name: Localized; slug: string }
  | { kind: "pages"; op: "update"; pageId: string; name?: Localized; slug?: string; seo?: unknown; showInNav?: boolean }
  | { kind: "pages"; op: "remove"; pageId: string }
  | { kind: "pages"; op: "reorder"; pageIds: string[] };

export type TemplateChangeError =
  | "not_found"
  | "home_page"
  | "slug_taken"
  | "invalid_slug"
  | "reserved_slug"
  | "too_many_pages"
  | "invalid_input"
  | "invalid_config";

export type TemplateChangeResult =
  | { ok: true; working: TemplateWorking; page: { id: string; slug: string } | null }
  | { ok: false; error: TemplateChangeError };

/** Change errors → the editor's message keys. */
export const TEMPLATE_CHANGE_ERRORS: Record<TemplateChangeError, EditorErrorKey> = {
  not_found: "notFound",
  home_page: "homePage",
  slug_taken: "slugTaken",
  invalid_slug: "invalidSlug",
  reserved_slug: "reservedSlug",
  too_many_pages: "tooManyPages",
  invalid_input: "invalidInput",
  invalid_config: "invalidContent",
};

const PAGE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED = storeSectionRegistry.allowedSections();

export const templatePageId = (slug: string) => `page:${slug}`;

/** The initial id map: every page as `page:<slug>`. */
export function templatePageIdsOf(config: SiteConfig): TemplatePageIds {
  return Object.fromEntries(config.pages.map((page) => [templatePageId(page.slug), page.slug]));
}

export function templateWorking(config: SiteConfig): TemplateWorking {
  return { config, pageIds: templatePageIdsOf(config) };
}

/** The editor's pages, chrome, design system, locales and the demo catalog for one template config. */
export function siteConfigToEditorInitial(
  config: SiteConfig,
  meta: TemplateMeta,
  draftVersion: number,
): Pick<EditorInitial, "pages" | "header" | "footer" | "designSystem" | "defaultLocale" | "locales" | "catalog"> {
  const pages: EditorPageView[] = config.pages.map((page) => {
    const names = meta.pageNames[page.slug];
    return {
      id: templatePageId(page.slug),
      slug: page.slug,
      isHome: page.isHome,
      name: { ar: names?.ar || page.name, en: names?.en || page.name },
      seo: (page.seo ?? {}) as Record<string, unknown>,
      showInNav: page.showInNav ?? true,
      content: page.content,
      version: draftVersion,
    };
  });
  return {
    pages,
    header: config.header,
    footer: config.footer,
    designSystem: config.designSystem,
    defaultLocale: config.settings.defaultLocale,
    locales: [...config.settings.locales],
    catalog: demoCatalogSnapshot(meta.demo),
  };
}

function checkSlug(slug: unknown): TemplateChangeError | null {
  if (typeof slug !== "string" || slug.length > 80 || !PAGE_SLUG_RE.test(slug)) return "invalid_slug";
  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) return "reserved_slug";
  return null;
}

const nameOf = (name: Localized | undefined) => (name?.ar?.trim() || name?.en?.trim() || "").slice(0, 80);

/** An editor id for a new page on `slug` that no other page uses (a renamed page keeps its old id). */
function freeId(ids: TemplatePageIds, slug: string): string {
  const base = templatePageId(slug);
  if (!(base in ids)) return base;
  let n = 2;
  while (`${base}:${n}` in ids) n += 1;
  return `${base}:${n}`;
}

/**
 * Applies one editor save to the working config and returns the new state
 * (never mutates `working`). The result always passes `validateSiteConfig`
 * (its sanitized output is the new config); anything else is refused.
 */
export function applyEditorChange(working: TemplateWorking, change: TemplateEditorChange): TemplateChangeResult {
  const config = structuredClone(working.config);
  const pageIds = { ...working.pageIds };
  const indexOf = (pageId: string) => {
    const slug = pageIds[pageId];
    return slug === undefined ? -1 : config.pages.findIndex((page) => page.slug === slug);
  };
  let created: { id: string; slug: string } | null = null;

  switch (change.kind) {
    case "page": {
      const index = indexOf(change.pageId);
      if (index < 0) return { ok: false, error: "not_found" };
      config.pages[index] = { ...config.pages[index]!, content: structuredClone(change.content) as SiteConfig["pages"][number]["content"] };
      break;
    }
    case "design":
      config.designSystem = structuredClone(change.designSystem) as SiteConfig["designSystem"];
      break;
    case "chrome":
      config[change.part] = (change.instance === undefined ? null : structuredClone(change.instance)) as SiteConfig["header"];
      break;
    case "pages": {
      if (change.op === "create") {
        const bad = checkSlug(change.slug);
        if (bad) return { ok: false, error: bad };
        if (config.pages.some((page) => page.slug === change.slug)) return { ok: false, error: "slug_taken" };
        if (config.pages.length >= MAX_PAGES) return { ok: false, error: "too_many_pages" };
        const name = nameOf(change.name);
        if (!name) return { ok: false, error: "invalid_input" };
        config.pages.push({ slug: change.slug, isHome: false, name, showInNav: true, seo: {}, content: { sections: [] } });
        created = { id: freeId(pageIds, change.slug), slug: change.slug };
        pageIds[created.id] = change.slug;
      } else if (change.op === "update") {
        const index = indexOf(change.pageId);
        if (index < 0) return { ok: false, error: "not_found" };
        const page = { ...config.pages[index]! };
        if (change.slug !== undefined && change.slug !== page.slug) {
          if (page.isHome) return { ok: false, error: "home_page" };
          const bad = checkSlug(change.slug);
          if (bad) return { ok: false, error: bad };
          if (config.pages.some((other) => other.slug === change.slug)) return { ok: false, error: "slug_taken" };
          page.slug = change.slug;
          pageIds[change.pageId] = change.slug;
        }
        if (change.name !== undefined) {
          const name = nameOf(change.name);
          if (!name) return { ok: false, error: "invalid_input" };
          page.name = name;
        }
        if (change.seo !== undefined) page.seo = structuredClone(change.seo) as typeof page.seo;
        if (change.showInNav !== undefined) page.showInNav = change.showInNav;
        config.pages[index] = page;
      } else if (change.op === "remove") {
        const index = indexOf(change.pageId);
        if (index < 0) return { ok: false, error: "not_found" };
        if (config.pages[index]!.isHome) return { ok: false, error: "home_page" };
        config.pages.splice(index, 1);
        delete pageIds[change.pageId];
      } else {
        const order = change.pageIds;
        if (!Array.isArray(order) || order.length !== config.pages.length || new Set(order).size !== order.length) {
          return { ok: false, error: "invalid_input" };
        }
        const indexes = order.map(indexOf);
        if (indexes.some((index) => index < 0)) return { ok: false, error: "invalid_input" };
        config.pages = indexes.map((index) => config.pages[index]!);
      }
      break;
    }
  }

  const result = validateSiteConfig(config, { allowedSections: ALLOWED });
  if (!result.success) return { ok: false, error: "invalid_config" };
  return { ok: true, working: { config: result.data, pageIds }, page: created };
}
