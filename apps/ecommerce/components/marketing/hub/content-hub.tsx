import type { LucideIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { HubListing, type HubCardItem } from "@/components/marketing/hub/hub-listing.client";
import { HubMarkView, HubPageFrame } from "@/components/marketing/hub/hub-page";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { localizedUrl } from "@/lib/marketing/seo.lib";

export type ContentHubEntry = { id: string; href: string; name: string; group: string; icon: LucideIcon; featured?: boolean };

/**
 * /solutions, /features and /tools: every page of one kind as a card, with
 * chips by group, search and ItemList JSON-LD (SEO_PLAN.md H1, H3, H4). Words
 * are under `<namespace>`: the HubPageFrame keys plus `items.<id>` and `categories`.
 */
export async function ContentHubPage({
  namespace,
  path,
  entries,
  groups,
}: {
  namespace: "solutionsHub" | "featuresHub" | "toolsHub";
  path: string;
  entries: readonly ContentHubEntry[];
  groups: readonly string[];
}) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations(namespace)]);
  const items: HubCardItem[] = entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: t(`items.${entry.id}`),
    category: entry.group,
    categoryLabel: t(`categories.${entry.group}`),
    featured: entry.featured,
    href: entry.href,
    mark: <HubMarkView mark={{ icon: entry.icon }} />,
  }));

  return (
    <HubPageFrame namespace={namespace} path={path}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("crumb"),
          url: localizedUrl(locale, path),
          itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: localizedUrl(locale, item.href!) })),
        }}
      />
      <HubListing
        items={items}
        categories={[{ id: "all", label: t("categories.all") }, ...groups.map((id) => ({ id, label: t(`categories.${id}`) }))]}
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
