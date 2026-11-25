import type { Metadata } from "next";
import {
  FinalCta,
  HomeFaq,
  HomeHero,
  PricingTeaser,
  TemplatesSection,
} from "@/components/marketing/home/home-sections";
import { HomeBento } from "@/components/marketing/home/home-bento";
import { HomeApps, HomeBuilder, HomeCustomers, HomeTallabyAi, HomeTallabyPay } from "@/components/marketing/home/home-product-sections";
import { HomeStats } from "@/components/marketing/home/home-stats";
import { HomeSteps } from "@/components/marketing/home/home-steps";
import { StickyCta } from "@/components/marketing/home/sticky-cta.client";
import { FaqJsonLd, ProductJsonLd } from "@/components/marketing/site/json-ld";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { metaUsdPriceVars } from "@/lib/marketing/pricing.lib";

// The hero's live store line, the stats, the store logos and Tallaby Pay's switch read the database, so the static page is rebuilt at most once a minute.
export const revalidate = 60;

/** The home page's share image: the owner's 3D art with the white wordmark (public/marketing/home, 2026-11-16). */
const HOME_OG_IMAGE = { url: "/marketing/home/og-home.jpg", width: 1200, height: 630 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "home", path: "/", absoluteTitle: true, values: metaUsdPriceVars(locale), image: HOME_OG_IMAGE });
}

/** Section order: the owner's list (2026-11-25). */
export default function HomePage() {
  return (
    <>
      <ProductJsonLd page="home" path="/" />
      {/* The same questions as <HomeFaq />. */}
      <FaqJsonLd namespace="home.faq" />
      <HomeHero />
      <HomeStats />
      {/* The store logos (TrustedStoresSection) are hidden for now (owner, 2026-11-25); add it back here and to the import. */}
      <HomeBento />
      <HomeSteps />
      <HomeTallabyPay />
      <HomeBuilder />
      <HomeCustomers />
      <HomeTallabyAi />
      <TemplatesSection />
      <HomeApps />
      <PricingTeaser />
      <HomeFaq />
      <FinalCta />
      <StickyCta />
    </>
  );
}
