import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { hreflangMap, localizedUrl } from "./seo.lib";
import { SOCIAL_LINKS } from "./site.lib";

export { localizedUrl };

/** public/og-image.jpg, the share image of every page without its own. */
const DEFAULT_OG_IMAGE = { url: "/og-image.jpg", width: 1200, height: 630 };

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
  const image = { ...DEFAULT_OG_IMAGE, alt: t("siteName") };

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: localizedUrl(locale, path),
      languages: hreflangMap(path),
    },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: locale === "ar" ? "en_US" : "ar_EG",
      url: localizedUrl(locale, path),
      title,
      description,
      images: [image],
    },
    twitter: { card: "summary_large_image", site: SOCIAL_LINKS.x.handle, title, description, images: [image] },
  };
}
