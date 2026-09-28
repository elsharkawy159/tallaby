import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { BadgeCheck, CalendarDays, MapPin, Star, Truck } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import { ShareStoreButton } from "./share-store-button";
import s from "./store.module.css";

export type StoreProfileSeller = {
  displayName: string;
  slug: string;
  description: string | null;
  storeDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  isVerified: boolean | null;
  storeRating: number | null;
  positiveRatingPercent: number | null;
  totalRatings: number | null;
  joinDate: string | null;
  freeDelivery: boolean;
  governorate: string | null;
};

export async function StoreProfile({
  seller,
  locale,
  productCount,
  categoryCount,
}: {
  seller: StoreProfileSeller;
  locale: string;
  productCount: number;
  categoryCount: number;
}) {
  const t = await getTranslations("pages.stores");
  const format = await getFormatter();
  const bio = seller.description || seller.storeDescription;
  const ratings = seller.totalRatings ?? 0;

  const stats: { value: string; label: string; star?: boolean }[] = [
    { value: format.number(productCount), label: t("statProducts", { count: productCount }) },
  ];
  if (seller.storeRating != null && ratings > 0) {
    stats.push({ value: seller.storeRating.toFixed(1), label: t("statRating"), star: true });
  }
  if (ratings > 0) {
    stats.push({ value: format.number(ratings), label: t("statRatings", { count: ratings }) });
  }
  if (seller.positiveRatingPercent != null && ratings > 0) {
    stats.push({
      value: format.number(seller.positiveRatingPercent / 100, { style: "percent" }),
      label: t("statPositive"),
    });
  }
  if (categoryCount > 0) {
    stats.push({ value: format.number(categoryCount), label: t("statCategories", { count: categoryCount }) });
  }

  return (
    <header className="container">
      <div className={cn(s.coverFrame, "-mx-4 sm:mx-0")}>
        <div
          className={cn(
            s.cover,
            !seller.bannerUrl && s.stripes,
            "relative aspect-[3/1] overflow-hidden bg-muted sm:rounded-t-2xl md:aspect-[4/1]",
          )}
        >
          {seller.bannerUrl && (
            <Image
              src={seller.bannerUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 1400px) 1400px, 100vw"
              className="object-cover"
            />
          )}
        </div>
      </div>

      <div className="relative flex flex-col gap-5 px-1 sm:px-4 md:flex-row md:items-end md:gap-6">
        <div className="relative -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full bg-card shadow-lg ring-4 ring-background md:-mt-16 md:h-36 md:w-36">
          {seller.logoUrl ? (
            <Image src={seller.logoUrl} alt="" fill priority sizes="144px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-primary text-4xl font-extrabold text-primary-foreground md:text-5xl">
              {seller.displayName.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 md:pb-1">
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            <span className="truncate">{seller.displayName}</span>
            {seller.isVerified && (
              <BadgeCheck
                className="h-6 w-6 shrink-0 fill-primary text-primary-foreground md:h-7 md:w-7"
                aria-label={t("verifiedBadge")}
              />
            )}
          </h1>
          <p className="text-muted-foreground">
            <bdi>@{seller.slug}</bdi>
          </p>
        </div>

        <div className="md:pb-2">
          <ShareStoreButton storeName={seller.displayName} />
        </div>
      </div>

      <div className="mt-5 px-1 sm:px-4">
        {bio && <p className="max-w-2xl text-pretty text-base leading-relaxed">{bio}</p>}

        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {seller.governorate && (
            <li className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden />
              {t("shipsFrom", { place: getGovernorateLabel(seller.governorate, locale) })}
            </li>
          )}
          {seller.joinDate && (
            <li className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden />
              {t("joined", {
                date: format.dateTime(new Date(seller.joinDate), { month: "long", year: "numeric" }),
              })}
            </li>
          )}
          {seller.freeDelivery && (
            <li className="flex items-center gap-1.5 font-medium text-primary">
              <Truck className="h-4 w-4" aria-hidden />
              {t("freeDelivery")}
            </li>
          )}
        </ul>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse">
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="flex items-center gap-1 text-2xl font-extrabold tabular-nums">
                {stat.star && (
                  <Star className="h-5 w-5 fill-accent text-accent" aria-hidden />
                )}
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
