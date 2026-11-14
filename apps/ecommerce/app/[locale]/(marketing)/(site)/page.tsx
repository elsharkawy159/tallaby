import type { Metadata } from "next";
import {
  AiSection,
  BuilderSection,
  FeaturesSection,
  FinalCta,
  HomeFaq,
  HomeHero,
  HowItWorks,
  MarketingSection,
  PaymentsSection,
  PricingTeaser,
  ShippingSection,
  TemplatesSection,
  TrustedStoresSection,
  WhatIsTallabySection,
} from "@/components/marketing/home/home-sections";
import { StickyCta } from "@/components/marketing/home/sticky-cta.client";
import { ProductJsonLd } from "@/components/marketing/site/json-ld";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

// The hero's live store line and the store logos read the database, so the static page is rebuilt at most once a minute.
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "home", path: "/", absoluteTitle: true });
}

export default function HomePage() {
  return (
    <>
      <ProductJsonLd page="home" path="/" />
      <HomeHero />
      <TrustedStoresSection />
      <WhatIsTallabySection />
      <FeaturesSection />
      <AiSection />
      <BuilderSection />
      <TemplatesSection />
      <MarketingSection />
      <ShippingSection />
      <PaymentsSection />
      <PricingTeaser />
      <HowItWorks />
      <HomeFaq />
      <FinalCta />
      <StickyCta />
    </>
  );
}
