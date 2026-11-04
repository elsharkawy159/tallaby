import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HubListing, type HubCardItem } from "@/components/marketing/hub/hub-listing.client";
import { HubPageFrame } from "@/components/marketing/hub/hub-page";
import { COMPARE_CATEGORIES, compareRobots, compareSlug, publishableCompetitors } from "@/lib/marketing/compare.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = await pageMetadata({ locale, page: "compare", path: "/compare" });
  const robots = compareRobots();
  return robots ? { ...meta, robots } : meta;
}

export default async function CompareHubPage() {
  const t = await getTranslations("compareHub");
  const page = await getTranslations("comparePage");
  const competitors = publishableCompetitors();

  const items: HubCardItem[] = await Promise.all(
    competitors.map(async (competitor) => {
      const c = await getTranslations(`competitors.${competitor.id}`);
      const name = c("name");
      return {
        id: competitor.id,
        name: page("vsLabel", { name }),
        description: t("cardBody", { name }),
        category: competitor.category,
        categoryLabel: t(`categories.${competitor.category}`),
        keywords: competitor.latin,
        featured: competitor.featured,
        href: `/compare/${compareSlug(competitor)}`,
        mark: (
          <span className="inline-flex h-8 items-center rounded-full border-[1.5px] border-[#e2e5e6] bg-[#eef0f1] px-2.5 text-[13px] font-bold whitespace-nowrap text-[#4a5558]">{name}</span>
        ),
      };
    }),
  );

  // A category with no comparison yet gets no chip.
  const used = COMPARE_CATEGORIES.filter((id) => competitors.some((competitor) => competitor.category === id));

  return (
    <HubPageFrame namespace="compareHub" path="/compare">
      <HubListing
        items={items}
        categories={[{ id: "all", label: t("categories.all") }, ...used.map((id) => ({ id, label: t(`categories.${id}`) }))]}
        labels={{
          search: t("search"),
          searchPlaceholder: t("searchPlaceholder"),
          categories: t("categoriesLabel"),
          soon: "",
          featured: t("featured"),
          featuredCta: t("featuredCta"),
          count: t.raw("count") as string,
          noneTitle: t("noneTitle"),
          noneBody: t("noneBody"),
        }}
      />
    </HubPageFrame>
  );
}
