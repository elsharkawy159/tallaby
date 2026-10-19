import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";
import { SITE_URL } from "./site.lib";

/** Absolute URL for a path in a locale ("as-needed": Arabic is unprefixed). */
export function localizedUrl(locale: string, path: string): string {
  const clean = path === "/" ? "" : path;
  return locale === routing.defaultLocale ? `${SITE_URL}${clean}` || SITE_URL : `${SITE_URL}/${locale}${clean}`;
}

/** Title, description, canonical and hreflang for a page. */
export async function pageMetadata({
  locale,
  page,
  path,
  values,
  absoluteTitle,
}: {
  locale: string;
  /** Key under `meta` in the messages. */
  page: string;
  path: string;
  values?: Record<string, string>;
  /** Home uses its full title without the "| Tallaby" suffix. */
  absoluteTitle?: boolean;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t(`${page}.title`, values);
  const description = t(`${page}.description`, values);
  const languages = Object.fromEntries(routing.locales.map((l: AppLocale) => [l, localizedUrl(l, path)]));

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: localizedUrl(locale, path),
      languages: { ...languages, "x-default": localizedUrl(routing.defaultLocale, path) },
    },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: locale === "ar" ? "ar_EG" : "en_US",
      url: localizedUrl(locale, path),
      title,
      description,
      images: [{ url: "/og-image.jpg" }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
