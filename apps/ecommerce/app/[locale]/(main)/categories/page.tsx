import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { getFilterOptions } from "@/actions/products";
import { LayoutGrid } from "lucide-react";

export const revalidate = 3600;

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

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("pages.categories");
  const result = await getFilterOptions();
  const categories = result.success ? (result.data?.categories ?? []) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("heading")}</h1>
            <p className="text-xl max-w-2xl mx-auto">{t("intro")}</p>
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            {categories.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                {t("noCategories")}
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((category: any) => {
                  const name =
                    locale === "ar"
                      ? category.nameAr || category.name
                      : category.name || category.nameAr;
                  return (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="group bg-white border rounded-lg p-6 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary transition-colors">
                        <LayoutGrid className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                      </div>
                      <h2 className="font-bold group-hover:text-primary transition-colors">
                        {name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("productsCount", { count: category.productCount ?? 0 })}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
