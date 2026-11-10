import { getLocale, getTranslations } from "next-intl/server";
import { parseStoreCurrency } from "@workspace/lib";
import { getStore } from "@workspace/lib/stores/server";
import { asc, db, eq, sellerProductCategories } from "@workspace/db";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { PageHeader } from "@/components/seller-ui";
import { ProductStoreProvider } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";
import { DiscountRulesView } from "./discount-rules.client";
import { listDiscountRules } from "./discount-rules.server";

/**
 * Automatic discounts of one store the session's seller owns (ROADMAP.md F-13a).
 * The URL's store wins when it is one of theirs, else the sidebar's selected store.
 */
export async function DiscountRulesData(props: { storeId: string | null }) {
  const [seller, { stores, selected }, t, locale] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("discountRules"),
    getLocale(),
  ]);
  const store = stores.find((s) => s.id === props.storeId) ?? selected;
  const [rules, storeRow, categories] = await Promise.all([
    store ? listDiscountRules(store.id) : [],
    store ? getStore(seller.sellerId, store.id) : null,
    db
      .select({ id: sellerProductCategories.id, name: sellerProductCategories.name, nameAr: sellerProductCategories.nameAr })
      .from(sellerProductCategories)
      .where(eq(sellerProductCategories.sellerId, seller.sellerId))
      .orderBy(asc(sellerProductCategories.position)),
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
          categories={categories.map((c) => ({ id: c.id, name: (locale === "ar" ? c.nameAr : c.name) || c.name || c.nameAr || "" }))}
        />
      </ProductStoreProvider>
    </>
  );
}
