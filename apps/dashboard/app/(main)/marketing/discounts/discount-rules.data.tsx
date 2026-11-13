import { getLocale, getTranslations } from "next-intl/server";
import { parseStoreCurrency } from "@workspace/lib";
import { getStore } from "@workspace/lib/stores/server";
import { asc, db, sellerProductCategories } from "@workspace/db";
import { taxonomyInStore } from "@workspace/lib/stores/scope/server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { PageHeader } from "@/components/seller-ui";
import { ProductStoreProvider } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";
import { DiscountRulesView } from "./discount-rules.client";
import { listDiscountRules } from "./discount-rules.server";
import { labelStoreCategories } from "@/lib/stores/category-labels.lib";

/**
 * Automatic discounts of one store the session's seller owns (ROADMAP.md F-13a).
 * The URL's store wins when it is one of theirs, else the sidebar's selected store.
 */
export async function DiscountRulesData(props: { storeId: string | null }) {
  const [seller, { stores, selected }, t, locale, catalogSplit] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("discountRules"),
    getLocale(),
    isSwitchOn("stores_catalog_split"),
  ]);
  const store = stores.find((s) => s.id === props.storeId) ?? selected;
  const [rules, storeRow, categories] = await Promise.all([
    store ? listDiscountRules(store.id) : [],
    store ? getStore(seller.sellerId, store.id) : null,
    db
      .select({
        id: sellerProductCategories.id,
        name: sellerProductCategories.name,
        nameAr: sellerProductCategories.nameAr,
        parentId: sellerProductCategories.parentId,
        position: sellerProductCategories.position,
      })
      .from(sellerProductCategories)
      // The category scope picker: the store's list (the seller's before the split, F-87d); the save checks it again.
      .where(taxonomyInStore(sellerProductCategories, { sellerId: seller.sellerId, storeId: store?.id ?? null, catalogSplit }))
      .orderBy(asc(sellerProductCategories.position), asc(sellerProductCategories.createdAt)),
  ]);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {/* The gift product picker lists this store's products (F-87c); the save checks them again. */}
      <ProductStoreProvider storeId={store?.id ?? ""}>
        <DiscountRulesView
          key={store?.id ?? "none"}
          stores={stores.map((s) => ({ id: s.id, name: s.name }))}
          storeId={store?.id ?? null}
          money={parseStoreCurrency(storeRow?.settings)}
          initial={rules}
          // Tree order, a sub-category as "Main › Sub" (0171).
          categories={labelStoreCategories(categories, locale)}
        />
      </ProductStoreProvider>
    </>
  );
}
