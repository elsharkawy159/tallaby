import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { aiConfigured } from "@workspace/ai";
import AddProduct from "./add-product";
import { getAllCategories } from "@/actions/categories";
import { loadProductStorePage, taxonomyScopeOf } from "@/lib/products/product-store.server";
import { loadSellerTaxonomyOptions } from "../categories-brands/categories-brands.data";
import { loadProductLinkHost } from "./product-link-host.data";
import { loadSellerPricing } from "./seller-pricing.data";
import { loadProductStoreRounding } from "@/lib/products/price-rounding.server";
import type { CategoryOption } from "./add-product.schema";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// Main page component
export default async function AddProductPage({ params }: { params: Promise<{ storeId: string }> }) {
  // The URL store, checked against the session (F-87c); the form saves into it.
  const access = await loadProductStorePage((await params).storeId);
  const { seller } = access;
  const [categories, sellerPricing, sellerTaxonomy, linkHost, priceRounding] = await Promise.all([
    getAllCategories(),
    loadSellerPricing(),
    loadSellerTaxonomyOptions(taxonomyScopeOf(access)),
    loadProductLinkHost(seller.sellerId),
    // The store's price rounding rule (F-112b): the form shows the price that will be saved.
    loadProductStoreRounding(access),
  ]);

  return (
    <AddProduct
      categories={(categories.data || []) as CategoryOption[]}
      sellerTaxonomy={sellerTaxonomy}
      linkHost={linkHost}
      aiEnabled={aiConfigured()}
      sellerPricing={{ ...sellerPricing, priceRounding }}
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.addProduct");
  return { title: t("title"), description: t("description") };
}
