import { storeLocalePrefix, storeUrl } from "@workspace/lib/storefront";
import { JsonLd } from "@/components/seo/json-ld";
import { generateBreadcrumbStructuredData, generateStoreProductStructuredData } from "@/lib/structured-data";
import { offerShippingDetails } from "@/lib/store-seo/offer-shipping.lib";
import { storeShippingForJsonLd } from "@/lib/store-seo/offer-shipping.server";
import { productBreadcrumb, productJsonLdInput } from "@/lib/store-seo/product-jsonld.lib";
import { storeCategoryOf } from "@/lib/store-site/product-detail.lib";
import { getStorefrontCategories, type Storefront } from "@/lib/storefront.server";
import type { ProductLocale } from "@/lib/product-translations";
import type { Product } from "./product-page.types";

interface ProductStructuredDataProps {
  product: Product;
  locale: ProductLocale;
  /** Localized "Home" label for the breadcrumb trail. */
  homeLabel: string;
  /** The store the request host resolved: every URL, the seller name, its zones and categories come from it. */
  store: Pick<Storefront, "id" | "storeId" | "subdomain" | "customDomain" | "displayName" | "currency" | "catalogMode" | "defaultLocale">;
}

/**
 * Product and breadcrumb JSON-LD of a store product page. The route renders
 * nothing (so no JSON-LD) while the store is offline. A failed shipping or
 * category read only drops that part.
 */
export async function ProductStructuredData({ product, locale, homeLabel, store }: ProductStructuredDataProps) {
  // The store's canonical host: its live custom domain, else <sub>.tallaby.com (as storePageMetadata).
  // The store's default language has no prefix (an English store: "/x" is English, "/ar/x" Arabic).
  const home = `${storeUrl(store.subdomain, store.customDomain)}${storeLocalePrefix(locale, store.defaultLocale)}`;
  const productUrl = `${home}/products/${product.slug}`;

  const [shipping, categories] = await Promise.all([
    storeShippingForJsonLd(store.id, store.storeId).catch((error) => {
      console.error("Store shipping failed to load for the product JSON-LD:", error);
      return null;
    }),
    product.category
      ? getStorefrontCategories(store.id, store.storeId).catch(() => [])
      : Promise.resolve([]),
  ]);

  const storeCategory = storeCategoryOf(product, categories);
  // The store category's own name when it has one, else the Tallaby category's (as the visible breadcrumb).
  const named = storeCategory?.name || storeCategory?.nameAr ? storeCategory : product.category;
  const categoryName = named ? (locale === "ar" ? named.nameAr || named.name : named.name || named.nameAr) : null;
  const parent = storeCategory?.parent;
  const parentName = parent ? (locale === "ar" ? parent.nameAr || parent.name : parent.name || parent.nameAr) : null;

  // What checkout charges one unit at this price (a variant's price can cross a free-over).
  const shippingFor = (price: number) =>
    shipping
      ? offerShippingDetails({
          settings: shipping.settings,
          zones: shipping.zones,
          currency: store.currency,
          price,
          sellerFreeDelivery: product.seller?.freeDelivery === true,
          digital: product.productType === "digital",
        })
      : [];

  const structuredData = generateStoreProductStructuredData(
    productJsonLdInput(product, locale, { categoryName, shippingFor }),
    { home, sellerName: store.displayName, currency: store.currency },
  );

  const breadcrumbData = generateBreadcrumbStructuredData(
    productBreadcrumb({
      home,
      homeLabel,
      productUrl,
      productTitle: product.title,
      category: storeCategory && categoryName ? { key: storeCategory.key, name: categoryName } : null,
      parentCategory: parent && parentName ? { key: parent.key, name: parentName } : null,
    }),
  );

  return (
    <>
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumbData} />
    </>
  );
}
