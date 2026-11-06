import { getTranslations } from "next-intl/server";
import { DASHBOARD_URL } from "@/lib/marketing/site.lib";

/**
 * "Only you can see your store" bar (ROADMAP.md F-76): shown only to the
 * seller's own browser (owner pass) on a store that isn't activated yet, on
 * every storefront page. Gone once the seller is activated.
 */
export async function StoreOwnerPreviewBanner() {
  const t = await getTranslations("storeOwnerPreview");
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950"
    >
      <span className="text-pretty">{t("body")}</span>
      <a href={`${DASHBOARD_URL}wallet`} className="font-semibold underline underline-offset-2 hover:no-underline">
        {t("cta")}
      </a>
    </div>
  );
}
