import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { resolvePrimaryImage } from "@/lib/utils";
import { getProductBySlug } from "@/actions/products";
import { Link } from "@/i18n/navigation";
import { BASE_URL } from "@/lib/constants";
import type { ProductLocale } from "@/lib/product-translations";
import { resolveStorefront } from "@/lib/storefront.server";
import { ProductDisplay } from "@/app/[locale]/(main)/products/[slug]/_components/product-display.client";
import { ProductContent } from "@/app/[locale]/(main)/products/[slug]/_components/product-content";
import { ProductTabsWrapper } from "@/app/[locale]/(main)/products/[slug]/_components/product-tabs-wrapper.client";
import type { Product } from "@/app/[locale]/(main)/products/[slug]/_components/product-page.types";
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
  return { store, product };
}

export async function generateMetadata({
  params,
}: StorefrontProductPageProps): Promise<Metadata> {
  const { locale, subdomain, slug } = await params;
  const { product } = await resolveStoreProduct(locale, subdomain, slug);
  const image = resolvePrimaryImage(product.images as string[] | undefined);

  return {
    title: product.title,
    description: product.description ?? undefined,
    // The marketplace page is the canonical copy of a product.
    alternates: { canonical: marketplaceProductUrl(locale, slug) },
    openGraph: { images: [image] },
  };
}

export default async function StorefrontProductPage({ params }: StorefrontProductPageProps) {
  const { locale, subdomain, slug } = await params;
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
