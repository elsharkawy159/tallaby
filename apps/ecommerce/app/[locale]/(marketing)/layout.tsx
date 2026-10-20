import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
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

export const viewport: Viewport = { themeColor: "#0d3743" };

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
