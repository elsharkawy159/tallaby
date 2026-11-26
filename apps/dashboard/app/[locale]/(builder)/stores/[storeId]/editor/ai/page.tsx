import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { loadStorePageAccess } from "@/lib/stores/store-page.server";
import { manualEditorHref } from "../editor-entry.lib";
import { editorAiEnabled } from "../server/editor-entry.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("editorEntry");
  return { title: t("aiTitle") };
}

/**
 * Edit the website with AI (owner, 2026-11-26). Placeholder until its content
 * ships: the store is checked like the editor's (404 for a foreign or missing
 * store), and with AI off the seller goes to the editor.
 */
export default async function StoreEditorAiPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const [store, aiEnabled] = await Promise.all([loadStorePageAccess(storeId), editorAiEnabled()]);
  if (!storeBuilderEnabled(store.sellerId)) notFound();
  if (!aiEnabled) redirect({ href: `/stores/${encodeURIComponent(store.id)}/editor`, locale: await getLocale() });
  const t = await getTranslations("editorEntry");

  return (
    <div className="seller-shell grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="flex max-w-[460px] flex-col items-center gap-3 text-center">
        <h1 className="text-[22px] font-bold text-(--s-ink)">{t("aiTitle")}</h1>
        <p className="text-sm text-pretty text-(--s-muted)">{t("aiSoon")}</p>
        <Link href={manualEditorHref(store.id)} className="text-sm font-semibold text-(--s-link)">
          {t("manualTitle")}
        </Link>
      </div>
    </div>
  );
}
