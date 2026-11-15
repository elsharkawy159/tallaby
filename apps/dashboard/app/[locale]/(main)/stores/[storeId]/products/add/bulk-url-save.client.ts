import { createProduct, setProductPublished } from "@/actions/products";
import { ensureTaxonomyItem, setProductSellerTaxonomy } from "../categories-brands/categories-brands.server";
import { saveProductSocialProof } from "../social-proof/social-proof.server";
import type { SellerTaxonomyOption } from "../categories-brands/categories-brands.dto";
import type { AddProductFormData } from "./add-product.schema";
import { toProductPayload } from "./prepare-product-submit.lib";

export type BulkSaveResult =
  | { ok: true; productId: string; draft: boolean; warning?: "category" | "settings" | "status" }
  | { ok: false; error?: string }

/**
 * Store categories found or added during one Save all, keyed by typed name or
 * Tallaby id, so ten rows with the same new name add it once.
 */
export type StoreCategoryCache = Map<string, Promise<SellerTaxonomyOption | null>>

function storeCategory (
  storeId: string,
  data: AddProductFormData,
  cache: StoreCategoryCache
): Promise<SellerTaxonomyOption | null> | null {
  const name = data.sellerCategoryName?.trim();
  if (!name && !data.categoryId) return null;
  const key = name ? `name:${name.toLowerCase()}` : `source:${data.categoryId}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = ensureTaxonomyItem(storeId, "category", name ? { name } : { sourceId: data.categoryId })
      .then((result) => (result.success ? result.data : null))
      .catch(() => null);
    cache.set(key, pending);
  }
  return pending;
}

/**
 * Saves one checked row the way the product form saves a new product:
 * createProduct (stock reason "import"), then its store category (a typed name
 * or a Tallaby pick is found in, or added to, the store's list), then stock
 * tracking, then draft when asked. The store is always the URL store, checked
 * again by every action against the session (rule 5).
 */
export async function saveBulkProduct (
  storeId: string,
  data: AddProductFormData,
  options: { draft: boolean; cache: StoreCategoryCache; onCategory?: (option: SellerTaxonomyOption) => void }
): Promise<BulkSaveResult> {
  const { payload, taxonomy } = toProductPayload(data);
  const created = await createProduct(storeId, payload as Parameters<typeof createProduct>[1], { stockReason: "import" });
  if (!created.success || !created.data?.id) {
    return { ok: false, error: "error" in created && typeof created.error === "string" ? created.error : undefined };
  }
  const productId = created.data.id;
  let warning: "category" | "settings" | "status" | undefined;

  const chosen = data.sellerCategoryName?.trim() ? null : data.sellerCategoryId || null;
  const option = chosen ? null : await storeCategory(storeId, data, options.cache);
  if (option) options.onCategory?.(option);
  const sellerCategoryId = chosen ?? option?.id ?? null;
  const linked = await setProductSellerTaxonomy(storeId, productId, { ...taxonomy, sellerCategoryId });
  if (!linked.success || (data.sellerCategoryName?.trim() && !sellerCategoryId)) warning = "category";

  const settings = await saveProductSocialProof(storeId, productId, {
    showLiveViews: data.showLiveViews ?? false,
    trackStock: data.trackStock ?? true,
    showLowStockBadge: data.showLowStockBadge ?? false,
    lowStockThreshold: data.lowStockThreshold ?? null,
    minOrderQuantity: data.minOrderQuantity ?? 1,
    reviews: [],
  });
  if (!settings.success) warning ??= "settings";

  let draft = created.data.status !== "active";
  if (options.draft && !draft) {
    const unpublished = await setProductPublished(storeId, productId, false);
    if (unpublished.success) draft = true;
    else warning ??= "status";
  }
  return { ok: true, productId, draft, warning };
}
