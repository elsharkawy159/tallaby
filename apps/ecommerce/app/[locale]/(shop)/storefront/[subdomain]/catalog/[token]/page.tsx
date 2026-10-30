import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { formatPricePlain } from "@workspace/lib";
import { storeUrl } from "@workspace/lib/storefront";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { resolveSharedCatalog } from "@/lib/catalog-share/catalog-share.server";
import { resolveStorefront } from "@/lib/storefront.server";
import { isStoreOfflineForRequest, STORE_OFFLINE_ROBOTS } from "@/lib/store-site/offline.server";
import { StoreCardAddToCart } from "../../_components/store-card-add-to-cart.client";
import { StoreLogo } from "../../_components/store-logo";
import s from "../../storefront.module.css";
import { CatalogShareTools } from "./catalog-share.client";

/**
 * A shared catalog (ROADMAP.md F-11c "Easy Catalog") at `/catalog/{token}` on
 * the store host: the products the seller picked (or one store category, or
 * the newest), with photos, prices and an order button each, made to be sent
 * on WhatsApp. `?print=1` opens the print dialog (Save as PDF); the print
 * styles below lay it out as a clean A4 sheet in the page's language and
 * direction. Never indexed. An offline store shows the offline page (layout).
 */

type CatalogPageProps = {
  params: Promise<{ locale: string; subdomain: string; token: string }>;
  searchParams: Promise<{ print?: string | string[] }>;
};

const NO_INDEX = { index: false, follow: false } as const;

const loadCatalog = cache(async (subdomain: string, token: string, locale: string) => {
  const store = await resolveStorefront(subdomain);
  if (await isStoreOfflineForRequest(store)) return { store, offline: true as const, catalog: null };
  return { store, offline: false as const, catalog: await resolveSharedCatalog(store, decodeURIComponent(token), locale) };
});

function catalogHeading(
  t: Awaited<ReturnType<typeof getTranslations<"catalogShare">>>,
  catalog: NonNullable<Awaited<ReturnType<typeof loadCatalog>>["catalog"]>,
): string {
  return catalog.title || catalog.categoryName || (catalog.source === "newest" ? t("newestTitle") : t("defaultTitle"));
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { locale, subdomain, token } = await params;
  const { store, offline, catalog } = await loadCatalog(subdomain, token, locale);
  if (offline || !catalog) return { robots: offline ? STORE_OFFLINE_ROBOTS : NO_INDEX };
  const t = await getTranslations({ locale, namespace: "catalogShare" });
  const heading = catalogHeading(t, catalog);
  const title = `${heading} | ${store.displayName}`;
  const description = t("ogDescription", { count: catalog.products.length, store: store.displayName });
  const images = catalog.products.map((p) => p.image).filter((url): url is string => Boolean(url)).slice(0, 4);
  const base = storeUrl(store.subdomain, store.customDomain).replace(/\/$/, "");
  const url = `${base}${locale === "en" ? "/en" : ""}/catalog/${token}`;
  return {
    title,
    description,
    robots: NO_INDEX,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url, siteName: store.displayName, locale: locale === "ar" ? "ar_EG" : "en_US", images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images },
  };
}

