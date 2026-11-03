import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

/** A page this store doesn't have. The shopper stays on the store (owner, 2026-11-03). */
export default async function StorePageNotFound() {
  const [t, locale] = await Promise.all([getTranslations("storefront"), getLocale()]);

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center">
      <h1 className="text-2xl font-bold md:text-3xl">{t("pageNotFoundTitle")}</h1>
      <p className="mt-2 opacity-80">{t("pageNotFoundBody")}</p>
      <Link
        href={locale === routing.defaultLocale ? "/" : `/${locale}`}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
      >
        {t("pageNotFoundCta")}
      </Link>
    </section>
  );
}
