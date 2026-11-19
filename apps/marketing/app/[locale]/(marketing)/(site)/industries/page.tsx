import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { HubListing, type HubCardItem } from "@/components/marketing/hub/hub-listing.client";
import { HubMarkView, HubPageFrame } from "@/components/marketing/hub/hub-page";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { INDUSTRIES, INDUSTRY_GROUPS, industryHref } from "@/lib/marketing/industries.lib";
import { localizedUrl, pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "industries", path: "/industries" });
}

/** /industries: every industry page as a card, filterable by group (SEO_PLAN.md H2). */
export default async function IndustriesPage() {
  const [locale, t, pages] = await Promise.all([getLocale(), getTranslations("industriesHub"), getTranslations("industryPages")]);

  const items: HubCardItem[] = INDUSTRIES.map((industry) => ({
    id: industry.slug,
    name: pages(`${industry.slug}.crumb`),
    description: t(`items.${industry.slug}`),
    category: industry.group,
    categoryLabel: t(`categories.${industry.group}`),
    featured: industry.featured,
    href: industryHref(industry),
    mark: <HubMarkView mark={{ icon: industry.icon }} />,
  }));

  return (
    <HubPageFrame namespace="industriesHub" path="/industries">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("crumb"),
          url: localizedUrl(locale, "/industries"),
          itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: localizedUrl(locale, item.href!) })),
        }}
      />
      <HubListing
        items={items}
        categories={[{ id: "all", label: t("categories.all") }, ...INDUSTRY_GROUPS.map((id) => ({ id, label: t(`categories.${id}`) }))]}
        labels={{
          search: t("search"),
          searchPlaceholder: t("searchPlaceholder"),
          categories: t("categoriesLabel"),
          soon: t("soon"),
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
