import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentHubPage } from "@/components/marketing/hub/content-hub";
import { FEATURE_GROUPS, FEATURE_PAGES } from "@/lib/marketing/detail-pages.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "features", path: "/features" });
}

/** /features: every feature page as a card (SEO_PLAN.md H3). Integrations have their own hub. */
export default async function FeaturesHub() {
  const pages = await getTranslations("detailPages");
  return (
    <ContentHubPage
      namespace="featuresHub"
      path="/features"
      groups={FEATURE_GROUPS}
      entries={FEATURE_PAGES.map((page) => ({
        id: page.slug,
        href: `/features/${page.slug}`,
        name: pages(`${page.slug}.crumb`),
        group: page.group ?? "website",
        icon: page.icon,
        featured: page.featured,
      }))}
    />
  );
}
