import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { getAllBrands } from "@/actions/brands";
import { Tag } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.brands");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/brands",
    title: t("title"),
    description: t("description"),
  });
}

export default async function BrandsPage() {
  const t = await getTranslations("pages.brands");
  const result = await getAllBrands({ sortBy: "name", limit: 200 });
  const brands = result.success ? (result.data ?? []) : [];

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
            {brands.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t("noBrands")}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {brands.map((brand: any) => (
                  <Link
                    key={brand.id}
                    href={`/brands/${brand.slug}`}
                    className="group bg-white border rounded-lg p-6 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col items-center"
                  >
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name}
                        width={56}
                        height={56}
                        className="rounded-md object-contain bg-white mb-3"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary transition-colors">
                        <Tag className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                      </div>
                    )}
                    <h2 className="font-bold group-hover:text-primary transition-colors">
                      {brand.name}
                    </h2>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
