import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { getAllSellers } from "@/actions/seller";
import { Store, BadgeCheck, Star } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.stores");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/stores",
    title: t("title"),
    description: t("description"),
  });
}

export default async function StoresPage() {
  const t = await getTranslations("pages.stores");
  const result = await getAllSellers();
  const sellers = result.success ? (result.data ?? []) : [];

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
            {sellers.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t("noStores")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sellers.map((seller: any) => (
                  <Link
                    key={seller.id}
                    href={`/stores/${seller.slug}`}
                    className="group bg-white border rounded-lg p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-4"
                  >
                    {seller.logoUrl ? (
                      <Image
                        src={seller.logoUrl}
                        alt={seller.displayName}
                        width={56}
                        height={56}
                        className="rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 shrink-0 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                        <Store className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-bold truncate group-hover:text-primary transition-colors">
                          {seller.displayName}
                        </h2>
                        {seller.isVerified && (
                          <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("productsCount", { count: seller.productCount ?? 0 })}
                      </p>
                      {seller.storeRating != null && seller.totalRatings > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Star className="h-3.5 w-3.5 fill-current text-accent" />
                          <span>{seller.storeRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
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
