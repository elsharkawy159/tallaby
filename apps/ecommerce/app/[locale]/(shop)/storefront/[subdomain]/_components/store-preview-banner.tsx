import { getTranslations } from "next-intl/server";
import type { StorePreviewState } from "@/lib/store-site/preview.server";

/**
 * "Preview — not live" bar for "Preview on my store" (PLAN.md P4-08). Shown
 * only to the browser holding a preview cookie; the exit form clears it.
 */
export async function StorePreviewBanner({ state }: { state: StorePreviewState }) {
  const t = await getTranslations("storePreview");
  return (
    <div
      role="status"
      className={
        state === "active"
          ? "sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950"
          : "sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-neutral-800 px-4 py-2 text-center text-sm text-white"
      }
    >
      <span>{state === "active" ? t("active") : t("invalid")}</span>
      <form action="/api/store-preview" method="post">
        <button type="submit" className="underline underline-offset-2 hover:no-underline">
          {t("exit")}
        </button>
      </form>
    </div>
  );
}
