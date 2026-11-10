import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AlternativesPageView } from "@/components/marketing/compare/alternatives-page";
import { alternativeCompetitors, compareRobots } from "@/lib/marketing/compare.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

type Props = { params: Promise<{ locale: string; id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return alternativeCompetitors().map((competitor) => ({ id: competitor.id }));
}

const find = (id: string) => alternativeCompetitors().find((competitor) => competitor.id === id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const competitor = find(id);
  if (!competitor) return {};
  const t = await getTranslations({ locale, namespace: `competitors.${competitor.id}` });
  const meta = await pageMetadata({ locale, page: `alternatives-${competitor.id}`, path: `/alternatives/${competitor.id}`, values: { name: t("name") } });
  const robots = compareRobots(competitor);
  return robots ? { ...meta, robots } : meta;
}

export default async function AlternativesPage({ params }: Props) {
  const { id } = await params;
  const competitor = find(id);
  if (!competitor) notFound();
  return <AlternativesPageView competitor={competitor} />;
}
