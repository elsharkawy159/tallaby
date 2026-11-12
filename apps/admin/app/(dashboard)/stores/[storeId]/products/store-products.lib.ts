import { agentCreateProductSchema, type AgentCreateProductInput } from "@workspace/lib/products/agent";
import { contentBlocksToHtml, type ProductAutofillOutput } from "@workspace/lib/products/autofill";

/**
 * Admin › Store › Products (owner request 2026-11-12: admins build stores for
 * sellers). Pure helpers: the create form's values, turning an AI autofill
 * answer into those values, turning them into the shared product-create input
 * (`agentCreateProduct`, the same command the MCP connector and the in-app
 * agent use), and the photo paths Admin may attach to a store's product.
 */

/** ai_usage_logs.feature for Admin's autofill: never the seller's `product_autofill`, so it counts toward no seller cap. */
export const ADMIN_AUTOFILL_FEATURE = "admin_product_autofill";

/** Model calls one admin may make per Cairo day (abuse guard; AI_ADMIN_PRODUCT_AUTOFILL_DAILY_LIMIT overrides). */
export const ADMIN_AUTOFILL_DAILY_LIMIT = 200;

export const STORE_PRODUCTS_PAGE_SIZE = 25;

export const STORE_PRODUCT_STATUS_FILTERS = ["all", "active", "draft", "trash"] as const;
export type StoreProductStatusFilter = (typeof STORE_PRODUCT_STATUS_FILTERS)[number];

export function parseStoreProductsParams(params: Record<string, string | string[] | undefined>) {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const status = one(params.status) as StoreProductStatusFilter;
  const page = Number.parseInt(one(params.page), 10);
  return {
    query: one(params.q).trim().slice(0, 100),
    status: (STORE_PRODUCT_STATUS_FILTERS as readonly string[]).includes(status) ? status : "all",
    page: Number.isInteger(page) && page > 0 && page <= 1000 ? page : 1,
  };
}

export type StoreProductFormValues = {
  titleAr: string;
  titleEn: string;
  /** Plain text paragraphs (blank-line separated); the shared command turns them into HTML. */
  descriptionAr: string;
  descriptionEn: string;
  /** Long description HTML, from the AI's content blocks (kept as is, sanitized on save). */
  contentAr: string;
  contentEn: string;
  /** One bullet point per line. */
  bulletsAr: string;
  bulletsEn: string;
  /** Comma or line separated search keywords. */
  keywordsAr: string;
  keywordsEn: string;
  price: string;
  compareAtPrice: string;
  quantity: string;
  trackStock: boolean;
  categoryId: string | null;
  categoryLabel: string;
  /** One of the store's own categories, or null. */
  storeCategoryId: string | null;
  /** A new store category to find or add by name (used when no storeCategoryId is picked). */
  storeCategoryName: string;
  /** Public URLs of photos uploaded for this store's seller. */
  images: string[];
  publish: boolean;
};

export const emptyStoreProductForm = (): StoreProductFormValues => ({
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  contentAr: "",
  contentEn: "",
  bulletsAr: "",
  bulletsEn: "",
  keywordsAr: "",
  keywordsEn: "",
  price: "",
  compareAtPrice: "",
  quantity: "",
  trackStock: true,
  categoryId: null,
  categoryLabel: "",
  storeCategoryId: null,
  storeCategoryName: "",
  images: [],
  publish: true,
});

const amount = (value: number | null | undefined) => (typeof value === "number" && value > 0 ? String(value) : "");

/**
 * The form values an AI answer fills. Price: the sale price is what the
 * customer pays and the regular price becomes the struck-through one. Photos
 * are the ones the admin uploaded, in their order; the model's photo numbers
 * only choose which of them go into the long description.
 */
export function formValuesFromAutofill(
  output: ProductAutofillOutput,
  ctx: { imageUrls: readonly string[] },
): Partial<StoreProductFormValues> {
  const productPhotoUrls = output.productPhotos.length
    ? output.productPhotos.map((index) => ctx.imageUrls[index]).filter((url): url is string => Boolean(url))
    : [...ctx.imageUrls];
  const { list, final } = output.price;
  return {
    titleAr: output.localized.ar.title,
    titleEn: output.localized.en.title,
    descriptionAr: output.localized.ar.description,
    descriptionEn: output.localized.en.description,
    contentAr: contentBlocksToHtml(output.localized.ar.contentBlocks, productPhotoUrls, output.localized.ar.title),
    contentEn: contentBlocksToHtml(output.localized.en.contentBlocks, productPhotoUrls, output.localized.en.title),
    bulletsAr: output.localized.ar.bulletPoints.join("\n"),
    bulletsEn: output.localized.en.bulletPoints.join("\n"),
    keywordsAr: output.localized.ar.metaKeywords.join(", "),
    keywordsEn: output.localized.en.metaKeywords.join(", "),
    price: amount(final ?? list),
    compareAtPrice: final ? amount(list) : "",
    quantity: output.quantity !== null ? String(output.quantity) : "",
    storeCategoryName: output.storeCategoryName ?? "",
  };
}

