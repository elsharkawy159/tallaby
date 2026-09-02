import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.cookies");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/cookies",
    title: t("title"),
    description: t("description"),
  });
}

export default async function CookiesPage() {
  const t = await getTranslations("pages.cookies");

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">{t("heading")}</h1>
        <p className="text-gray-600 mb-10">{t("intro")}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-2">{t("whatTitle")}</h2>
            <p className="text-gray-600">{t("whatBody")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">{t("controlTitle")}</h2>
            <p className="text-gray-600">{t("controlBody")}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
