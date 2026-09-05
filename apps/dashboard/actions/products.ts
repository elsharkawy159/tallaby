"use server";

import {
  products,
  productVariants,
  productTranslations,
  productQuestions,
  productAnswers,
  db,
} from "@workspace/db";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUser } from "./auth";
import slugify from "slugify";
import {
  isRichTextEmpty,
  sanitizeRichTextHtml,
} from "@workspace/tiptap";
import {
  applyInvalidation,
  invalidateProduct,
  type ProductCacheSnapshot,
} from "@workspace/cache";

function normalizeRichTextContent(html?: string | null): string | null {
  if (!html?.trim()) return null;
  const sanitized = sanitizeRichTextHtml(html);
  return isRichTextEmpty(sanitized) ? null : sanitized;
}

// Excel parsing
import * as XLSX from "xlsx";
import {
  normalizeHeaderKey,
  PRODUCT_IMPORT_HEADER_MAP,
} from "@/lib/product-import-headers";
// tables imported above via @workspace/db default export; no need for direct table imports here

/** Builds the cache-invalidation snapshot for a product from its current DB state. */
async function toSnapshot(productId: string): Promise<ProductCacheSnapshot | null> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      productTranslations: { columns: { locale: true, slug: true } },
    },
  });
  if (!product) return null;

  return {
    id: product.id,
    sellerId: product.sellerId,
    categoryId: product.categoryId,
    brandId: product.brandId,
    slugs: product.productTranslations.map((t) => ({ locale: t.locale, slug: t.slug })),
    status: product.status,
    isFeatured: product.isFeatured ?? false,
    isTrending: product.isTrending ?? false,
    isSeasonal: product.isSeasonal ?? false,
    isMostSelling: product.isMostSelling ?? false,
    isPlatformChoice: product.isPlatformChoice ?? false,
    priceKey: JSON.stringify(product.price ?? null),
  };
}

// Generate random SKU function
async function generateRandomSKU(): Promise<string> {
  const prefix = "SKU";
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.random().toString(36).substring(2, 8).toUpperCase(); // Random 6 chars
  const sku = `${prefix}-${timestamp}-${random}`;

  // Check if SKU already exists in database
  const existingProduct = await db.query.products.findFirst({
    where: eq(products.sku, sku),
  });

  // If SKU exists, generate a new one recursively
  if (existingProduct) {
    return generateRandomSKU();
  }

  return sku;
}

async function findBestCategoryMatch(
  productText: string
): Promise<{ id: string; name: string } | null> {
  if (!productText || productText.trim().length < 3) return null;

  const normalizedText = productText.toLowerCase().trim();

  // Get all categories from database
  const allCategories = await db.query.categories.findMany({
    where: (categories, { isNotNull }) => isNotNull(categories.name),
  });

  if (allCategories.length === 0) return null;

  let bestMatch: { id: string; name: string } | null = null;
  let highestScore = 0;

  for (const category of allCategories) {
    if (!category.name) continue;

    const categoryName = category.name.toLowerCase();
    let score = 0;

    // Check if category name is included in product text
    if (normalizedText.includes(categoryName)) {
      score = categoryName.length; // Longer matches get higher scores
    }

    // Check if any words from category name are in product text
    const categoryWords = categoryName
      .split(/\s+/)
      .filter((word) => word.length > 2);
    for (const word of categoryWords) {
      if (normalizedText.includes(word)) {
        score += word.length;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        id: category.id,
        name: category.name,
      };
    }
  }

  // Only return if we have a reasonable match (score > 3)
  return highestScore > 3 ? bestMatch : null;
}

