import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { getCategoriesPageData } from "@/actions/categories";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import type { ProductCardProps } from "@/components/product";
import type { ProductLocale } from "@/lib/product-translations";
import { LayoutGrid, ArrowRight } from "lucide-react";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.categories");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/categories",
    title: t("title"),
    description: t("description"),
  });
}

function localizedCategoryName(
  category: { name: string | null; nameAr: string | null },
  locale: ProductLocale,
): string {
  if (locale === "ar") return category.nameAr || category.name || "";
  return category.name || category.nameAr || "";
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as ProductLocale;
  const t = await getTranslations("pages.categories");
  const result = await getCategoriesPageData(locale);
  const sections = result.success ? result.data : [];

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-12 md:py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("heading")}</h1>
            <p className="text-xl max-w-2xl mx-auto">{t("intro")}</p>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container space-y-12">
            {sections.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                {t("noCategories")}
              </p>
            ) : (
              <>
                <nav aria-label={t("heading")} className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {sections.map((category) => {
                    const name = localizedCategoryName(category, locale);
                    return (
                      <a
                        key={category.id}
                        href={`#category-${category.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        {name}
                        <span className="text-muted-foreground tabular-nums">
                          {category.productCount}
                        </span>
                      </a>
                    );
                  })}
                </nav>

                <div className="space-y-14">
                  {sections.map((category) => {
                    const name = localizedCategoryName(category, locale);
                    const products = category.products ?? [];

                    return (
                      <section
                        key={category.id}
                        id={`category-${category.slug}`}
                        className="scroll-mt-24"
                      >
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-primary/10">
                              {category.imageUrl ? (
                                <Image
                                  src={category.imageUrl}
                                  alt={name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <LayoutGrid className="h-5 w-5 text-primary" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h2 className="text-xl md:text-2xl font-bold truncate">
                                {name}
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                {t("productsCount", {
                                  count: category.productCount ?? 0,
                                })}
                              </p>
                            </div>
                          </div>

                          <Link
                            href={`/categories/${category.slug}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
                          >
                            {t("viewAll")}
                            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                          </Link>
                        </div>

                        {products.length === 0 ? (
                          <p className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                            {t("noProducts")}
                          </p>
                        ) : (
                          <div className="grid gap-3 lg:gap-5 2xl:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {products.map((product) => (
                              <ProductCard
                                key={(product as { id?: string }).id}
                                {...(product as ProductCardProps)}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
