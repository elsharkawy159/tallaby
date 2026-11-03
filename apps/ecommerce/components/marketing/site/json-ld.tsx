import { getLocale, getTranslations } from "next-intl/server";
import { localizedUrl } from "@/lib/marketing/seo.lib";
import { serializeJsonLd, softwareApplicationSchema } from "@/lib/marketing/structured-data.lib";

/** Structured data for search engines; renders nothing visible. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

/** The product's SoftwareApplication data on the home and pricing pages. */
export async function ProductJsonLd({ page, path }: { page: "home" | "pricing"; path: string }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return (
    <JsonLd
      data={softwareApplicationSchema({
        url: localizedUrl(locale, path),
        description: t(`${page}.description`),
        inLanguage: locale,
      })}
    />
  );
}
