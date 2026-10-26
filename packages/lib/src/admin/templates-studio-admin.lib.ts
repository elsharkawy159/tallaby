// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// /**
//  * Pure parts of the admin template studio (spec 2026-10-20-admin-website-builder
//  * §5.4, Task 14): input schemas, the blank template config and the config
//  * check every template write goes through. No database here.
//  */
// import { z } from "zod";
// import { storeSectionRegistry } from "@workspace/store-sections/render";
// import { CURRENT_SITE_CONFIG_VERSION, validateSiteConfig, type SiteConfig } from "@workspace/store-sections";
// import { DEFAULT_TEMPLATE } from "@workspace/store-sections/templates";
//
// /** Same rule as the keys seeded and looked up elsewhere (template-rows.server.ts), at least 2 characters. */
// export const TEMPLATE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
//
// export const templateKeySchema = z.string().trim().min(2).max(63).regex(TEMPLATE_KEY_RE);
// const nameSchema = z.object({ ar: z.string().trim().min(1).max(80), en: z.string().trim().min(1).max(80) }).strict();
// const descriptionSchema = z.object({ ar: z.string().trim().max(300), en: z.string().trim().max(300) }).strict();
//
// export const templateCreateSchema = z
//   .object({
//     key: templateKeySchema,
//     name: nameSchema,
//     description: descriptionSchema,
//     category: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
//   })
//   .strict();
// export type TemplateCreateInput = z.output<typeof templateCreateSchema>;
//
// /** A new template's version 1: one empty home page, Classic's design system, no header or footer. */
// export function blankTemplateConfig(): SiteConfig {
//   return {
//     schemaVersion: CURRENT_SITE_CONFIG_VERSION,
//     designSystem: structuredClone(DEFAULT_TEMPLATE.config().designSystem),
//     header: null,
//     footer: null,
//     settings: { defaultLocale: "ar", locales: ["ar", "en"] },
//     pages: [{ slug: "home", isHome: true, name: "الرئيسية", showInNav: true, seo: {}, content: { sections: [] } }],
//   };
// }
//
// const ALLOWED = storeSectionRegistry.allowedSections();
//
// /** The validated (sanitized, migrated) form of an untrusted template config, or `{ ok: false }`. */
// export function prepareTemplateConfig(raw: unknown): { ok: true; config: SiteConfig } | { ok: false } {
//   const result = validateSiteConfig(raw, { allowedSections: ALLOWED });
//   return result.success ? { ok: true, config: result.data } : { ok: false };
// }
//
// // ---------------------------------------------------------------------------
// // Page names (both languages). A SiteConfig page has one `name`; the
// // localized names live in `templates.meta.pageNames` (what sellers and new
// // stores read). The studio keeps the working draft's names in
// // `meta.draftPageNames` (never read by sellers) and Publish turns them into
// // `meta.pageNames` in the same transaction.
// // ---------------------------------------------------------------------------
//
// export type TemplatePageNames = Record<string, { ar: string; en: string }>;
//
// const pageNameInput = z.object({ ar: z.string(), en: z.string() });
// const asRecord = (value: unknown): Record<string, unknown> =>
//   value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
//
// /**
//  * Untrusted page names → one entry per page of `pages` that has a valid
//  * `{ ar, en }` (trimmed, max 80; an empty side falls back to the page's
//  * name). Slugs not in `pages` are dropped.
//  */
// export function templatePageNamesFor(raw: unknown, pages: readonly { slug: string; name: string }[]): TemplatePageNames {
//   const input = asRecord(raw);
//   const names: TemplatePageNames = {};
//   for (const page of pages) {
//     if (!Object.hasOwn(input, page.slug)) continue;
//     const parsed = pageNameInput.safeParse(input[page.slug]);
//     if (!parsed.success) continue;
//     const clean = (value: string) => value.trim().slice(0, 80) || page.name;
//     names[page.slug] = { ar: clean(parsed.data.ar), en: clean(parsed.data.en) };
//   }
//   return names;
// }
//
// /**
//  * `meta.pageNames` after publishing `pages`, keyed by slug: the draft's names
//  * for a page, else the names it was published with, else its name in both
//  * languages. Slugs that are no longer pages are dropped.
//  */
// export function publishedPageNames(
//   previous: Readonly<Record<string, { ar: string; en: string }>>,
//   draft: Readonly<TemplatePageNames>,
//   pages: readonly { slug: string; name: string }[],
// ): TemplatePageNames {
//   const names: TemplatePageNames = {};
//   for (const page of pages) {
//     const own = (record: Readonly<Record<string, { ar: string; en: string }>>) => (Object.hasOwn(record, page.slug) ? record[page.slug] : undefined);
//     const chosen = own(draft) ?? own(previous);
//     names[page.slug] = chosen ? { ar: chosen.ar, en: chosen.en } : { ar: page.name, en: page.name };
//   }
//   return names;
// }
//
// /** `templates.meta` after Publish: `pageNames` from the published pages, no draft names. */
// export function publishedTemplateMeta(
//   rawMeta: unknown,
//   previousNames: Readonly<Record<string, { ar: string; en: string }>>,
//   pages: readonly { slug: string; name: string }[],
// ): Record<string, unknown> {
//   const { draftPageNames, ...rest } = asRecord(rawMeta);
//   return { ...rest, pageNames: publishedPageNames(previousNames, templatePageNamesFor(draftPageNames, pages), pages) };
// }
//
// /** `templates.meta` with the working draft's page names (or without any, for `null`). */
// export function withDraftPageNames(rawMeta: unknown, names: TemplatePageNames | null): Record<string, unknown> {
//   const { draftPageNames: _old, ...rest } = asRecord(rawMeta);
//   return names ? { ...rest, draftPageNames: names } : rest;
// }
//
// /** The names the studio opens with: the published names, overlaid by the draft's while there is a draft. */
// export function studioPageNames(
//   rawMeta: unknown,
//   publishedNames: Readonly<Record<string, { ar: string; en: string }>>,
//   pages: readonly { slug: string; name: string }[],
//   hasDraft: boolean,
// ): TemplatePageNames {
//   const published = Object.fromEntries(Object.entries(publishedNames).map(([slug, name]) => [slug, { ar: name.ar, en: name.en }]));
//   return hasDraft ? { ...published, ...templatePageNamesFor(asRecord(rawMeta).draftPageNames, pages) } : published;
// }
//
