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
  const t = await getTranslations("pages.privacy");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/privacy",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PrivacyPage() {
  const t = await getTranslations("pages.privacy");
  const dataPoints = [
    t("data1"),
    t("data2"),
    t("data3"),
    t("data4"),
    t("data5"),
    t("data6"),
    t("data7"),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">{t("heading")}</h1>
        <p className="text-gray-600 mb-10">{t("intro")}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-2">{t("dataTitle")}</h2>
            <p className="text-gray-600 mb-3">{t("dataIntro")}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ms-4">
              {dataPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">{t("useTitle")}</h2>
            <p className="text-gray-600">{t("useBody")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">{t("paymentTitle")}</h2>
            <p className="text-gray-600">{t("paymentBody")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">{t("cookiesTitle")}</h2>
            <p className="text-gray-600">{t("cookiesBody")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">{t("sharingTitle")}</h2>
            <p className="text-gray-600">{t("sharingBody")}</p>
          </section>

          <section className="border-t pt-6">
            <h2 className="text-xl font-bold mb-2">{t("contactTitle")}</h2>
            <p className="text-gray-600">{t("contactBody")}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
