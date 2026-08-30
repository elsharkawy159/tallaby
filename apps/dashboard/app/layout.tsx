import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@workspace/ui/globals.css";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
// import { ThemeProvider } from "next-themes";
import { Toaster } from "@workspace/ui/components/sonner";
import { getSiteData } from "@/actions/site-data";
import { SiteDataProvider } from "@/providers/site-data";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vendor Dashboard",
  description: "Vendor Dashboard",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

// Not needed as a blanket declaration: this layout reads getLocale() (cookie-
// driven), which already forces dynamic rendering. Individual private routes
// keep their own explicit `export const dynamic = "force-dynamic"` as a marker.

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <SiteDataProvider promise={getSiteData()}>
          <NextIntlClientProvider>
            {/* <ThemeProvider
              attribute="class"
              defaultTheme="light"
              disableTransitionOnChange
            > */}
              {children}
              <Toaster position="top-center" />
            {/* </ThemeProvider> */}
          </NextIntlClientProvider>
        </SiteDataProvider>
      </body>
    </html>
  );
}
