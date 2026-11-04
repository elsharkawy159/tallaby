import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndustryPageView } from "@/components/marketing/industries/industry-page";
import { findIndustry, INDUSTRIES } from "@/lib/marketing/industries.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return INDUSTRIES.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!findIndustry(slug)) return {};
  return pageMetadata({ locale, page: `industry-${slug}`, path: `/industries/${slug}` });
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const industry = findIndustry(slug);
  if (!industry) notFound();
  return <IndustryPageView industry={industry} />;
}
