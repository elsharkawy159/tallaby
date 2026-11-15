import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Montserrat, Noto_Kufi_Arabic } from "next/font/google";
import "@workspace/ui/globals.css";
import "./globals.css";
import { EmptyState, SellerButton, SellerCard } from "@/components/seller-ui";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

// A URL that matches no route (experimental.globalNotFound): served as a real
// 404 with server HTML. It bypasses app/[locale]/layout.tsx, so it imports the
// global styles and fonts itself, and has no locale, so it shows both
// languages. In-page notFound() (e.g. requireStore) uses app/[locale]/not-found.tsx.
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

export const metadata: Metadata = {
  title: `${ar.errorPages.notFoundTitle} · ${en.errorPages.notFoundTitle}`,
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${notoKufiArabic.variable} ${montserrat.variable} antialiased`}>
        <main data-page-state="not-found" className="seller-shell grid min-h-dvh place-items-center bg-background p-4">
          <SellerCard className="w-full max-w-[480px]">
            <Image
              src="/illustrations/status/not-found.png"
              alt=""
              aria-hidden
              width={160}
              height={160}
              className="mx-auto mt-[26px] block size-40 select-none"
            />
            <EmptyState
              className="pt-0"
              title={<h1 className="text-[17px]">{ar.errorPages.notFoundTitle}</h1>}
              description={ar.errorPages.notFoundBody}
              action={
                <SellerButton asChild variant="solid">
                  <Link href="/">{ar.errorPages.home}</Link>
                </SellerButton>
              }
            />
            <div lang="en" dir="ltr" className="border-t">
              <EmptyState
                title={<p className="text-[17px] font-semibold">{en.errorPages.notFoundTitle}</p>}
                description={en.errorPages.notFoundBody}
                action={
                  <SellerButton asChild variant="outline">
                    <Link href="/en">{en.errorPages.home}</Link>
                  </SellerButton>
                }
              />
            </div>
          </SellerCard>
        </main>
      </body>
    </html>
  );
}
