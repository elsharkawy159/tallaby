/**
 * Pure CMS + blog rules shared by the dashboard (forms) and server code
 * (PLAN.md §8.5 P4-11, §8.9 P4-16, §11.7). No database or HTML-sanitizer
 * imports, so client components can use the schemas. Rich text is sanitized
 * on the server (cms.server.ts) and again before render.
 *
 * Model: every store has collections (`cms_collections`); the blog is the
 * system collection `blog` (kind 'blog', is_system) with fixed fields. Items
 * (`cms_items`) are `draft` or `published`; a published item whose
 * `published_at` is in the future is *scheduled* and is not public yet.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------

export const BLOG_COLLECTION_SLUG = "blog";

/** cms_collections.slug CHECK (0055). */
export const CMS_COLLECTION_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
/** Item slugs: one path segment, lowercase. */
export const CMS_ITEM_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?$/;

/**
 * Collection slugs that would clash with store-host routes (PLAN.md §10.2):
 * builder page slugs reserved by @workspace/store-sections (a test keeps this
 * list a superset), the paths that pass through to the app on a store host,
 * the blog, and internal route segments.
 */
export const RESERVED_COLLECTION_SLUGS: readonly string[] = [
  "products", "product", "cart", "checkout", "auth", "login", "signup", "orders",
  "profile", "payment", "api", "storefront", "search", "sitemap", "robots", "_next",
  "blog", "pages", "cms", "error", "privacy", "terms", "returns", "shipping", "cookies",
  "en", "ar", "rss", "feed",
];

export function isReservedCollectionSlug(slug: string): boolean {
  return RESERVED_COLLECTION_SLUGS.includes(slug);
}

/** A URL slug suggestion from a title (Latin letters and digits only; may be empty for Arabic titles). */
export function slugifyCms(value: string, maxLength = 80): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/** Public path of an item on the store host (the locale prefix is added by the host's Link). */
export function cmsItemPath(collectionSlug: string, itemSlug: string): string {
  return `/${collectionSlug}/${itemSlug}`;
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

export const CMS_FIELD_TYPES = [
  "text",
  "textarea",
  "richtext",
  "number",
  "boolean",
  "date",
  "image",
  "url",
  "email",
  "select",
  "tags",
] as const;
export type CmsFieldType = (typeof CMS_FIELD_TYPES)[number];

export const CMS_MAX_FIELDS = 30;
export const CMS_MAX_COLLECTIONS = 20;
export const CMS_MAX_TAGS = 20;
export const CMS_RICHTEXT_MAX = 100_000;

const fieldOptionSchema = z.strictObject({
  value: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(80),
});

export const cmsFieldDefSchema = z.strictObject({
  key: z.string().regex(/^[a-z][a-zA-Z0-9_]{0,39}$/),
  label: z.string().trim().min(1).max(80),
  type: z.enum(CMS_FIELD_TYPES),
  required: z.boolean().optional(),
  helpText: z.string().trim().max(200).optional(),
  options: z.array(fieldOptionSchema).max(50).optional(),
});
export type CmsFieldDef = z.infer<typeof cmsFieldDefSchema>;

export const cmsFieldsSchema = z
  .array(cmsFieldDefSchema)
  .min(1)
  .max(CMS_MAX_FIELDS)
  .refine((fields) => new Set(fields.map((f) => f.key)).size === fields.length, "duplicate_key")
  .refine((fields) => fields.some((f) => f.type === "text"), "needs_text_field")
  .refine((fields) => fields.every((f) => f.type !== "select" || (f.options?.length ?? 0) > 0), "select_needs_options");

/** The field shown as the item's title: the first text field. */
export function primaryFieldKey(fields: readonly CmsFieldDef[]): string | null {
  return fields.find((f) => f.type === "text")?.key ?? null;
}

/** Fixed fields of the system blog collection (PLAN.md §8.9). */
export const BLOG_FIELDS: readonly CmsFieldDef[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "excerpt", label: "Excerpt", type: "textarea" },
  { key: "coverImage", label: "Cover image", type: "image" },
  { key: "body", label: "Body", type: "richtext" },
  { key: "tags", label: "Tags", type: "tags" },
  { key: "authorName", label: "Author", type: "text" },
];

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export const cmsCollectionInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(CMS_COLLECTION_SLUG_RE, "invalid_slug")
    .refine((s) => !isReservedCollectionSlug(s), "reserved_slug"),
  description: z.string().trim().max(500).optional().default(""),
  fields: cmsFieldsSchema,
});
export type CmsCollectionInput = z.input<typeof cmsCollectionInputSchema>;

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export const CMS_ITEM_STATUSES = ["draft", "published"] as const;
export type CmsItemStatus = (typeof CMS_ITEM_STATUSES)[number];

/** What the seller sees: a published item with a future date is scheduled. */
export type CmsItemState = "draft" | "scheduled" | "published";

export function cmsItemState(status: string, publishedAt: string | Date | null | undefined, now: Date = new Date()): CmsItemState {
  if (status !== "published" || !publishedAt) return "draft";
  return new Date(publishedAt).getTime() > now.getTime() ? "scheduled" : "published";
}

/** Public on a store host: published and due. The SQL filter in cms.server.ts mirrors this. */
export function isCmsItemPublic(status: string, publishedAt: string | Date | null | undefined, now: Date = new Date()): boolean {
  return cmsItemState(status, publishedAt, now) === "published";
}

const safeImage = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => v === "" || /^https?:\/\/[^\s"'<>]+$/i.test(v) || (/^(?!\/\/)[\w\-./]+$/.test(v) && !v.includes("..")),
    "invalid_image",
  );

