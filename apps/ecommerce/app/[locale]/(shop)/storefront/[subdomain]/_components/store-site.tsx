import type { ReactNode } from "react";
import { formatPricePlain } from "@workspace/lib";
import { getPublicStoreForms } from "@workspace/lib/store-forms/server";
import { storeUrl } from "@workspace/lib/storefront";
import type { SectionInstance, SiteConfig } from "@workspace/store-sections";
import {
  CATALOG_LIST_ID,
  PageStyles,
  SectionRenderer,
  collectCatalogQueries,
  collectFormIds,
  collectContentQueries,
  drawChrome,
  flushHeaderOnMobile,
  storeSectionRegistry,
  type ProductDetail,
  type RenderContext,
} from "@workspace/store-sections/render";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { formatContentDate, toContentSummary } from "@/lib/store-cms/cms.lib";
import { getCachedSectionContent } from "@/lib/store-cms/cms.server";
import { resolveStoreCatalog, toProductSummaries, type ResolvedCatalog } from "@/lib/store-site/catalog.server";
import { optimizeStoreImage } from "@/lib/store-site/optimize-image.lib";
import { siteNavPages } from "@/lib/store-site/site-nav.lib";
import { catalogStoreId, type Storefront } from "@/lib/storefront.server";
import { CartSheet } from "./cart-sheet.client";
import { StoreCardAddToCart } from "./store-card-add-to-cart.client";
import { StoreCartBadge } from "./store-cart-badge.client";
import { StoreSearchBox, StoreSearchButton } from "./store-search.client";
import { StoreForm } from "./store-form.client";
import { StorefrontLanguageSwitcher } from "./storefront-language.client";
import { StorefrontThemeToggle } from "./storefront-theme-toggle.client";
import { StoreAccountButton } from "./store-account-button.client";
import { StoreWishlistButton } from "./store-wishlist-button.client";
import { storefrontFont } from "./storefront-font";
import {
  StoreProductBuyBox,
  StoreProductGallery,
  StoreProductPrice,
  StoreProductReviews,
  StoreProductStock,
  StoreProductVariants,
} from "./product-hooks.client";

/**
 * Published builder sites on a store host (PLAN.md P5-01). Every section is
 * a tree section from @workspace/store-sections (CLAUDE.md rule 17).
 */

const textProp = (value: unknown) => (typeof value === "string" && value.trim() ? value.slice(0, 60) : undefined);

/**
 * The product page's interactive parts (template product page spec §5.3).
 * They read the product and its selected variant from the
 * `ProductPageProvider` around the page; the node's props pick their look.
 */
const PRODUCT_HOOKS: Pick<
  RenderContext,
  "renderProductGallery" | "renderProductPrice" | "renderProductStock" | "renderProductVariants" | "renderProductBuyBox" | "renderProductReviews"
> = {
  renderProductGallery: (_product, props) => (
    <StoreProductGallery thumbs={props.thumbs === "bottom" || props.thumbs === "none" ? props.thumbs : "side"} zoom={props.zoom !== false} />
  ),
  renderProductPrice: (_product, props) => <StoreProductPrice showDiscount={props.showDiscount !== false} showCountdown={props.showCountdown !== false} />,
  renderProductStock: () => <StoreProductStock />,
  renderProductVariants: () => <StoreProductVariants />,
  renderProductBuyBox: (_product, props) => (
    <StoreProductBuyBox
      buyNow={props.buyNow !== false}
      stickyMobile={props.stickyMobile !== false}
      variant={props.variant === "outline" ? "outline" : "solid"}
      addLabel={textProp(props.addLabel)}
      buyLabel={textProp(props.buyLabel)}
    />
  ),
  renderProductReviews: () => <StoreProductReviews />,
};

