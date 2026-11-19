import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPageView } from "@/components/marketing/features/detail-page";
import { ProductPageView } from "@/components/marketing/features/product-page";
import { FEATURE_PAGES, findFeaturePage } from "@/lib/marketing/detail-pages.lib";
import { getMarketingPriceVars } from "@/lib/marketing/exchange-rate.server";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { PRODUCT_PAGES, findProductPage } from "@/lib/marketing/product-pages.lib";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

/** The older detail pages and the product pages (product-pages.lib.ts) share /features/[slug]. */
export function generateStaticParams() {
  return [...FEATURE_PAGES, ...PRODUCT_PAGES].map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!findFeaturePage(slug) && !findProductPage(slug)) return {};
  return pageMetadata({ locale, page: `feature-${slug}`, path: `/features/${slug}`, values: await getMarketingPriceVars(locale, { isolate: false }) });
}

export default async function FeaturePage({ params }: Props) {
  const { slug } = await params;
  const detail = findFeaturePage(slug);
  if (detail) return <DetailPageView page={detail} />;
  const product = findProductPage(slug);
  if (!product) notFound();
  return <ProductPageView page={product} />;
}
