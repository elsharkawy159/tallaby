import type { Metadata } from "next";
import { MotionScope, SmoothScrollProvider } from "@workspace/motion";
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

/** Scroll motion (@workspace/motion) and smooth scrolling are a home page pilot; 90 = the sticky header plus a gap. */
export default function HomePage() {
  return (
    <SmoothScrollProvider offset={90}>
      <MotionScope>
        <HomeHero />
        <HowItWorks />
        <TemplatesShowcase />
        <BuilderSection />
        <FeaturesSection />
        <PricingTeaser />
        <HomeFaq />
        <FinalCta />
      </MotionScope>
      <StickyCta />
    </SmoothScrollProvider>
  );
}
