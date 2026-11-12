"use server";

import {
  applyInvalidation,
  invalidateProduct,
  invalidateSellerProducts,
  mergeInvalidations,
  type ProductCacheSnapshot,
} from "@workspace/cache";
import { and, db, eq, productTranslations, products } from "@workspace/db";
import { customerFieldsSchema } from "@workspace/lib/products/customer-fields";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";

export type CustomerFieldsSaveResult = { success: true } | { success: false; error: "invalidInput" | "notFound" | "readOnly" | "generic" };

/**
 * Saves the product form's "Customer requirements" (0167, ROADMAP.md F-91)
 * after createProduct / updateProduct, like saveProductSocialProof, so
 * actions/products.ts stays untouched. The store must be the session seller's
 * and the product in it (`productInStore`, scope `managed`, in the same
 * UPDATE), else `notFound`. The fields are checked by the shared zod schema
 * (counts, lengths, prices); an empty list saves NULL. Carts already holding
 * the product are checked again at checkout, so a changed field never charges
 * a different amount silently.
 */
export async function saveProductCustomerFields(storeId: string, productId: string, input: unknown): Promise<CustomerFieldsSaveResult> {
  try {
    const { seller, inStore } = await requireProductStore(storeId);
    const parsed = customerFieldsSchema.safeParse(input);
    if (!parsed.success || typeof productId !== "string") return { success: false, error: "invalidInput" };
    const customerFields = parsed.data.length ? parsed.data : null;

    const [row] = await db
      .update(products)
      .set({ customerFields })
      .where(and(eq(products.id, productId), eq(products.sellerId, seller.sellerId), inStore))
      .returning({
        id: products.id,
        sellerId: products.sellerId,
        storeId: products.storeId,
        categoryId: products.categoryId,
        brandId: products.brandId,
        status: products.status,
      });
    if (!row) return { success: false, error: "notFound" };

    // The product page caches (by slug and by store) and the store lists (the
    // card's quick add follows the required fields).
    const translations = await db
      .select({ locale: productTranslations.locale, slug: productTranslations.slug })
      .from(productTranslations)
      .where(eq(productTranslations.productId, row.id));
    const snapshot: ProductCacheSnapshot = {
      id: row.id,
      sellerId: row.sellerId,
      storeId: row.storeId,
      categoryId: row.categoryId,
      brandId: row.brandId,
      slugs: translations.map((t) => ({ locale: t.locale, slug: t.slug })),
      status: row.status,
      isFeatured: false,
      isTrending: false,
      isSeasonal: false,
      isMostSelling: false,
      isPlatformChoice: false,
      sponsored: false,
      priceKey: "",
    };
    await applyInvalidation(mergeInvalidations(invalidateProduct(snapshot, snapshot), invalidateSellerProducts(seller.sellerId)), {
      from: "dashboard",
      mode: "action",
    });
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) {
      const readOnly = error.code === "seller_blocked" || error.code === "store_read_only";
      return { success: false, error: readOnly ? "readOnly" : "notFound" };
    }
    console.error("[customer-fields] save failed", error);
    return { success: false, error: "generic" };
  }
}
