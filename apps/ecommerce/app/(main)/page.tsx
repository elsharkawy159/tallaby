import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Hero from "@/components/home/hero/hero";
import {
  DealOfTheDay,
  ProductSection,
  ProductsGrid,
} from "@/components/home";

export const metadata: Metadata = {
  title: "Home | Multi-Vendor E-commerce",
  description:
    "Discover amazing products from top vendors. Shop electronics, fashion, home goods, and more with great deals and fast shipping.",
  keywords:
    "ecommerce, online shopping, multi-vendor, electronics, fashion, home goods",
  openGraph: {
    title: "Home | Multi-Vendor E-commerce",
    description:
      "Discover amazing products from top vendors. Shop electronics, fashion, home goods, and more with great deals and fast shipping.",
    type: "website",
  },
};

function SectionSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`container mx-auto animate-pulse py-8 ${className}`}
      aria-hidden
    >
      <div className="mb-6 h-8 w-48 rounded-md bg-muted" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-72 w-44 shrink-0 rounded-lg bg-muted"
          />
        ))}
      </div>
    </div>
  );
}

const HomePage = async () => {
  const t = await getTranslations("pages.home");

  return (
    <div className="min-h-screen">
      <Hero />

      {/* <Suspense fallback={<SectionSkeleton className="bg-amber-50/40" />}>
        <DealOfTheDay
          title={t("dealOfTheDay")}
          subtitle={t("dealOfTheDaySubtitle")}
          limit={8}
          showCountdown={true}
          className="bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-transparent"
        />
      </Suspense> */}

      {/* <Suspense fallback={<SectionSkeleton />}>
        <ProductSection
          title={t("newArrivals")}
          description={t("newArrivalsDescription")}
          filters={{
            sortBy: "newest",
            limit: 12,
          }}
        />
      </Suspense> */}

      <ProductsGrid
        title={t("featuredProducts")}
        filters={{
          sortBy: "popular",
          limit: 30,
        }}
      />
    </div>
  );
};

export default HomePage;
