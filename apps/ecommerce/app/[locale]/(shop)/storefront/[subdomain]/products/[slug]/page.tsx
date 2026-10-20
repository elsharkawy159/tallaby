import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { socialShareImageUrl } from "@/lib/metadata";
import { getProductBySlug } from "@/actions/products";
import { Link } from "@/i18n/navigation";
import { BASE_URL } from "@/lib/constants";
import type { ProductLocale } from "@/lib/product-translations";
import { resolveStorefront, storeShowsProduct } from "@/lib/storefront.server";
import { isSubdomainOfflineForRequest, STORE_OFFLINE_METADATA } from "@/lib/store-site/offline.server";
import { ProductDisplay } from "@/components/product-page/product-display.client";
import { ProductContent } from "@/components/product-page/product-content";
import { ProductTabsWrapper } from "@/components/product-page/product-tabs-wrapper.client";
import type { Product } from "@/components/product-page/product-page.types";
import s from "../../storefront.module.css";

type StorefrontProductPageProps = {
  params: Promise<{ locale: string; subdomain: string; slug: string }>;
};

function marketplaceProductUrl(locale: string, slug: string) {
  const origin = BASE_URL || "https://tallaby.com";
  return `${origin}${locale === "ar" ? "" : `/${locale}`}/products/${slug}`;
}

/**
 * Only this seller's products open inside their storefront; another seller's
 * product (an old link, a related item) opens on tallaby.com instead, and an
 * unknown product sends the shopper back to the store.
 */
async function resolveStoreProduct(locale: string, subdomain: string, slug: string) {
  const store = await resolveStorefront(subdomain);
  const result = await getProductBySlug(slug, locale as ProductLocale);
  const product = result.success ? (result.data as Product | undefined) : undefined;

  if (!product) redirect(locale === "ar" ? "/" : `/${locale}`);
  if (product.sellerId !== store.id) redirect(marketplaceProductUrl(locale, slug));
  // A store with a selected catalog (D24) only opens its picks.
  if (!(await storeShowsProduct(store, product.id))) redirect(marketplaceProductUrl(locale, slug));
  return { store, product };
}

export async function generateMetadata({
  params,
}: StorefrontProductPageProps): Promise<Metadata> {
  const { locale, subdomain, slug } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const { product } = await resolveStoreProduct(locale, subdomain, slug);
  const firstImage = (product.images as string[] | undefined)?.find((i) => i?.trim());

  return {
    title: product.title,
    description: product.description ?? undefined,
    // The marketplace page is the canonical copy of a product.
    alternates: { canonical: marketplaceProductUrl(locale, slug) },
    ...(firstImage && {
      openGraph: {
        images: [{ url: socialShareImageUrl(firstImage), alt: product.title }],
      },
    }),
  };
}

export default async function StorefrontProductPage({ params }: StorefrontProductPageProps) {
  const { locale, subdomain, slug } = await params;
  // Website offline: the layout shows the offline page instead.
  if (await isSubdomainOfflineForRequest(subdomain)) return null;
  const [{ store, product }, t] = await Promise.all([
    resolveStoreProduct(locale, subdomain, slug),
    getTranslations("storefront"),
  ]);

  return (
    <>
      <div className={cn(s.wrap, "pt-6 pb-10")}>
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-(--sf-muted) hover:text-(--sf-ink)"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("backToStore", { store: store.displayName })}
        </Link>
        <ProductDisplay product={product} />
      </div>
      <ProductContent html={product.content} dir={locale === "ar" ? "rtl" : "ltr"} />
      <ProductTabsWrapper product={product} />
    </>
  );
}
