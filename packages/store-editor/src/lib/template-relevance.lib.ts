/**
 * The one relevance order of every template list on the dashboard (owner,
 * 2026-11-15: "always sort templates by most relevance"), shared by
 * Website › Templates, the editor's Templates tab, the AI builder and Admin's
 * change-theme dialog. Tiers, best first:
 *
 * 0. the store niche's own template (`readyNicheTemplate`);
 * 1. templates that have the niche's edition (`editionsForNiche`);
 * 2. templates of the store's industry;
 * 3. templates of each related industry, in `RELATED_INDUSTRIES` order;
 * 4. the rest.
 *
 * A template's industry is its niche's industry when it serves a niche
 * (`nicheOfTemplate`), else its category. Without an industry the niche's
 * own industry is used. An unknown niche counts as none. Stable: templates in
 * one tier keep the input order (callers pass newest first), and with no
 * industry and no niche the list comes back unchanged. Pure, but it reads the
 * code template data, so keep it on the server.
 */
import { editionsForNiche, getNiche, nicheOfTemplate, readyNicheTemplate, type NicheTemplate } from "@workspace/store-sections/templates";
import { RELATED_INDUSTRIES } from "./industries.lib";

export type TemplateRelevance = {
  /** A `STORE_INDUSTRIES` id, or null when unknown. */
  industryId?: string | null;
  /** A `NICHES` id (the saved niche, else `matchNiche`), or null. */
  nicheId?: string | null;
  /** The niche template rows. Tests only: callers leave it out (`NICHE_TEMPLATES`). */
  nicheTemplates?: readonly NicheTemplate[];
};

/** The industry a template belongs to: its niche's when it serves one, else its category. */
export function templateIndustry(template: { key: string; category: string }, rows?: readonly NicheTemplate[]): string {
  return getNiche(nicheOfTemplate(template.key, rows)?.niche)?.industry ?? template.category;
}

/** A ranking function for one store: lower is more relevant. */
export function relevanceRank({ industryId, nicheId, nicheTemplates }: TemplateRelevance): (template: { key: string; category: string }) => number {
  const niche = getNiche(nicheId);
  const industry = industryId || niche?.industry || null;
  const related = industry ? (RELATED_INDUSTRIES[industry] ?? []) : [];
  const lead = niche ? readyNicheTemplate(niche.id, nicheTemplates)?.template : undefined;
  const editionLooks = new Set(niche ? editionsForNiche(niche.id).map((entry) => entry.look) : []);
  const rest = 3 + related.length;
  return (template) => {
    if (lead && template.key === lead) return 0;
    if (editionLooks.has(template.key)) return 1;
    if (!industry) return rest;
    const own = templateIndustry(template, nicheTemplates);
    if (own === industry) return 2;
    const index = related.indexOf(own);
    return index < 0 ? rest : 3 + index;
  };
}

/** The templates, most relevant first (stable inside a tier). */
export function sortByRelevance<T extends { key: string; category: string }>(templates: readonly T[], context: TemplateRelevance = {}): T[] {
  const rank = relevanceRank(context);
  return templates
    .map((template, index) => ({ template, index, rank: rank(template) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.template);
}
