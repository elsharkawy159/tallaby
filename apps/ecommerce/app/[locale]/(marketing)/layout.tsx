import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
import { AnimationObserver } from "@workspace/motion";
import { MetaPixel } from "@/components/meta/meta-pixel";
import { NextIntlClientProvider } from "next-intl";
import { loadAllMessages } from "@/i18n/messages";
import { MARKETING_CLIENT_NAMESPACES, pickMessages } from "@/i18n/client-messages.lib";
import { SITE_URL } from "@/lib/marketing/site.lib";
import "./marketing.css";

// The tallaby.com site (moved from apps/marketing). Store hosts never reach
// these pages: proxy.ts rewrites them to app/[locale]/(shop)/storefront.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("home.title"), template: t("titleTemplate") },
    description: t("home.description"),
    applicationName: t("siteName"),
    icons: { icon: "/favicon.ico", apple: "/logo-mark.png" },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff" };

/** One AnimationObserver plays every `data-animate` element on the tallaby.com pages (@workspace/motion). */
export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    // Only what client components read (i18n/client-messages.lib.ts), not all of ar.json and every marketing group.
    <NextIntlClientProvider messages={pickMessages(await loadAllMessages(locale), MARKETING_CLIENT_NAMESPACES)}>
      {children}
      <AnimationObserver />
      <MetaPixel />
    </NextIntlClientProvider>
  );
}
