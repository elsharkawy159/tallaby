import type { Metadata, Viewport } from "next";
import { Montserrat, Noto_Kufi_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { DirectionProvider } from "@workspace/ui/components/direction";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site.lib";
import "../globals.css";

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

// `[locale]` is the root param read by i18n/request.ts; listing the locales
// keeps every page statically renderable.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className={`${montserrat.variable} ${notoKufiArabic.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <DirectionProvider dir={dir}>{children}</DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
