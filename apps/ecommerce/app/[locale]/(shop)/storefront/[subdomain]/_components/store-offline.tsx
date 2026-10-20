import { getTranslations } from "next-intl/server";
import { BASE_URL } from "@/lib/constants";
import type { Storefront } from "@/lib/storefront.server";
import { StoreLogo } from "./store-logo";

/**
 * A store whose seller took the website offline (Website › "Website live"
 * off). Shown by the storefront layout on every route of the store.
 */
export async function StoreOffline({
  store,
}: {
  store: Pick<Storefront, "displayName" | "logoUrl">;
}) {
  const t = await getTranslations("storefront");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <StoreLogo name={store.displayName} logoUrl={store.logoUrl} size={72} className="mb-4" />
      <p className="mb-6 text-lg font-semibold">{store.displayName}</p>
      <h1 className="text-2xl font-bold md:text-3xl">{t("offlineTitle")}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t("offlineBody", { store: store.displayName })}</p>
      <a
        href={BASE_URL || "https://tallaby.com"}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
      >
        {t("offlineCta")}
      </a>
    </main>
  );
}
