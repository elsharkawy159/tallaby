import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPageView } from "@/components/marketing/features/detail-page";
import { findIntegrationPage, INTEGRATION_PAGES } from "@/lib/marketing/detail-pages.lib";
import { getMarketingPriceVars } from "@/lib/marketing/exchange-rate.server";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return INTEGRATION_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!findIntegrationPage(slug)) return {};
  return pageMetadata({ locale, page: `integration-${slug}`, path: `/integrations/${slug}`, values: await getMarketingPriceVars(locale, { isolate: false }) });
}

export default async function IntegrationPage({ params }: Props) {
  const { slug } = await params;
  const page = findIntegrationPage(slug);
  if (!page) notFound();
  return <DetailPageView page={page} />;
}
