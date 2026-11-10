import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { loadProductStorePage, taxonomyScopeOf } from "@/lib/products/product-store.server";
import { loadSellerTaxonomyList } from "./categories-brands.data";
import { TaxonomyManager } from "./categories-brands.client";
import type { TaxonomyKind } from "./categories-brands.dto";

/** Shared by the Products › Categories and Products › Brands pages. */

const KEY: Record<TaxonomyKind, "categories" | "brands"> = { category: "categories", brand: "brands" };

export async function taxonomyPageMetadata(kind: TaxonomyKind): Promise<Metadata> {
  const t = await getTranslations(`categoriesBrands.${KEY[kind]}`);
  return { title: t("pageTitle"), description: t("pageSubtitle") };
}

/**
 * The URL store is checked against the session first; the list is the store's
 * (the seller's one list until the catalog split, F-87d). The client sends the
 * same store id back with every action, and the server checks it again.
 */
export async function TaxonomyPage({ kind, storeId }: { kind: TaxonomyKind; storeId: string }) {
  const ctx = await loadProductStorePage(storeId);
  const items = await loadSellerTaxonomyList(taxonomyScopeOf(ctx), kind);

  return (
    <PageContainer narrow>
      <TaxonomyManager kind={kind} initialItems={items} />
    </PageContainer>
  );
}
