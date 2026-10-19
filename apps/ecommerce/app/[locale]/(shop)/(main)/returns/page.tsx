import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { contentParams } from "@/lib/content-params";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.returns");
  const values = contentParams(locale);

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/returns",
    title: t("title"),
    description: t("description", values),
  });
}

export default async function ReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("pages.returns");
  const tFooter = await getTranslations("footer");
  const values = contentParams(locale);

  const reasons = [
    t("reason1"),
    t("reason2"),
    t("reason3"),
    t("reason4"),
    t("reason5"),
    t("reason6"),
    t("reason7"),
    t("reason8"),
  ];
  const refundMethods = [
    t("refundMethod1"),
    t("refundMethod2"),
    t("refundMethod3"),
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
            <div>
              <h2 className="text-xl font-bold mb-2">
                {t("windowTitle", values)}
              </h2>
              <p className="text-gray-600">{t("windowBody", values)}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">{t("howToTitle")}</h2>
              <p className="text-gray-600">{t("howToBody")}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">{t("reasonsTitle")}</h2>
              <p className="text-gray-600 mb-4">{t("reasonsIntro")}</p>
              <div className="flex flex-wrap gap-2">
                {reasons.map((reason, index) => (
                  <Badge key={index} variant="secondary">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">{t("costTitle")}</h2>
              <p className="text-gray-600">{t("costFreeBody")}</p>
              <p className="text-gray-600 mt-3">{t("costPaidBody", values)}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">{t("refundTitle")}</h2>
              <p className="text-gray-600">{t("refundBody")}</p>
              <p className="text-gray-600 mt-3">{t("refundMethodsIntro")}</p>
              <ul className="mt-3 space-y-1.5 text-gray-600">
                {refundMethods.map((method, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    <span>{method}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-8 text-center">
              <h2 className="text-xl font-bold mb-2">{t("helpTitle")}</h2>
              <p className="text-gray-600 mb-4">{t("helpBody")}</p>
              <Link href="/contact">
                <Button>{tFooter("contactUs")}</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