export default async function SharedCatalogPage({ params, searchParams }: CatalogPageProps) {
  const { locale, subdomain, token } = await params;
  const { print } = await searchParams;
  const { store, offline, catalog } = await loadCatalog(subdomain, token, locale);
  // Website offline: the layout shows the offline page instead.
  if (offline) return null;
  if (!catalog) notFound();

  const t = await getTranslations({ locale, namespace: "catalogShare" });
  const heading = catalogHeading(t, catalog);
  const autoPrint = (Array.isArray(print) ? print[0] : print) === "1";
  const today = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "long", timeZone: "Africa/Cairo" }).format(new Date());
  const price = (value: number) => formatPricePlain(value, locale, store.currencyLabel);
  const contact = store.supportWhatsapp || store.supportPhone;
  const host = storeUrl(store.subdomain, store.customDomain).replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div id="catalog-share" className={cn(s.wrap, "space-y-6 py-6 md:py-10")}>
      <style>{PRINT_CSS}</style>

      <header className="catalog-head flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <StoreLogo name={store.displayName} logoUrl={store.logoUrl} size={48} />
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-sm">{store.displayName}</p>
            <h1 className="text-xl font-bold leading-tight md:text-2xl">{heading}</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {t("count", { count: catalog.products.length })} · {t("pricesAsOf", { date: today })}
            </p>
          </div>
        </div>
        <CatalogShareTools autoPrint={autoPrint} shareText={t("shareText", { title: heading, store: store.displayName })} />
      </header>

      {catalog.products.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-medium">{t("empty")}</p>
          <Link href="/products" className="catalog-noprint mt-3 inline-block text-sm font-semibold underline underline-offset-4">
            {t("browseStore")}
          </Link>
        </div>
      ) : (
        <ul className="catalog-grid grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {catalog.products.map((product) => {
            const onSale = product.compareAtPrice != null && product.price != null && product.compareAtPrice > product.price;
            return (
              <li key={product.id} className="catalog-card bg-card flex flex-col overflow-hidden rounded-2xl border">
                <Link href={product.href} className="bg-muted relative block aspect-square overflow-hidden">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- printed pages need the plain image loaded, not a lazy optimizer URL
                    <img
                      src={product.image}
                      alt={product.title}
                      loading={autoPrint ? "eager" : "lazy"}
                      className="size-full object-cover"
                    />
                  ) : null}
                  {product.inStock === false && (
                    <span className="bg-background/90 absolute top-2 start-2 rounded-full px-2 py-0.5 text-[11px] font-semibold">{t("soldOut")}</span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <Link href={product.href} className="line-clamp-2 text-sm font-medium leading-snug">
                    {product.title}
                  </Link>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    {product.price != null && <span className="font-bold tabular-nums">{price(product.price)}</span>}
                    {onSale && <span className="text-muted-foreground text-xs tabular-nums line-through">{price(product.compareAtPrice!)}</span>}
                  </div>
                  <span className="catalog-print-only text-muted-foreground text-[10px]" dir="ltr">
                    {host}
                    {locale === "en" ? "/en" : ""}
                    {product.href}
                  </span>
                  <div className="catalog-noprint mt-auto [&_a]:w-full [&_button]:w-full [&>div]:w-full">
                    <StoreCardAddToCart
                      productId={product.id}
                      href={product.href}
                      inStock={product.inStock !== false}
                      hasVariants={catalog.withVariants.has(product.id)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="catalog-foot text-muted-foreground border-t pt-4 text-center text-xs">
        <p>{t("pricesNote")}</p>
        <p className="catalog-print-only mt-1" dir="ltr">
          {host}
          {contact ? ` · ${contact}` : ""}
        </p>
      </footer>
    </div>
  );
}

/**
 * Print / Save as PDF: only the catalog, three products a row on A4, no
 * buttons; the store's header and footer are hidden. The page's own `dir`
 * keeps Arabic right-to-left.
 */
const PRINT_CSS = `
.catalog-print-only { display: none; }
@media print {
  @page { size: A4; margin: 12mm; }
  body * { visibility: hidden; }
  header:not(.catalog-head), footer:not(.catalog-foot), nav, [role="dialog"] { display: none !important; }
  #catalog-share, #catalog-share * { visibility: visible; }
  #catalog-share { position: absolute; inset-inline: 0; top: 0; padding: 0 !important; max-width: none !important; }
  #catalog-share .catalog-noprint { display: none !important; }
  #catalog-share .catalog-print-only { display: block; }
  #catalog-share .catalog-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 8mm !important; }
  #catalog-share .catalog-card { break-inside: avoid; page-break-inside: avoid; border-color: #ddd; }
  #catalog-share * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
