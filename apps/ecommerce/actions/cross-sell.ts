"use server";

import { revalidatePath } from "next/cache";
import { cacheProfiles, createCachedQuery, productTags, storeTags } from "@workspace/cache";
import { and, cartItems, carts, db, eq, inArray, isNull, or, productCrossSells, products, productTranslations, productVariants, stores } from "@workspace/db";
import { getPriceFinal } from "@workspace/lib";
import { crossSellUnitDiscountPiastres } from "@workspace/lib/orders/cross-sell";
import { findStoreOffer } from "@workspace/lib/orders/cross-sell/server";
import { getLocale } from "next-intl/server";
import { addToCart } from "@/actions/cart";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { getCartScope } from "@/lib/storefront.server";
import { isSwitchOn } from "@/lib/platform-switches.server";
import { productShownInStore } from "@workspace/lib/stores/scope/server";

export type CrossSellCard = {
  offerId: string;
  mainProductId: string;
  productId: string;
  title: string;
  image: string | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  /** In-stock choices. Empty for a product with no variants. */
  variants: { id: string; title: string; unitPiastres: number; discountedPiastres: number }[];
  unitPiastres: number;
  discountedPiastres: number;
};

/**
 * Offers on these main products for one store: only active and in-stock products
 * this store shows (`productInStore`, scope `shown`). Cached per seller, store and
 * catalog mode (the switch is read by the caller, F-87c); the price, stock and
 * store catalog tags keep it right. The checkout recomputes the discount from the
 * database, never from this.
 */
const loadOffers = createCachedQuery({
  name: "storefront:cross-sell:v2",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, mainProductIds: string[], _locale: string, _catalogSplit: boolean) => [
    storeTags.crossSells(sellerId, storeId),
    storeTags.catalog(sellerId, storeId),
    productTags.store(sellerId, storeId),
    ...mainProductIds.map((id) => productTags.detail(id)),
  ],
  query: async (sellerId: string, storeId: string, mainProductIds: string[], locale: string, catalogSplit: boolean): Promise<CrossSellCard[]> => {
    const [store] = await db.select({ enabled: stores.crossSellEnabled }).from(stores).where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId))).limit(1);
    if (!store?.enabled || mainProductIds.length === 0) return [];
    const rows = await db
      .select()
      .from(productCrossSells)
      .where(
        and(
          eq(productCrossSells.sellerId, sellerId),
          inArray(productCrossSells.productId, mainProductIds),
          eq(productCrossSells.isActive, true),
          or(isNull(productCrossSells.storeId), eq(productCrossSells.storeId, storeId)),
        ),
      )
      .orderBy(productCrossSells.sortOrder);
    const ids = [...new Set(rows.map((row) => row.offerProductId))];
    if (ids.length === 0) return [];
    const [items, titles, variants] = await Promise.all([
      // Only what this store shows (the same rule as storeSellsProduct before the split).
      db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, ids),
            eq(products.sellerId, sellerId),
            eq(products.status, "active"),
            isNull(products.deletedAt),
            productShownInStore({ storeId, catalogSplit }),
          ),
        ),
      db.select().from(productTranslations).where(inArray(productTranslations.productId, ids)),
      db.select().from(productVariants).where(inArray(productVariants.productId, ids)),
    ]);
    const cards: CrossSellCard[] = [];
    for (const row of rows) {
      const product = items.find((item) => item.id === row.offerProductId);
      if (!product) continue;
      const type = row.discountType === "fixed" ? "fixed" : "percent";
      const value = Number(row.discountValue);
      const tracked = product.trackStock !== false;
      const discounted = (price: number) => {
        const unit = Math.round(price * 100);
        return { unitPiastres: unit, discountedPiastres: unit - crossSellUnitDiscountPiastres(unit, type, value) };
      };
      const own = variants.filter((variant) => variant.productId === product.id);
      const choices = own
        .filter((variant) => (row.offerVariantId ? variant.id === row.offerVariantId : true))
        .filter((variant) => !tracked || Number(variant.stock ?? 0) > 0)
        .map((variant) => ({
          id: variant.id,
          title: variant.title ?? "",
          ...discounted(getPriceFinal(variant.price)),
        }));
      if (own.length > 0 && choices.length === 0) continue;
      if (own.length === 0 && tracked && Number(product.quantity ?? 0) <= 0) continue;
      const translations = titles.filter((title) => title.productId === product.id);
      const title = (translations.find((t) => t.locale === locale) ?? translations[0])?.title ?? "";
      const base = choices[0] ?? discounted(getPriceFinal(product.price));
      cards.push({
        offerId: row.id,
        mainProductId: row.productId,
        productId: product.id,
        title,
        image: (product.images as string[] | null)?.[0] ?? null,
        discountType: type,
        discountValue: value,
        variants: choices,
        unitPiastres: base.unitPiastres,
        discountedPiastres: base.discountedPiastres,
      });
    }
    return cards;
  },
});

/** The store comes from the request host, never the client. */
async function hostStore() {
  const scope = await getCartScope();
  return scope?.storeId && scope.sellerId ? { id: scope.storeId, sellerId: scope.sellerId } : null;
}

/** Offers for the products on this page or in this cart, for the request's own store. */
export async function getCrossSellOffers(mainProductIds: string[]): Promise<CrossSellCard[]> {
  try {
    const store = await hostStore();
    if (!store || !Array.isArray(mainProductIds)) return [];
    const ids = [...new Set(mainProductIds.filter((id) => typeof id === "string"))].sort().slice(0, 30);
    return await loadOffers(store.sellerId, store.id, ids, await getLocale(), await isSwitchOn("stores_catalog_split"));
  } catch (error) {
    console.error("[cross-sell] offers failed", (error as Error)?.name);
    return [];
  }
}

/**
 * Adds the offer's product to this customer's cart and notes the offer on the
 * line. `addToCart` runs its normal stock and store checks, and the price stays
 * full: the discount is only ever computed at checkout, from the database.
 */
export async function addCrossSellToCart(offerId: string, variantId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const store = await hostStore();
    const userId = await getCurrentUserId();
    if (!store || !userId || typeof offerId !== "string") return { success: false };
    const offer = await findStoreOffer(store.sellerId, store.id, offerId);
    if (!offer) return { success: false };
    const chosen = offer.offerVariantId ?? (typeof variantId === "string" ? variantId : undefined);

    const result = await addToCart({ productId: offer.offerProductId, quantity: 1, variantId: chosen, exactQuantity: true });
    if (!result.success || !("data" in result) || !result.data) {
      return { success: false, error: "error" in result ? (result.error as string) : undefined };
    }
    await db
      .update(cartItems)
      .set({ crossSellId: offer.id })
      .where(
        and(
          eq(cartItems.id, (result.data as { id: string }).id),
          inArray(cartItems.cartId, db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId))),
        ),
      );
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("[cross-sell] add failed", (error as Error)?.name);
    return { success: false };
  }
}
