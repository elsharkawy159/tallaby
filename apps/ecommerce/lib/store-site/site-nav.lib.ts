import { navPages, type SiteConfig } from "@workspace/store-sections/config";
import type { NavPage } from "@workspace/store-sections/render";

/**
 * The pages a published site's menus link to (`ctx.pages`): the home page and
 * every page shown in the nav, never the product page (a template for
 * /products/{slug}, not a page of its own). Each is named in the visitor's
 * language (`names`), else the default language's `name` (revisions
 * published before `names`).
 */
export function siteNavPages(site: Pick<SiteConfig, "pages">, locale: string): NavPage[] {
  return navPages(site)
    .filter((page) => page.isHome || page.showInNav !== false)
    .map((page) => ({ name: page.names?.[locale === "en" ? "en" : "ar"] ?? page.name, href: page.isHome ? "/" : `/${page.slug}`, isHome: page.isHome }))
    .map((page) => ({ ...page, name: page.isHome && locale === "en" && page.name === "الرئيسية" ? "Home" : page.name }));
}
