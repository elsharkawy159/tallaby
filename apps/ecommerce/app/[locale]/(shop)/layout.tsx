import type { Metadata } from "next";
import "@workspace/ui/globals.css";
import "./globals.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
import { Scripts } from "@/components/layout/structured-data";
import { getTranslations } from "next-intl/server";
import { Toaster } from "@workspace/ui/components/sonner";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";
import { buildLanguageAlternates, localizedUrl } from "@/lib/metadata";
import { contentParams } from "@/lib/content-params";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const contentValues = contentParams(locale);

  return {
    title: {
      default: t("titleDefault"),
      template: "%s | Tallaby.com",
    },
    description: t("description", contentValues),
    keywords: t("keywords")
      .split(",")
      .map((keyword) => keyword.trim()),
    authors: [{ name: "Tallaby.com" }],
    creator: "Tallaby.com",
    publisher: "Tallaby.com",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      url:
        locale === routing.defaultLocale ? BASE_URL : `${BASE_URL}/${locale}`,
      siteName: t("siteName"),
      title: t("ogTitle"),
      description: t("ogDescription", contentValues),
    },
    twitter: {
      card: "summary_large_image",
      site: "@tallaby",
      creator: "@tallaby",
      title: t("twitterTitle"),
      description: t("twitterDescription", contentValues),
    },
    // app/favicon.ico is served by the file convention; /favicon.png never existed.
    icons: {
      apple: [{ url: "/logo/logo.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical:
        locale === routing.defaultLocale ? BASE_URL : `${BASE_URL}/${locale}`,
      // ar is the unprefixed default locale; en lives under /en.
      languages: buildLanguageAlternates({
        en: localizedUrl("en", ""),
        ar: localizedUrl("ar", ""),
      }),
    },
    category: "ecommerce",
  };
}

/**
 * Seller storefronts and the customer pages they share (checkout, auth,
 * orders, profile, policies): this was the app's root layout before the
 * marketing pages moved in.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Scripts />
      <NextTopLoader
        color="var(--accent)"
        crawlSpeed={200}
        height={3}
        showSpinner={false}
        easing="ease"
        speed={200}
      />
      <Providers>{children}</Providers>
      <Toaster />
    </>
  );
}
