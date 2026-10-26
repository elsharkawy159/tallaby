// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// /**
//  * The admin template screen's section changes (owner, 2026-10-26): a
//  * template is a list of library sections per page plus its header, footer,
//  * design system and pages. The admin fills each section's values
//  * (`libraryRef.props`), adds a library section, removes or moves one, and
//  * swaps the header or footer; never edits a tree. Pure: every change gives a
//  * new working state (never mutates) that passes `validateSiteConfig`, like
//  * `applyEditorChange` (design system and pages) in `template-adapter.lib.ts`.
//  */
// import { validateSiteConfig, type SectionInstance, type SiteConfig } from "@workspace/store-sections";
// import { storeSectionRegistry } from "@workspace/store-sections/render";
// import { templatePageNamesOf, type TemplateChangeResult, type TemplateWorking } from "./template-adapter.lib";
//
// /** A template value (`libraryRef.props[key]`): copy in both languages or one string, a number, a switch, or `null` (removed). */
// export type TemplateFieldValue = string | number | boolean | null | { ar: string; en: string };
// export type TemplateFieldValues = Record<string, TemplateFieldValue>;
//
// /** Where a section is: the header, the footer, or a page (by slug). */
// export type SectionSlot = { part: "header" | "footer" } | { page: string };
//
// export type TemplateSectionChange =
//   | { kind: "section-props"; slot: SectionSlot; sectionId: string; props: TemplateFieldValues }
//   | { kind: "section-add"; page: string; key: string; category: string; index: number }
//   | { kind: "section-remove"; page: string; sectionId: string }
//   | { kind: "section-move"; page: string; sectionId: string; index: number }
//   | { kind: "chrome-set"; part: "header" | "footer"; key: string; category: string };
//
// const ALLOWED = storeSectionRegistry.allowedSections();
// const KEY_RE = /^[a-z0-9-]{1,100}$/;
//
// /** Library categories a page can take: product-page sections only on the product page, chrome never. */
// export function categoryFits(category: string, target: { part: "header" | "footer" } | { productPage: boolean }): boolean {
//   if ("part" in target) return category === (target.part === "header" ? "headers" : "footers");
//   if (category === "headers" || category === "footers") return false;
//   return target.productPage ? category === "product-page" : category !== "product-page";
// }
//
// /** A new section id from the library key: unique in the config, at most 64 characters. */
// export function newSectionId(key: string, taken: ReadonlySet<string>, random: () => string = () => Math.random().toString(36).slice(2, 8)): string {
//   const base = key.slice(0, 50);
//   for (;;) {
//     const id = `${base}-${random()}`.replace(/[^A-Za-z0-9_:-]/g, "");
//     if (!taken.has(id)) return id;
//   }
// }
//
// /** A library ref section with no values yet. */
// export function librarySection(key: string, id: string): SectionInstance {
//   return { id, sectionId: "custom-section", version: 1, props: {}, source: `${key}@1`, libraryRef: { key } } as SectionInstance;
// }
//
// const sectionIds = (config: SiteConfig) =>
//   new Set([config.header, config.footer, ...config.pages.flatMap((page) => page.content.sections)].filter((s) => s !== null).map((s) => s.id));
//
// /** Applies one section change; the result passes `validateSiteConfig` or is refused. */
// export function applySectionChange(working: TemplateWorking, change: TemplateSectionChange, random?: () => string): TemplateChangeResult {
//   const config = structuredClone(working.config);
//   const pageOf = (slug: string) => config.pages.find((page) => page.slug === slug);
//
//   switch (change.kind) {
//     case "section-props": {
//       const list = "part" in change.slot ? null : pageOf(change.slot.page)?.content.sections;
//       const section = "part" in change.slot ? config[change.slot.part] : list?.find((s) => s.id === change.sectionId);
//       if (!section || section.id !== change.sectionId) return { ok: false, error: "not_found" };
//       const ref = section.libraryRef;
//       if (!ref || ref.patch) return { ok: false, error: "invalid_input" };
//       const props = structuredClone(change.props);
//       const { props: _old, ...rest } = ref;
//       section.libraryRef = Object.keys(props).length ? { ...rest, props } : rest;
//       break;
//     }
//     case "section-add": {
//       const page = pageOf(change.page);
//       if (!page) return { ok: false, error: "not_found" };
//       if (!KEY_RE.test(change.key) || !categoryFits(change.category, { productPage: page.kind === "product" })) return { ok: false, error: "invalid_input" };
//       const index = Math.max(0, Math.min(Math.trunc(change.index), page.content.sections.length));
//       page.content.sections.splice(index, 0, librarySection(change.key, newSectionId(change.key, sectionIds(config), random)));
//       break;
//     }
//     case "section-remove": {
//       const page = pageOf(change.page);
//       const index = page?.content.sections.findIndex((s) => s.id === change.sectionId) ?? -1;
//       if (!page || index < 0) return { ok: false, error: "not_found" };
//       page.content.sections.splice(index, 1);
//       break;
//     }
//     case "section-move": {
//       const page = pageOf(change.page);
//       const from = page?.content.sections.findIndex((s) => s.id === change.sectionId) ?? -1;
//       if (!page || from < 0) return { ok: false, error: "not_found" };
//       const to = Math.max(0, Math.min(Math.trunc(change.index), page.content.sections.length - 1));
//       const [moved] = page.content.sections.splice(from, 1);
//       page.content.sections.splice(to, 0, moved!);
//       break;
//     }
//     case "chrome-set": {
//       if (!KEY_RE.test(change.key) || !categoryFits(change.category, { part: change.part })) return { ok: false, error: "invalid_input" };
//       const taken = sectionIds(config);
//       const current = config[change.part];
//       if (current) taken.delete(current.id);
//       config[change.part] = librarySection(change.key, newSectionId(change.key, taken, random));
//       break;
//     }
//   }
//
//   const result = validateSiteConfig(config, { allowedSections: ALLOWED });
//   if (!result.success) return { ok: false, error: "invalid_config" };
//   return { ok: true, working: { ...working, config: result.data, pageNames: templatePageNamesOf(result.data, working.pageNames) }, page: null };
// }
//
// /** The value as the form shows it in one language (a plain string is both). */
// export function fieldText(value: TemplateFieldValue | undefined, locale: "ar" | "en"): string | undefined {
//   if (value === undefined || value === null) return undefined;
//   if (typeof value === "object") return value[locale];
//   return String(value);
// }
//
// /** One language of a copy value changed; the other kept (from the value, else the library's copy). */
// export function withFieldText(
//   value: TemplateFieldValue | undefined,
//   locale: "ar" | "en",
//   text: string,
//   original: { ar: string; en: string } | null,
// ): TemplateFieldValue {
//   const current = typeof value === "object" && value !== null ? value : typeof value === "string" ? { ar: value, en: value } : (original ?? { ar: "", en: "" });
//   return { ...current, [locale]: text };
// }
//
