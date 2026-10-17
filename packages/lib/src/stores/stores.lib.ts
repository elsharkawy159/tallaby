/**
 * Pure store rules shared by the dashboard and server code (PLAN.md §8.0,
 * P1-04). No database imports.
 */
import { z } from "zod";
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
    catalogMode: z.enum(["all", "selected"]).optional(),
  })
  .strict()
  .refine(
    (s) => !s.defaultLocale || !s.supportedLocales || s.supportedLocales.includes(s.defaultLocale),
    { message: "default_locale_not_supported", path: ["defaultLocale"] },
  );
export type StoreGeneralSettings = z.output<typeof storeGeneralSettingsSchema>;

export const STORE_POLICY_KEYS = ["return", "shipping", "privacy", "terms"] as const;
export type StorePolicyKey = (typeof STORE_POLICY_KEYS)[number];
export type StorePolicies = Partial<Record<StorePolicyKey, string>>;

const policyText = z.string().trim().max(20_000).optional();

/** Store settings › Policies. Empty text removes a policy; omitted keys are left as they are. */
export const storePoliciesSchema = z
  .object({ return: policyText, shipping: policyText, privacy: policyText, terms: policyText })
  .strict()
  .transform((p) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) as StorePolicies);
