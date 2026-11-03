import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter } from "next-intl/server";
import { cmsItemSummaryFields, type CmsFieldDef } from "@workspace/lib/cms";
import { storeUrl } from "@workspace/lib/storefront";
import { cmsImageUrl } from "@/lib/store-cms/cms.lib";
import { getCachedCmsCollection, getCachedCmsItem } from "@/lib/store-cms/cms.server";
import { resolveStorefront } from "@/lib/storefront.server";
import { storePageMetadata } from "@/lib/store-seo/store-seo.lib";
import { isSubdomainOfflineForRequest, STORE_OFFLINE_METADATA } from "@/lib/store-site/offline.server";
import { ArticleBody, ContentImage, JsonLd } from "../../../_components/store-content";
import s from "../../../storefront.module.css";

type CmsItemPageProps = {
  params: Promise<{ locale: string; subdomain: string; collection: string; itemSlug: string }>;
};

/**
 * A published CMS item, /{collection}/{item} on a store host (PLAN.md §8.5,
 * P4-11). A path whose first segment is not one of this store's collections
 * or a known collection with no such published item, is this store's 404.
 */
async function load(locale: string, subdomain: string, collectionSlug: string, itemSlug: string) {
  const store = await resolveStorefront(subdomain);
  const collection = await getCachedCmsCollection(store.id, store.storeId, collectionSlug);
  if (!collection || collection.kind === "blog") notFound();
  const item = await getCachedCmsItem(store.id, store.storeId, collection.slug, itemSlug);
  if (!item) notFound();
  const summary = cmsItemSummaryFields(collection.fields, item.data);
  return { store, collection, item, summary };
}

export async function generateMetadata({ params }: CmsItemPageProps): Promise<Metadata> {
  const { locale, subdomain, collection: collectionSlug, itemSlug } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const { store, collection, item, summary } = await load(locale, subdomain, collectionSlug, itemSlug);
  return storePageMetadata(store, locale, {
    paths: `/${collection.slug}/${item.slug}`,
    title: item.seo.title || summary.title || item.slug,
    description: item.seo.description || summary.excerpt,
    image: cmsImageUrl(item.seo.ogImage || summary.image),
    article: { publishedTime: item.publishedAt, modifiedTime: item.updatedAt },
    noindex: item.seo.noindex,
  });
}

function FieldValue({ field, value, format, itemTitle }: { field: CmsFieldDef; value: unknown; format: Awaited<ReturnType<typeof getFormatter>>; itemTitle: string }) {
  switch (field.type) {
    case "richtext":
      return <ArticleBody html={typeof value === "string" ? value : ""} />;
    case "textarea":
      return <p className="whitespace-pre-line text-pretty leading-relaxed">{String(value)}</p>;
    case "image":
      return (
        <div className="overflow-hidden rounded-(--sf-radius,12px) bg-(--sf-shelf)">
          <ContentImage src={String(value)} alt={itemTitle} className="h-auto w-full" sizes="(min-width: 768px) 768px, 100vw" />
        </div>
      );
    case "boolean":
      return <span>{value ? "✓" : "—"}</span>;
    case "number":
      return <span dir="ltr">{format.number(Number(value))}</span>;
    case "date": {
      const date = new Date(String(value));
      return <span>{Number.isNaN(date.getTime()) ? String(value) : format.dateTime(date, { dateStyle: "long" })}</span>;
    }
    case "url":
    case "email": {
      const href = field.type === "email" ? `mailto:${String(value)}` : String(value);
      if (!/^(?:https?:|mailto:|tel:)/i.test(href)) return <span>{String(value)}</span>;
      return (
        <a href={href} className="font-medium text-(--sf-brand) underline" rel="noopener noreferrer nofollow" target={href.startsWith("http") ? "_blank" : undefined}>
          {String(value)}
        </a>
      );
    }
    case "select":
      return <span>{field.options?.find((o) => o.value === value)?.label ?? String(value)}</span>;
    case "tags":
      return (
        <span className="flex flex-wrap gap-2">
          {(Array.isArray(value) ? value : []).map((tag) => (
            <span key={String(tag)} className="rounded-full border border-(--sf-line) px-3 py-1 text-sm">
              {String(tag)}
            </span>
          ))}
        </span>
      );
    default:
      return <span>{String(value)}</span>;
  }
}

export default async function StoreCmsItemPage({ params }: CmsItemPageProps) {
  const { locale, subdomain, collection: collectionSlug, itemSlug } = await params;
  // Website offline: the layout shows the offline page; no marketplace redirect.
  if (await isSubdomainOfflineForRequest(subdomain)) return null;
  const [{ store, collection, item, summary }, format] = await Promise.all([
    load(locale, subdomain, collectionSlug, itemSlug),
    getFormatter({ locale }),
  ]);
  const primary = collection.fields.find((f) => f.type === "text")?.key;
  const rest = collection.fields.filter((f) => f.key !== primary && item.data[f.key] !== undefined && item.data[f.key] !== "");
  const base = storeUrl(store.subdomain, store.customDomain);

  return (
    <article className={`${s.wrap} py-10 md:py-14`}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: (summary.title || item.slug).slice(0, 110),
          datePublished: item.publishedAt,
          dateModified: item.updatedAt,
          image: cmsImageUrl(summary.image) ?? undefined,
          publisher: { "@type": "Organization", name: store.displayName, url: base },
        }}
      />
      <div className="mx-auto max-w-3xl space-y-6">
        <p className="text-sm font-semibold text-(--sf-muted)">{collection.name}</p>
        <h1 className="text-balance text-3xl font-bold leading-tight md:text-4xl">{summary.title || item.slug}</h1>
        {rest.map((field) => (
          <section key={field.key} className="space-y-2">
            {field.type !== "richtext" && field.type !== "image" && field.type !== "textarea" && (
              <h2 className="text-sm font-semibold text-(--sf-muted)">{field.label}</h2>
            )}
            <FieldValue field={field} value={item.data[field.key]} format={format} itemTitle={summary.title || item.slug} />
          </section>
        ))}
      </div>
    </article>
  );
}
