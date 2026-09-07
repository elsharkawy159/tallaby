import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Hero from "@/components/home/hero/hero";
import { ProductsGrid } from "@/components/home";
import { ProductsGridSkeleton } from "@/components/home/products-grid.skeleton";
import { generateHomeMetadata } from "@/lib/metadata";
import type { SeoLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateHomeMetadata(locale as SeoLocale);
}

// Keep homepage data fresh; avoids stale client-router payloads with empty sections.
export const revalidate = 60;

const HomePage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  const t = await getTranslations("pages.home");

  return (
    <div className="min-h-screen">
      <Hero locale={locale} />

      {/* <FeaturesSection locale={locale} /> */}

      {/* <Suspense fallback={<SectionSkeleton className="bg-amber-50/40" />}>
        <DealOfTheDay
          title={t("dealOfTheDay")}
          subtitle={t("dealOfTheDaySubtitle")}
          limit={8}
          showCountdown={true}
          className="bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-transparent"
        />
      </Suspense> */}

      {/* <Suspense fallback={<ProductsGridSkeleton />}>
        <ProductsGrid
          title={t("newArrivals")}
          description={t("newArrivalsDescription")}
          filters={{
            sortBy: "newest",
            limit: 12,
          }}
        />
      </Suspense> */}
      <Suspense fallback={<ProductsGridSkeleton />}>
        <ProductsGrid
          title={t("seasonal")}
          // description={t("seasonalDescription")}
          filters={{
            isSeasonal: true,
            sortBy: "newest",
            limit: 12,
          }}
        />
      </Suspense>

      <Suspense fallback={<ProductsGridSkeleton />}>
        <ProductsGrid
          title={t("trending")}
          // description={t("trendingDescription")}
          filters={{
            isTrending: true,
            sortBy: "popular",
            limit: 12,
          }}
        />
      </Suspense>

      <Suspense fallback={<ProductsGridSkeleton />}>
        <ProductsGrid
          title={t("featuredProducts")}
          filters={{
            sortBy: "popular",
            limit: 30,
            isTrending: false,
            isSeasonal: false,
          }}
        />
      </Suspense>
    </div>
  );
};

export default HomePage;
