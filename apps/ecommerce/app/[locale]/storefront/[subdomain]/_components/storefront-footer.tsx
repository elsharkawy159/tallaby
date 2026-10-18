import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Mail, MapPin, MessageCircle, Phone, Star, Store } from "lucide-react";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import { SocialIcon, getSocialPlatform } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import { BASE_URL } from "@/lib/constants";
import { storeCategoryLabel, type Storefront } from "@/lib/storefront.server";
import { StoreLogo } from "./store-logo";
import s from "../storefront.module.css";

/** Egyptian numbers as wa.me expects them: country code, digits only. */
function whatsappNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
}

/**
 * Closes the store the way the hero opens it: the store's name as a shop
 * sign, here set large and faint along the bottom edge.
 */
export async function StorefrontFooter({ store }: { store: Storefront }) {
  const [t, format, locale] = await Promise.all([
    getTranslations("storefront"),
    getFormatter(),
    getLocale(),
  ]);
  const bio = store.description || store.storeDescription;
  const whatsapp = store.supportPhone ? whatsappNumber(store.supportPhone) : null;
  const category = storeCategoryLabel(store, locale);
  const ratings = store.totalRatings ?? 0;
  const social = store.social ?? [];

  return (
    <footer className={s.footer}>
      <div className={s.wrap}>
        <div className={s.footerTop}>
          <div className="flex min-w-0 items-center gap-4">
            <StoreLogo name={store.displayName} logoUrl={store.logoUrl} size={56} />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold md:text-2xl">{store.displayName}</h2>
              <ul className={s.footerFacts}>
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
                {store.storeRating != null && ratings > 0 && (
                  <li>
                    <Star className="size-4 fill-(--sf-sun) text-(--sf-sun)" aria-hidden />
                    {t("ratingSummary", {
                      rating: format.number(store.storeRating, { maximumFractionDigits: 1 }),
                      count: ratings,
                    })}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {(store.supportPhone || store.supportEmail || social.length > 0) && (
            <nav aria-label={t("contactHeading")} className={s.footerContact}>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(s.footerButton, s.footerButtonSolid)}
                >
                  <MessageCircle className="size-4" aria-hidden />
                  {t("whatsapp")}
                </a>
              )}
              {store.supportPhone && (
                <a href={`tel:${store.supportPhone.replace(/[^\d+]/g, "")}`} className={s.footerButton}>
                  <Phone className="size-4" aria-hidden />
                  <bdi dir="ltr" className="tabular-nums">{store.supportPhone}</bdi>
                </a>
              )}
              {store.supportEmail && (
                <a href={`mailto:${store.supportEmail}`} className={s.footerButton}>
                  <Mail className="size-4" aria-hidden />
                  {t("email")}
                </a>
              )}
              {/* Website › Social media (P4-15); read live from the store, not the publish snapshot. */}
              {social.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={getSocialPlatform(link.platform)?.label[locale === "en" ? "en" : "ar"] ?? link.platform}
                  className={cn(s.footerButton, s.footerSocial)}
                >
                  <SocialIcon platform={link.platform} className="size-4" />
                </a>
              ))}
            </nav>
          )}
        </div>

        {/* Store policies are builder pages now (2026-10-18), not footer text. */}
        {bio && (
          <div className={s.footerBody}>
            <section className="max-w-prose">
              <h3 className={s.footerHeading}>
                {t("aboutHeading", { store: store.displayName })}
              </h3>
              <p className="line-clamp-5 whitespace-pre-line leading-relaxed">{bio}</p>
            </section>
          </div>
        )}
      </div>

      <p className={s.footerSign} aria-hidden>
        {store.displayName}
      </p>

      <div className={s.footerBase}>
        <div className={cn(s.wrap, "flex flex-col gap-2 py-5 text-sm sm:flex-row sm:justify-between")}>
          <span>{t("copyright", { year: new Date().getFullYear(), store: store.displayName })}</span>
          <a href={BASE_URL || "https://tallaby.com"} className="font-medium text-white hover:underline">
            {t("moreStores")}
          </a>
        </div>
      </div>
    </footer>
  );
}
