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
