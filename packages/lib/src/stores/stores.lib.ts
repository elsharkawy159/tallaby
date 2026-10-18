/**
 * Pure store rules shared by the dashboard and server code (PLAN.md §8.0,
 * P1-04). No database imports.
 */
import { z } from "zod";
import { CURRENCY_LABELS } from "../utils/formatPrice";
import { SOCIAL_PLATFORM_KEYS, SOCIAL_VALUE_MAX, normalizeSocialLink } from "@workspace/store-sections/social";
import { SUBDOMAIN_MAX_LENGTH, normalizeSubdomain, validateSubdomain, type SubdomainProblem } from "../storefront";

export const STORE_STATUSES = ["active", "archived", "suspended"] as const;
export type StoreStatus = (typeof STORE_STATUSES)[number];

export const STORE_LOCALES = ["ar", "en"] as const;
export type StoreLocale = (typeof STORE_LOCALES)[number];

export type StoreSubdomainStatus = "available" | "taken" | SubdomainProblem;

const SUFFIXES = ["store", "shop", "eg", "online", "2", "3"];

/**
 * Alternative subdomains to offer when `base` is taken: `{base}-store`,
 * `{base}-shop`, … trimmed to the length limit and validated. The caller
 * filters out the ones that are taken too.
 */
export function subdomainCandidates(base: string): string[] {
  const clean = normalizeSubdomain(base).replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!clean) return [];
  const out: string[] = [];
  for (const suffix of SUFFIXES) {
    const head = clean.slice(0, SUBDOMAIN_MAX_LENGTH - suffix.length - 1).replace(/-$/, "");
    const candidate = `${head}-${suffix}`;
    if (candidate !== clean && !out.includes(candidate) && validateSubdomain(candidate) === null) {
      out.push(candidate);
    }
  }
  return out;
}

export const storeNameSchema = z.string().trim().min(2).max(80);

export const createStoreInputSchema = z.object({
  name: storeNameSchema,
  subdomain: z.string().transform(normalizeSubdomain),
});
export type CreateStoreInput = z.input<typeof createStoreInputSchema>;

// An https URL, or a path inside a Tallaby storage bucket (older logos are
// stored as `logos/abc.png` in the `sellers` bucket). Never other schemes.
const STORAGE_PATH = /^(?!.*\.\.)[A-Za-z0-9][A-Za-z0-9/_.-]{0,500}$/;
const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => /^https:\/\/[^\s]+$/i.test(v) || /^http:\/\/localhost[:/]/i.test(v) || STORAGE_PATH.test(v),
    "invalid_url",
  );

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const storeContactSchema = z
  .object({
    // Same characters the existing seller settings accept (values are mirrored both ways).
    phone: z.string().trim().regex(/^[+()\d\s-]{7,24}$/, "invalid_phone").optional(),
    whatsapp: z.string().trim().regex(/^[+()\d\s-]{7,24}$/, "invalid_phone").optional(),
    email: z.email().max(254).optional(),
  })
  .strict();

/**
 * Store settings › General (PLAN.md §7.3). `.strict()` refuses keys that are
 * not settings, so a client can never set seller_id, status, is_primary, …
 */
export const storeGeneralSettingsSchema = z
  .object({
    name: storeNameSchema.optional(),
    description: optionalText(2000),
    storeCategory: optionalText(80),
    storeCategoryAr: optionalText(80),
    logoUrl: httpUrl.nullable().optional(),
    faviconUrl: httpUrl.nullable().optional(),
    bannerUrl: httpUrl.nullable().optional(),
    contact: storeContactSchema.optional(),
    defaultLocale: z.enum(STORE_LOCALES).optional(),
    supportedLocales: z.array(z.enum(STORE_LOCALES)).min(1).max(STORE_LOCALES.length).optional(),
    /** How prices are labelled on this store's site (stores.settings.currencyLabel). */
    currencyLabel: z.enum(CURRENCY_LABELS).optional(),
    // The catalog mode is set with its product selection (storeCatalogInputSchema).
  })
  .strict()
  .refine(
    (s) => !s.defaultLocale || !s.supportedLocales || s.supportedLocales.includes(s.defaultLocale),
    { message: "default_locale_not_supported", path: ["defaultLocale"] },
  );
export type StoreGeneralSettings = z.output<typeof storeGeneralSettingsSchema>;

export const STORE_CATALOG_MODES = ["all", "selected"] as const;
export type StoreCatalogMode = (typeof STORE_CATALOG_MODES)[number];
export const STORE_CATALOG_MAX_PRODUCTS = 1000;

/**
 * Store settings › Catalog (PLAN.md D24). "all" = every active product of the
 * seller; "selected" = only `productIds`, in this order. Duplicates are dropped.
 */
