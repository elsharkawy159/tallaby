import { notFound } from "next/navigation";
import { formatPricePlain } from "@workspace/lib";
import { starterPreviewForm } from "@workspace/lib/store-forms/starter";
import type { SectionInstance, SiteConfig } from "@workspace/store-sections";
import {
  DESIGNS,
  PageStyles,
  SITE_ROOT_CLASS,
  SectionRenderer,
  SiteTheme,
  collectCatalogQueries,
  drawChrome,
  flushHeaderOnMobile,
  instantiateDesign,
  storeSectionRegistry,
  type RenderContext,
} from "@workspace/store-sections/render";
import { CarouselRuntime, MotionRuntime } from "@workspace/store-sections/client";
import {
  DEFAULT_TEMPLATE,
  getCodeTemplate,
  getTemplateOwnDesign,
  prepareTemplateForStore,
  resolveDemoCatalog,
  templateDemoProduct,
  templateFormNeeds,
} from "@workspace/store-sections/templates";
import { cn, getPublicUrl } from "@workspace/ui/lib/utils";
import { optimizeStoreImage } from "@/lib/store-site/optimize-image.lib";
import { storeFontVariables, storefrontFont } from "../../../../(shop)/storefront/[subdomain]/_components/storefront-font";
import s from "../../../../(shop)/storefront/[subdomain]/storefront.module.css";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ demo?: string; motion?: string }>;
};

/**
 * One section design from the working tree, drawn as a storefront draws it
 * (public mode, header and footer through `drawChrome`) with a template's demo
 * store: its products, categories, theme and ready-made forms. Noindex; the
 * library page frames it. `?demo=<template key>` picks the demo store,
 * `?motion=1` turns reveal on scroll on.
 */
export default async function DevSectionFrame({ params, searchParams }: Props) {
  const [{ locale: routeLocale, id }, { demo: demoKey, motion }] = await Promise.all([params, searchParams]);
  const design = DESIGNS.find((d) => d.id === id) ?? getTemplateOwnDesign(id);
  if (!design) notFound();
  const template = (demoKey && getCodeTemplate(demoKey)) || DEFAULT_TEMPLATE;
  const locale = routeLocale === "en" ? "en" : "ar";
  const reveal = motion === "1";

  const instance = instantiateDesign(design, { id: design.id, defaultLocale: "ar" });
  const part = design.category === "headers" ? "header" : design.category === "footers" ? "footer" : "page";
  const base = template.config();
  const home = base.pages.find((p) => p.isHome) ?? base.pages[0]!;
  const draft: SiteConfig = {
    ...base,
    header: part === "header" ? instance : null,
    footer: part === "footer" ? instance : null,
    pages: [{ ...home, content: { ...home.content, sections: part === "page" ? [instance] : [] } }],
  };
  // Ready-made forms (newsletter, contact) bound as "Use template" binds them, else the section hides.
  const formIds = Object.fromEntries(templateFormNeeds(draft).map((kind) => [kind, `preview-${kind}`]));
  const site = prepareTemplateForStore(draft, { defaultLocale: base.settings.defaultLocale, formIds });

  const opts = { translated: true, hasLogo: false, locale };
  const header = drawChrome(flushHeaderOnMobile(site.header), "header", opts) ?? null;
  const footer = drawChrome(site.footer, "footer", opts) ?? null;
  const sections = site.pages[0]!.content.sections;
  const all = [...(header ? [header] : []), ...sections, ...(footer ? [footer] : [])];
  const product = design.category === "product-page" ? templateDemoProduct(template.demo, { locale }) : undefined;
  const ctx = buildContext(template.key, site, all, locale, formIds, reveal, product);
  const render = (section: SectionInstance) => (
    <SectionRenderer key={section.id} instance={section} registry={storeSectionRegistry} ctx={ctx} defaultLocale={site.settings.defaultLocale} />
  );

  return (
    <div className={cn(storefrontFont.variable, s.root, SITE_ROOT_CLASS, storeFontVariables, "min-h-0!")} dir={ctx.dir} lang={locale}>
      <CarouselRuntime />
      {reveal && <MotionRuntime />}
      <SiteTheme designSystem={site.designSystem} />
      <PageStyles sections={all} />
      {/* The library measures this box to size its frame. */}
      <div data-dev-frame>
        {header && render(header)}
        <main>{sections.map(render)}</main>
        {footer && render(footer)}
      </div>
    </div>
  );
}

function buildContext(
  key: string,
  site: SiteConfig,
  sections: SectionInstance[],
  locale: "ar" | "en",
  formIds: Record<string, string>,
  reveal: boolean,
  product?: ReturnType<typeof templateDemoProduct>,
): RenderContext {
  const template = getCodeTemplate(key) ?? DEFAULT_TEMPLATE;
  const demo = template.demo;
  return {
    mode: "public",
    reveal,
    locale,
    dir: locale === "en" ? "ltr" : "rtl",
    store: {
      name: demo.store.name[locale] || demo.store.name.ar || key,
      description: demo.store.description[locale] || null,
      url: "https://example.tallaby.com",
      paymentMethods: [{ key: "cash_on_delivery" }, { key: "instapay" }],
    },
    pages: site.pages.map((p) => ({ name: template.pageNames[p.slug]?.[locale] ?? p.name, href: p.isHome ? "/" : `/${p.slug}`, isHome: p.isHome })),
    catalog: resolveDemoCatalog(collectCatalogQueries(sections, storeSectionRegistry, { product }), demo, locale),
    ...(product ? { product } : {}),
    forms: Object.fromEntries(
      Object.entries(formIds).flatMap(([kind, id]) => {
        const form = starterPreviewForm(kind, locale, id);
        return form ? [[id, form]] : [];
      }),
    ),
    // A picture of a section: links go nowhere.
    Link: ({ className, children, ...rest }) => (
      <a href="#" className={className} aria-label={rest["aria-label"]} data-part={rest["data-part"]}>
        {children}
      </a>
    ),
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