async function buildContext(
  store: Storefront,
  site: SiteConfig,
  locale: string,
  sections: SiteConfig["pages"][number]["content"]["sections"],
  paging?: ProductPaging,
  /** The product of a product page: seeds its elements and the "related" lists. */
  product?: ProductDetail,
): Promise<RenderContext> {
  const queries = collectCatalogQueries(sections, storeSectionRegistry, product ? { product } : undefined);
  // Paginated product lists show the requested page (`?page=N`).
  for (const query of Object.values(queries)) if (query.kind === "products" && query.paginate) query.page = paging?.page ?? 1;
  const formIds = collectFormIds(sections, storeSectionRegistry);
  const contentQueries = collectContentQueries(sections, storeSectionRegistry);
  const [catalog, forms, content] = await Promise.all([
    Object.keys(queries).length
      ? resolveStoreCatalog(store.id, store.storeId, catalogStoreId(store), queries, locale)
      : ({ products: {}, categories: [], withVariants: new Set<string>() } as ResolvedCatalog),
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
      contact: { phone: store.supportPhone, email: store.supportEmail, whatsapp: store.supportWhatsapp ?? null },
      social: store.social ?? [],
      policies: [],
    },
    pages: siteNavPages(site, locale),
    catalog: {
      products: catalog.products,
      categories: catalog.categories,
      brands: catalog.brands,
      reviews: catalog.reviews,
      reviewStats: catalog.reviewStats ?? null,
      coupons: catalog.coupons,
      productPages: catalog.productPages,
    },
    ...(paging && { productPageHref: paging.href }),
    content: { items: contentItems },
    formatDate: (iso) => formatContentDate(iso, locale),
    Link: ({ href, className, children, ...rest }) => (
      <Link href={href} className={className} aria-label={rest["aria-label"]} data-part={rest["data-part"]}>
        {children}
      </Link>
    ),
    // Builder images live in the seller's media; product images are already URLs.
    imageUrl: (src) => (src ? getPublicUrl(src, "sellers") || null : null),
    optimizeImage: optimizeStoreImage,
    formatPrice: (amount) => formatPricePlain(amount, locale, store.currencyLabel),
    renderCartButton: () => <CartSheet storeName={store.displayName} fontClassName={storefrontFont.variable} />,
    renderCartBadge: () => <StoreCartBadge />,
    renderSearch: ({ placeholder, icon, iconFirst }) =>
      placeholder ? (
        <StoreSearchBox placeholder={placeholder} icon={icon} iconFirst={iconFirst} />
      ) : (
        <StoreSearchButton icon={icon} fontClassName={storefrontFont.variable} />
      ),
    renderLanguageSwitcher: () => <StorefrontLanguageSwitcher variant="site" />,
    renderThemeToggle: () => <StorefrontThemeToggle />,
    renderAccountButton: () => <StoreAccountButton />,
    renderAddToCart: (product) => (
      <StoreCardAddToCart productId={product.id} href={product.href} inStock={!!product.inStock} hasVariants={catalog.withVariants.has(product.id)} />
    ),
    renderWishlistButton: (product) => <StoreWishlistButton productId={product.id} />,
    forms,
    renderForm: (form, instanceId) => <StoreForm form={form} instanceId={instanceId} />,
    ...(product && { product, ...PRODUCT_HOOKS }),
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
  // The logo and tools the seller turned on (Content › Header/Footer options), drawn and never saved.
  const opts = { translated: new Set(store.supportedLocales).size > 1, hasLogo: Boolean(store.logoUrl) };
  const instance = part === "header" ? drawChrome(flushHeaderOnMobile(site.header), "header", opts) : drawChrome(site.footer, "footer", opts);
  if (!instance) return null;
  const ctx = await buildContext(store, site, locale, [instance]);
  const chrome = (
    <>
      <PageStyles sections={[instance]} />
      <SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={site.settings.defaultLocale} />
    </>
  );
  // Every section is its own stacking context (`relative isolate`), so the header's search
  // results would paint under the sections after it; lift the whole header above the page.
  return part === "header" ? <div className="relative z-40">{chrome}</div> : chrome;
}

/**
 * A page of catalog products (`getProducts` rows) in the site's own product
 * card (`productCatalogSection`), for the /products page.
 */
export async function StoreSiteProductGrid({
  store,
  site,
  locale,
  instance,
  rows,
}: {
  store: Storefront;
  site: SiteConfig;
  locale: string;
  instance: SectionInstance;
  rows: readonly unknown[];
}) {
  const { products, withVariants } = toProductSummaries(rows);
  const base = await buildContext(store, site, locale, []);
  const ctx: RenderContext = {
    ...base,
    catalog: { ...base.catalog, products: { [CATALOG_LIST_ID]: products } },
    renderAddToCart: (product) => (
      <StoreCardAddToCart productId={product.id} href={product.href} inStock={!!product.inStock} hasVariants={withVariants.has(product.id)} />
    ),
  };
  return (
    <>
      <PageStyles sections={[instance]} />
      <SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={site.settings.defaultLocale} />
    </>
  );
}

/** The page of a page's paginated product lists, and the link to another page. */
type ProductPaging = { page: number; href: (page: number) => string };

/** One page of a published site (its sections only; chrome is in the layout). */
export async function StoreSitePage({
  store,
  site,
  page,
  locale,
  productPage = 1,
  product,
}: {
  store: Storefront;
  site: SiteConfig;
  page: SiteConfig["pages"][number];
  locale: string;
  /** `?page=N` of the request, for paginated product lists (the home page's main grid). */
  productPage?: number;
  /** The product page's product (`/products/{slug}`); the page is then the site's product page. */
  product?: ProductDetail;
}) {
  const path = product ? product.href : page.isHome ? "/" : `/${page.slug}`;
  const ctx = await buildContext(
    store,
    site,
    locale,
    page.content.sections,
    { page: productPage, href: (n) => (n > 1 ? `${path}?page=${n}` : path) },
    product,
  );
  // The storefront layout owns <main>, so the sections render directly.
  return (
    <>
      {/* Section, part and element styles from the editor (P4B-01). */}
      <PageStyles sections={page.content.sections} />
      {page.content.sections.map((instance) => (
        <SectionRenderer key={instance.id} instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={site.settings.defaultLocale} />
      ))}
    </>
  );
}
