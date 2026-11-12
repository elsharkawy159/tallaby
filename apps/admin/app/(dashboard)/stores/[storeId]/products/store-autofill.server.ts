import "server-only";
import { aiUsageLogs, and, asc, count, db, eq, gte, sellerProductCategories } from "@workspace/db";
import { cairoDayStart, generateStructured, type GenerateContentPart } from "@workspace/ai";
import {
  AUTOFILL_CALL_OPTIONS,
  AUTOFILL_SYSTEM_RULES,
  autofillRequestText,
  cairoToday,
  cleanAutofillOutput,
  productAutofillOutputSchema,
  type AutofillInput,
  type ProductAutofillOutput,
} from "@workspace/lib/products/autofill";
import { taxonomyInStore } from "@workspace/lib/stores/scope/server";
import { isSwitchOn } from "@workspace/lib/stores/switches/server";
import type { AdminStoreProductsAccess } from "./store-products-access.server";
import { ADMIN_AUTOFILL_DAILY_LIMIT, ADMIN_AUTOFILL_FEATURE } from "./store-products.lib";

/**
 * Admin's AI product autofill for a store: the seller dashboard's prompt,
 * output schema, cleaning and call settings (@workspace/lib/products/autofill;
 * fast tier, medium media, minimal thinking, 10-minute result cache), through
 * `generateStructured` like every AI call (docs/ai.md).
 *
 * Who pays: Tallaby, not the seller. No AI credit is claimed from the
 * seller's ledger and the call is logged under its own feature
 * (`admin_product_autofill`), which no seller cap counts. ai_usage_logs needs
 * a seller (seller_id NOT NULL), so the row carries the store's seller with
 * ref_id = the acting admin, and Admin's own daily cap counts by that admin.
 */

export const adminDailyLimit = () => {
  const value = Number(process.env.AI_ADMIN_PRODUCT_AUTOFILL_DAILY_LIMIT);
  return Number.isInteger(value) && value >= 0 ? value : ADMIN_AUTOFILL_DAILY_LIMIT;
};

/** Successful admin autofill calls by this admin since the start of today in Cairo. */
export async function adminAutofillUsedToday(adminId: string, now = new Date()): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(aiUsageLogs)
    .where(
      and(
        eq(aiUsageLogs.feature, ADMIN_AUTOFILL_FEATURE),
        eq(aiUsageLogs.refId, adminId),
        eq(aiUsageLogs.status, "ok"),
        gte(aiUsageLogs.createdAt, cairoDayStart(now).toISOString()),
      ),
    );
  return row?.value ?? 0;
}

export async function adminAutofillProduct(
  access: AdminStoreProductsAccess,
  input: AutofillInput,
): Promise<{ output: ProductAutofillOutput; cached: boolean }> {
  const today = cairoToday();
  // The store's own category names (a short list the seller owns), as the dashboard sends them.
  const scope = { sellerId: access.store.sellerId, storeId: access.store.id, catalogSplit: await isSwitchOn("stores_catalog_split") };
  const owned = await db
    .select({ name: sellerProductCategories.name, nameAr: sellerProductCategories.nameAr })
    .from(sellerProductCategories)
    .where(taxonomyInStore(sellerProductCategories, scope))
    .orderBy(asc(sellerProductCategories.position))
    .limit(300);
  const storeCategories = owned.map((c) => c.nameAr || c.name).filter(Boolean);

  const content: GenerateContentPart[] = [
    {
      type: "text",
      text: autofillRequestText({ ...input, imageCount: input.images.length, hasPdf: Boolean(input.pdf) }, { today, storeCategories }),
    },
    ...input.images.map((image) => ({ type: "image" as const, data: image.data, mediaType: image.mediaType })),
    ...(input.pdf ? [{ type: "file" as const, data: input.pdf.data, mediaType: input.pdf.mediaType }] : []),
  ];

  const { object, cached } = await generateStructured({
    ...AUTOFILL_CALL_OPTIONS,
    feature: ADMIN_AUTOFILL_FEATURE,
    sellerId: access.store.sellerId,
    refId: access.adminId,
    schema: productAutofillOutputSchema,
    system: AUTOFILL_SYSTEM_RULES,
    content,
  });

  return {
    cached: Boolean(cached),
    output: cleanAutofillOutput(object, { sellerText: input.text, hasPdf: Boolean(input.pdf), imageCount: input.images.length, today }),
  };
}
