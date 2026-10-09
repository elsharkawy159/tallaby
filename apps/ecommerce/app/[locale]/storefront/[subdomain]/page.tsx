import { cn } from "@workspace/ui/lib/utils";
import type { StoreQuery } from "@/app/[locale]/(main)/stores/[slug]/_components/store-products";
import { getStorefrontCategories, resolveStorefront } from "@/lib/storefront.server";
import { StorefrontHero } from "./_components/storefront-hero";
import { CategoryCircles } from "./_components/category-circles";
import { StorefrontCatalog } from "./_components/storefront-catalog";
import s from "./storefront.module.css";

type StorefrontPageProps = {
  params: Promise<{ locale: string; subdomain: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

export default async function StorefrontPage({ params, searchParams }: StorefrontPageProps) {
  const { locale, subdomain } = await params;
  const sp = await searchParams;
  const store = await resolveStorefront(subdomain);
  const categories = await getStorefrontCategories(store.id);

  const query: StoreQuery = {
    category: categories.some((c) => c.key === one(sp.category)) ? one(sp.category) : undefined,
    // `q` arrives from marketplace search links redirected here.
    search: (one(sp.search) ?? one(sp.q))?.slice(0, 100),
    sort: one(sp.sort),
    page: Math.max(1, Math.floor(Number(one(sp.page)) || 1)),
  };

  return (
    <>
      <StorefrontHero store={store} />
      <div className={cn(s.wrap, "space-y-10 py-10 md:space-y-14 md:py-14")}>
        <CategoryCircles categories={categories} query={query} />
        <StorefrontCatalog
          sellerId={store.id}
          locale={locale}
          categories={categories}
          query={query}
        />
      </div>
    </>
  );
}
