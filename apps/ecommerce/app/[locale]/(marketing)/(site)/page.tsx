import type { Metadata } from "next";
import {
  FeaturesSection,
  FinalCta,
  HomeFaq,
  HomeHero,
  PricingTeaser,
  TemplatesSection,
  TrustedStoresSection,
  WhatIsTallabySection,
} from "@/components/marketing/home/home-sections";
import { StickyCta } from "@/components/marketing/home/sticky-cta.client";
import { FaqJsonLd, ProductJsonLd } from "@/components/marketing/site/json-ld";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { metaUsdPriceVars } from "@/lib/marketing/pricing.lib";

// The hero's live store line and the store logos read the database, so the static page is rebuilt at most once a minute.
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "home", path: "/", absoluteTitle: true, values: metaUsdPriceVars(locale) });
}

export default function HomePage() {
  return (
    <>
      <ProductJsonLd page="home" path="/" />
      {/* The same questions as <HomeFaq />. */}
      <FaqJsonLd namespace="home.faq" />
      <HomeHero />
      <TrustedStoresSection />
      <WhatIsTallabySection />
      <FeaturesSection />
      <TemplatesSection />
      <PricingTeaser />
      <HomeFaq />
      <FinalCta />
      <StickyCta />
    </>
  );
}