export async function getSellerProducts(params?: {
  status?: "draft" | "pending" | "active" | "rejected";
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const conditions = [eq(products.sellerId, session.user.id)];

    if (params?.status !== undefined) {
      conditions.push(eq(products.status, params.status));
    }

    const productListRaw = await db.query.products.findMany({
      where: and(...conditions),
      with: {
        brand: true,
        category: true,
        productVariants: true,
        productTranslations: true,
      },
      orderBy: [desc(products.createdAt)],
      ...(params?.limit !== undefined ? { limit: params.limit } : {}),
      offset: params?.offset || 0,
    });

    const productList = productListRaw.map((p) => {
      const translations =
        (
          p as {
            productTranslations?: Array<{ locale: string; title: string }>;
          }
        ).productTranslations ?? [];
      const enT = translations.find((t) => t.locale === "en");
      const arT = translations.find((t) => t.locale === "ar");
      const title = enT?.title ?? arT?.title ?? "";
      return { ...p, title };
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(and(...conditions));

    return {
      success: true,
      data: productList,
      totalCount: Number(totalCount[0].count),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Bulk upload via Excel/CSV
// Helpers for bulk upload
const normalizeKey = normalizeHeaderKey;

function normalizeVariantImageFields(v: {
  images?: string[] | null;
  imageUrl?: string | null | undefined;
}) {
  const images = Array.isArray(v.images)
    ? v.images.filter(
        (img): img is string => typeof img === "string" && img.length > 0
      )
    : v.imageUrl
      ? [v.imageUrl]
      : [];

  return {
    images: images.length > 0 ? images : null,
    imageUrl: images[0] ?? null,
  };
}

function normalizeVariantDefaultFlags<T extends { isDefault?: boolean | null }>(
  variants: T[]
): T[] {
  if (variants.length === 0) {
    return variants;
  }

  const defaultIndex = variants.findIndex((variant) => variant.isDefault === true);
  const resolvedIndex = defaultIndex >= 0 ? defaultIndex : 0;

  return variants.map((variant, index) => ({
    ...variant,
    isDefault: index === resolvedIndex,
  }));
}

function applyDefaultVariantProductImages<
  T extends {
    isDefault?: boolean | null;
    images?: string[] | null;
    imageUrl?: string | null;
  },
>(variants: T[], productImages: string[] | null | undefined): T[] {
  const images = Array.isArray(productImages)
    ? productImages.filter(
        (image): image is string => typeof image === "string" && image.length > 0
      )
    : [];

  if (images.length === 0 || variants.length === 0) {
    return variants;
  }

  const defaultIndex = variants.findIndex((variant) => variant.isDefault === true);
  const resolvedIndex = defaultIndex >= 0 ? defaultIndex : 0;

  return variants.map((variant, index) => {
    if (index !== resolvedIndex) {
      return variant;
    }

    return {
      ...variant,
      images,
      imageUrl: images[0] ?? null,
    };
  });
}

function mapVariantFormToDb(v: any, index: number) {
  const { images, imageUrl } = normalizeVariantImageFields(v);
  const localized = v.localized ?? null;
  const englishFields =
    localized && typeof localized === "object" && !Array.isArray(localized)
      ? (localized as { en?: { title?: string; option1?: string; option2?: string; option3?: string } }).en
      : null;

  return {
    title: englishFields?.title ?? v.title,
    price: v.price as any,
    stock: v.stock ?? 0,
    sku: v.sku,
    imageUrl,
    images,
    isDefault: Boolean(v.isDefault),
    localized,
    option1: englishFields?.option1 ?? v.option1,
    option2: englishFields?.option2 ?? v.option2,
    option3: englishFields?.option3 ?? v.option3,
    barCode: v.barCode,
    position: v.position ?? index + 1,
  };
}

function buildPriceObject(input: {
  base?: number | null;
  list?: number | null;
  final?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  basePrice?: number | null;
  salePrice?: number | null;
}) {
  let base = Number(
    input.base ?? input.basePrice ?? input.list ?? input.salePrice ?? 0
  );
  let list = Number(input.list ?? input.basePrice ?? base ?? 0);
  if (!Number.isFinite(base)) base = 0;
  if (!Number.isFinite(list)) list = 0;

  let discountType: "percent" | "amount" | null =
    (input.discountType as any) || null;
  let discountValue: number | null =
    input.discountValue != null ? Number(input.discountValue) : null;
  let finalPrice = input.final != null ? Number(input.final) : null;

  if (discountType === "percent" && discountValue != null) {
    finalPrice = Number((list * (1 - discountValue / 100)).toFixed(2));
  } else if (discountType === "amount" && discountValue != null) {
    finalPrice = Number((list - discountValue).toFixed(2));
  } else if (finalPrice != null && Number.isFinite(finalPrice)) {
    const amount = list - finalPrice;
    discountType = "amount";
    discountValue = Number(amount.toFixed(2));
  } else {
    finalPrice = list;
    discountType = null;
    discountValue = null;
  }

  if (!Number.isFinite(finalPrice)) finalPrice = list;

  return {
    base,
    list,
    final: finalPrice,
    discountType,
    discountValue,
  };
}

export type ParsedBulkRow = {
  row: number;
  product: {
    title: string;
    slug: string;
    description?: string;
    sku: string;
    brandId?: string;
    categoryId: string;
    quantity: number;
    images: string[];
    status: "draft" | "pending" | "active" | "rejected";
    isFeatured: boolean;
    condition: any;
    conditionDescription?: string;
    fulfillmentType?: string;
    handlingTime?: number;
    maxOrderQuantity?: number;
    isPlatformChoice?: boolean;
    isMostSelling?: boolean;
    taxClass?: string;
    price: {
      base: number;
      list: number;
      final: number;
      discountType: "percent" | "amount" | null;
      discountValue: number | null;
    };
    bulletPoints?: string[];
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      weight?: number;
    };
    seo?: { title?: string; description?: string; keywords?: string[] };
  };
  variants: Array<{
    title: string;
    price: number;
    stock?: number;
    sku: string;
    imageUrl?: string;
    option1?: string;
    option2?: string;
    option3?: string;
    barCode?: string;
    position?: number;
  }>;
  qa: Array<{ question: string; answer?: string }>;
};

// Preview only: parse file and return valid/invalid, no DB writes yet
export async function bulkUploadProductsAction(formData: FormData) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error("Missing file");
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
    });
    // Map human headers → internal keys (supports nested price fields).
    // Shared with the Export/Template sheet — see lib/product-import-headers.ts.
    const headerMap = PRODUCT_IMPORT_HEADER_MAP;

    const valid: ParsedBulkRow[] = [];
    const invalid: Array<{
      row: number;
      message: string;
      raw: Record<string, any>;
    }> = [];

    // Preload brands/categories maps to reduce queries
    const allBrands = await db.query.brands.findMany({});
    const brandByName = new Map<string, string>();
    for (const b of allBrands)
      brandByName.set((b.name || "").toLowerCase().trim(), b.id);

    // Get all categories for name resolution
    const allCategories = await db.query.categories.findMany({
      where: (categories, { isNotNull }) => isNotNull(categories.name),
    });
    const categoryByName = new Map<string, string>();
    for (const c of allCategories)
      categoryByName.set((c.name || "").toLowerCase().trim(), c.id);

    // Track used SKUs in this batch to avoid duplicates
    const usedSKUs = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i]!;

      // Build a canonical object using headerMap (including nested price fields)
      const record: any = {};
      for (const [k, v] of Object.entries(raw)) {
        const mapKey = headerMap[normalizeKey(k)];
        if (!mapKey) continue;
        if (mapKey.startsWith("price.")) {
          record.price = record.price || {};
          const sub = mapKey.split(".")[1]!;
          record.price[sub] = v;
        } else {
          record[mapKey] = v;
        }
      }

      // Required fields
      const title = String(record.title || "").trim();
      let sku = String(record.sku || "").trim();
      const categoryName = String(record.category || "").trim();

      if (!title) {
        invalid.push({
          row: i + 2,
          message: "Missing required field: title",
          raw,
        });
        continue;
      }

      // Generate SKU if missing
      if (!sku) {
        sku = await generateRandomSKU();
        record.sku = sku; // Update the record with generated SKU
      }

      // Check for duplicate SKU in this batch
      if (usedSKUs.has(sku)) {
        invalid.push({
          row: i + 2,
          message: `Duplicate SKU in batch: ${sku}`,
          raw,
        });
        continue;
      }
      usedSKUs.add(sku);

      // Resolve category by name (case-insensitive) or auto-categorize if missing
      let categoryId = categoryByName.get(categoryName.toLowerCase()) || null;

      // Auto-categorization: if category is missing or not found, automatically try to categorize
      if (!categoryId) {
        const productText = `${title} ${String(record.description || "").trim()}`;
        const bestMatch = await findBestCategoryMatch(productText);

        if (bestMatch) {
          categoryId = bestMatch.id;
          // Update the record to show the auto-assigned category
          record.category = bestMatch.name;
        }
      }

      if (!categoryId) {
        const errorMessage = categoryName
          ? `Category not found: ${categoryName} (auto-categorization attempted)`
          : "Category missing and auto-categorization failed";

        invalid.push({
          row: i + 2,
          message: errorMessage,
          raw,
        });
        continue;
      }

      // Resolve brand if provided
      const brandName = String(record.brand || "").trim();
      const brandId = brandName
        ? brandByName.get(brandName.toLowerCase()) || null
        : null;

      // Parse numbers/booleans
      const quantity = Number(record.quantity ?? 0) || 0;
      // Legacy Excel isActive column maps to status for bulk import
      const importStatus =
        String(record.isActive ?? "").toLowerCase() === "true" ||
        String(record.isActive).toLowerCase() === "yes"
          ? ("active" as const)
          : ("pending" as const);
      const isFeatured =
        String(record.isFeatured ?? "").toLowerCase() === "true" ||
        String(record.isFeatured).toLowerCase() === "yes";
      const condition =
        (String(record.condition || "new").toLowerCase() as any) || "new";

      // Images
      let imagesArr: string[] = [];
      if (record.images) {
        if (Array.isArray(record.images))
          imagesArr = record.images.filter(Boolean).map((x: any) => String(x));
        else
          imagesArr = String(record.images)
            .split(/[;,.\n]/)
            .map((s) => s.trim())
            .filter(Boolean);
      }

      // Price
      const price = buildPriceObject({
        base:
          record.price?.base != null ? Number(record.price.base) : undefined,
        list:
          record.price?.list != null ? Number(record.price.list) : undefined,
        final:
          record.price?.final != null ? Number(record.price.final) : undefined,
        discountType: record.price?.discountType || null,
        discountValue:
          record.price?.discountValue != null
            ? Number(record.price.discountValue)
            : null,
        basePrice:
          record.basePrice !== undefined && record.basePrice !== ""
            ? Number(record.basePrice)
            : null,
        salePrice:
          record.salePrice !== undefined && record.salePrice !== ""
            ? Number(record.salePrice)
            : null,
      });

      // Flattened Variants: variant{n}_title, variant{n}_price, ...
      const variantBuckets: Record<string, any> = {};
      for (const [key, val] of Object.entries(raw)) {
        const m = String(key)
          .toLowerCase()
          .match(
            /^variant(\d+)_(title|price|stock|sku|imageurl|option1|option2|option3|barcode|position)$/
          );
        if (!m) continue;
        const idx = m[1]!;
        const field = m[2]!;
        const bucket = (variantBuckets[idx] = variantBuckets[idx] || {});
        bucket[field] = val;
      }
      const variants: ParsedBulkRow["variants"] = Object.keys(variantBuckets)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => {
          const v = variantBuckets[k]!;
          return {
            title: String(v.title || "").trim(),
            price: Number(v.price ?? 0) || 0,
            stock: v.stock != null ? Number(v.stock) : undefined,
            sku: String(v.sku || "").trim(),
            imageUrl: v.imageurl ? String(v.imageurl) : undefined,
            option1: v.option1 ? String(v.option1) : undefined,
            option2: v.option2 ? String(v.option2) : undefined,
            option3: v.option3 ? String(v.option3) : undefined,
            barCode: v.barcode ? String(v.barcode) : undefined,
            position: v.position != null ? Number(v.position) : undefined,
          };
        })
        .filter((v) => v.title && v.sku);

      // Flattened Q&A: q{n}_question, q{n}_answer
      const qaBuckets: Record<string, any> = {};
      for (const [key, val] of Object.entries(raw)) {
        const m = String(key)
          .toLowerCase()
          .match(/^q(\d+)_(question|answer)$/);
        if (!m) continue;
        const idx = m[1]!;
        const field = m[2]!;
        const bucket = (qaBuckets[idx] = qaBuckets[idx] || {});
        bucket[field] = val;
      }
      const qa: ParsedBulkRow["qa"] = Object.keys(qaBuckets)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => {
          const q = qaBuckets[k]!;
          return {
            question: String(q.question || "").trim(),
            answer: q.answer ? String(q.answer) : undefined,
          };
        })
        .filter((q) => q.question);

      // Bullet points: bullet1..bullet10
      const bullets: string[] = [];
      for (let bi = 1; bi <= 10; bi++) {
        const k = `bullet${bi}`;
        const v = (raw as any)[k] ?? (raw as any)[k.toUpperCase()];
        if (v !== undefined && v !== "") bullets.push(String(v));
      }

      // Dimensions: dimensions_length|width|height|weight
      const dimensions: any = {};
      const parts = ["length", "width", "height", "weight"];
      for (const p of parts) {
        const k1 = `dimensions_${p}`;
        const k2 = `dimension_${p}`;
        const val =
          (raw as any)[k1] ??
          (raw as any)[k2] ??
          (raw as any)[k1.toUpperCase()];
        if (val !== undefined && val !== "") dimensions[p] = Number(val);
      }

      // SEO: seo_title, seo_description, seo_keywords
      const seo: any = {};
      const seoTitle = (raw as any)["seo_title"] ?? (raw as any)["SEO_TITLE"];
      const seoDesc =
        (raw as any)["seo_description"] ?? (raw as any)["SEO_DESCRIPTION"];
      const seoKeywords =
        (raw as any)["seo_keywords"] ?? (raw as any)["SEO_KEYWORDS"];
      if (seoTitle) seo.title = String(seoTitle);
      if (seoDesc) seo.description = String(seoDesc);
      if (seoKeywords)
        seo.keywords = String(seoKeywords)
          .split(/[;,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);

      // Build product payload (no DB writes here)
      const slugBase = `${title}-${sku}`;
      const slug = slugify(slugBase, { lower: true, strict: true });
      valid.push({
        row: i + 2,
        product: {
          title,
          slug,
          description: record.description
            ? String(record.description)
            : undefined,
          sku,
          brandId: brandId ?? undefined,
          categoryId,
          price,
          quantity,
          images: imagesArr,
          status: importStatus,
          isFeatured,
          condition,
          conditionDescription: record.conditionDescription
            ? String(record.conditionDescription)
            : undefined,
          fulfillmentType: record.fulfillmentType
            ? String(record.fulfillmentType)
            : undefined,
          handlingTime:
            record.handlingTime !== undefined && record.handlingTime !== ""
              ? Number(record.handlingTime)
              : undefined,
          maxOrderQuantity:
            record.maxOrderQuantity !== undefined &&
            record.maxOrderQuantity !== ""
              ? Number(record.maxOrderQuantity)
              : undefined,
          isPlatformChoice:
            String(record.isPlatformChoice ?? "").toLowerCase() === "true" ||
            String(record.isPlatformChoice).toLowerCase() === "yes"
              ? true
              : undefined,
          isMostSelling:
            String(record.isMostSelling ?? "").toLowerCase() === "true" ||
            String(record.isMostSelling).toLowerCase() === "yes"
              ? true
              : undefined,
          taxClass: record.taxClass ? String(record.taxClass) : undefined,
          bulletPoints: bullets.length ? bullets : undefined,
          dimensions: Object.keys(dimensions).length ? dimensions : undefined,
          seo: Object.keys(seo).length ? seo : undefined,
        },
        variants,
        qa,
      });
    }

    return {
      success: true,
      valid,
      invalid,
      summary: { valid: valid.length, invalid: invalid.length },
    };
  } catch (error) {
    console.error("bulkUploadProductsAction (preview) error:", error);
    return {
      success: false,
      valid: [],
      invalid: [
        {
          row: 0,
          message: error instanceof Error ? error.message : "Unknown error",
          raw: {},
        },
      ],
      summary: { valid: 0, invalid: 1 },
    };
  }
}

