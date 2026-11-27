import { and, db, eq, products } from "@workspace/db";
import { CATEGORY_KIND_MISMATCH, toProductKind } from "@workspace/lib/products/category-kind";
import { loadCategoryKind } from "@workspace/lib/products/category-kind/server";

/**
 * createProduct / updateProduct (F-108e): a payload's Tallaby category
 * (`categoryId`, when present) must be of the product's kind. The kind is the
 * form's `categoryKind` (the type it's about to save; saveProductDigital then
 * checks the saved type against the category again), else, for an update, the
 * product's stored type, else physical: the bulk imports and every other
 * caller only ever get physical categories. Throws `Error(category_kind_mismatch)`,
 * which both actions return as their `error`.
 */
export async function assertCategoryKindForProduct(
  data: { categoryId?: unknown; categoryKind?: unknown },
  existing?: { productId: string; sellerId: string },
): Promise<void> {
  const categoryId = data.categoryId;
  if (typeof categoryId !== "string" || !categoryId) return;
  const kind = await loadCategoryKind(categoryId);
  if (kind === null) return;

  let declared = data.categoryKind === "digital" || data.categoryKind === "physical" ? data.categoryKind : null;
  if (!declared && existing) {
    const [row] = await db
      .select({ productType: products.productType })
      .from(products)
      .where(and(eq(products.id, existing.productId), eq(products.sellerId, existing.sellerId)))
      .limit(1);
    declared = toProductKind(row?.productType);
  }
  if (kind !== (declared ?? "physical")) throw new Error(CATEGORY_KIND_MISMATCH);
}
