import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { Truck, MapPin, PackageCheck, Gift } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.shipping");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/shipping",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ShippingPage() {
  const t = await getTranslations("pages.shipping");

  const sections = [
    { icon: MapPin, title: t("coverageTitle"), body: t("coverageBody") },
    { icon: Truck, title: t("costTitle"), body: t("costBody") },
    { icon: Gift, title: t("freeDeliveryTitle"), body: t("freeDeliveryBody") },
    { icon: PackageCheck, title: t("trackingTitle"), body: t("trackingBody") },
  ];

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
          <div className="container max-w-3xl mx-auto space-y-10">
            {sections.map((section, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-12 h-12 shrink-0 bg-primary rounded-full flex items-center justify-center">
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">{section.title}</h2>
                  <p className="text-gray-600">{section.body}</p>
                </div>
              </div>
            ))}
            <p className="text-gray-600 border-t pt-6">{t("codNote")}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
