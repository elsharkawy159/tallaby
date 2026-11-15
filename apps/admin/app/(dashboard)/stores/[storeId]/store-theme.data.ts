/**
 * The change-theme dialog's data, built on the server (owner request
 * 2026-11-12): the offered themes and each industry tab's niches, from the
 * same gallery rules as the seller's Website › Templates (`galleryNiches`,
 * `nicheCards`, retired templates left out), plus the tab and niche the
 * dialog opens on (the store's industry and its own niche: the saved one,
 * else today's guess). The themes are most relevant first, newest first
 * inside a group, like the seller's gallery (`sortByRelevance`; owner,
 * 2026-11-15).
 */
import type { StoreTemplateCard } from "@workspace/lib/store-sites/server";
import { effectiveStoreNiche } from "@workspace/lib/stores/niche";
import { findIndustry } from "@workspace/store-editor/lib/industries.lib";
import { sortByRelevance } from "@workspace/store-editor/lib/template-relevance.lib";
import { galleryNiches, nicheCards } from "@workspace/store-editor/lib/template-niches.lib";
import { defaultNiche, isRetiredTemplate } from "@workspace/store-sections/templates";
import { localizedText } from "../stores.lib";
import type { ThemeNicheTab, ThemeOption } from "./store-theme.lib";

export type ThemeGallery = {
  themes: ThemeOption[];
  tabs: Record<string, ThemeNicheTab>;
  /** The industry tab and niche the dialog opens on (null: "All"). */
  initial: { category: string | null; niche: string | null };
};

export function buildThemeGallery(
  templates: readonly StoreTemplateCard[],
  store: { name: string; storeCategory: string | null; storeCategoryAr: string | null; nicheSetting?: string | null },
): ThemeGallery {
  const category = { en: store.storeCategory, ar: store.storeCategoryAr };
  const industry = findIndustry(category)?.id ?? null;
  const storeNiche = effectiveStoreNiche({ ...store, settings: { niche: store.nicheSetting ?? null } }, industry);
  // A niche-only industry (ROADMAP F-90) leaves out its templates that serve no niche.
  const offered = sortByRelevance(
    templates.filter((template) => !isRetiredTemplate(template)).sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0)),
    { industryId: industry, nicheId: storeNiche },
  );
  const keys = new Set(offered.map((template) => template.key));
  const cards = nicheCards([...keys]);
  const themes: ThemeOption[] = offered.map((template) => ({
    key: template.key,
    name: localizedText(template.name),
    category: template.category,
    thumbnailUrl: template.thumbnailUrl,
    isPremium: template.isPremium,
    isDefault: template.isDefault,
    palette: template.palette,
    pageCount: template.outline.length,
    editions: (template.editions ?? []).map((edition) => ({ id: edition.id, name: edition.name })),
    nicheCard: cards[template.key] ?? null,
    preview: template.preview ?? null,
  }));

  const tabs: Record<string, ThemeNicheTab> = {};
  for (const category of new Set(themes.map((theme) => theme.category))) {
    const filter = galleryNiches(category, keys);
    if (!filter.niches.length) continue;
    tabs[category] = {
      niches: filter.niches.map((niche) => ({ id: niche.id, name: niche.name })),
      tabLooks: filter.tabLooks,
      looks: Object.fromEntries(filter.niches.map((niche) => [niche.id, filter.looksOf(niche.id)])),
    };
  }

  const tab = industry && themes.some((theme) => theme.category === industry) ? industry : null;
  const offeredNiches = tab ? tabs[tab]?.niches : undefined;
  const niche = offeredNiches ? (offeredNiches.some((option) => option.id === storeNiche) ? storeNiche : defaultNiche({ category, name: store.name, industryId: tab }, offeredNiches)) : null;
  return { themes, tabs, initial: { category: tab, niche } };
}
