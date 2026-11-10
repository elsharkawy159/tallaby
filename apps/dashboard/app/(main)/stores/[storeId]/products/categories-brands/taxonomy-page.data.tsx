import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { loadProductStorePage } from "@/lib/products/product-store.server";
import { loadSellerTaxonomyList } from "./categories-brands.data";
import { TaxonomyManager } from "./categories-brands.client";
import type { TaxonomyKind } from "./categories-brands.dto";

/** Shared by the Products › Categories and Products › Brands pages. */

const KEY: Record<TaxonomyKind, "categories" | "brands"> = { category: "categories", brand: "brands" };

export async function taxonomyPageMetadata(kind: TaxonomyKind): Promise<Metadata> {
  const t = await getTranslations(`categoriesBrands.${KEY[kind]}`);
  return { title: t("pageTitle"), description: t("pageSubtitle") };
}

/** The lists are still the seller's (per store in F-87d); the URL store is checked against the session first. */
export async function TaxonomyPage({ kind, storeId }: { kind: TaxonomyKind; storeId: string }) {
  const { seller } = await loadProductStorePage(storeId);
  const items = await loadSellerTaxonomyList(seller.sellerId, kind);

  return (
    <PageContainer narrow>
      <TaxonomyManager kind={kind} initialItems={items} />
    </PageContainer>
  );
}
