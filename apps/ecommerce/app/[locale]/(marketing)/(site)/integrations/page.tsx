import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { HubListing, type HubCardItem } from "@/components/marketing/hub/hub-listing.client";
import { HubMarkView, HubPageFrame } from "@/components/marketing/hub/hub-page";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { INTEGRATION_CATEGORIES, INTEGRATION_ITEMS, integrationHref } from "@/lib/marketing/integrations-hub.lib";
import { localizedUrl, pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "integrations", path: "/integrations" });
}

export default async function IntegrationsPage() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("integrationsHub")]);

  const items: HubCardItem[] = INTEGRATION_ITEMS.map((item) => ({
    id: item.id,
    name: t(`items.${item.id}.name`),
    description: t(`items.${item.id}.description`),
    category: item.category,
    categoryLabel: t(`categories.${item.category}`),
    keywords: item.keywords,
    soon: item.soon,
    featured: item.featured,
    href: integrationHref(item.id),
    mark: <HubMarkView mark={item.mark} />,
  }));

  return (
    <HubPageFrame namespace="integrationsHub" path="/integrations">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("crumb"),
          url: localizedUrl(locale, "/integrations"),
          itemListElement: items
            .filter((item) => !item.soon)
            .map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name })),
        }}
      />
      <HubListing
        items={items}
        categories={[{ id: "all", label: t("categories.all") }, ...INTEGRATION_CATEGORIES.map((id) => ({ id, label: t(`categories.${id}`) }))]}
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
