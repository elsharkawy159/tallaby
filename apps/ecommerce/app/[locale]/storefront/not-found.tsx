import { getTranslations } from "next-intl/server";
import { Store } from "lucide-react";
import { BASE_URL } from "@/lib/constants";

/** An unknown or unapproved store subdomain. */
export default async function StorefrontNotFound() {
  const t = await getTranslations("storefront");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Store className="mb-5 size-12 text-primary" aria-hidden />
      <h1 className="text-2xl font-bold md:text-3xl">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t("notFoundBody")}</p>
      <a
        href={`${BASE_URL || "https://tallaby.com"}/stores`}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
      >
        {t("notFoundCta")}
      </a>
    </main>
  );
}
