import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { appPaths, getApp } from "@workspace/apps";
import { parseStoreSeo, storeSeoDefaults } from "@workspace/lib/stores";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { PageContainer, PageHeader } from "@/components/seller-ui";
import { Link } from "@/i18n/navigation";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { SiteOfflineNote } from "../_components/site-offline-note";
import { loadLiveDomain } from "../domain/domain.data";
import { PagesSeo } from "./pages-seo.client";
import { loadNoindexReasons, loadSeoDefaults, loadSeoPages } from "./seo.data";
import { toSeoFormValues } from "./seo.dto";
import { StoreSeoForm } from "./seo-form.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellerWebsite.seoPage");
  return { title: t("title") };
}

/**
 * Website › SEO (owner, 2026-11-09; simplified 2026-11-27): the store's own
 * SEO, then every page's SEO. Google Search Console (code, sitemap, robots)
 * is its own app now: Apps › Google Search Console.
 */
export default async function StoreSeoPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const liveDomain = await loadLiveDomain(store);
  const [blockedBy, defaults, pages, tp] = await Promise.all([
    loadNoindexReasons(store),
    loadSeoDefaults(store),
    loadSeoPages(store),
    getTranslations("sellerWebsite.seoPage"),
  ]);
  const readOnly = store.status !== "active";
  const seo = parseStoreSeo(store.seo);
  // What a page with no SEO of its own falls back to: the store's saved SEO, else its defaults.
  const effective = storeSeoDefaults(
    { name: store.name, description: store.description, storeCategory: store.storeCategory, storeCategoryAr: store.storeCategoryAr },
    seo,
    defaults.locale,
  );
  const searchConsole = getApp("google_search_console");

  return (
    <PageContainer narrow>
      <PageHeader className="sui-rise" title={tp("title")} description={tp("description")} />
      <SiteOfflineNote storeId={store.id} siteStatus={store.siteStatus} />

      <StoreSeoForm
        storeId={store.id}
        storeName={store.name}
        storeHost={liveDomain ?? storeHostname(store.subdomain)}
        initial={toSeoFormValues(seo)}
        defaults={defaults}
        blockedBy={blockedBy}
        readOnly={readOnly}
      />

      {/* #pages: Website › Pages links here. */}
      <div id="pages" className="scroll-mt-24">
        <PagesSeo
          storeId={store.id}
          initial={pages}
          readOnly={readOnly}
          ctx={{
            storeName: store.name,
            storeUrl: storeUrl(store.subdomain, liveDomain),
            template: effective.titleTemplate,
            homeDefault: effective.homeTitle,
            description: effective.description,
            keywords: effective.keywords,
            locale: defaults.locale,
          }}
        />
      </div>

      {searchConsole && (
        <Link
          href={appPaths.settings(store.id, searchConsole)}
          className="flex items-center gap-3 rounded-[18px] border border-(--s-line) bg-(--s-surface) px-4 py-3 text-[13px] text-(--s-muted) hover:border-(--s-primary)"
        >
          <span className="min-w-0 flex-1">
            <b className="block text-sm font-bold text-(--s-text)">{tp("searchConsole.title")}</b>
            {tp("searchConsole.description")}
          </span>
          <ChevronRight aria-hidden className="size-4 shrink-0 text-(--s-subtle) rtl:-scale-x-100" />
        </Link>
      )}
    </PageContainer>
  );
}
