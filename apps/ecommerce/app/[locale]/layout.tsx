import type { Metadata } from "next";
import { Montserrat, Noto_Kufi_Arabic } from "next/font/google";
import "@workspace/ui/globals.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import "./globals.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
import { Scripts } from "@/components/layout/structured-data";
import { getMessages, getTranslations } from "next-intl/server";
import { Toaster } from "@workspace/ui/components/sonner";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";
import { contentParams } from "@/lib/content-params";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-kufi-arabic",
  weight: ["400", "500", "600", "700"],
});

// This is the app's root layout, which makes `[locale]` a root param — the
// segment `i18n/request.ts` reads via `next/root-params`. Enumerating the
// locales here is what makes every nested page eligible for static rendering.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const contentValues = contentParams(locale);

  return {
    // Resolves relative OG/Twitter image paths ("/og-image.jpg") against the
    // real origin instead of Next's localhost fallback.
    metadataBase: new URL(BASE_URL || "http://localhost:3000"),
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
      url: locale === routing.defaultLocale ? BASE_URL : `${BASE_URL}/${locale}`,
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
    icons: {
      icon: [{ url: "/favicon.png", sizes: "any" }],
    },
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical:
        locale === routing.defaultLocale ? BASE_URL : `${BASE_URL}/${locale}`,
      languages: {
        en: BASE_URL,
        ar: `${BASE_URL}/ar`,
        "x-default": BASE_URL,
      },
    },
    category: "ecommerce",
  };
}

type RootLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <Scripts />
      </head>
      <body
        className={`${
          locale === "ar" ? notoKufiArabic.variable : montserrat.variable
        } antialiased`}
      >
        <NextTopLoader
          color="var(--accent)"
          crawlSpeed={200}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
        />
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
