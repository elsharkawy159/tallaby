import { notFound } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { formatPricePlain } from "@workspace/lib";
import { isProductPage, type SiteConfig } from "@workspace/store-sections";
import {
  PageStyles,
  SITE_ROOT_CLASS,
  SectionRenderer,
  SiteBottomNav,
  SiteTheme,
  collectCatalogQueries,
  drawChrome,
  flushHeaderOnMobile,
  productCatalogSection,
  storeSectionRegistry,
  type ProductDetail,
  type RenderContext,
} from "@workspace/store-sections/render";
import { CarouselRuntime, MotionRuntime, PhotoToolsRuntime } from "@workspace/store-sections/client";
import { prepareTemplateForStore, resolveDemoCatalog, templateDemoProduct, templateFormNeeds, type TemplateDemo, type TemplateMeta } from "@workspace/store-sections/templates";
import { starterPreviewForm } from "@workspace/lib/store-forms/starter";
import { cn, getPublicUrl } from "@workspace/ui/lib/utils";
import { templateFrameSrc } from "@/lib/marketing/templates.lib";
import { PREVIEW_CATALOG_SLUG, previewLinkTarget, withPreviewParams } from "@/lib/marketing/template-preview-links.lib";
import { optimizeStoreImage } from "@/lib/store-site/optimize-image.lib";
import { getTemplatePreview } from "@/lib/marketing/templates.server";
import { storeFontVariables, storefrontFont } from "../../../../(shop)/storefront/[subdomain]/_components/storefront-font";
import s from "../../../../(shop)/storefront/[subdomain]/storefront.module.css";
import { FrameGuard } from "./frame-guard.client";

type Props = {
  params: Promise<{ locale: string; key: string; page?: string[] }>;
  searchParams: Promise<{ thumb?: string; edition?: string | string[]; product?: string | string[]; category?: string | string[]; search?: string | string[] }>;
};

/**
 * One page of an active template, drawn with its demo store, for the
 * tallaby.com gallery: card thumbnails (`?thumb=1`: the top of the home
 * page) and the template page's stage. Read-only; the config and meta (demo
 * store, page names) are global admin-authored data from the database,
 * never a seller's.
 *
 * `?edition=<nicheId>` draws the template with that niche's edition (niche
 * editions, ROADMAP F-90): its catalog, photos, copy, product stage and
 * product page. An unknown niche, a pack not approved on this template and a
 * template that takes no editions all draw the template as it is, silently
 * (`getTemplatePreview`). Never indexed (the layout's robots).
 *
 * Opened in its own tab it can be browsed like a store (owner, 2026-11-12):
 * product links open the product page with that product (`?product=`), and
 * "all products", category and search links open a catalog page
 * (`/products?category=&search=`) drawn with the template's own product card,
 * as a live store's /products (`template-preview-links.lib.ts`).
 */
