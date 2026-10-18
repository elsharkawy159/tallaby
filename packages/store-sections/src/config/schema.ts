/**
 * SiteConfig v1: the versioned JSON shape of a store website (PLAN.md §3 item 8,
 * §12, P1-01). Stored in `store_pages` drafts, `store_site_revisions` snapshots
 * and `template_versions`. The section and node shapes mirror the Valorcy
 * reference (`components/sections/registry.types.ts`,
 * `lib/builder/component-node.ts`) so ported editor code reads them unchanged.
 *
 * No React here: the dashboard and ecommerce apps both import this.
 */
import { z } from "zod";
import { isHttpOrRelativeUrl } from "./url";

export const SITE_CONFIG_VERSION = 1 as const;

export const SUPPORTED_LOCALES = ["ar", "en"] as const;
export type SiteLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Free-form node types the builder may store. The reference list minus
 * `customCode` (seller HTML/JS, never allowed: CLAUDE.md rule 9) and `map`
 * (renders a third-party iframe).
 */
export const ALLOWED_NODE_TYPES = [
  "div", "section", "article", "main", "header", "footer", "nav", "aside", "span",
  "stack", "flex", "card", "button", "text", "heading", "image", "icon", "link",
  "container", "quickStack", "vFlex", "hFlex", "grid", "pageSlot", "list", "listItem",
  "linkBlock", "paragraph", "textLink", "blockQuote", "richText", "video", "form",
  "label", "input", "textarea", "colorInput", "radio", "select", "checkbox", "search",
  "tabs", "dropdown",
  "shadcn-accordion", "shadcn-carousel", "shadcn-calendar", "shadcn-dialog",
  "shadcn-badge", "shadcn-card", "shadcn-tabs", "shadcn-alert", "shadcn-avatar",
  "shadcn-progress", "shadcn-tooltip",
  // Custom-section elements (P4B-01); additive, schema version unchanged.
  "divider", "spacer", "badge",
] as const;
export type AllowedNodeType = (typeof ALLOWED_NODE_TYPES)[number];

/** Page slugs that would shadow storefront routes (`apps/ecommerce/lib/storefront-routing.ts`). */
export const RESERVED_PAGE_SLUGS = [
  "products", "product", "cart", "checkout", "auth", "login", "signup", "orders",
  "profile", "payment", "api", "storefront", "search", "sitemap", "robots", "_next",
  // Store blog routes (/blog, /blog/[slug], P4-16).
  "blog",
] as const;

export const MAX_PAGES = 50;
export const MAX_SECTIONS_PER_PAGE = 80;
export const MAX_NODES_PER_LIST = 200;

const ELEMENT_TAGS = [
  "div", "section", "article", "header", "footer", "nav", "aside", "main",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "ul", "ol", "li",
] as const;

const idSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_:-]+$/);
const looseRecord = z.record(z.string(), z.unknown());
const styleSchema = looseRecord;

// Colors end up in CSS custom properties, so only accept plain color syntax.
const COLOR_RE =
  /^(?:#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|(?:rgba?|hsla?|oklch|oklab)\([0-9.,%\s/+-]+\))$/i;
const colorSchema = z.string().trim().max(64).regex(COLOR_RE, "invalid_color");

// Font names end up in `font-family`; no quotes, semicolons or braces.
const fontSchema = z.string().trim().min(1).max(60).regex(/^[\p{L}\p{N} _-]+$/u, "invalid_font");

const safeImageUrl = z.string().trim().max(2048).refine(isHttpOrRelativeUrl, "unsafe_url");

const slugSchema = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid_slug")
  .refine((s) => !(RESERVED_PAGE_SLUGS as readonly string[]).includes(s), "reserved_slug");

export type ComponentNode = {
  id: string;
  type: AllowedNodeType;
  props: Record<string, unknown>;
  children: ComponentNode[];
  style?: Record<string, unknown>;
  breakpointStyles?: Record<string, Record<string, unknown>>;
  layout?: "grid" | "absolute";
};

export const componentNodeSchema: z.ZodType<ComponentNode> = z.lazy(() =>
  z.object({
    id: idSchema,
    type: z.enum(ALLOWED_NODE_TYPES),
    props: looseRecord.default({}),
    children: z.array(componentNodeSchema).max(MAX_NODES_PER_LIST),
    style: styleSchema.optional(),
    breakpointStyles: z.record(z.string(), styleSchema).optional(),
    layout: z.enum(["grid", "absolute"]).optional(),
  }),
);

const slotLayoutSchema = z.object({
  order: z.array(z.string().max(128)).max(MAX_NODES_PER_LIST).optional(),
  hidden: z.array(z.string().max(128)).max(MAX_NODES_PER_LIST).optional(),
});

export const sectionInstanceSchema = z.object({
  id: idSchema,
  sectionId: z.string().min(1).max(100).regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/),
  version: z.number().int().min(1).max(1000),
  props: looseRecord.default({}),
  translations: z.partialRecord(z.enum(SUPPORTED_LOCALES), looseRecord).optional(),
  style: styleSchema.optional(),
  breakpointStyles: z.record(z.string(), styleSchema).optional(),
  animation: looseRecord.optional(),
  componentTree: z.array(componentNodeSchema).max(MAX_NODES_PER_LIST).optional(),
  slots: z.record(z.string(), slotLayoutSchema).optional(),
  savedBlockRef: z.string().max(64).optional(),
});
export type SectionInstance = z.output<typeof sectionInstanceSchema>;