export const cmsSeoSchema = z.strictObject({
  title: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().max(300).optional().default(""),
  ogImage: safeImage.optional().default(""),
  noindex: z.boolean().optional().default(false),
});
export type CmsSeo = z.infer<typeof cmsSeoSchema>;

export const cmsItemInputSchema = z.strictObject({
  slug: z.string().trim().toLowerCase().regex(CMS_ITEM_SLUG_RE, "invalid_slug"),
  status: z.enum(CMS_ITEM_STATUSES),
  /** ISO datetime. Published with no date = now; a future date schedules the item. */
  publishedAt: z
    .string()
    .max(40)
    .refine((v) => !Number.isNaN(Date.parse(v)), "invalid_date")
    .nullable()
    .optional(),
  data: z.record(z.string(), z.unknown()),
  seo: cmsSeoSchema.optional(),
});
export type CmsItemInput = z.input<typeof cmsItemInputSchema>;

export type CmsDataIssue = { key: string; code: "required" | "invalid" | "too_long" };

const URL_RE = /^(?:https?:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|tel:[+\d\s()-]+)$/i;
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/;

const TEXT_LIMITS: Partial<Record<CmsFieldType, number>> = { text: 300, textarea: 5000, richtext: CMS_RICHTEXT_MAX };

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function parseValue(field: CmsFieldDef, raw: unknown): { ok: true; value: unknown } | { ok: false; code: CmsDataIssue["code"] } {
  switch (field.type) {
    case "text":
    case "textarea":
    case "richtext": {
      if (typeof raw !== "string") return { ok: false, code: "invalid" };
      const value = field.type === "richtext" ? raw : raw.trim();
      if (value.length > (TEXT_LIMITS[field.type] ?? 300)) return { ok: false, code: "too_long" };
      return { ok: true, value };
    }
    case "number": {
      const n = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
      return typeof n === "number" && Number.isFinite(n) ? { ok: true, value: n } : { ok: false, code: "invalid" };
    }
    case "boolean":
      return typeof raw === "boolean" ? { ok: true, value: raw } : { ok: false, code: "invalid" };
    case "date":
      return typeof raw === "string" && DATE_RE.test(raw) && !Number.isNaN(Date.parse(raw)) ? { ok: true, value: raw } : { ok: false, code: "invalid" };
    case "image": {
      const parsed = safeImage.safeParse(raw);
      return parsed.success ? { ok: true, value: parsed.data } : { ok: false, code: "invalid" };
    }
    case "url":
      return typeof raw === "string" && raw.length <= 2048 && URL_RE.test(raw.trim()) ? { ok: true, value: raw.trim() } : { ok: false, code: "invalid" };
    case "email":
      return typeof raw === "string" && raw.length <= 254 && EMAIL_RE.test(raw.trim()) ? { ok: true, value: raw.trim() } : { ok: false, code: "invalid" };
    case "select":
      return typeof raw === "string" && (field.options ?? []).some((o) => o.value === raw) ? { ok: true, value: raw } : { ok: false, code: "invalid" };
    case "tags": {
      if (!Array.isArray(raw) || raw.length > CMS_MAX_TAGS) return { ok: false, code: "invalid" };
      const tags: string[] = [];
      for (const tag of raw) {
        if (typeof tag !== "string") return { ok: false, code: "invalid" };
        const clean = tag.trim().replace(/\s+/g, " ").toLowerCase();
        if (clean.length > 40) return { ok: false, code: "too_long" };
        if (clean && !tags.includes(clean)) tags.push(clean);
      }
      return { ok: true, value: tags };
    }
  }
}

/**
 * Item data checked against the collection's fields: unknown keys are
 * dropped, empty optional values are omitted, required fields must be set.
 * Rich text is returned as given — the server sanitizes it.
 */
export function parseCmsItemData(
  fields: readonly CmsFieldDef[],
  data: Record<string, unknown>,
): { success: true; data: Record<string, unknown> } | { success: false; issues: CmsDataIssue[] } {
  const out: Record<string, unknown> = {};
  const issues: CmsDataIssue[] = [];
  for (const field of fields) {
    const raw = data[field.key];
    if (isEmpty(raw)) {
      if (field.required) issues.push({ key: field.key, code: "required" });
      continue;
    }
    const parsed = parseValue(field, raw);
    if (!parsed.ok) {
      issues.push({ key: field.key, code: parsed.code });
      continue;
    }
    if (isEmpty(parsed.value)) {
      if (field.required) issues.push({ key: field.key, code: "required" });
      continue;
    }
    out[field.key] = parsed.value;
  }
  return issues.length ? { success: false, issues } : { success: true, data: out };
}

/** Minutes to read a body of plain text (≈200 words a minute, at least 1). */
export function readingMinutes(plainText: string): number {
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ---------------------------------------------------------------------------
// Public summaries (used by hosts to fill content sections and lists)
// ---------------------------------------------------------------------------

export type PublicCmsItem = {
  id: string;
  collectionSlug: string;
  collectionKind: string;
  slug: string;
  data: Record<string, unknown>;
  seo: Partial<CmsSeo>;
  publishedAt: string;
  updatedAt: string;
};

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** Title, excerpt and image of an item, by its collection's fields (blog fields for the blog). */
export function cmsItemSummaryFields(fields: readonly CmsFieldDef[], data: Record<string, unknown>) {
  const primary = primaryFieldKey(fields);
  const excerptField = fields.find((f) => f.type === "textarea");
  const imageField = fields.find((f) => f.type === "image");
  const tagsField = fields.find((f) => f.type === "tags");
  return {
    title: (primary && str(data[primary])) || "",
    excerpt: excerptField ? str(data[excerptField.key]) : null,
    image: imageField ? str(data[imageField.key]) : null,
    tags: tagsField && Array.isArray(data[tagsField.key]) ? (data[tagsField.key] as string[]) : [],
  };
}
