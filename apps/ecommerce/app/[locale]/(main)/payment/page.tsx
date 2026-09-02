import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { Banknote, Wallet, Smartphone, CreditCard } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.payment");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/payment",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PaymentPage() {
  const t = await getTranslations("pages.payment");

  const methods = [
    { icon: Banknote, title: t("codTitle"), body: t("codBody") },
    { icon: Wallet, title: t("walletTitle"), body: t("walletBody") },
    { icon: Smartphone, title: t("instapayTitle"), body: t("instapayBody") },
    { icon: CreditCard, title: t("cardTitle"), body: t("cardBody") },
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
          <div className="container grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {methods.map((method, index) => (
              <div key={index} className="bg-white border rounded-lg p-6">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <method.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg font-bold mb-2">{method.title}</h2>
                <p className="text-gray-600 text-sm">{method.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