const elementAttributesSchema = z.object({
  htmlId: z.string().regex(/^[A-Za-z][\w-]{0,63}$/).optional(),
  tag: z.enum(ELEMENT_TAGS).optional(),
  visibility: z.enum(["visible", "hidden"]).optional(),
});

export const pageContentSchema = z.object({
  sections: z.array(sectionInstanceSchema).max(MAX_SECTIONS_PER_PAGE),
  elementStyles: z.record(z.string(), styleSchema).optional(),
  elementAttributes: z.record(z.string(), elementAttributesSchema).optional(),
  injectedChildren: z.record(z.string(), z.array(componentNodeSchema).max(MAX_NODES_PER_LIST)).optional(),
});
export type PageContent = z.output<typeof pageContentSchema>;

export const pageSeoSchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(320).optional(),
  ogImage: safeImageUrl.optional(),
  noindex: z.boolean().optional(),
});

export const sitePageSchema = z.object({
  id: idSchema.optional(),
  slug: slugSchema,
  isHome: z.boolean().default(false),
  name: z.string().trim().min(1).max(80),
  showInNav: z.boolean().optional(),
  seo: pageSeoSchema.default({}),
  content: pageContentSchema,
});
export type SitePage = z.output<typeof sitePageSchema>;

/** Theme tokens. Seller custom CSS is intentionally not part of the schema (stripped). */
export const designSystemSchema = z.object({
  colors: z
    .object({
      primary: colorSchema.optional(),
      secondary: colorSchema.optional(),
      background: colorSchema.optional(),
      foreground: colorSchema.optional(),
      muted: colorSchema.optional(),
      border: colorSchema.optional(),
      accent: colorSchema.optional(),
      destructive: colorSchema.optional(),
    })
    .default({}),
  typography: z
    .object({
      headingFont: fontSchema.optional(),
      bodyFont: fontSchema.optional(),
      arabicFont: fontSchema.optional(),
      baseFontSize: z.number().min(10).max(32).optional(),
      scaleRatio: z.number().min(1).max(2).optional(),
    })
    .default({}),
  spacing: z
    .object({
      containerMaxWidth: z.number().int().min(320).max(2560).optional(),
      sectionPaddingY: z.number().min(0).max(400).optional(),
      borderRadius: z.number().min(0).max(64).optional(),
    })
    .default({}),
});
export type DesignSystem = z.output<typeof designSystemSchema>;

export const siteSettingsSchema = z
  .object({
    defaultLocale: z.enum(SUPPORTED_LOCALES).default("ar"),
    locales: z.array(z.enum(SUPPORTED_LOCALES)).min(1).max(SUPPORTED_LOCALES.length).default(["ar", "en"]),
  })
  .refine((s) => new Set(s.locales).size === s.locales.length, {
    message: "duplicate_locale",
    path: ["locales"],
  })
  .refine((s) => s.locales.includes(s.defaultLocale), {
    message: "default_locale_not_enabled",
    path: ["defaultLocale"],
  });
export type SiteSettings = z.output<typeof siteSettingsSchema>;

export const siteConfigSchema = z
  .object({
    schemaVersion: z.literal(SITE_CONFIG_VERSION),
    designSystem: designSystemSchema.default({ colors: {}, typography: {}, spacing: {} }),
    header: sectionInstanceSchema.nullable().default(null),
    footer: sectionInstanceSchema.nullable().default(null),
    settings: siteSettingsSchema.default({ defaultLocale: "ar", locales: ["ar", "en"] }),
    pages: z.array(sitePageSchema).min(1).max(MAX_PAGES),
  })
  .superRefine((config, ctx) => {
    const homes = config.pages.filter((p) => p.isHome).length;
    if (homes !== 1) {
      ctx.addIssue({ code: "custom", message: "exactly_one_home_page", path: ["pages"] });
    }
    const seen = new Set<string>();
    config.pages.forEach((page, index) => {
      if (seen.has(page.slug)) {
        ctx.addIssue({ code: "custom", message: "duplicate_slug", path: ["pages", index, "slug"] });
      }
      seen.add(page.slug);
    });
  });

export type SiteConfig = z.output<typeof siteConfigSchema>;
export type SiteConfigInput = z.input<typeof siteConfigSchema>;
