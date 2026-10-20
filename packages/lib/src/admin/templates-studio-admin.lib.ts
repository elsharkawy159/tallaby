/**
 * Pure parts of the admin template studio (spec 2026-10-20-admin-website-builder
 * §5.4, Task 14): input schemas, the blank template config and the config
 * check every template write goes through. No database here.
 */
import { z } from "zod";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import { CURRENT_SITE_CONFIG_VERSION, validateSiteConfig, type SiteConfig } from "@workspace/store-sections";
import { DEFAULT_TEMPLATE } from "@workspace/store-sections/templates";

/** Same rule as the keys seeded and looked up elsewhere (template-rows.server.ts), at least 2 characters. */
export const TEMPLATE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export const templateKeySchema = z.string().trim().min(2).max(63).regex(TEMPLATE_KEY_RE);
const nameSchema = z.object({ ar: z.string().trim().min(1).max(80), en: z.string().trim().min(1).max(80) }).strict();
const descriptionSchema = z.object({ ar: z.string().trim().max(300), en: z.string().trim().max(300) }).strict();

export const templateCreateSchema = z
  .object({
    key: templateKeySchema,
    name: nameSchema,
    description: descriptionSchema,
    category: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
  })
  .strict();
export type TemplateCreateInput = z.output<typeof templateCreateSchema>;

/** A new template's version 1: one empty home page, Classic's design system, no header or footer. */
export function blankTemplateConfig(): SiteConfig {
  return {
    schemaVersion: CURRENT_SITE_CONFIG_VERSION,
    designSystem: structuredClone(DEFAULT_TEMPLATE.config().designSystem),
    header: null,
    footer: null,
    settings: { defaultLocale: "ar", locales: ["ar", "en"] },
    pages: [{ slug: "home", isHome: true, name: "الرئيسية", showInNav: true, seo: {}, content: { sections: [] } }],
  };
}

const ALLOWED = storeSectionRegistry.allowedSections();

/** The validated (sanitized, migrated) form of an untrusted template config, or `{ ok: false }`. */
export function prepareTemplateConfig(raw: unknown): { ok: true; config: SiteConfig } | { ok: false } {
  const result = validateSiteConfig(raw, { allowedSections: ALLOWED });
  return result.success ? { ok: true, config: result.data } : { ok: false };
}