export default async function TemplatePreviewFrame({ params, searchParams }: Props) {
  const [{ locale: routeLocale, key, page: pageParam }, query] = await Promise.all([params, searchParams]);
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) || undefined;
  const { thumb } = query;
  const editionParam = query.edition;
  if ((pageParam?.length ?? 0) > 1) notFound();
  const preview = await getTemplatePreview(key, typeof editionParam === "string" ? editionParam : null);
  if (!preview) notFound();
  // `edition` is what was drawn (null after a fallback), so the page's own links never carry a bad value.
  const { config: stored, meta, edition } = preview;
  // Its ready-made forms (newsletter, contact) bound as "Use template" binds them, so
  // sections holding one show here too (a section with an unbound form is hidden).
  const formIds = Object.fromEntries(templateFormNeeds(stored).map((kind) => [kind, `preview-${kind}`]));
  const site = Object.keys(formIds).length ? prepareTemplateForStore(stored, { defaultLocale: stored.settings.defaultLocale, formIds }) : stored;
  const slug = pageParam?.[0] ? decodeURIComponent(pageParam[0]) : undefined;
  const home = site.pages.find((p) => p.isHome) ?? site.pages[0];
  // The catalog is a virtual page: a template with its own "products" page keeps that page.
  const isCatalog = slug === PREVIEW_CATALOG_SLUG && !site.pages.some((p) => p.slug === slug);
  const page = isCatalog ? home : slug ? site.pages.find((p) => p.slug === slug) : home;
  if (!page) notFound();

  const locale = routeLocale === "en" ? "en" : "ar";
  const isThumb = thumb === "1";
  const catalog = isCatalog ? catalogView(site, meta.demo, locale, one(query.category), one(query.search)) : null;
  const sections = catalog ? (catalog.section && catalog.count ? [catalog.section] : []) : isThumb ? page.content.sections.slice(0, 3) : page.content.sections;
  // Drawn like a live store (burger sheet on phones, Powered by in the footer), so the gallery shows what a store gets.
  const chrome = { translated: false, hasLogo: false, locale };
  const header = drawChrome(flushHeaderOnMobile(site.header), "header", chrome) ?? null;
  const footer = isThumb ? null : (drawChrome(site.footer, "footer", chrome) ?? null);
  const all = [...(header ? [header] : []), ...sections, ...(footer ? [footer] : [])];
  // The product page is drawn with the demo product, as a store's product page shows a real one.
  const product = !isCatalog && isProductPage(page) ? templateDemoProduct(meta.demo, { locale, productSlug: one(query.product) }) : undefined;
  const ctx = buildContext(site, catalog ? { ...meta, demo: catalog.demo } : meta, key, routeLocale, locale, all, formIds, edition, product);
  // Page sections reveal on scroll like a live store; the header and footer don't.
  const chromeCtx = { ...ctx, reveal: false };

  return (
    <div className={cn(storefrontFont.variable, s.root, SITE_ROOT_CLASS, storeFontVariables)} dir={ctx.dir} lang={locale}>
      <FrameGuard allowPrefix={templateFrameSrc(routeLocale, key)} />
      <CarouselRuntime />
      <PhotoToolsRuntime />
      <MotionRuntime />
      <SiteTheme designSystem={site.designSystem} />
      <PageStyles sections={all} />
      {header && <SectionRenderer instance={header} registry={storeSectionRegistry} ctx={chromeCtx} defaultLocale={site.settings.defaultLocale} />}
      <main className="flex-1">
        {catalog && <CatalogHead catalog={catalog} locale={locale} href={previewHrefFor(site, routeLocale, key, edition)} />}
        {sections.map((instance, index) => {
          const drawn = <SectionRenderer key={instance.id} instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={site.settings.defaultLocale} aboveFold={index === 0} />;
          // The catalog grid sits in the page width, as the store's /products wraps it.
          return catalog ? (
            <div key={instance.id} className={cn(s.wrap, "pb-14 md:pb-20")}>
              {drawn}
            </div>
          ) : (
            drawn
          );
        })}
      </main>
      {footer && <SectionRenderer instance={footer} registry={storeSectionRegistry} ctx={chromeCtx} defaultLocale={site.settings.defaultLocale} />}
      {/* The phone bottom navigation, as a store shows it by default. */}
      {!isThumb && <SiteBottomNav header={site.header} ctx={chromeCtx} />}
    </div>
  );
}

/**
 * Links point at the preview's own pages, product page and catalog, so a
 * preview opened in its own tab can be browsed; anything else is left as it is.
 */
function previewHrefFor(site: SiteConfig, routeLocale: string, key: string, edition: string | null): (href: string) => string {
  const pageSlugs = new Set(site.pages.filter((p) => !p.isHome).map((p) => p.slug));
  const productPageSlug = site.pages.find((p) => isProductPage(p))?.slug ?? null;
  return (href) => {
    const target = previewLinkTarget(href, { pageSlugs, productPageSlug });
    return target ? withPreviewParams(templateFrameSrc(routeLocale, key, target.slug, false, edition), target.params) : href;
  };
}

type CatalogView = {
  /** The template's product card in a full grid (`productCatalogSection`), or null when it has no product list. */
  section: ReturnType<typeof productCatalogSection>;
  /** The demo store with only the products this view shows. */
  demo: TemplateDemo;
  count: number;
  categories: { id: string; name: string }[];
  category: { id: string; name: string } | null;
  search: string | null;
};

/** The preview's catalog: every demo product, or one category's, or a search's (title in either language). */
function catalogView(site: SiteConfig, demo: TemplateDemo, locale: "ar" | "en", categoryId?: string, search?: string): CatalogView {
  const name = (v: { ar: string; en: string }) => v[locale] || v.ar || v.en;
  const categories = demo.categories.map((c) => ({ id: c.id, name: name(c.name) }));
  const category = categories.find((c) => c.id === categoryId) ?? null;
  const needle = search?.toLocaleLowerCase();
  const products = demo.products.filter(
    (p) =>
      (!category || p.categoryId === category.id) &&
      (!needle || [p.title.ar, p.title.en].some((t) => t?.toLocaleLowerCase().includes(needle))),
  );
  return { section: productCatalogSection(site.pages), demo: { ...demo, products }, count: products.length, categories, category, search: search ?? null };
}

