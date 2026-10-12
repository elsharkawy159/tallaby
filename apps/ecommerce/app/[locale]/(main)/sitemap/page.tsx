import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { getSitemapDataset } from "@/lib/sitemap/sitemap.server";
import type { SitemapEntry, SitemapPageType } from "@/lib/sitemap/sitemap.lib";

// Same data and schedule as /sitemap.xml.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sitemapPage" });

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/sitemap",
    title: t("title"),
    description: t("description"),
  });
}

const SECTIONS: Array<{ type: SitemapPageType; key: "pages" | "categories" | "brands" | "stores" | "products" }> = [
  { type: "page", key: "pages" },
  { type: "category", key: "categories" },
  { type: "brand", key: "brands" },
  { type: "store", key: "stores" },
  { type: "product", key: "products" },
];

/**
 * Human sitemap: every page from /sitemap.xml in this page's language only
 * (/sitemap → Arabic, /en/sitemap → English), as plain links by section.
 */
export default async function SitemapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const [t, tPages, { entries }] = await Promise.all([
    getTranslations({ locale, namespace: "sitemapPage" }),
    getTranslations({ locale, namespace: "breadcrumb" }),
    getSitemapDataset(),
  ]);

  const collator = new Intl.Collator(locale);
  const labelOf = (entry: SitemapEntry) => {
    if (entry.label) return entry.label;
    const segment = entry.path.slice(1) || "home";
    return tPages.has(segment) ? tPages(segment) : segment;
  };

  const sections = SECTIONS.map(({ type, key }) => {
    const links = entries
      .filter((e) => e.locale === locale && e.type === type)
      .map((e) => ({ href: e.path || "/", label: labelOf(e) }));
    // Pages keep their curated order; everything else reads alphabetically.
    if (type !== "page") links.sort((a, b) => collator.compare(a.label, b.label));
    return { key, links };
  }).filter((s) => s.links.length > 0);

  return (
    <div className="min-h-screen">
      <DynamicBreadcrumb />
      <main className="container py-6">
        <h1 className="text-2xl font-bold lg:text-3xl">{t("heading")}</h1>
        <p className="mt-1 mb-8 text-muted-foreground">{t("intro")}</p>

        <div className="space-y-10">
          {sections.map(({ key, links }) => (
            <section key={key} aria-labelledby={`sitemap-${key}`}>
              <h2 id={`sitemap-${key}`} className="mb-3 border-b pb-2 text-lg font-semibold">
                {t(key)} <span className="text-sm font-normal text-muted-foreground">({links.length})</span>
              </h2>
              <ul className="columns-1 gap-8 sm:columns-2 lg:columns-3">
                {links.map((link) => (
                  <li key={link.href} className="mb-2 break-inside-avoid">
                    <Link href={link.href} className="text-sm text-primary hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
