import type { ReactNode } from "react";
import { productPageOf, type SiteConfig } from "@workspace/store-sections/config";
import type { Product } from "@/components/product-page/product-page.types";
import type { ProductLocale } from "@/lib/product-translations";
import { storeCategoryKey, toProductDetail } from "@/lib/store-site/product-detail.lib";
import { catalogStoreId, getStorefrontCategories, type Storefront } from "@/lib/storefront.server";
import { StoreSitePage } from "./store-site";

/**
 * A product of this store drawn with the site's product page (template
 * product page spec §5.4): the page's sections, every product part reading
 * this product. The route wraps it in `ProductPageProvider`, which holds the
 * selected variant the interactive parts share. Null when the site has no
 * product page (the route then keeps today's layout).
 */
export async function StoreProductPage({
  store,
  site,
  locale,
  product,
}: {
  store: Storefront;
  site: SiteConfig;
  locale: string;
  product: Product;
}): Promise<ReactNode> {
  const page = productPageOf(site);
  if (!page) return null;
  // The breadcrumb links its category to the catalog filtered by it; a failed read only loses the link.
  const categories = product.category
    ? await getStorefrontCategories(store.id, catalogStoreId(store)).catch((error) => {
        console.error("Store categories failed to load for the product page:", error);
        return [];
      })
    : [];
  const detail = toProductDetail(product, locale as ProductLocale, { categoryKey: storeCategoryKey(product.category, categories) });
  return <StoreSitePage store={store} site={site} page={page} locale={locale} product={detail} />;
}
