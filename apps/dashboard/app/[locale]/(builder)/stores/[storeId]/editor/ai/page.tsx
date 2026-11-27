import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getAiCreditStatus } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { editorAiEnabled } from "../server/editor-entry.data";
import { loadEditorInitial } from "../server/editor-initial.data";
import { EditWithAiEditor } from "./edit-with-ai-editor.client";
import { EditWithAiSkeleton } from "./edit-with-ai-skeleton";
import { editWithAiGate } from "./edit-with-ai-page.lib";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("editWithAi");
  return { title: t("title") };
}

/**
 * Edit the website with AI (owner request 2026-11-26): the website editor in
 * its AI layout, with a chat beside the canvas that changes the site's
 * drafts, products and settings. The store is checked like the editor's (404
 * for a foreign or missing store); with AI off the seller goes to the editor.
 * Every action checks the store again.
 */
export default async function StoreEditorAiPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return (
    <Suspense fallback={<EditWithAiSkeleton />}>
      <EditWithAiLoader storeId={storeId} />
    </Suspense>
  );
}

/** AI credits left, only where credits apply (after the USD switch). Never cached; a failed read just hides the chip. */
async function loadAiCredits(sellerId: string): Promise<number | null> {
  const billing = await getBillingState().catch(() => null);
  if (!billing?.usdLive) return null;
  return getAiCreditStatus(sellerId)
    .then((status) => status.total)
    .catch(() => null);
}

async function EditWithAiLoader({ storeId }: { storeId: string }) {
  const [store, aiEnabled] = await Promise.all([loadStorePage(storeId), editorAiEnabled()]);
  const gate = editWithAiGate({ builderEnabled: storeBuilderEnabled(store.sellerId), aiEnabled });
  if (gate === "notFound") notFound();
  if (gate === "editor") redirect({ href: `/stores/${encodeURIComponent(store.id)}/editor`, locale: await getLocale() });

  // The same load as the manual editor (`../page.tsx`).
  const [loaded, credits] = await Promise.all([loadEditorInitial(store), loadAiCredits(store.sellerId)]);
  if (!loaded) notFound();

  return <EditWithAiEditor initial={loaded.initial} codeSections={loaded.codeSections} editorAgent={loaded.editorAgent} initialCredits={credits} />;
}