// Confirm: take parsed records and insert into DB (includes variants and Q&A)
export async function bulkInsertProductsAction(records: ParsedBulkRow[]) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const results: {
      inserted: number;
      failed: number;
      errors: Array<{ row: number; message: string }>;
    } = {
      inserted: 0,
      failed: 0,
      errors: [],
    };

    for (const rec of records) {
      try {
        const res = await createProduct({
          title: rec.product.title,
          slug: rec.product.slug,
          description: rec.product.description,
          sku: rec.product.sku,
          brandId: rec.product.brandId,
          categoryId: rec.product.categoryId,
          price: rec.product.price as any,
          quantity: rec.product.quantity,
          bulletPoints: undefined,
          images: rec.product.images,
          dimensions: undefined,
          seo: undefined,
          condition: rec.product.condition,
          conditionDescription: undefined,
          fulfillmentType: "seller_fulfilled",
          handlingTime: 1,
          maxOrderQuantity: undefined,
          status: rec.product.status,
          isPlatformChoice: false,
          isMostSelling: false,
          isFeatured: rec.product.isFeatured,
          taxClass: "standard",
          variants: rec.variants || [],
        });

        if (!res.success || !res.data?.id) {
          results.failed++;
          results.errors.push({
            row: rec.row,
            message: res.error || "Failed to create product",
          });
          continue;
        }

        const productId = res.data.id as string;

        if (rec.qa && rec.qa.length) {
          for (const qa of rec.qa) {
            const q = await db
              .insert(productQuestions)
              .values({
                productId,
                userId: session.user.id,
                question: qa.question,
                isAnonymous: false,
                status: "approved" as any,
              } as any)
              .returning();
            const questionId = q[0]?.id as string | undefined;
            if (questionId && qa.answer) {
              await db.insert(productAnswers).values({
                questionId,
                userId: session.user.id,
                sellerId: session.user.id,
                answer: qa.answer,
                isAnonymous: false,
                isVerified: true,
                status: "approved" as any,
              } as any);
              await db
                .update(productQuestions)
                .set({ isAnswered: true })
                .where(eq(productQuestions.id as any, questionId as any));
            }
          }
        }

        results.inserted++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: rec.row,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Each createProduct() call above already invalidates and broadcasts
    // its own product's caches; only the local (uncached) dashboard list needs a nudge.
    revalidatePath("/products");
    return { success: true, ...results };
  } catch (error) {
    console.error("bulkInsertProductsAction error:", error);
    return {
      success: false,
      inserted: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    };
  }
}

