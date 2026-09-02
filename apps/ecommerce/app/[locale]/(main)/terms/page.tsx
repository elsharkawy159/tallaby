import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";

interface TermsSection {
  title: string;
  body: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.terms");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/terms",
    title: t("title"),
    description: t("description"),
  });
}

export default async function Terms() {
  const t = await getTranslations("pages.terms");
  const sections = t.raw("sections") as TermsSection[];

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">{t("heading")}</h1>
            <p className="text-gray-600">
              {t("lastUpdatedLabel")}: {t("lastUpdated")}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("intro")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator />
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <section key={index}>
                    <h3 className="text-xl font-bold mb-3">{section.title}</h3>
                    <p className="text-gray-600">{section.body}</p>
                  </section>
                ))}

                <section>
                  <h3 className="text-xl font-bold mb-3">{t("contactTitle")}</h3>
                  <p className="text-gray-600">{t("contactBody")}</p>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
