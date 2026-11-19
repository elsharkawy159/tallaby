import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentHubPage } from "@/components/marketing/hub/content-hub";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { SOLUTION_GROUPS, SOLUTIONS } from "@/lib/marketing/solutions.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "solutions", path: "/solutions" });
}

/** /solutions: every solution page as a card (SEO_PLAN.md H1). */
export default async function SolutionsHub() {
  const pages = await getTranslations("solutionPages");
  return (
    <ContentHubPage
      namespace="solutionsHub"
      path="/solutions"
      groups={SOLUTION_GROUPS}
      entries={SOLUTIONS.map((solution) => ({
        id: solution.slug,
        href: `/solutions/${solution.slug}`,
        name: pages(`${solution.slug}.crumb`),
        group: solution.group,
        icon: solution.featureIcons[0]!,
        featured: solution.featured,
      }))}
    />
  );
}
