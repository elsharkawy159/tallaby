import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { productCatalogSection } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import { storeQueryHref, type StoreQuery } from "@/components/store-page/store-products";
import { getStorefrontCategories, resolveStorefront } from "@/lib/storefront.server";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { isStoreOfflineForRequest, isSubdomainOfflineForRequest, STORE_OFFLINE_METADATA } from "@/lib/store-site/offline.server";
import { storeCatalogSeo, storePageMetadata } from "@/lib/store-seo/store-seo.lib";
import { CategoryCircles } from "../_components/category-circles";
import { StoreSiteProductGrid } from "../_components/store-site";
import { StorefrontCatalog } from "../_components/storefront-catalog";
import s from "../storefront.module.css";

type StoreProductsPageProps = {
  params: Promise<{ locale: string; subdomain: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

export async function generateMetadata({ params, searchParams }: StoreProductsPageProps): Promise<Metadata> {
  const { locale, subdomain } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const sp = await searchParams;
  const [store, t] = await Promise.all([resolveStorefront(subdomain), getTranslations({ locale, namespace: "storefront" })]);
  const categories = await getStorefrontCategories(store.id, store.storeId);
  const active = categories.find((c) => c.key === one(sp.category));
  const categoryName = active ? (locale === "ar" ? active.nameAr || active.name : active.name || active.nameAr) : null;
  const { path, noindex } = storeCatalogSeo({
    category: active?.key,
    search: one(sp.search) ?? one(sp.q),
    page: Math.max(1, Math.floor(Number(one(sp.page)) || 1)),
  });
  // A preview keeps the layout's noindex: the key is only set here when true.
  return storePageMetadata(store, locale, {
    paths: path,
    title: categoryName || t("productsHeading"),
    description: categoryName
      ? t("categoryMetaDescription", { category: categoryName, store: store.displayName })
      : t("catalogMetaDescription", { store: store.displayName }),
    image: active?.coverImage,
    noindex,
  });
}

/**
 * The store's full catalog at /products (storefront templates, 2026-10-19):
 * search, category filter, sort and pages, inside the published site's
 * header and footer, so builder sites have a shop page their menus, category
 * cards and "View all" links can open. A store without a builder site keeps
 * its catalog on the home page, so /products goes there with the same filters.
 */
export default async function StoreProductsPage({ params, searchParams }: StoreProductsPageProps) {
  const { locale, subdomain } = await params;
  const sp = await searchParams;
  const store = await resolveStorefront(subdomain);
  // Website offline: the layout shows the offline page instead.
  if (await isStoreOfflineForRequest(store)) return null;
  const categories = await getStorefrontCategories(store.id, store.storeId);

  const query: StoreQuery = {
    category: categories.some((c) => c.key === one(sp.category)) ? one(sp.category) : undefined,
    search: (one(sp.search) ?? one(sp.q))?.slice(0, 100),
    sort: one(sp.sort),
    page: Math.max(1, Math.floor(Number(one(sp.page)) || 1)),
  };

  const { site } = await getStorefrontSite(store.id, store.storeId, store.subdomain);
  if (!site) {
    // The classic storefront's home is its catalog.
    redirect(`${storeQueryHref(locale === "en" ? "/en" : "/", query)}#products`);
  }
  // Products in the template's own card: the item template of the site's first product list.
  const grid = productCatalogSection(site.pages);

  return (
    <div className={cn(s.wrap, "space-y-10 py-10 md:space-y-12 md:py-14")}>
      <CategoryCircles categories={categories} query={query} basePath="/products" />
      <StorefrontCatalog
        sellerId={store.id}
        storeId={store.storeId}
        locale={locale}
        categories={categories}
        query={query}
        basePath="/products"
        renderProducts={
          grid ? (rows) => <StoreSiteProductGrid store={store} site={site} locale={locale} instance={grid} rows={rows} /> : undefined
        }
      />
    </div>
  );
}
