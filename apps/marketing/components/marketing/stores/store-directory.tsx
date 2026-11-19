import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumb } from "@/components/marketing/site/breadcrumb";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { BackArrow, ForwardArrow } from "@/components/marketing/site/direction-icons";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { Container, Eyebrow } from "@/components/marketing/site/layout-primitives";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { localizedUrl, pageMetadata } from "@/lib/marketing/metadata.lib";
import { STORE_INDUSTRY_NAMES } from "@/lib/marketing/recent-stores.lib";
import {
  type DirectoryStore,
  directoryPage,
  directoryPageCount,
  directoryPagePath,
  directoryStores,
} from "@/lib/marketing/store-directory.lib";
import { getDirectoryStores } from "@/lib/marketing/stores.server";
import { breadcrumbSchema } from "@/lib/marketing/structured-data.lib";

/** Metadata of /stores (page 1) or /stores/page/<n>: self-canonical, with the usual hreflang. */
export async function storeDirectoryMetadata(locale: string, page: number): Promise<Metadata> {
  return page <= 1
    ? pageMetadata({ locale, page: "stores", path: "/stores" })
    : pageMetadata({ locale, page: "storesPage", path: directoryPagePath(page), values: { page: String(page) } });
}

/** The first letter of a store name, for stores without a logo. */
function initial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "?";
}

function StoreCard({ store, locale, products }: { store: DirectoryStore; locale: string; products: string }) {
  const industry = store.industry ? STORE_INDUSTRY_NAMES[store.industry][locale === "ar" ? "ar" : "en"] : null;
  return (
    <li>
      <a
        href={store.url}
        className="flex h-full items-center gap-4 rounded-[20px] border border-line bg-white/90 p-4 text-body transition-colors duration-150 hover:border-line-strong hover:text-body hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        <span className="flex size-16 flex-none items-center justify-center overflow-hidden rounded-2xl border border-line-soft bg-white">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- seller logos can live on any https host
            <img src={store.logoUrl} alt="" width={56} height={56} loading="lazy" decoding="async" className="size-14 object-contain" />
          ) : (
            <span aria-hidden className="flex size-full items-center justify-center bg-teal-50 text-2xl font-bold text-teal-700">
              {initial(store.name)}
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-base font-bold text-teal-900" dir="auto">
            {store.name}
          </span>
          {industry ? <span className="truncate text-[13px] text-ink-500">{industry}</span> : null}
          <span className="text-[13px] text-ink-400">{products}</span>
        </span>
      </a>
    </li>
  );
}

/**
 * One page of tallaby.com's store directory: every live, indexable store with
 * at least one product, in name order, DIRECTORY_PAGE_SIZE a page, as plain
 * links to the store's own address. A page past the end is a 404.
 */
export async function StoreDirectoryPage({ page }: { page: number }) {
  const [all, locale, t, tm] = await Promise.all([
    getDirectoryStores().then(directoryStores),
    getLocale(),
    getTranslations("storesDirectory"),
    getTranslations("meta"),
  ]);
  const stores = directoryPage(all, page);
  if (!stores) notFound();
  const pages = directoryPageCount(all.length);
  const path = directoryPagePath(page);
  const breadcrumbs = breadcrumbSchema([
    { name: tm("siteName"), url: localizedUrl(locale, "/") },
    { name: t("breadcrumb"), url: localizedUrl(locale, "/stores") },
    ...(page > 1 ? [{ name: t("pageOf", { page, pages }), url: localizedUrl(locale, path) }] : []),
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <section className="pt-9 pb-16 sm:pt-12">
        <Container>
          <Breadcrumb
            items={page > 1 ? [{ label: t("breadcrumb"), href: "/stores" }, { label: t("pageOf", { page, pages }) }] : [{ label: t("breadcrumb") }]}
            className="mb-[22px]"
          />
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="text-[clamp(34px,5vw,60px)] leading-[1.25] font-bold text-balance text-teal-900 en:leading-[1.1] en:tracking-[-0.02em]">
            {t("title")}
          </h1>
          <p className="mt-3 mb-10 max-w-[640px] text-[clamp(16px,2vw,18px)] text-pretty text-ink-500">{t("lead")}</p>

          {stores.length ? (
            <ul aria-label={t("listLabel")} className="m-0 grid list-none gap-3 p-0 min-[561px]:grid-cols-2 min-[961px]:grid-cols-3">
              {stores.map((store) => (
                <StoreCard key={store.url} store={store} locale={locale} products={t("products", { count: store.productCount })} />
              ))}
            </ul>
          ) : (
            <p className="rounded-[20px] border border-line bg-white/80 p-6 text-ink-500">{t("empty")}</p>
          )}

          {pages > 1 ? (
            <nav aria-label={t("pagination")} className="mt-10 flex flex-wrap items-center justify-between gap-4 text-sm">
              {page > 1 ? (
                <Link href={directoryPagePath(page - 1)} rel="prev" className="flex items-center gap-1.5 font-bold text-teal-700 hover:underline">
                  <BackArrow />
                  {t("previous")}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-ink-500">
                {t("pageOf", { page, pages })}
              </span>
              {page < pages ? (
                <Link href={directoryPagePath(page + 1)} rel="next" className="flex items-center gap-1.5 font-bold text-teal-700 hover:underline">
                  {t("next")}
                  <ForwardArrow />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </Container>
      </section>
      <CtaBand title={t("ctaTitle")} body={t("ctaBody")} action={<SignupTrigger>{t("cta")}</SignupTrigger>} />
    </>
  );
}
