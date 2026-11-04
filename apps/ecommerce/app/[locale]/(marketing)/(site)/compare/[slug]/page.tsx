import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ComparePageView } from "@/components/marketing/compare/compare-page";
import { compareRobots, compareSlug, findCompetitorBySlug, publishableCompetitors } from "@/lib/marketing/compare.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return publishableCompetitors().map((competitor) => ({ slug: compareSlug(competitor) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const competitor = findCompetitorBySlug(slug);
  if (!competitor) return {};
  const t = await getTranslations({ locale, namespace: `competitors.${competitor.id}` });
  const meta = await pageMetadata({ locale, page: "compare-entry", path: `/compare/${slug}`, values: { name: t("name") } });
  const robots = compareRobots();
  return robots ? { ...meta, robots } : meta;
}

export default async function CompareEntryPage({ params }: Props) {
  const { slug } = await params;
  const competitor = findCompetitorBySlug(slug);
  if (!competitor) notFound();
  return <ComparePageView competitor={competitor} />;
}