/** The catalog's title, count and category chips, in the store's colours; the template's own header and footer frame it. */
function CatalogHead({ catalog, locale, href }: { catalog: CatalogView; locale: "ar" | "en"; href: (href: string) => string }) {
  const ar = locale === "ar";
  const title = catalog.category?.name ?? (catalog.search ? (ar ? `نتائج البحث: ${catalog.search}` : `Results for "${catalog.search}"`) : ar ? "كل المنتجات" : "All products");
  const count = ar ? `${catalog.count.toLocaleString("ar-EG")} منتج` : `${catalog.count} ${catalog.count === 1 ? "product" : "products"}`;
  const chip = (on: boolean) =>
    cn(
      "inline-flex min-h-10 items-center rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors",
      on ? "border-(--sf-brand) bg-(--sf-brand) text-(--sf-brand-ink)" : "border-(--sf-line) bg-(--sf-paper) text-(--sf-ink) hover:border-(--sf-ink)",
    );
  return (
    <section className={cn(s.wrap, "pt-10 pb-6 md:pt-14")}>
      <h1 className="text-3xl font-bold text-(--sf-ink) md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-(--sf-muted)">{count}</p>
      {catalog.categories.length > 1 && (
        <nav className="mt-6 flex flex-wrap gap-2" aria-label={ar ? "الأقسام" : "Categories"}>
          <a href={href("/products")} className={chip(!catalog.category && !catalog.search)}>
            {ar ? "الكل" : "All"}
          </a>
          {catalog.categories.map((c) => (
            <a key={c.id} href={href(`/products?category=${encodeURIComponent(c.id)}`)} className={chip(catalog.category?.id === c.id)}>
              {c.name}
            </a>
          ))}
        </nav>
      )}
      {catalog.count === 0 && <p className="mt-10 text-base text-(--sf-muted)">{ar ? "مفيش منتجات هنا." : "No products here."}</p>}
    </section>
  );
}

function buildContext(
  site: SiteConfig,
  meta: TemplateMeta,
  key: string,
  routeLocale: string,
  locale: "ar" | "en",
  sections: SiteConfig["pages"][number]["content"]["sections"],
  /** Form id per ready-made form kind the template binds. */
  formIds: Record<string, string>,
  /** The niche edition drawn, kept on the preview's own links. */
  edition: string | null,
  product?: ProductDetail,
): RenderContext {
  const demo = meta.demo;
  const previewHref = previewHrefFor(site, routeLocale, key, edition);
  return {
    mode: "public",
    reveal: true,
    revealDefault: site.designSystem.motion?.default,
    locale,
    dir: locale === "en" ? "ltr" : "rtl",
    store: {
      name: demo.store.name[locale] || demo.store.name.ar || key,
      description: demo.store.description[locale] || null,
      url: "https://example.tallaby.com",
      // What a new store offers: cash on delivery only (defaultStorePayments).
      paymentMethods: [{ key: "cash_on_delivery" }],
    },
    pages: site.pages
      .filter((p) => !isProductPage(p) && (p.isHome || p.showInNav !== false))
      .map((p) => ({ name: meta.pageNames[p.slug]?.[locale] ?? p.name, href: p.isHome ? "/" : `/${p.slug}`, isHome: p.isHome })),
    catalog: resolveDemoCatalog(collectCatalogQueries(sections, storeSectionRegistry, { product }), demo, locale),
    ...(product ? { product } : {}),
    // Still previews of the template's forms (no renderForm: fields drawn, never submitted).
    forms: Object.fromEntries(
      Object.entries(formIds).flatMap(([kind, id]) => {
        const form = starterPreviewForm(kind, locale, id);
        return form ? [[id, form]] : [];
      }),
    ),
    Link: ({ href, className, children, ...rest }) => (
      <a href={previewHref(href)} className={className} aria-label={rest["aria-label"]} data-part={rest["data-part"]}>
        {children}
      </a>
    ),
    // Template images are URLs or paths in the shared media bucket, as on the storefront.
    imageUrl: (src) => (src ? getPublicUrl(src, "sellers") || null : null),
    optimizeImage: optimizeStoreImage,
    formatPrice: (amount) => formatPricePlain(amount, locale),
    renderCartButton: () => (
      <span aria-hidden className="inline-flex h-9 items-center rounded-full border border-(--sf-line) px-3 text-sm">
        🛒
      </span>
    ),
    // A still copy of the storefront's card button (store-card-add-to-cart.client.tsx), so a preview shows the card as a store draws it.
    renderAddToCart: () => (
      <span aria-hidden className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-(--sf-brand) px-3 text-sm font-medium whitespace-nowrap text-(--sf-brand-ink)">
        <ShoppingCart className="size-3.5 shrink-0 md:size-4" />
        <span>{locale === "ar" ? "أضف للسلة" : "Add to cart"}</span>
      </span>
    ),
    renderWishlistButton: () => (
      <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-full border border-(--sf-line) bg-(--sf-paper) text-sm">
        ♡
      </span>
    ),
  };
}
