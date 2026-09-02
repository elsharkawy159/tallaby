import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.careers");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/careers",
    title: t("title"),
    description: t("description"),
  });
}

export default async function Careers() {
  const t = await getTranslations("pages.careers");

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1">
        <section className="py-20">
          <div className="container max-w-2xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{t("heading")}</h1>
            <p className="text-gray-600 mb-8">{t("body")}</p>
            <Link href="/contact">
              <Button>{t("cta")}</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
