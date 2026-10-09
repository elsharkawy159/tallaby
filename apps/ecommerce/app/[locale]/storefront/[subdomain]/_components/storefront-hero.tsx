import Image from "next/image";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { BadgeCheck, MapPin, Star, Store, Truck } from "lucide-react";
import { storeUrl } from "@workspace/lib/storefront";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import { cn, getPublicUrl } from "@workspace/ui/lib/utils";
import { storeCategoryLabel, type Storefront } from "@/lib/storefront.server";
import { ShareStore } from "./share-store.client";
import s from "../storefront.module.css";

/** The store name set as a shop sign over the seller's banner. */
export async function StorefrontHero({ store }: { store: Storefront }) {
  const [t, tStores, format, locale] = await Promise.all([
    getTranslations("storefront"),
    getTranslations("pages.stores"),
    getFormatter(),
    getLocale(),
  ]);
  const bio = store.description || store.storeDescription;
  const ratings = store.totalRatings ?? 0;
  const category = storeCategoryLabel(store, locale);

  return (
    <section className={cn(s.hero, !store.bannerUrl && s.heroPlain)}>
      {store.bannerUrl && (
        <Image
          src={getPublicUrl(store.bannerUrl, "sellers")}
          alt=""
          fill
          priority
          sizes="100vw"
          className={s.heroImage}
        />
      )}
      <div className={cn(s.wrap, s.heroInner)}>
        <h1 className={s.sign}>
          {store.displayName}
          {store.isVerified && (
            <BadgeCheck
              className="ms-3 inline size-[0.4em] fill-white align-[0.15em] text-(--sf-brand)"
              aria-label={tStores("verifiedBadge")}
            />
          )}
        </h1>

        {bio && <p className={cn(s.heroBio, "line-clamp-3")}>{bio}</p>}

        <ul className={s.heroFacts}>
          {store.storeRating != null && ratings > 0 && (
            <li>
              <Star className="size-4 fill-(--sf-sun) text-(--sf-sun)" aria-hidden />
              {t("ratingSummary", {
                rating: format.number(store.storeRating, { maximumFractionDigits: 1 }),
                count: ratings,
              })}
            </li>
          )}
          {store.governorate && (
            <li>
              <MapPin className="size-4" aria-hidden />
              {getGovernorateLabel(store.governorate, locale)}
            </li>
          )}
          {category && (
            <li>
              <Store className="size-4" aria-hidden />
              {category}
            </li>
          )}
          {store.freeDelivery && (
            <li>
              <Truck className="size-4" aria-hidden />
              {tStores("freeDelivery")}
            </li>
          )}
        </ul>

        <div className={s.heroActions}>
          <a href="#products" className={s.heroButton}>
            {t("browseProducts")}
          </a>
          <ShareStore
            storeName={store.displayName}
            url={storeUrl(store.subdomain)}
            className={cn(s.heroButton, s.heroButtonGhost)}
          />
        </div>
      </div>
    </section>
  );
}
