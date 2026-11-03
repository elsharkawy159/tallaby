/**
 * Input schemas for the MCP product tools (ROADMAP.md F-29f, design note §7).
 * This is the server-side validation the dashboard's product actions still
 * lack: every field is typed and capped, prices are EGP, and product copy is
 * always written in both Arabic and English (CLAUDE.md rule 13, AI rule 20).
 */
import { z } from "zod";

export const AGENT_PRODUCT_LIMITS = {
  title: 255,
  description: 5000,
  content: 50_000,
  bulletPoints: 10,
  bulletPoint: 300,
  metaTitle: 60,
  metaDescription: 160,
  metaKeywords: 15,
  metaKeyword: 40,
  images: 10,
  variants: 100,
  options: 3,
  sku: 100,
  maxPrice: 10_000_000,
  maxStock: 1_000_000,
  searchLimit: 50,
} as const;

const L = AGENT_PRODUCT_LIMITS;

const uuid = z.string().uuid();
const text = (max: number) => z.string().trim().min(1).max(max);
/** EGP, more than zero, kept to the piastre by the builders. */
const price = z.number().positive().max(L.maxPrice);
const stock = z.number().int().min(0).max(L.maxStock);

/** Both languages, always (owner, 2026-10-29: product copy is bilingual). */
const bilingual = (max: number) => z.object({ ar: text(max), en: text(max) }).strict();

const seoLocale = z
  .object({
    metaTitle: z.string().trim().max(L.metaTitle).optional(),
    metaDescription: z.string().trim().max(L.metaDescription).optional(),
    keywords: z.array(z.string().trim().max(L.metaKeyword)).max(L.metaKeywords).optional(),
  })
  .strict();

/**
 * An image: an https URL Tallaby downloads and stores (JPEG, PNG or WebP,
 * ≤ 5 MB), or an image the product already has (as returned by get_product).
 */
const imageRef = z.string().trim().min(1).max(2000);

const optionValue = z
  .object({
    ar: text(100),
    en: text(100),
    /** Colour swatch for a colour option, e.g. "#1f2937". */
    swatch: z
      .string()
      .regex(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/)
      .optional(),
  })
  .strict();