/** Bulk-create products from add-product form payloads (URL bulk import). */
export async function bulkCreateProductsAction(
  products: Array<Record<string, unknown>>
) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const results: {
      inserted: number;
      failed: number;
      errors: Array<{ index: number; message: string }>;
    } = {
      inserted: 0,
      failed: 0,
      errors: [],
    };

    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      if (!product) continue;

      try {
        const res = await createProduct(product as any);
        if (!res.success || !res.data?.id) {
          results.failed++;
          results.errors.push({
            index,
            message: res.error || "Failed to create product",
          });
          continue;
        }
        results.inserted++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          index,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    revalidatePath("/products");
    return { success: true as const, ...results };
  } catch (error) {
    console.error("bulkCreateProductsAction error:", error);
    return {
      success: false as const,
      inserted: 0,
      failed: 0,
      errors: [
        {
          index: 0,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    };
  }
}

export async function getProduct(productId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.sellerId, session.user.id)
      ),
      with: {
        brand: true,
        productVariants: true,
        productTranslations: true,
        productQuestions: {
          with: {
            productAnswers: true,
          },
        },
        reviews: {
          limit: 10,
        },
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Build localized map from productTranslations for edit form
    const translations =
      (
        product as {
          productTranslations?: Array<{
            locale: string;
            title: string;
            slug: string | null;
            description: string | null;
            content: string | null;
            bulletPoints: unknown;
            metaTitle: string | null;
            metaDescription: string | null;
          }>;
        }
      ).productTranslations ?? [];
    const enRow = translations.find((t) => t.locale === "en");
    const arRow = translations.find((t) => t.locale === "ar");
    const localized = {
      en: {
        title: enRow?.title ?? "",
        slug: enRow?.slug ?? "",
        description: enRow?.description ?? undefined,
        content: enRow?.content ?? "",
        bulletPoints: enRow
          ? Array.isArray(enRow.bulletPoints)
            ? enRow.bulletPoints
            : []
          : [],
        metaTitle: enRow?.metaTitle ?? undefined,
        metaDescription: enRow?.metaDescription ?? undefined,
      },
      ar: arRow
        ? {
            title: arRow.title,
            slug: arRow.slug ?? "",
            description: arRow.description ?? undefined,
            content: arRow.content ?? "",
            bulletPoints: Array.isArray(arRow.bulletPoints)
              ? arRow.bulletPoints
              : [],
            metaTitle: arRow.metaTitle ?? undefined,
            metaDescription: arRow.metaDescription ?? undefined,
          }
        : {
            title: "",
            slug: "",
            description: "",
            content: "",
            bulletPoints: [],
            metaTitle: "",
            metaDescription: "",
          },
    };

    return {
      success: true,
      data: { ...product, localized },
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

type CreateProductLegacy = {
  productUrl?: string;
  title: string;
  slug: string;
  description?: string;
  sku?: string;
  brandId?: string;
  categoryId: string;
  price: any;
  quantity: number;
  bulletPoints?: any;
  images?: any;
  dimensions?: any;
  seo?: any;
  condition?: string;
  conditionDescription?: string;
  fulfillmentType?: string;
  handlingTime?: number;
  maxOrderQuantity?: number;
  status?: "draft" | "pending" | "active" | "rejected";
  isPlatformChoice?: boolean;
  isMostSelling?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  isSeasonal?: boolean;
  taxClass?: string;
  variants?: Array<{
    title: string;
    sku: string;
    price: number;
    stock?: number;
    imageUrl?: string;
    isDefault?: boolean;
    option1?: string;
    option2?: string;
    option3?: string;
    barCode?: string;
    position?: number;
  }>;
};

type CreateProductNew = Omit<
  CreateProductLegacy,
  "title" | "slug" | "description" | "bulletPoints" | "seo"
> & {
  localized: {
    en: {
      title: string;
      slug: string;
      description?: string;
      content?: string;
      bulletPoints?: string[];
      metaTitle?: string;
      metaDescription?: string;
    };
    ar: {
      title?: string;
      slug?: string;
      description?: string;
      content?: string;
      bulletPoints?: string[];
      metaTitle?: string;
      metaDescription?: string;
    };
  };
};

function hasLocalized(
  data: CreateProductLegacy | CreateProductNew
): data is CreateProductNew {
  return "localized" in data && data.localized != null;
}

export async function createProduct(
  data: CreateProductLegacy | CreateProductNew
) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const { productUrl: _productUrl, ...rest } = data as CreateProductLegacy & {
      productUrl?: string;
      localized?: CreateProductNew["localized"];
    };

    const sku =
      (typeof rest.sku === "string" && rest.sku.trim()) ||
      (await generateRandomSKU());

    const {
      localized: _localized,
      variants: _variantsForm,
      variantTypes: _variantTypes,
      title: _t,
      slug: _s,
      description: _d,
      bulletPoints: _b,
      seo: _seo,
      locale: _locale,
      ...sharedOnly
    } = rest as typeof rest & {
      localized?: CreateProductNew["localized"];
      variantTypes?: unknown;
      title?: string;
      slug?: string;
      description?: string;
      bulletPoints?: unknown;
      seo?: unknown;
      locale?: string;
    };

    // products table: shared data only (content lives in product_translations).
    // status is always seller-set to 'pending' here — it is not a field the
    // seller form is allowed to set directly, regardless of what `rest` carries.
    const productPayload = {
      ...sharedOnly,
      sku,
      sellerId: session.user.id,
      status: (rest as CreateProductLegacy).status ?? ("pending" as const),
    } as any;

    const slugsForSnapshot: { locale: string; slug: string | null }[] = [];

    const createdProduct = await db.transaction(async (tx) => {
      const newProduct = await tx
        .insert(products)
        .values(productPayload)
        .returning();
      const created = newProduct[0];
      if (!created) return created;

      // Insert variants if provided
      if (Array.isArray(rest.variants) && rest.variants.length > 0) {
        const normalizedVariants = applyDefaultVariantProductImages(
          normalizeVariantDefaultFlags(rest.variants),
          Array.isArray(rest.images) ? rest.images : null
        );
        const variantValues = normalizedVariants.map((v: any, index: number) => ({
          productId: created.id,
          ...mapVariantFormToDb(v, index),
        }));
        await tx.insert(productVariants).values(variantValues);
      }

      // Insert product_translations for en (always) and ar (if has content)
      let localizedData: CreateProductNew["localized"] | undefined;
      if (hasLocalized(data)) {
        localizedData = data.localized;
      } else {
        // Legacy flow: build localized from top-level fields
        localizedData = {
          en: {
            title: (data.title ?? "").trim() || "Untitled",
            slug:
              (data.slug ?? "").trim() ||
              slugify(data.title ?? "untitled", { lower: true, strict: true }),
            description: data.description?.trim(),
            content: "",
            bulletPoints: Array.isArray(data.bulletPoints)
              ? data.bulletPoints
              : [],
            metaTitle: (data.seo as any)?.metaTitle,
            metaDescription: (data.seo as any)?.metaDescription,
          },
          ar: {
            title: "",
            slug: "",
            description: "",
            content: "",
            bulletPoints: [],
            metaTitle: "",
            metaDescription: "",
          },
        };
      }

      if (localizedData) {
        const enTitle = (localizedData.en.title ?? "").trim() || "Untitled";
        const enSlug =
          (localizedData.en.slug ?? "").trim() ||
          slugify(localizedData.en.title ?? "untitled", {
            lower: true,
            strict: true,
          });
        const enRow = {
          productId: created.id,
          locale: "en" as const,
          title: enTitle,
          description: localizedData.en.description?.trim() || null,
          content: normalizeRichTextContent(localizedData.en.content),
          bulletPoints: localizedData.en.bulletPoints ?? [],
          slug: enSlug,
          metaTitle: localizedData.en.metaTitle?.trim() || null,
          metaDescription: localizedData.en.metaDescription?.trim() || null,
        };
        await tx.insert(productTranslations).values(enRow);
        slugsForSnapshot.push({ locale: "en", slug: enSlug });

        const arHasContent =
          (localizedData.ar?.title ?? "").trim() !== "" ||
          (localizedData.ar?.description ?? "").trim() !== "" ||
          (localizedData.ar?.content ?? "").trim() !== "" ||
          (localizedData.ar?.slug ?? "").trim() !== "" ||
          (localizedData.ar?.bulletPoints ?? []).length > 0 ||
          (localizedData.ar?.metaTitle ?? "").trim() !== "" ||
          (localizedData.ar?.metaDescription ?? "").trim() !== "";

        if (arHasContent) {
          const arSlug = localizedData.ar?.slug?.trim() || null;
          const arRow = {
            productId: created.id,
            locale: "ar" as const,
            title: (localizedData.ar!.title ?? "").trim() || enTitle,
            description: localizedData.ar?.description?.trim() || null,
            content: normalizeRichTextContent(localizedData.ar?.content),
            bulletPoints: localizedData.ar?.bulletPoints ?? [],
            slug: arSlug,
            metaTitle: localizedData.ar?.metaTitle?.trim() || null,
            metaDescription: localizedData.ar?.metaDescription?.trim() || null,
          };
          await tx.insert(productTranslations).values(arRow);
          slugsForSnapshot.push({ locale: "ar", slug: arSlug });
        }
      }

      return created;
    });

    if (createdProduct) {
      await applyInvalidation(
        invalidateProduct(null, {
          id: createdProduct.id,
          sellerId: createdProduct.sellerId,
          categoryId: createdProduct.categoryId,
          brandId: createdProduct.brandId,
          slugs: slugsForSnapshot,
          status: createdProduct.status,
          isFeatured: createdProduct.isFeatured ?? false,
          isTrending: createdProduct.isTrending ?? false,
          isSeasonal: createdProduct.isSeasonal ?? false,
          isMostSelling: createdProduct.isMostSelling ?? false,
          isPlatformChoice: createdProduct.isPlatformChoice ?? false,
          priceKey: JSON.stringify(createdProduct.price ?? null),
        }),
        { from: "dashboard", mode: "action" }
      );
    }

    return { success: true, data: createdProduct };
  } catch (error: any) {
    console.error("Error creating product:", error);

    const skuUsed = (data as CreateProductLegacy).sku || "generated";

    if (error?.code === "23505" && error?.constraint_name?.includes("slug")) {
      const slugUsed = hasLocalized(data)
        ? data.localized.en.slug
        : (data as CreateProductLegacy).slug;
      return {
        success: false,
        error: `A product with the slug "${slugUsed}" already exists. Please use a different slug.`,
      };
    }
    if (error?.code === "23505" && error?.constraint_name?.includes("sku")) {
      return {
        success: false,
        error: `A product with the SKU "${skuUsed}" already exists. Please use a different SKU.`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateProduct(
  productId: string,
  data: Partial<typeof products.$inferInsert> & {
    variants?: Array<{
      title: string;
      sku: string;
      price: number;
      stock?: number;
      images?: string[];
      imageUrl?: string;
      isDefault?: boolean;
      option1?: string;
      option2?: string;
      option3?: string;
      barCode?: string;
      position?: number;
    }>;
    localized?: {
      en: {
        title: string;
        slug: string;
        description?: string;
        content?: string;
        bulletPoints?: string[];
        metaTitle?: string;
        metaDescription?: string;
      };
      ar: {
        title?: string;
        slug?: string;
        description?: string;
        content?: string;
        bulletPoints?: string[];
        metaTitle?: string;
        metaDescription?: string;
      };
    };
  }
) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const before = await toSnapshot(productId);
    if (!before || before.sellerId !== session.user.id) {
      throw new Error("Product not found or unauthorized");
    }

    // Extract variants, localized, notes and content columns (content lives in product_translations)
    type FormOnly = {
      title?: string;
      slug?: string;
      description?: string;
      bulletPoints?: unknown;
      seo?: unknown;
      locale?: string;
      productUrl?: string;
      notes?: string;
      variantTypes?: unknown;
    };
    const {
      variants,
      variantTypes: _variantTypes,
      localized: localizedData,
      title: _t,
      slug: _s,
      description: _d,
      bulletPoints: _b,
      seo: _seo,
      locale: _locale,
      productUrl: _productUrl,
      notes: _notes,
      ...productData
    } = data as typeof data & FormOnly;

    const updatedProduct = await db.transaction(async (tx) => {
      // Update the main product (shared fields only). Any seller edit sends
      // the product back to review — status is never left as-is here, and
      // it is never taken from `productData` (the seller form cannot set it).
      const updated = await tx
        .update(products)
        .set({
          ...productData,
          status: "pending",
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(eq(products.id, productId), eq(products.sellerId, session.user.id))
        )
        .returning();

      if (!updated.length) {
        throw new Error("Product not found or unauthorized");
      }

      // Update product_translations for en and ar when localized is provided
      if (localizedData) {
        const enTitle = (localizedData.en?.title ?? "").trim() || "Untitled";
        const enSlug =
          (localizedData.en?.slug ?? "").trim() ||
          slugify(localizedData.en?.title ?? "untitled", {
            lower: true,
            strict: true,
          });
        await tx
          .update(productTranslations)
          .set({
            title: enTitle,
            slug: enSlug,
            description: localizedData.en?.description?.trim() || null,
            content: normalizeRichTextContent(localizedData.en?.content),
            bulletPoints: localizedData.en?.bulletPoints ?? [],
            metaTitle: localizedData.en?.metaTitle?.trim() || null,
            metaDescription: localizedData.en?.metaDescription?.trim() || null,
          })
          .where(
            and(
              eq(productTranslations.productId, productId),
              eq(productTranslations.locale, "en")
            )
          );

        const arHasContent =
          (localizedData.ar?.title ?? "").trim() !== "" ||
          (localizedData.ar?.description ?? "").trim() !== "" ||
          (localizedData.ar?.content ?? "").trim() !== "" ||
          (localizedData.ar?.slug ?? "").trim() !== "" ||
          (localizedData.ar?.bulletPoints ?? []).length > 0 ||
          (localizedData.ar?.metaTitle ?? "").trim() !== "" ||
          (localizedData.ar?.metaDescription ?? "").trim() !== "";

        if (arHasContent && localizedData.ar) {
          const arRow = await tx.query.productTranslations.findFirst({
            where: and(
              eq(productTranslations.productId, productId),
              eq(productTranslations.locale, "ar")
            ),
          });
          const arPayload = {
            title: (localizedData.ar.title ?? "").trim() || enTitle,
            slug: localizedData.ar.slug?.trim() || null,
            description: localizedData.ar.description?.trim() || null,
            content: normalizeRichTextContent(localizedData.ar.content),
            bulletPoints: localizedData.ar.bulletPoints ?? [],
            metaTitle: localizedData.ar.metaTitle?.trim() || null,
            metaDescription: localizedData.ar.metaDescription?.trim() || null,
          };
          if (arRow) {
            await tx
              .update(productTranslations)
              .set(arPayload)
              .where(
                and(
                  eq(productTranslations.productId, productId),
                  eq(productTranslations.locale, "ar")
                )
              );
          } else {
            await tx.insert(productTranslations).values({
              productId,
              locale: "ar",
              ...arPayload,
            });
          }
        }
      }

      // Handle variants if provided
      if (variants && Array.isArray(variants)) {
        // First, delete existing variants
        await tx
          .delete(productVariants)
          .where(eq(productVariants.productId, productId));

        // Then insert new variants if any
        if (variants.length > 0) {
          const productImages = Array.isArray(productData.images)
            ? productData.images.filter(
                (image): image is string =>
                  typeof image === "string" && image.length > 0
              )
            : Array.isArray(updated[0]?.images)
              ? updated[0].images.filter(
                  (image): image is string =>
                    typeof image === "string" && image.length > 0
                )
              : null;
          const normalizedVariants = applyDefaultVariantProductImages(
            normalizeVariantDefaultFlags(variants),
            productImages
          );
          const variantValues = normalizedVariants.map((v, index) => ({
            productId,
            ...mapVariantFormToDb(v, index),
          }));

          await tx.insert(productVariants).values(variantValues);
        }
      }

      return updated;
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    const after = await toSnapshot(productId);
    await applyInvalidation(invalidateProduct(before, after), {
      from: "dashboard",
      mode: "action",
    });

    return { success: true, data: updatedProduct[0] };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function toggleProductStatus(productId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.sellerId, session.user.id)
      ),
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.status !== "active" && product.status !== "draft") {
      return {
        success: false,
        error: `Cannot toggle product with status "${product.status}"`,
      };
    }

    const before = await toSnapshot(productId);

    const nextStatus = product.status === "active" ? "draft" : "pending";

    const updatedProduct = await db
      .update(products)
      .set({
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(products.id, productId))
      .returning();

    const after = await toSnapshot(productId);
    await applyInvalidation(invalidateProduct(before, after), {
      from: "dashboard",
      mode: "action",
    });

    return { success: true, data: updatedProduct[0] };
  } catch (error) {
    console.error("Error toggling product status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createProductVariant(data: {
  productId: string;
  title: string;
  price: string;
  stock: number;
  sku: string;
  option1?: string;
  option2?: string;
  option3?: string;
  imageUrl?: string;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify product ownership
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, data.productId),
        eq(products.sellerId, session.user.id)
      ),
    });

    if (!product) {
      throw new Error("Product not found or unauthorized");
    }

    const newVariant = await db
      .insert(productVariants)
      .values(data)
      .returning();

    return { success: true, data: newVariant[0] };
  } catch (error) {
    console.error("Error creating variant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function answerProductQuestion(data: {
  questionId: string;
  answer: string;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify the question exists and belongs to a product owned by this seller
    const questionRow = await db
      .select({ productId: productQuestions.productId })
      .from(productQuestions)
      .where(eq(productQuestions.id, data.questionId));

    if (!questionRow.length) {
      throw new Error("Question not found");
    }

    const productRow = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, questionRow[0].productId as any),
          eq(products.sellerId, session.user.id)
        )
      );

    if (!productRow.length) {
      throw new Error("Unauthorized to answer this question");
    }

    const newAnswer = await db
      .insert(productAnswers)
      .values({
        questionId: data.questionId,
        answer: data.answer,
        sellerId: session.user.id,
        userId: session.user.id,
        isVerified: true,
      })
      .returning();

    await db
      .update(productQuestions)
      .set({ isAnswered: true })
      .where(eq(productQuestions.id, data.questionId));

    return { success: true, data: newAnswer[0] };
  } catch (error) {
    console.error("Error answering question:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateProductAnswer(data: {
  answerId: string;
  answer: string;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const updated = await db
      .update(productAnswers)
      .set({
        answer: data.answer,
        updatedAt: new Date().toISOString(),
      } as any)
      .where(
        and(
          eq(productAnswers.id, data.answerId),
          eq(productAnswers.sellerId, session.user.id)
        )
      )
      .returning();

    if (!updated.length) {
      throw new Error("Answer not found or unauthorized");
    }

    return { success: true, data: updated[0] };
  } catch (error) {
    console.error("Error updating answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Form wrappers for use with <form action={...}>
export async function answerProductQuestionAction(formData: FormData) {
  try {
    const questionId = String(formData.get("questionId") || "");
    const answer = String(formData.get("answer") || "");
    const productId = String(formData.get("productId") || "");
    if (!questionId || !answer) {
      throw new Error("Missing fields");
    }
    const res = await answerProductQuestion({ questionId, answer });
    if (productId) {
      revalidatePath(`/products/${productId}`);
    }
    return res;
  } catch (error) {
    console.error("answerProductQuestionAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateProductAnswerAction(formData: FormData) {
  try {
    const answerId = String(formData.get("answerId") || "");
    const answer = String(formData.get("answer") || "");
    const productId = String(formData.get("productId") || "");
    if (!answerId || !answer) {
      throw new Error("Missing fields");
    }
    const res = await updateProductAnswer({ answerId, answer });
    if (productId) {
      revalidatePath(`/products/${productId}`);
    }
    return res;
  } catch (error) {
    console.error("updateProductAnswerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.sellerId, session.user.id)
      ),
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const before = await toSnapshot(productId);

    // Scope the delete itself by sellerId — previously guarded only by the
    // findFirst above, not by the delete's own WHERE clause.
    await db
      .delete(products)
      .where(
        and(eq(products.id, productId), eq(products.sellerId, session.user.id))
      );

    if (before) {
      await applyInvalidation(invalidateProduct(before, null), {
        from: "dashboard",
        mode: "action",
      });
    }

    return { success: true, data: product };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getSellerUnansweredQuestions(params?: {
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const limit = params?.limit ?? 5;
    const offset = params?.offset ?? 0;

    const rows = await db
      .select({
        id: productQuestions.id,
        question: productQuestions.question,
        createdAt: productQuestions.createdAt,
        productId: products.id,
        productTitle: productTranslations.title,
        productSku: products.sku,
        productImages: products.images,
      })
      .from(productQuestions)
      .leftJoin(products, eq(productQuestions.productId as any, products.id))
      .leftJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.locale, "en")
        )
      )
      .where(
        and(
          eq(products.sellerId, session.user.id),
          eq(productQuestions.isAnswered, false)
        )
      )
      .orderBy(desc(productQuestions.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql`count(*)` })
      .from(productQuestions)
      .leftJoin(products, eq(productQuestions.productId as any, products.id))
      .where(
        and(
          eq(products.sellerId, session.user.id),
          eq(productQuestions.isAnswered, false)
        )
      );

    return {
      success: true,
      data: rows,
      totalCount: Number((total[0] as any)?.count ?? 0),
    };
  } catch (error) {
    console.error("Error fetching unanswered questions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getSellerQuestions(params?: {
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;

    const rows = await db
      .select({
        id: productQuestions.id,
        question: productQuestions.question,
        createdAt: productQuestions.createdAt,
        isAnswered: productQuestions.isAnswered,
        productId: products.id,
        productTitle: productTranslations.title,
        productSku: products.sku,
        productImages: products.images,
      })
      .from(productQuestions)
      .leftJoin(products, eq(productQuestions.productId as any, products.id))
      .leftJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.locale, "en")
        )
      )
      .where(eq(products.sellerId, session.user.id))
      .orderBy(
        asc(productQuestions.isAnswered),
        desc(productQuestions.createdAt)
      )
      .limit(limit)
      .offset(offset);

    const qids = rows.map((r) => r.id);
    let answersByQuestion: Record<string, any[]> = {};
    if (qids.length > 0) {
      const answers = await db
        .select({
          id: productAnswers.id,
          questionId: productAnswers.questionId,
          answer: productAnswers.answer,
          createdAt: productAnswers.createdAt,
          sellerId: productAnswers.sellerId,
        })
        .from(productAnswers)
        .where(inArray(productAnswers.questionId as any, qids as any))
        .orderBy(desc(productAnswers.createdAt));

      for (const a of answers) {
        const key = String(a.questionId);
        if (!answersByQuestion[key]) answersByQuestion[key] = [];
        answersByQuestion[key]!.push(a);
      }
    }

    return {
      success: true,
      data: rows.map((r) => ({
        ...r,
        answers: answersByQuestion[String(r.id)] ?? [],
      })),
      totalCount: rows.length,
    };
  } catch (error) {
    console.error("Error fetching questions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
