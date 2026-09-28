import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getSellerBySlug, getSellerStoreCategories } from "@/actions/seller";
import { generateStoreMetadata } from "@/lib/metadata";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Link } from "@/i18n/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { routing } from "@/i18n/routing";
import type { ProductLocale } from "@/lib/product-translations";
import { StoreProfile } from "./_components/store-profile";
import { StoreProducts, storeHref, type StoreQuery } from "./_components/store-products";

interface StorePageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 3600;
export const dynamicParams = true;

async function resolveStore(locale: string, slug: string) {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const result = await getSellerBySlug(slug);
  // Only approved sellers get a public storefront — a pending/suspended
  // seller's slug should 404 rather than leak an unapproved profile.
  if (!result.success || !result.data || result.data.status !== "approved") {
    notFound();
  }

  return { locale: locale as ProductLocale, seller: result.data };
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { seller } = await resolveStore(locale, slug);

  return generateStoreMetadata({
    locale: locale as ProductLocale,
    store: {
      name: seller.displayName,
      slug: seller.slug,
      description: seller.description,
      logoUrl: seller.logoUrl,
      productCount: seller.productCount,
    },
  });
}

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations("pages.stores");
  const sp = await searchParams;
  const { seller } = await resolveStore(locale, slug);
  const categoriesResult = await getSellerStoreCategories(seller.id);
  const categories = categoriesResult.data;

  const query: StoreQuery = {
    category: categories.some((c) => c.key === one(sp.category)) ? one(sp.category) : undefined,
    search: one(sp.search)?.slice(0, 100),
    sort: one(sp.sort),
    page: Math.max(1, Math.floor(Number(one(sp.page)) || 1)),
  };

  // Live count of storefront-visible products; sellers.product_count lags.
  const productCount = categories.reduce((sum, c) => sum + c.productCount, 0);
  const bio = seller.description || seller.storeDescription;
  const hasAbout = Boolean(bio || seller.returnPolicy || seller.shippingPolicy);
  const tab = hasAbout && one(sp.tab) === "about" ? "about" : "products";

  const storeStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seller.displayName,
    description: bio || undefined,
    logo: seller.logoUrl || undefined,
    ...(seller.storeRating && seller.totalRatings && seller.totalRatings > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: seller.storeRating,
            reviewCount: seller.totalRatings,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const tabs = [
    { id: "products", label: t("tabProducts"), count: productCount, href: storeHref(slug, {}) },
    ...(hasAbout
      ? [{ id: "about", label: t("tabAbout"), count: undefined, href: storeHref(slug, { tab: "about" }) }]
      : []),
  ];

  return (
    <main className="min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeStructuredData) }}
      />
      <DynamicBreadcrumb customLabels={{ [slug]: seller.displayName }} />

      <div className="pt-4">
        <StoreProfile
          seller={seller}
          locale={locale}
          productCount={productCount}
          categoryCount={categories.length}
        />
      </div>

      <div className="container">
        {tabs.length > 1 && (
          <nav aria-label={t("tabsLabel")} className="mt-8 border-b">
            <ul className="-mb-px flex gap-6">
              {tabs.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    scroll={false}
                    aria-current={tab === item.id ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors",
                      tab === item.id
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                    {item.count != null && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                        {item.count}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {tab === "about" ? (
          <section className="mt-8 grid max-w-3xl gap-8">
            {bio && (
              <div>
                <h2 className="mb-2 text-lg font-bold">
                  {t("aboutStore", { store: seller.displayName })}
                </h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{bio}</p>
              </div>
            )}
            {seller.shippingPolicy && (
              <div>
                <h2 className="mb-2 text-lg font-bold">{t("shippingPolicy")}</h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {seller.shippingPolicy}
                </p>
              </div>
            )}
            {seller.returnPolicy && (
              <div>
                <h2 className="mb-2 text-lg font-bold">{t("returnPolicy")}</h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {seller.returnPolicy}
                </p>
              </div>
            )}
          </section>
        ) : (
          <StoreProducts
            slug={slug}
            sellerId={seller.id}
            storeName={seller.displayName}
            locale={locale}
            categories={categories}
            query={query}
            hasProducts={productCount > 0}
          />
        )}
      </div>
    </main>
  );
}