export const storeCatalogInputSchema = z
  .object({
    mode: z.enum(STORE_CATALOG_MODES),
    productIds: z
      .array(z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
      .max(STORE_CATALOG_MAX_PRODUCTS)
      .transform((ids) => [...new Set(ids.map((id) => id.toLowerCase()))]),
  })
  .strict();
export type StoreCatalogInput = z.input<typeof storeCatalogInputSchema>;

/**
 * Website › Social media (PLAN.md §8.8, P4-15): `stores.contact.social`.
 * One entry per platform; every value is normalized to the platform's https
 * URL (`normalizeSocialLink`), so a link can only point at that platform.
 */
export const storeSocialLinkSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORM_KEYS),
    value: z.string().trim().min(1).max(SOCIAL_VALUE_MAX),
    enabled: z.boolean(),
    order: z.number().int().min(0).max(100),
  })
  .strict()
  .transform((link, ctx) => {
    const url = normalizeSocialLink(link.platform, link.value);
    if (!url) {
      ctx.addIssue({ code: "custom", message: "invalid_social_link", path: ["value"] });
      return z.NEVER;
    }
    return { ...link, value: url };
  });

export const storeSocialLinksSchema = z
  .array(storeSocialLinkSchema)
  .max(SOCIAL_PLATFORM_KEYS.length)
  .refine((links) => new Set(links.map((l) => l.platform)).size === links.length, "duplicate_platform")
  .transform((links) => [...links].sort((a, b) => a.order - b.order).map((link, order) => ({ ...link, order })));
export type StoreSocialLink = z.output<typeof storeSocialLinkSchema>;

/**
 * The stored social list of a `stores.contact` value, re-validated on read
 * (entries that no longer validate are dropped), in display order.
 */
export function readStoreSocialLinks(contact: unknown): StoreSocialLink[] {
  const raw = (contact as { social?: unknown } | null)?.social;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => storeSocialLinkSchema.safeParse(entry))
    .filter((r) => r.success)
    .map((r) => r.data)
    .sort((a, b) => a.order - b.order);
}

/** Enabled links as the storefront renders them (`RenderContext.store.social`). */
export function publicStoreSocialLinks(contact: unknown): { platform: string; url: string }[] {
  return readStoreSocialLinks(contact)
    .filter((link) => link.enabled)
    .map((link) => ({ platform: link.platform, url: link.value }));
}

/**
 * Google Search Console "HTML tag" token. The storefront renders it only as
 * the content of `<meta name="google-site-verification">` through Next
 * metadata (escaped), never as raw HTML; the pattern also rules out quotes
 * and angle brackets.
 */
export const GOOGLE_SITE_VERIFICATION_RE = /^[A-Za-z0-9_-]{10,100}$/;
/** Where the page title goes in a store title template: "%s | My store". */
export const TITLE_TEMPLATE_TOKEN = "%s";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const titleTemplate = z
  .string()
  .trim()
  .max(120)
  .refine((v) => v.split(TITLE_TEMPLATE_TOKEN).length === 2, "invalid_title_template");
const seoDescription = z.string().trim().max(320);
const googleSiteVerification = z.string().trim().regex(GOOGLE_SITE_VERIFICATION_RE, "invalid_verification_token");

/**
 * Website › Domain & SEO › SEO (PLAN.md §7.3, P4-14), stored in `stores.seo`.
 * Saved as a whole form; an empty field is `null` (removed). Applies at once:
 * the storefront layout reads it live; page-level builder SEO still overrides
 * the title and description of its page.
 */
export const storeSeoSchema = z
  .object({
    titleTemplate: z.preprocess(blankToNull, titleTemplate.nullable()),
    description: z.preprocess(blankToNull, seoDescription.nullable()),
    shareImageUrl: z.preprocess(blankToNull, httpUrl.nullable()),
    /** false = ask search engines not to index the store (noindex, no sitemap). */
    indexing: z.boolean(),
    googleSiteVerification: z.preprocess(blankToNull, googleSiteVerification.nullable()),
  })
  .strict();
export type StoreSeoInput = z.input<typeof storeSeoSchema>;

export type StoreSeo = {
  titleTemplate: string | null;
  description: string | null;
  shareImageUrl: string | null;
  indexing: boolean;
  googleSiteVerification: string | null;
};

export const DEFAULT_STORE_SEO: StoreSeo = {
  titleTemplate: null,
  description: null,
  shareImageUrl: null,
  indexing: true,
  googleSiteVerification: null,
};

/**
 * Reads `stores.seo` for rendering. Field by field, so one bad value (an old
 * row, a manual edit) drops only that field, and every value is re-validated
 * at render time, the verification token included.
 */
export function parseStoreSeo(raw: unknown): StoreSeo {
  const value = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const pick = <T>(schema: z.ZodType<T>, v: unknown): T | null => {
    const parsed = schema.safeParse(v);
    return parsed.success ? parsed.data : null;
  };
  return {
    titleTemplate: pick(titleTemplate, value.titleTemplate) || null,
    description: pick(seoDescription, value.description) || null,
    shareImageUrl: pick(httpUrl, value.shareImageUrl) || null,
    indexing: value.indexing !== false,
    googleSiteVerification: pick(googleSiteVerification, value.googleSiteVerification),
  };
}
