import type { Metadata } from "next";
import { Montserrat, Noto_Kufi_Arabic } from "next/font/google";
import "@workspace/ui/globals.css";
import "./globals.css";
import { getLocale, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "@workspace/ui/components/sonner";
import { DirectionProvider } from "@workspace/ui/components/direction";
import { getSiteData } from "@/actions/site-data";
import { SiteDataProvider } from "@/providers/site-data";
import { ZodLocale } from "@/lib/i18n/zod-locale.client";
import { ThemeProvider } from "@/providers/theme";
import QueryProvider from "@/providers/use-query";
import { MetaPixel } from "@/components/meta-pixel.client";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("title"),
    description: t("description"),
    icons: {
      apple: [{ url: "/logo/logo.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "Tallaby Seller",
      statusBarStyle: "default",
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

// Not needed as a blanket declaration: this layout reads getLocale() (cookie-
// driven), which already forces dynamic rendering. Individual private routes
// keep their own explicit `export const dynamic = "force-dynamic"` as a marker.

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    // Smooth in-page scrolling; data-scroll-behavior makes Next jump instantly on route changes.
    <html
      lang={locale}
      dir={direction}
      className="scroll-smooth motion-reduce:scroll-auto"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body
        className={`${locale === "ar" ? `${notoKufiArabic.variable} ${montserrat.variable}` : montserrat.variable} antialiased`}
      >
        <MetaPixel />
        <DirectionProvider dir={direction}>
          <SiteDataProvider promise={getSiteData()}>
            <NextIntlClientProvider>
              <ZodLocale />
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                disableTransitionOnChange
              >
                <QueryProvider>{children}</QueryProvider>
                <Toaster />
              </ThemeProvider>
            </NextIntlClientProvider>
          </SiteDataProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
