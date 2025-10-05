import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@workspace/ui/globals.css";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
import { Scripts } from "@/components/layout/structured-data";
import { getMessages } from "next-intl/server";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Tallaby.com – Your Everything Store",
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
    url: "https://www.tallaby.com",
    siteName: "Tallaby.com",
    title: "Tallaby.com – Your Everything Store",
    description:
      "Discover endless shopping on Tallaby.com – electronics, fashion, home, beauty, and more. Worldwide delivery, secure checkout, and trusted sellers.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tallaby.com – Your Everything Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@tallaby",
    creator: "@tallaby",
    title: "Tallaby.com – Your Everything Store",
    description:
      "Tallaby.com brings you Amazon-like shopping with millions of products, great prices, and secure delivery.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#0f172a" },
    ],
  },
  manifest: "/site.webmanifest",
  themeColor: "#0f172a",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: "https://www.tallaby.com",
    languages: {
      "en-US": "https://www.tallaby.com",
      "es-ES": "https://www.tallaby.com/es",
      "fr-FR": "https://www.tallaby.com/fr",
    },
  },
  category: "ecommerce",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return (
    <html lang="en">
      <head>
        <Scripts />
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <NextTopLoader
          color="var(--accent)"
          crawlSpeed={200}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
        />
        <Providers>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
