import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { HubListing, type HubCardItem } from "@/components/marketing/hub/hub-listing.client";
import { HubPageFrame } from "@/components/marketing/hub/hub-page";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { CompetitorChip } from "@/components/marketing/compare/compare-table";
import { alternativesLinkTargets, COMPARE_CATEGORIES, isAlternativesHubPublic } from "@/lib/marketing/compare.lib";
import { localizedUrl, pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = await pageMetadata({ locale, page: "alternatives", path: "/alternatives" });
  const robots = isAlternativesHubPublic() ? undefined : { index: false, follow: false };
  return robots ? { ...meta, robots } : meta;
}

/** /alternatives: every "<X> alternatives" page as a card (`SEO_PLAN.md` §9.3, same gate as /compare). */
export default async function AlternativesHubPage() {
  const [locale, t, page] = await Promise.all([getLocale(), getTranslations("alternativesHub"), getTranslations("alternativesPage")]);
  const competitors = alternativesLinkTargets();

  const items: HubCardItem[] = await Promise.all(
    competitors.map(async (competitor) => {
      const name = (await getTranslations(`competitors.${competitor.id}`))("name");
      return {
        id: competitor.id,
        name: page("crumbEntry", { name }),
        description: t("cardBody", { name }),
        category: competitor.category,
        categoryLabel: t(`categories.${competitor.category}`),
        keywords: [competitor.latin, ...competitor.arabicNames].join(" "),
        featured: competitor.featured,
        href: `/alternatives/${competitor.id}`,
        mark: <CompetitorChip name={name} small />,
      };
    }),
  );

  const used = COMPARE_CATEGORIES.filter((id) => competitors.some((competitor) => competitor.category === id));

  return (
    <HubPageFrame namespace="alternativesHub" path="/alternatives">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("crumb"),
          url: localizedUrl(locale, "/alternatives"),
          itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: localizedUrl(locale, item.href!) })),
        }}
      />
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
