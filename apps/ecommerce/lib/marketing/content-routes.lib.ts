import { COMPARE_PUBLIC, compareSlug, publishableCompetitors } from "./compare.lib";
import { FEATURE_PAGES, INTEGRATION_PAGES } from "./detail-pages.lib";
import { INDUSTRIES } from "./industries.lib";
import { SOLUTIONS } from "./solutions.lib";
import { TOOL_SLUGS } from "./tools.lib";

/** The content pages for the sitemap. Compare pages join only when they're switched public. */
export function contentPagePaths(comparePublic: boolean = COMPARE_PUBLIC): string[] {
  return [
    "/integrations",
    ...FEATURE_PAGES.map((page) => `/features/${page.slug}`),
    ...INTEGRATION_PAGES.map((page) => `/integrations/${page.slug}`),
    ...TOOL_SLUGS.map((slug) => `/tools/${slug}`),
    ...INDUSTRIES.map((industry) => `/industries/${industry.slug}`),
    ...SOLUTIONS.map((solution) => `/solutions/${solution.slug}`),
    ...(comparePublic ? ["/compare", ...publishableCompetitors().map((competitor) => `/compare/${compareSlug(competitor)}`)] : []),
  ];
}
