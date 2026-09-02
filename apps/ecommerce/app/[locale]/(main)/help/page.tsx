import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { HelpCircle, Truck, RotateCcw, CreditCard, Mail } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.help");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/help",
    title: t("title"),
    description: t("description"),
  });
}

export default async function Help() {
  const t = await getTranslations("pages.help");

  const topics = [
    { icon: HelpCircle, title: t("topicFaqTitle"), description: t("topicFaqDescription"), href: "/faq" },
    { icon: Truck, title: t("topicShippingTitle"), description: t("topicShippingDescription"), href: "/shipping" },
    { icon: RotateCcw, title: t("topicReturnsTitle"), description: t("topicReturnsDescription"), href: "/returns" },
    { icon: CreditCard, title: t("topicPaymentTitle"), description: t("topicPaymentDescription"), href: "/payment" },
    { icon: Mail, title: t("topicContactTitle"), description: t("topicContactDescription"), href: "/contact" },
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
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {topics.map((topic, index) => (
                <Link key={index} href={topic.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3">
                        <topic.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle>{topic.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{topic.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