const lines = (value: string) =>
  value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const keywords = (value: string) =>
  value
    .split(/[,،\n]+/)
    .map((word) => word.trim())
    .filter(Boolean);

const numberOrUndefined = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const FIELD_LABELS: Record<string, string> = {
  title: "Title (both languages)",
  description: "Short description (both languages)",
  content: "Detailed description",
  bulletPoints: "Bullet points",
  seo: "Keywords",
  price: "Price",
  compareAtPrice: "Price before discount",
  quantity: "Stock",
  categoryId: "Tallaby category",
  storeCategoryId: "Store category",
  storeCategoryName: "Store category name",
  images: "Photos",
};

export type BuildCreateInputResult = { ok: true; input: AgentCreateProductInput } | { ok: false; error: string };

/**
 * The form → the shared create command's input, validated by the same zod
 * schema the MCP tool uses (both languages, caps, EGP-style amounts). The
 * store id is the route's, checked again on the server against the database.
 */
export function buildCreateInput(values: StoreProductFormValues, storeId: string): BuildCreateInputResult {
  const both = (ar: string, en: string) => (ar.trim() || en.trim() ? { ar: ar.trim(), en: en.trim() } : undefined);
  const bulletsAr = lines(values.bulletsAr);
  const bulletsEn = lines(values.bulletsEn);
  const keywordsAr = keywords(values.keywordsAr);
  const keywordsEn = keywords(values.keywordsEn);
  const price = numberOrUndefined(values.price);
  const compareAt = numberOrUndefined(values.compareAtPrice);
  const quantity = numberOrUndefined(values.quantity);

  if (price === undefined) return { ok: false, error: "Enter a price." };
  if (compareAt !== undefined && price !== undefined && compareAt <= price) {
    return { ok: false, error: "The price before discount must be higher than the price." };
  }
  if (!values.categoryId && !values.storeCategoryId) return { ok: false, error: "Pick a Tallaby category." };
  if (values.images.length === 0) return { ok: false, error: "Add at least one photo." };

  const candidate = {
    storeId,
    title: { ar: values.titleAr.trim(), en: values.titleEn.trim() },
    description: both(values.descriptionAr, values.descriptionEn),
    content: both(values.contentAr, values.contentEn),
    bulletPoints: bulletsAr.length || bulletsEn.length ? { ar: bulletsAr, en: bulletsEn } : undefined,
    seo:
      keywordsAr.length || keywordsEn.length
        ? { ar: { keywords: keywordsAr.slice(0, 15) }, en: { keywords: keywordsEn.slice(0, 15) } }
        : undefined,
    price,
    compareAtPrice: compareAt,
    quantity: values.trackStock ? (quantity ?? 0) : undefined,
    trackStock: values.trackStock,
    categoryId: values.categoryId ?? undefined,
    storeCategoryId: values.storeCategoryId ?? undefined,
    storeCategoryName:
      !values.storeCategoryId && values.storeCategoryName.trim()
        ? { ar: values.storeCategoryName.trim(), en: values.storeCategoryName.trim() }
        : undefined,
    images: values.images,
    publish: values.publish,
  };
  const parsed = agentCreateProductSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, input: parsed.data };
  const issue = parsed.error.issues[0];
  const field = String(issue?.path[0] ?? "");
  const label = FIELD_LABELS[field] ?? (field || "A field");
  return { ok: false, error: `${label}: ${issue?.message ?? "check the value"}.` };
}

// ── Photos ──────────────────────────────────────────────────────────────────

/** `<Date.now()>-<slug>.<ext>`, the name `generateImageName` makes (same rule as createAdminImageUploadUrl). */
export const STORE_PRODUCT_IMAGE_NAME_RE = /^\d{10,16}-[a-z0-9-]{0,200}\.[A-Za-z0-9]{1,16}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Where Admin uploads a photo for this seller: the seller dashboard's `<sellerId>/<YYYY-MM-DD>/<file>` layout. */
export function storeProductImagePath(sellerId: string, fileName: string, now = new Date()): string | null {
  if (!UUID_RE.test(sellerId) || !STORE_PRODUCT_IMAGE_NAME_RE.test(fileName)) return null;
  return `${sellerId}/${now.toISOString().slice(0, 10)}/${fileName}`;
}

/**
 * The stored path of a photo URL when it is a "products" bucket object in
 * this seller's folder, else null. The create command accepts only these (no
 * other seller's photos, no outside links).
 */
export function sellerProductImagePath(url: string, ctx: { supabaseUrl: string | null | undefined; sellerId: string }): string | null {
  if (!ctx.supabaseUrl || !UUID_RE.test(ctx.sellerId)) return null;
  const prefix = `${ctx.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/products/`;
  if (!url.startsWith(prefix)) return null;
  let path: string;
  try {
    path = decodeURIComponent(url.slice(prefix.length).split("?")[0] ?? "");
  } catch {
    return null;
  }
  const [owner, day, file, ...rest] = path.split("/");
  if (rest.length || owner?.toLowerCase() !== ctx.sellerId.toLowerCase()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day ?? "") || !STORE_PRODUCT_IMAGE_NAME_RE.test(file ?? "")) return null;
  return path;
}
