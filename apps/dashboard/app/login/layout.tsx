import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PUBLIC_ENTRY_PATH, dashboardOrigin } from "@/lib/seo/public-entry.lib";

// /login is the dashboard's one indexable page (signed out, `/` redirects here).
// The root layout's noindex stays the default for every other route.
export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("meta.login"), getLocale()]);
  const origin = dashboardOrigin();
  const url = `${origin}${PUBLIC_ENTRY_PATH}`;
  const title = t("title");
  const description = t("description");
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: locale === "en" ? "en_US" : "ar_EG",
      title,
      description,
      url,
      images: [{ url: `${origin}/logo/logo.png`, width: 1622, height: 1622, alt: t("siteName") }],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
