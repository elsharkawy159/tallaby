import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SolutionPageView } from "@/components/marketing/solutions/solution-page";
import { getMarketingPriceVars } from "@/lib/marketing/exchange-rate.server";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { findSolution, SOLUTIONS } from "@/lib/marketing/solutions.lib";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUTIONS.map((solution) => ({ slug: solution.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!findSolution(slug)) return {};
  return pageMetadata({ locale, page: `solution-${slug}`, path: `/solutions/${slug}`, values: await getMarketingPriceVars(locale, { isolate: false }) });
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const solution = findSolution(slug);
  if (!solution) notFound();
  return <SolutionPageView solution={solution} />;
}
