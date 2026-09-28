import type { Metadata } from "next";
import { Montserrat, Noto_Kufi_Arabic } from "next/font/google";
import "@workspace/ui/globals.css";
import { getLocale, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "@workspace/ui/components/sonner";
import { DirectionProvider } from "@workspace/ui/components/direction";
import { getSiteData } from "@/actions/site-data";
import { SiteDataProvider } from "@/providers/site-data";
import { ZodLocale } from "@/lib/i18n/zod-locale.client";
import { ThemeProvider } from "@/providers/theme";

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
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body
        className={`${locale === "ar" ? notoKufiArabic.variable : montserrat.variable} antialiased`}
      >
        <DirectionProvider dir={direction}>
          <SiteDataProvider promise={getSiteData()}>
            <NextIntlClientProvider>
              <ZodLocale />
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                disableTransitionOnChange
              >
                {children}
                <Toaster position="top-center" />
              </ThemeProvider>
            </NextIntlClientProvider>
          </SiteDataProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
