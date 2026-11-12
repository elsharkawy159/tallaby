/**
 * The change-theme dialog's filters (owner request 2026-11-12): industry
 * tabs, then niche tabs, as the seller's Website › Templates. Client-safe:
 * the niche data comes from the server (`store-theme.data.ts`), and the
 * edition rule is the shared `cardEdition`.
 */
import type { TemplatePreview } from "@workspace/store-sections/templates";
import type { NicheCardView } from "@workspace/store-editor/templates.dto";
import { cardEdition } from "@workspace/store-editor/lib/template-edition.lib";

type Bilingual = { ar: string; en: string };

/** One offered theme, as the store page shows it. */
export type ThemeOption = {
  key: string;
  name: string;
  category: string;
  thumbnailUrl: string | null;
  isPremium: boolean;
  isDefault: boolean;
  palette: string[];
  pageCount: number;
  /** Niche editions the theme can be applied with. */
  editions: { id: string; name: Bilingual }[];
  /** A switched industry's niche card (it always shows its niche), else null. */
  nicheCard: NicheCardView | null;
  /** Card screenshots of its home page (paths on tallaby.com), or null: the card draws the page live. */
  preview?: TemplatePreview | null;
};

/**
 * An industry tab's niches (only tabs that have some). A switched industry
 * lists only its niche templates (`tabLooks`); `looks` is each niche tab's
 * list, best first.
 */
export type ThemeNicheTab = { niches: { id: string; name: Bilingual }[]; tabLooks: string[] | null; looks: Record<string, string[]> };

export type ThemeFilter = { category: string | null; niche: string | null; query: string };

/** A card in the dialog: the theme and the edition it previews and applies (null: its own content). */
export type ThemeCard = { theme: ThemeOption; edition: string | null };

const matches = (theme: ThemeOption, q: string) => theme.name.toLowerCase().includes(q) || theme.key.includes(q);

/**
 * The cards for a filter. A search looks through every theme and ignores
 * the tabs. "All" lists every theme. An industry tab lists its themes (a
 * switched industry: its niche templates); a niche tab lists that niche's
 * looks, each with the niche's edition.
 */
export function themeCards(themes: readonly ThemeOption[], tabs: Readonly<Record<string, ThemeNicheTab>>, filter: ThemeFilter): ThemeCard[] {
  const q = filter.query.trim().toLowerCase();
  const card = (theme: ThemeOption, niche: string | null): ThemeCard => ({ theme, edition: cardEdition(theme, niche, theme.nicheCard) });
  if (q) return themes.filter((theme) => matches(theme, q)).map((theme) => card(theme, null));
  if (!filter.category) return themes.map((theme) => card(theme, null));
  const tab = tabs[filter.category];
  const byKeys = (keys: readonly string[]) => [...new Set(keys)].flatMap((key) => themes.filter((theme) => theme.key === key));
  const niche = filter.niche && tab?.niches.some((option) => option.id === filter.niche) ? filter.niche : null;
  if (tab && niche) return byKeys(tab.looks[niche] ?? []).map((theme) => card(theme, niche));
  const inTab = tab?.tabLooks ? byKeys(tab.tabLooks) : themes.filter((theme) => theme.category === filter.category);
  return inTab.map((theme) => card(theme, null));
}

/** The niche a card is shown for (its tag), in English: the niche card's, else the edition's. */
export function themeNicheName(theme: ThemeOption, edition: string | null): string | null {
  if (theme.nicheCard) return theme.nicheCard.name.en;
  return (edition && theme.editions.find((option) => option.id === edition)?.name.en) || null;
}
