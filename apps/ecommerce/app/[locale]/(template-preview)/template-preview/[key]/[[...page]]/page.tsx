import { notFound } from "next/navigation";
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
  storeSectionRegistry,
  type ProductDetail,
  type RenderContext,
} from "@workspace/store-sections/render";
import { CarouselRuntime, MotionRuntime } from "@workspace/store-sections/client";
import { prepareTemplateForStore, resolveDemoCatalog, templateDemoProduct, templateFormNeeds, type TemplateMeta } from "@workspace/store-sections/templates";
import { starterPreviewForm } from "@workspace/lib/store-forms/starter";
import { cn, getPublicUrl } from "@workspace/ui/lib/utils";
import { templateFrameSrc } from "@/lib/marketing/templates.lib";
import { optimizeStoreImage } from "@/lib/store-site/optimize-image.lib";
import { getTemplatePreview } from "@/lib/marketing/templates.server";
import { storeFontVariables, storefrontFont } from "../../../../(shop)/storefront/[subdomain]/_components/storefront-font";
import s from "../../../../(shop)/storefront/[subdomain]/storefront.module.css";
import { FrameGuard } from "./frame-guard.client";

type Props = {
  params: Promise<{ locale: string; key: string; page?: string[] }>;
  searchParams: Promise<{ thumb?: string }>;
};

/**
 * One page of an active template, drawn with its demo store, for the
 * tallaby.com gallery: card thumbnails (`?thumb=1`: the top of the home
 * page) and the template page's stage. Read-only; the config and meta (demo
 * store, page names) are global admin-authored data from the database,
 * never a seller's.
 */
export default async function TemplatePreviewFrame({ params, searchParams }: Props) {
  const [{ locale: routeLocale, key, page: pageParam }, { thumb }] = await Promise.all([params, searchParams]);
  if ((pageParam?.length ?? 0) > 1) notFound();
  const preview = await getTemplatePreview(key);
  if (!preview) notFound();
  const { config: stored, meta } = preview;
  // Its ready-made forms (newsletter, contact) bound as "Use template" binds them, so
  // sections holding one show here too (a section with an unbound form is hidden).
  const formIds = Object.fromEntries(templateFormNeeds(stored).map((kind) => [kind, `preview-${kind}`]));
  const site = Object.keys(formIds).length ? prepareTemplateForStore(stored, { defaultLocale: stored.settings.defaultLocale, formIds }) : stored;
  const slug = pageParam?.[0];
  const page = slug ? site.pages.find((p) => p.slug === slug) : (site.pages.find((p) => p.isHome) ?? site.pages[0]);
  if (!page) notFound();

  const locale = routeLocale === "en" ? "en" : "ar";
  const isThumb = thumb === "1";
  const sections = isThumb ? page.content.sections.slice(0, 3) : page.content.sections;
  // Drawn like a live store (burger sheet on phones, Powered by in the footer), so the gallery shows what a store gets.
  const chrome = { translated: false, hasLogo: false, locale };
  const header = drawChrome(flushHeaderOnMobile(site.header), "header", chrome) ?? null;
  const footer = isThumb ? null : (drawChrome(site.footer, "footer", chrome) ?? null);
  const all = [...(header ? [header] : []), ...sections, ...(footer ? [footer] : [])];
  // The product page is drawn with the demo product, as a store's product page shows a real one.
  const ctx = buildContext(site, meta, key, routeLocale, locale, all, formIds, isProductPage(page) ? templateDemoProduct(meta.demo, { locale }) : undefined);
  // Page sections reveal on scroll like a live store; the header and footer don't.
  const chromeCtx = { ...ctx, reveal: false };

  return (
    <div className={cn(storefrontFont.variable, s.root, SITE_ROOT_CLASS, storeFontVariables)} dir={ctx.dir} lang={locale}>
      <FrameGuard allowPrefix={templateFrameSrc(routeLocale, key)} />
      <CarouselRuntime />
      <MotionRuntime />
      <SiteTheme designSystem={site.designSystem} />
      <PageStyles sections={all} />
      {header && <SectionRenderer instance={header} registry={storeSectionRegistry} ctx={chromeCtx} defaultLocale={site.settings.defaultLocale} />}
      <main className="flex-1">
        {sections.map((instance) => (
          <SectionRenderer key={instance.id} instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={site.settings.defaultLocale} />
        ))}
      </main>
      {footer && <SectionRenderer instance={footer} registry={storeSectionRegistry} ctx={chromeCtx} defaultLocale={site.settings.defaultLocale} />}
      {/* The phone bottom navigation, as a store shows it by default. */}
      {!isThumb && <SiteBottomNav header={site.header} ctx={chromeCtx} />}
    </div>
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
  product?: ProductDetail,
): RenderContext {
  const demo = meta.demo;
  const slugs = new Set(site.pages.filter((p) => !p.isHome).map((p) => p.slug));
  // Page links point at the preview's own pages, so a preview opened in its own tab can be browsed.
  const previewHref = (href: string) => {
    if (href === "/") return templateFrameSrc(routeLocale, key);
    const slug = href.startsWith("/") ? href.slice(1) : null;
    return slug && slugs.has(slug) ? templateFrameSrc(routeLocale, key, slug) : href;
  };
  return {
    mode: "public",
    reveal: true,
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
    renderWishlistButton: () => (
      <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-full border border-(--sf-line) bg-(--sf-paper) text-sm">
        ♡
      </span>
    ),
  };
}
