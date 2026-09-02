import type { Metadata } from "next";
import { Montserrat, Noto_Kufi_Arabic } from "next/font/google";
import "@workspace/ui/globals.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import "./globals.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
import { Scripts } from "@/components/layout/structured-data";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Toaster } from "@workspace/ui/components/sonner";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";

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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: "Online Shopping Egypt - Your Everything Store",
    template: "%s | Tallaby.com",
  },
  description:
    "Tallaby.com is a global online marketplace offering millions of products across electronics, fashion, home essentials, beauty, and more. Shop securely, fast, and conveniently like Amazon.",
  keywords: [
    "tallaby",
    "online shopping",
    "ecommerce",
    "amazon alternative",
    "buy online",
    "fashion",
    "electronics",
    "home",
    "beauty",
    "marketplace",
  ],
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
    locale: "en_US",
    url: BASE_URL,
    siteName: "Tallaby.com",
    title: "Tallaby.com – Your Everything Store",
    description:
      "Discover endless shopping on Tallaby.com – electronics, fashion, home, beauty, and more. Worldwide delivery, secure checkout, and trusted sellers.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@tallaby",
    creator: "@tallaby",
    title: "Tallaby.com – Your Everything Store",
    description:
      "Tallaby.com brings you Amazon-like shopping with millions of products, great prices, and secure delivery.",
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "any" }],
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: BASE_URL,
    languages: {
      en: BASE_URL,
      ar: `${BASE_URL}/ar`,
      "x-default": BASE_URL,
    },
  },
  category: "ecommerce",
};

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

  // Enables static rendering for this locale (see next-intl docs).
  setRequestLocale(locale);

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
