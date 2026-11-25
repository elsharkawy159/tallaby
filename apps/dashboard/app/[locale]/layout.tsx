import type { Metadata } from "next";
import { Montserrat, Noto_Kufi_Arabic } from "next/font/google";
import "@workspace/ui/globals.css";
import "../globals.css";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { Toaster } from "@workspace/ui/components/sonner";
import { DirectionProvider } from "@workspace/ui/components/direction";
import { ZodLocale } from "@/lib/i18n/zod-locale.client";
import { ThemeProvider } from "@/providers/theme";
import QueryProvider from "@/providers/use-query";
import { MetaPixel } from "@/components/meta-pixel.client";
import { ClarityScript } from "@/components/clarity.client";
import { enabledClarityProjectId } from "@/lib/analytics/clarity.lib";
import { routing } from "@/i18n/routing";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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

// The app's root layout: `[locale]` is a root param (read by i18n/request.tsx
// through next/root-params). Arabic is served unprefixed (the proxy rewrites
// /orders to /ar/orders); English lives under /en.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({ params }: Pick<RootLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
    icons: {
      apple: [{ url: "/logo/logo.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "Tallaby",
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

// Cache Components is on (next.config.ts). The page language comes from the
// URL (the `[locale]` param), never from the locale cookie; every page and
// layout keeps `instant = false` until it adopts a static shell
// (docs/plans/dashboard-static-shell.md).

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const direction = locale === "ar" ? "rtl" : "ltr";
  // Microsoft Clarity: production only, on Vercel or self-hosted (lib/analytics/clarity.lib.ts).
  const clarityId = enabledClarityProjectId();

  return (
    // Smooth in-page scrolling; data-scroll-behavior makes Next jump instantly on route changes.
    <html
      lang={locale}
      dir={direction}
      className="scroll-smooth motion-reduce:scroll-auto"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      {/* noindex comes from generateMetadata above (the default for every route); only /login overrides it. */}
      <body
        className={`${locale === "ar" ? `${notoKufiArabic.variable} ${montserrat.variable}` : montserrat.variable} antialiased`}
      >
        <MetaPixel />
        {clarityId && <ClarityScript projectId={clarityId} />}
        <DirectionProvider dir={direction}>
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
        </DirectionProvider>
      </body>
    </html>
  );
}
