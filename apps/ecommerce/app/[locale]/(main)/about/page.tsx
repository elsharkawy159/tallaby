import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { ShoppingBag, ShieldCheck, Truck } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.about");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/about",
    title: t("title"),
    description: t("description"),
  });
}

export default async function About() {
  const t = await getTranslations("pages.about");

  const values = [
    { icon: ShoppingBag, title: t("value1Title"), description: t("value1Description") },
    { icon: ShieldCheck, title: t("value2Title"), description: t("value2Description") },
    { icon: Truck, title: t("value3Title"), description: t("value3Description") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("heroTitle")}</h1>
            <p className="text-xl max-w-2xl mx-auto">{t("heroDescription")}</p>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">{t("whatIsTitle")}</h2>
            <p className="text-gray-600 mb-8">{t("whatIsBody")}</p>
            <h2 className="text-2xl font-bold mb-4">{t("howItWorksTitle")}</h2>
            <p className="text-gray-600">{t("howItWorksBody")}</p>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container">
            <h2 className="text-2xl font-bold mb-10 text-center">{t("valuesTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {values.map((value, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary text-white">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">{t("ctaTitle")}</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">{t("ctaDescription")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button className="bg-accent text-black hover:bg-accent/90">{t("ctaShop")}</Button>
              </Link>
              <Link href="/sell">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  {t("ctaSell")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