const variantInput = z
  .object({
    /** Keep an existing variant (from get_product) so carts and orders keep pointing at it. */
    id: uuid.optional(),
    /** One entry per option, in the same order on every variant: [{ name: {ar,en}, value: {ar,en} }]. */
    options: z
      .array(z.object({ name: bilingual(50), value: optionValue }).strict())
      .min(1)
      .max(L.options),
    price,
    compareAtPrice: price.optional(),
    stock: stock.default(0),
    sku: z.string().trim().min(1).max(L.sku).optional(),
    image: imageRef.optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export type AgentVariantInput = z.infer<typeof variantInput>;

const productFields = {
  title: bilingual(L.title),
  /** Short description (plain text or simple HTML). */
  description: bilingual(L.description),
  /** Long description, HTML (p, h2, h3, ul, ol, li, strong, em, a, img). Sanitized on save. */
  content: bilingual(L.content),
  bulletPoints: z
    .object({
      ar: z.array(text(L.bulletPoint)).max(L.bulletPoints),
      en: z.array(text(L.bulletPoint)).max(L.bulletPoints),
    })
    .strict(),
  seo: z.object({ ar: seoLocale.optional(), en: seoLocale.optional() }).strict(),
  /** What the customer pays, EGP. */
  price,
  /** The "before" price shown struck through; must be higher than price. Null removes it. */
  compareAtPrice: price.nullable(),
  /** When the compare-at discount ends (ISO 8601). Null = no end. */
  discountEndsAt: z.string().datetime({ offset: true }).nullable(),
  /** Stock for a product without variants. */
  quantity: stock,
  /** False: unlimited stock (digital, made to order, services): orders never count it and it never sells out. */
  trackStock: z.boolean(),
  sku: z.string().trim().min(1).max(L.sku),
  /** A Tallaby category id from search_categories (required on create unless the store category was picked from one). */
  categoryId: uuid,
  /** One of the seller's own store categories (list_store_categories). Null removes it. */
  storeCategoryId: uuid.nullable(),
  /** Find or add a store category by name instead of an id. */
  storeCategoryName: z.object({ ar: text(80).optional(), en: text(80) }).strict(),
  images: z.array(imageRef).min(1).max(L.images),
  variants: z.array(variantInput).max(L.variants),
  freeDelivery: z.boolean(),
  maxOrderQuantity: z.number().int().min(1).max(10_000).nullable(),
  condition: z.enum(["new", "renewed", "refurbished", "used_like_new", "used_very_good", "used_good", "used_acceptable"]),
  /** Shipping weight in grams. */
  weightGrams: z.number().int().min(1).max(1_000_000).nullable(),
};

const idempotencyKey = z.string().regex(/^[\x21-\x7e]{1,200}$/).optional();

export const agentCreateProductSchema = z
  .object({
    storeId: uuid,
    ...productFields,
    description: productFields.description.optional(),
    content: productFields.content.optional(),
    bulletPoints: productFields.bulletPoints.optional(),
    seo: productFields.seo.optional(),
    compareAtPrice: productFields.compareAtPrice.optional(),
    discountEndsAt: productFields.discountEndsAt.optional(),
    quantity: productFields.quantity.optional(),
    trackStock: productFields.trackStock.optional(),
    sku: productFields.sku.optional(),
    categoryId: productFields.categoryId.optional(),
    storeCategoryId: productFields.storeCategoryId.optional(),
    storeCategoryName: productFields.storeCategoryName.optional(),
    variants: productFields.variants.optional(),
    freeDelivery: productFields.freeDelivery.optional(),
    maxOrderQuantity: productFields.maxOrderQuantity.optional(),
    condition: productFields.condition.optional(),
    weightGrams: productFields.weightGrams.optional(),
    /** false keeps it as a hidden draft; default true (live when it has a photo). */
    publish: z.boolean().optional(),
    idempotencyKey,
  })
  .strict();

export const agentUpdateProductSchema = z
  .object({
    storeId: uuid,
    productId: uuid,
    title: productFields.title.optional(),
    description: productFields.description.nullable().optional(),
    content: productFields.content.nullable().optional(),
    bulletPoints: productFields.bulletPoints.optional(),
    seo: productFields.seo.optional(),
    price: productFields.price.optional(),
    compareAtPrice: productFields.compareAtPrice.optional(),
    discountEndsAt: productFields.discountEndsAt.optional(),
    quantity: productFields.quantity.optional(),
    trackStock: productFields.trackStock.optional(),
    sku: productFields.sku.optional(),
    categoryId: productFields.categoryId.optional(),
    storeCategoryId: productFields.storeCategoryId.optional(),
    storeCategoryName: productFields.storeCategoryName.optional(),
    images: productFields.images.optional(),
    /** Replaces the whole variant list ([] removes every variant). Pass the ids from get_product to keep existing ones. */
    variants: productFields.variants.optional(),
    freeDelivery: productFields.freeDelivery.optional(),
    maxOrderQuantity: productFields.maxOrderQuantity.optional(),
    condition: productFields.condition.optional(),
    weightGrams: productFields.weightGrams.optional(),
  })
  .strict();

export const agentProductRefSchema = z.object({ storeId: uuid, productId: uuid }).strict();

export const agentSetProductStatusSchema = z
  .object({ storeId: uuid, productId: uuid, status: z.enum(["active", "draft"]) })
  .strict();

export const agentProductIdsSchema = z
  .object({ storeId: uuid, productIds: z.array(uuid).min(1).max(50) })
  .strict();

export const agentSearchProductsSchema = z
  .object({
    storeId: uuid,
    /** Words in the Arabic or English title, or a SKU. */
    query: z.string().trim().max(100).optional(),
    status: z.enum(["active", "draft", "trash"]).optional(),
    storeCategoryId: uuid.optional(),
    /** Only products with at most this much stock (unlimited products never match). */
    maxStock: z.number().int().min(0).max(L.maxStock).optional(),
    limit: z.number().int().min(1).max(L.searchLimit).default(20),
    cursor: z.number().int().min(0).max(100_000).default(0),
  })
  .strict();

export const agentSearchCategoriesSchema = z
  .object({ storeId: uuid, query: z.string().trim().min(1).max(80) })
  .strict();

export const agentStoreRefSchema = z.object({ storeId: uuid }).strict();

export type AgentCreateProductInput = z.infer<typeof agentCreateProductSchema>;
export type AgentUpdateProductInput = z.infer<typeof agentUpdateProductSchema>;
export type AgentSearchProductsInput = z.infer<typeof agentSearchProductsSchema>;
