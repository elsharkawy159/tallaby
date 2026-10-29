import type { Metadata } from "next";
import { MotionScope } from "@workspace/motion";
import {
  BuilderSection,
  FeaturesSection,
  FinalCta,
  HomeFaq,
  HomeHero,
  HowItWorks,
  PricingTeaser,
  StoresShowcase,
  TemplatesShowcase,
} from "@/components/marketing/home/home-sections";
import { StickyCta } from "@/components/marketing/home/sticky-cta.client";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "home", path: "/", absoluteTitle: true });
}

/** Scroll motion (@workspace/motion) is a home page pilot. Native scrolling only; a smooth-scroll library felt laggy (owner, 2026-10-29). */
export default function HomePage() {
  return (
    <>
      <MotionScope>
        <HomeHero />
        <StoresShowcase />
        <HowItWorks />
        <TemplatesShowcase />
        <BuilderSection />
        <FeaturesSection />
        <PricingTeaser />
        <HomeFaq />
        <FinalCta />
      </MotionScope>
      <StickyCta />
    </>
  );
}
