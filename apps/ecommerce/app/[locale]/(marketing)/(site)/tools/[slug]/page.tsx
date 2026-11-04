import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarginToolPage } from "@/components/marketing/tools/margin-tool-page";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { isToolSlug, TOOL_SLUGS, type ToolSlug } from "@/lib/marketing/tools.lib";

type Props = { params: Promise<{ locale: string; slug: string }> };

const TOOL_PAGES: Record<ToolSlug, () => Promise<React.JSX.Element>> = {
  "profit-margin-calculator": MarginToolPage,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return TOOL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isToolSlug(slug)) return {};
  return pageMetadata({ locale, page: `tool-${slug}`, path: `/tools/${slug}` });
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  if (!isToolSlug(slug)) notFound();
  const Tool = TOOL_PAGES[slug];
  return <Tool />;
}
