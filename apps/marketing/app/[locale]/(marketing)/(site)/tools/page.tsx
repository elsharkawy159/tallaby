import type { Metadata } from "next";
import { Calculator, Percent } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContentHubPage } from "@/components/marketing/hub/content-hub";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { TOOL_GROUP, TOOL_SLUGS } from "@/lib/marketing/tools.lib";

const ICONS = { "store-cost-calculator": Calculator, "profit-margin-calculator": Percent } as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "tools", path: "/tools" });
}

/** /tools: every free tool as a card (SEO_PLAN.md H4). */
export default async function ToolsHub() {
  const pages = await getTranslations("toolPages");
  return (
    <ContentHubPage
      namespace="toolsHub"
      path="/tools"
      groups={["costs", "pricing"]}
      entries={TOOL_SLUGS.map((slug) => ({ id: slug, href: `/tools/${slug}`, name: pages(`${slug}.crumb`), group: TOOL_GROUP[slug], icon: ICONS[slug], featured: true }))}
    />
  );
}
