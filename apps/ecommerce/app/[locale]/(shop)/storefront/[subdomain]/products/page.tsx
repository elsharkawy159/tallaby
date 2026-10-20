import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { storeQueryHref, type StoreQuery } from "@/components/store-page/store-products";
import { catalogStoreId, getStorefrontCategories, resolveStorefront } from "@/lib/storefront.server";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { isStoreOfflineForRequest } from "@/lib/store-site/offline.server";
import { CategoryCircles } from "../_components/category-circles";
import { StorefrontCatalog } from "../_components/storefront-catalog";
import s from "../storefront.module.css";

type StoreProductsPageProps = {
  params: Promise<{ locale: string; subdomain: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

export async function generateMetadata({ params }: StoreProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "storefront" });
  return { title: t("productsHeading") };
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
  const categories = await getStorefrontCategories(store.id, catalogStoreId(store));

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

  return (
    <div className={cn(s.wrap, "space-y-10 py-10 md:space-y-12 md:py-14")}>
      <CategoryCircles categories={categories} query={query} basePath="/products" />
      <StorefrontCatalog
        sellerId={store.id}
        catalogStoreId={catalogStoreId(store)}
        locale={locale}
        categories={categories}
        query={query}
        basePath="/products"
      />
    </div>
  );
}
