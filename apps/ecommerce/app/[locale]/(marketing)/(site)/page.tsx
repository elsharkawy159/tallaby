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
} from "@/components/marketing/home/home-sections";
import { StickyCta } from "@/components/marketing/home/sticky-cta.client";
import { ProductJsonLd } from "@/components/marketing/site/json-ld";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "home", path: "/", absoluteTitle: true });
}

export default function HomePage() {
  return (
    <>
      <ProductJsonLd page="home" path="/" />
      <HomeHero />
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
