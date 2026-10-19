import type { Metadata } from "next";
import { Montserrat, Noto_Kufi_Arabic } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { DirectionProvider } from "@workspace/ui/components/direction";
import { notFound } from "next/navigation";
import { MetaPixel } from "@/components/meta/meta-pixel";
import { GoogleAnalytics } from "@/components/layout/google-analytics";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800"],
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-kufi-arabic",
  weight: ["400", "500", "600", "700", "800"],
});

// This is the app's root layout, which makes `[locale]` a root param — the
// segment `i18n/request.ts` reads via `next/root-params`. Enumerating the
// locales here is what makes every nested page eligible for static rendering.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Resolves relative OG/Twitter image paths ("/og-image.jpg") against the real
// origin instead of Next's localhost fallback. Titles and descriptions come
// from the (marketing) and (shop) group layouts.
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL || "http://localhost:3000"),
};

type RootLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Shared shell only. Styles and providers live in the route groups:
 * (marketing) is the tallaby.com site, (shop) holds seller storefronts and
 * the customer pages they use (checkout, auth, orders, profile). Each group
 * imports its own CSS because the marketing palette overrides Tailwind colors.
 */
export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction}>
      {/* No Kufi variable in English: the shop's body font picks Kufi whenever it is set. */}
      <body
        className={`${
          locale === "ar" ? `${notoKufiArabic.variable} ${montserrat.variable}` : montserrat.variable
        } antialiased`}
      >
        {/* Tallaby's own tracking: both skip seller storefronts (P5-05). */}
        <MetaPixel />
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          <DirectionProvider dir={direction}>{children}</DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
