import type { Metadata } from "next";
import {
  BuilderSection,
  FeaturesSection,
  FinalCta,
  HomeFaq,
  HomeHero,
  HowItWorks,
  PricingTeaser,
  TemplatesShowcase,
} from "@/components/marketing/home/home-sections";
import { StickyCta } from "@/components/marketing/home/sticky-cta.client";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "home", path: "/", absoluteTitle: true });
}

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HowItWorks />
      <TemplatesShowcase />
      <BuilderSection />
      <FeaturesSection />
      <PricingTeaser />
      <HomeFaq />
      <FinalCta />
      <StickyCta />
    </>
  );
}
