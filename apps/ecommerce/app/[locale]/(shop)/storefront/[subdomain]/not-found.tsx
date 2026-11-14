import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * A page this store doesn't have. The shopper stays on the store (owner,
 * 2026-11-03); "/" is its home in this language (the link follows the store's
 * default language).
 */
export default async function StorePageNotFound() {
  const t = await getTranslations("storefront");

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center">
      <h1 className="text-2xl font-bold md:text-3xl">{t("pageNotFoundTitle")}</h1>
      <p className="mt-2 opacity-80">{t("pageNotFoundBody")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
      >
        {t("pageNotFoundCta")}
      </Link>
    </section>
  );
}
