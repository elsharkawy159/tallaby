import { COMPARE_PUBLIC, compareSlug, publicCompetitors } from "./compare.lib";
import { FEATURE_PAGES, INTEGRATION_PAGES } from "./detail-pages.lib";
import { INDUSTRIES } from "./industries.lib";
import { SOLUTIONS } from "./solutions.lib";
import { TOOL_SLUGS } from "./tools.lib";

/** The content pages for the sitemap. Compare and alternatives pages join only when they're switched public (per competitor). */
export function contentPagePaths(comparePublic: boolean = COMPARE_PUBLIC): string[] {
  return [
    "/integrations",
    "/industries",
    "/solutions",
    "/features",
    "/tools",
    ...FEATURE_PAGES.map((page) => `/features/${page.slug}`),
    ...INTEGRATION_PAGES.map((page) => `/integrations/${page.slug}`),
    ...TOOL_SLUGS.map((slug) => `/tools/${slug}`),
    ...INDUSTRIES.map((industry) => `/industries/${industry.slug}`),
    ...SOLUTIONS.map((solution) => `/solutions/${solution.slug}`),
    ...comparePaths(comparePublic),
  ];
}

/** /compare, each released comparison and its /alternatives page; nothing while no comparison is public. */
function comparePaths(comparePublic: boolean): string[] {
  const open = publicCompetitors(comparePublic);
  if (!open.length) return [];
  return [
    "/compare",
    ...open.map((competitor) => `/compare/${compareSlug(competitor)}`),
    ...(open.some((competitor) => competitor.alternative) ? ["/alternatives"] : []),
    ...open.filter((competitor) => competitor.alternative).map((competitor) => `/alternatives/${competitor.id}`),
  ];
}

/** How many pages of each kind the footer's Solutions column lists. */
export const FOOTER_SOLUTIONS_PER_SOURCE = 3;

/**
 * The footer's "Solutions" links, read from the page lists so a new page shows
 * up by itself: solutions, then industries, features and tools, at most
 * `perSource` of each. `metaKey` is the page's key under `meta` (its title is
 * the link text).
 */
export function footerSolutionLinks(perSource: number = FOOTER_SOLUTIONS_PER_SOURCE): { href: string; metaKey: string }[] {
  const take = <T,>(items: readonly T[], href: (item: T) => string, key: (item: T) => string) =>
    items.slice(0, perSource).map((item) => ({ href: href(item), metaKey: key(item) }));
  return [
    ...take(SOLUTIONS, (s) => `/solutions/${s.slug}`, (s) => `solution-${s.slug}`),
    ...take(INDUSTRIES, (i) => `/industries/${i.slug}`, (i) => `industry-${i.slug}`),
    ...take(FEATURE_PAGES, (f) => `/features/${f.slug}`, (f) => `feature-${f.slug}`),
    ...take(TOOL_SLUGS, (slug) => `/tools/${slug}`, (slug) => `tool-${slug}`),
  ];
}
