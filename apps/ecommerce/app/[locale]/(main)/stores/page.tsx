import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateStaticPageMetadata, type SeoLocale } from "@/lib/metadata";
import { getAllSellers, getSellerCategoryMix } from "@/actions/seller";
import { Store, BadgeCheck, Star } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import s from "./stores.module.css";

export const revalidate = 3600;

const TONES = [s.tone0, s.tone1, s.tone2, s.tone3, s.tone4, s.tone5];

type Seller = {
  id: string;
  displayName: string;
  slug: string;
  logoUrl: string | null;
  storeRating: number | null;
  totalRatings: number | null;
  productCount: number | null;
  isVerified: boolean | null;
};

type Category = {
  id: string;
  label: string;
  slug: string | null;
  tone?: string;
};

type Aisle = { category: Category; sellers: Seller[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("pages.stores");

  return generateStaticPageMetadata({
    locale: locale as SeoLocale,
    path: "/stores",
    title: t("title"),
    description: t("description"),
  });
}

export default async function StoresPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("pages.stores");
  const [sellerResult, mixResult] = await Promise.all([
    getAllSellers(),
    getSellerCategoryMix(),
  ]);
  const sellers: Seller[] = sellerResult.success ? (sellerResult.data ?? []) : [];
  const mix = mixResult.data;

  const label = (row: { name: string | null; nameAr: string | null }) =>
    (locale === "ar" ? row.nameAr || row.name : row.name || row.nameAr) ?? "";

  // Categories each seller sells in, most products first (the query's order).
  // Keyed by slug: the catalog has duplicate root categories sharing one slug,
  // and shoppers should see them as a single aisle.
  const bySeller = new Map<string, { categoryId: string; productCount: number }[]>();
  const categoryInfo = new Map<string, Omit<Category, "tone">>();
  for (const row of mix) {
    const key = row.slug ?? row.categoryId;
    if (!categoryInfo.has(key)) {
      categoryInfo.set(key, { id: key, label: label(row), slug: row.slug });
    }
    const list = bySeller.get(row.sellerId) ?? [];
    const existing = list.find((c) => c.categoryId === key);
    if (existing) existing.productCount += row.productCount;
    else list.push({ categoryId: key, productCount: row.productCount });
    bySeller.set(row.sellerId, list);
  }
  for (const list of bySeller.values()) {
    list.sort((a, b) => b.productCount - a.productCount);
  }

  // A seller stands in the aisle of the category they sell most in.
  const aisleMembers = new Map<string, Seller[]>();
  const settingUp: Seller[] = [];
  for (const seller of sellers) {
    const primary = bySeller.get(seller.id)?.[0];
    if (!primary) {
      settingUp.push(seller);
      continue;
    }
    const members = aisleMembers.get(primary.categoryId) ?? [];
    members.push(seller);
    aisleMembers.set(primary.categoryId, members);
  }

  // Biggest aisles first; colors follow that order so each category keeps
  // one color across the directory, aisle headers, stalls, and chips.
  const categories = new Map<string, Category>();
  const aisles: Aisle[] = [...aisleMembers.entries()]
    .sort(
      ([a, am], [b, bm]) =>
        bm.length - am.length ||
        categoryInfo.get(a)!.label.localeCompare(categoryInfo.get(b)!.label, locale),
    )
    .map(([id, members], i) => {
      const category = { ...categoryInfo.get(id)!, tone: TONES[i % TONES.length]! };
      categories.set(id, category);
      return { category, sellers: members };
    });
  // Categories a seller also sells in without having an aisle of their own.
  let next = aisles.length;
  for (const info of categoryInfo.values()) {
    if (!categories.has(info.id)) {
      categories.set(info.id, { ...info, tone: TONES[next++ % TONES.length]! });
    }
  }

  const stallProps = (seller: Seller) => {
    const sells = bySeller.get(seller.id) ?? [];
    return {
      seller,
      productCount: sells.length
        ? sells.reduce((sum, c) => sum + c.productCount, 0)
        : (seller.productCount ?? 0),
      alsoSells: sells.slice(1).map((c) => categories.get(c.categoryId)!),
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1 pb-20">
        <header className={cn(s.awningTone, s.tone0)}>
          <div className={cn(s.awning, s.heroAwning)} aria-hidden />
          <div className="container pt-14 pb-2 md:pt-20 md:pb-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary text-balance max-w-3xl">
              {t("heading")}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl text-pretty">
              {t("intro")}
            </p>
            {sellers.length > 0 && (
              <p className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-foreground">
                <span>{t("storesCount", { count: sellers.length })}</span>
                {aisles.length > 0 && (
                  <span>{t("aislesCount", { count: aisles.length })}</span>
                )}
              </p>
            )}
          </div>
        </header>

        {sellers.length === 0 ? (
          <div className="container">
            <div className="rounded-xl border border-dashed py-16 text-center">
              <Store className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{t("noStores")}</p>
            </div>
          </div>
        ) : (
          <>
            {aisles.length > 1 && (
              <nav aria-label={t("directoryLabel")} className="container mb-4">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {t("directoryLabel")}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {aisles.map(({ category, sellers: members }) => (
                    <li key={category.id}>
                      <a
                        href={`#aisle-${category.id}`}
                        className={cn(
                          s.awningTone,
                          category.tone,
                          s.chip,
                          "flex items-center gap-2 rounded-full border ps-1.5 pe-3 py-1.5 text-sm font-medium transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                        )}
                      >
                        <span className={cn(s.swatch, "h-5 w-5 rounded-full")} aria-hidden />
                        {category.label}
                        <span className="text-muted-foreground tabular-nums">
                          {members.length}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {aisles.map(({ category, sellers: members }) => (
              <Aisle
                key={category.id}
                id={`aisle-${category.id}`}
                tone={category.tone}
                title={category.label}
                count={t("storesCount", { count: members.length })}
                action={
                  category.slug && (
                    <Link
                      href={`/categories/${category.slug}`}
                      className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {t("browseCategory", { category: category.label })}
                    </Link>
                  )
                }
              >
                {members.map((seller) => (
                  <Stall key={seller.id} tone={category.tone} {...stallProps(seller)} t={t} />
                ))}
              </Aisle>
            ))}

            {settingUp.length > 0 && (
              <Aisle
                id="aisle-setting-up"
                tone={s.toneIdle}
                title={t("settingUp")}
                count={t("storesCount", { count: settingUp.length })}
                note={t("settingUpNote")}
              >
                {settingUp.map((seller) => (
                  <Stall key={seller.id} tone={s.toneIdle} {...stallProps(seller)} t={t} />
                ))}
              </Aisle>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Aisle({
  id,
  tone,
  title,
  count,
  note,
  action,
  children,
}: {
  id: string;
  tone?: string;
  title: string;
  count: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(s.awningTone, tone, "container scroll-mt-24 pt-12")}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b pb-4">
        <div className="flex items-center gap-4">
          <span className={cn(s.swatch, "h-10 w-2.5 shrink-0 rounded-full")} aria-hidden />
          <div>
            <h2 id={`${id}-title`} className="text-2xl md:text-3xl font-bold tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {count}
              {note && <span className="block">{note}</span>}
            </p>
          </div>
        </div>
        {action}
      </div>
      <ul className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </ul>
    </section>
  );
}

function Stall({
  seller,
  tone,
  productCount,
  alsoSells,
  t,
}: {
  seller: Seller;
  tone?: string;
  productCount: number;
  alsoSells: Category[];
  t: Awaited<ReturnType<typeof getTranslations<"pages.stores">>>;
}) {
  return (
    <li>
      <Link
        href={`/stores/${seller.slug}`}
        className={cn(
          s.awningTone,
          tone,
          s.stall,
          "group flex h-full flex-col overflow-hidden rounded-t-md rounded-b-xl bg-card shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
        )}
      >
        <div className={cn(s.awning, s.stallAwning)} aria-hidden />
        <div className="flex flex-1 flex-col items-center px-5 pt-8 pb-5 text-center">
          <div className="relative mb-4 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-card ring-4 ring-card shadow-md">
            {seller.logoUrl ? (
              <Image
                src={seller.logoUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">
                {seller.displayName.trim().charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <h3 className="flex items-center justify-center gap-1.5 text-lg font-bold leading-tight group-hover:text-primary">
            <span className="line-clamp-2">{seller.displayName}</span>
            {seller.isVerified && (
              <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-primary" aria-label={t("verifiedBadge")} />
            )}
          </h3>

          <p className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
            {productCount > 0 && <span>{t("productsCount", { count: productCount })}</span>}
            {seller.storeRating != null && (seller.totalRatings ?? 0) > 0 && (
              <span className="flex items-center gap-1" aria-label={`${seller.storeRating.toFixed(1)} ${t("ratingLabel")}`}>
                <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
                <span aria-hidden>{seller.storeRating.toFixed(1)}</span>
              </span>
            )}
          </p>

          {alsoSells.length > 0 && (
            <div className="mt-auto w-full pt-4">
              <p className="sr-only">{t("alsoSells")}</p>
              <ul className="flex flex-wrap justify-center gap-1.5">
                {alsoSells.map((c) => (
                  <li
                    key={c.id}
                    className={cn(s.awningTone, c.tone, s.chip, "rounded-full border px-2.5 py-0.5 text-xs font-medium")}
                  >
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
