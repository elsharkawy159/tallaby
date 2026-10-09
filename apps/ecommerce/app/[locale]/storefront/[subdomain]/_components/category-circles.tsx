import { getLocale, getTranslations } from "next-intl/server";
import { LayoutGrid } from "lucide-react";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import {
  storeQueryHref,
  type StoreQuery,
} from "@/app/[locale]/(main)/stores/[slug]/_components/store-products";
import type { StorefrontCategory } from "@/lib/storefront.server";
import { CategoryCarousel } from "./category-carousel.client";
import s from "../storefront.module.css";

/**
 * The seller's categories as round thumbnails, each showing one of the
 * seller's own products from that category (as on the tallaby.com home).
 */
export async function CategoryCircles({
  categories,
  query,
}: {
  categories: StorefrontCategory[];
  query: StoreQuery;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("storefront"),
    getLocale(),
  ]);
  if (categories.length < 2) return null;

  const label = (c: StorefrontCategory) =>
    (locale === "ar" ? c.nameAr || c.name : c.name || c.nameAr) ?? "";
  const total = categories.reduce((sum, c) => sum + c.productCount, 0);
  const href = (category?: string) =>
    storeQueryHref("/", { sort: query.sort, category });

  return (
    <nav aria-label={t("categoriesLabel")}>
      <CategoryCarousel
        dir={locale === "ar" ? "rtl" : "ltr"}
        labels={{
          previous: t("previousCategories"),
          next: t("nextCategories"),
        }}
      >
        <Link
          href={href()}
          scroll={false}
          className={s.circleLink}
          aria-current={query.category ? undefined : "true"}
        >
          <span className={s.circle}>
            <span className={s.circleAll}>
              <LayoutGrid className="size-7" aria-hidden />
            </span>
          </span>
          <span className={s.circleName}>{t("allProducts")}</span>
          <span className={s.circleCount}>{total}</span>
        </Link>
        {categories.map((category) => (
          <Link
            key={category.key}
            href={href(category.key)}
            scroll={false}
            className={s.circleLink}
            aria-current={query.category === category.key ? "true" : undefined}
          >
            <span className={s.circle}>
              {category.coverImage ? (
                <ImageWithFallback
                  src={getPublicUrl(category.coverImage, "products")}
                  alt=""
                  fill
                  sizes="100px"
                  className={s.circleImage}
                />
              ) : (
                <span className={s.circleAll}>{label(category).charAt(0)}</span>
              )}
            </span>
            <span className={s.circleName}>{label(category)}</span>
            <span className={s.circleCount}>{category.productCount}</span>
          </Link>
        ))}
      </CategoryCarousel>
    </nav>
  );
}
