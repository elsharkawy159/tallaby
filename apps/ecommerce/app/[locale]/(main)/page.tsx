import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Hero from "@/components/home/hero/hero";
import { ProductsGrid } from "@/components/home";
import { CuratedCollections } from "@/components/home/sections/curated-collections";
import { TodaysDeals } from "@/components/home/sections/todays-deals";
import { CategoryHub } from "@/components/home/sections/category-hub";
import { ShopByBudget } from "@/components/home/sections/shop-by-budget";
import { PopularBrands } from "@/components/home/sections/popular-brands";
import { PickedForYou } from "@/components/home/sections/picked-for-you";
import { SellerBand } from "@/components/home/sections/seller-band";
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
export const revalidate = 3600; // 1 hour

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

      <CuratedCollections />

      {/* Renders nothing unless some active product is discounted. */}
      <TodaysDeals />

      {/* Admin-merchandised rows; each renders nothing while its flag is unused. */}
      <ProductsGrid
        title={t("sponsored")}
        filters={{ isSponsored: true, sortBy: "popular", limit: 12 }}
      />
      <ProductsGrid
        title={t("trending")}
        filters={{ isTrending: true, sortBy: "popular", limit: 12 }}
      />
      <ProductsGrid
        title={t("seasonal")}
        filters={{ isSeasonal: true, sortBy: "newest", limit: 12 }}
      />

      <CategoryHub />
      <ShopByBudget />
      <PopularBrands />
      <PickedForYou />
      <SellerBand />
    </div>
  );
};

export default HomePage;
