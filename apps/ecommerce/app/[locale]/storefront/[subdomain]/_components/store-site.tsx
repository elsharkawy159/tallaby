import type { ReactNode } from "react";
import { formatPricePlain } from "@workspace/lib";
import { getPublicStoreForms } from "@workspace/lib/store-forms/server";
import { storeUrl } from "@workspace/lib/storefront";
import type { SiteConfig } from "@workspace/store-sections";
import {
  SectionRenderer,
  collectCatalogQueries,
  collectFormIds,
  collectContentQueries,
  storeSectionRegistry,
  type NavPage,
  type RenderContext,
} from "@workspace/store-sections/render";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import type { StoreQuery } from "@/app/[locale]/(main)/stores/[slug]/_components/store-products";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Link } from "@/i18n/navigation";
import { formatContentDate, toContentSummary } from "@/lib/store-cms/cms.lib";
import { getCachedSectionContent } from "@/lib/store-cms/cms.server";
import { resolveStoreCatalog } from "@/lib/store-site/catalog.server";
import { catalogStoreId, type Storefront, type StorefrontCategory } from "@/lib/storefront.server";
import { CartSheet } from "./cart-sheet.client";
import { CategoryCircles } from "./category-circles";
import { StoreForm } from "./store-form.client";
import { StorefrontCatalog } from "./storefront-catalog";
import { storefrontFont } from "./storefront-font";
import { StorefrontFooter } from "./storefront-footer";
import { StorefrontHeader } from "./storefront-header";
import { StorefrontHero } from "./storefront-hero";
import s from "../storefront.module.css";

/**
 * Published builder sites on a store host (PLAN.md P5-01). Sections come
 * from @workspace/store-sections; Tallaby Classic parts are drawn by the
 * existing storefront components, so a Classic site looks exactly like the
 * legacy storefront.
 */

function navPages(site: SiteConfig, locale: string): NavPage[] {
  return site.pages
    .filter((page) => page.isHome || page.showInNav !== false)
    .map((page) => ({ name: page.name, href: page.isHome ? "/" : `/${page.slug}`, isHome: page.isHome }))
    .map((page) => ({ ...page, name: page.isHome && locale === "en" && page.name === "الرئيسية" ? "Home" : page.name }));
}

type ClassicData = { categories: StorefrontCategory[]; query: StoreQuery } | null;

function classicRenderer(store: Storefront, locale: string, classic: ClassicData): RenderContext["renderClassic"] {
  return (part) => {
    switch (part) {
      case "classic-header":
        return <StorefrontHeader store={store} />;
      case "classic-footer":
        return <StorefrontFooter store={store} />;
      case "classic-hero":
        return <StorefrontHero store={store} />;
      // Same spacing as the legacy home: one py-10/md:py-14 band with
      // space-y-10/md:space-y-14 between circles and catalog.
      case "classic-categories":
        return classic && classic.categories.length >= 2 ? (
          <div className={`${s.wrap} pt-10 md:pt-14`}>
            <CategoryCircles categories={classic.categories} query={classic.query} />
          </div>
        ) : null;
      case "classic-catalog":
        return classic ? (
          <div className={`${s.wrap} py-10 md:py-14`}>
            <StorefrontCatalog sellerId={store.id} catalogStoreId={catalogStoreId(store)} locale={locale} categories={classic.categories} query={classic.query} />
          </div>
        ) : null;
      default:
        return null;
    }
  };
}

async function buildContext(
  store: Storefront,
  site: SiteConfig,
  locale: string,
  sections: SiteConfig["pages"][number]["content"]["sections"],
  classic: ClassicData,
): Promise<RenderContext> {
  const queries = collectCatalogQueries(sections, storeSectionRegistry);
  const formIds = collectFormIds(sections, storeSectionRegistry);
  const contentQueries = collectContentQueries(sections, storeSectionRegistry);
  const [catalog, forms, content] = await Promise.all([
    Object.keys(queries).length
      ? resolveStoreCatalog(store.id, catalogStoreId(store), queries, locale)
      : { products: {}, categories: [], withVariants: new Set<string>() },
    // Forms of THIS host's store only (P4-10); another store's form id resolves to nothing.
    formIds.length ? getPublicStoreForms(store.storeId, formIds) : {},
    // Blog/CMS sections (P4-16, P4-11): only this store's published items.
    Object.keys(contentQueries).length ? getCachedSectionContent(store.id, store.storeId, contentQueries) : null,
  ]);
  const contentItems = Object.fromEntries(
    Object.entries(content?.items ?? {}).map(([instanceId, items]) => [
      instanceId,
      items.map((item) => toContentSummary(item, content?.fields[item.collectionSlug])),
    ]),
  );

  return {
    mode: "public",
    locale: locale === "en" ? "en" : "ar",
    dir: locale === "en" ? "ltr" : "rtl",
    store: {
      name: store.displayName,
      description: store.description,
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      url: storeUrl(store.subdomain, store.customDomain),
      contact: { phone: store.supportPhone, email: store.supportEmail, whatsapp: store.supportPhone },
      social: store.social ?? [],
      policies: [],
    },
    pages: navPages(site, locale),
    catalog: { products: catalog.products, categories: catalog.categories },
    content: { items: contentItems },
    formatDate: (iso) => formatContentDate(iso, locale),
    Link: ({ href, className, children, ...rest }) => (
      <Link href={href} className={className} aria-label={rest["aria-label"]}>
        {children}
      </Link>
    ),
    // Builder images live in the seller's media; product images are already URLs.
    imageUrl: (src) => (src ? getPublicUrl(src, "sellers") || null : null),
    formatPrice: (amount) => formatPricePlain(amount, locale),
    renderCartButton: () => <CartSheet storeName={store.displayName} fontClassName={storefrontFont.variable} />,
    renderAddToCart: (product) =>
      catalog.withVariants.has(product.id) ? null : <AddToCartButton productId={product.id} size="sm" stock={product.inStock ? 1 : 0} />,
    renderClassic: classicRenderer(store, locale, classic),
    forms,
    renderForm: (form, instanceId) => <StoreForm form={form} instanceId={instanceId} />,
  };
}

/** Header or footer of a published site, as the storefront layout renders it. */
export async function StoreSiteChrome({
  store,
  site,
  locale,
  part,
}: {
  store: Storefront;
  site: SiteConfig;
  locale: string;
  part: "header" | "footer";
}): Promise<ReactNode> {
  const instance = part === "header" ? site.header : site.footer;
  if (!instance) return null;
  const ctx = await buildContext(store, site, locale, [instance], null);
  return <SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={site.settings.defaultLocale} />;
}

/** One page of a published site (its sections only; chrome is in the layout). */
export async function StoreSitePage({
  store,
  site,
  page,
  locale,
  classic,
}: {
  store: Storefront;
  site: SiteConfig;
  page: SiteConfig["pages"][number];
  locale: string;
  classic: ClassicData;
}) {
  const ctx = await buildContext(store, site, locale, page.content.sections, classic);
  // The storefront layout owns <main>, so the sections render directly.
  return (
    <>
      {page.content.sections.map((instance) => (
        <SectionRenderer key={instance.id} instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={site.settings.defaultLocale} />
      ))}
    </>
  );
}
