import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { SellerEditor } from "./seller-editor.client";
import { SmallScreenNoticeFrame } from "./small-screen-notice.client";
import { EditorEntryChooser } from "./editor-entry-chooser";
import { aiEditorHref, resolveEditorEntry } from "./editor-entry.lib";
import { EditorEntrySkeleton } from "./editor-entry-skeleton";
import { editorAiEnabled } from "./server/editor-entry.data";
import { loadEditorInitial } from "./server/editor-initial.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("storeEditor");
  return { title: t("title") };
}

/**
 * Website editor for one store (PLAN.md P4-06). The store id comes from the
 * URL and is checked by loadStorePage (404 for a foreign or missing store);
 * every save goes through the editor actions, which check it again. While AI
 * is on, a bare /editor first asks: edit with AI or by hand (`resolveEditorEntry`).
 */
export default async function StoreEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ storeId }, query, aiEnabled] = await Promise.all([params, searchParams, editorAiEnabled()]);
  // Edit with AI or by hand (owner, 2026-11-26). Decided before any editor data loads,
  // so the choice streams its skeleton at once and reads only the checked store.
  const entry = resolveEditorEntry(query, { aiEnabled });
  if (entry === "choose") {
    return (
      <Suspense fallback={<EditorEntrySkeleton />}>
        <EditorEntryChooser storeId={storeId} />
      </Suspense>
    );
  }

  const store = await loadStorePage(storeId);
  if (!storeBuilderEnabled(store.sellerId)) notFound();
  if (entry === "ai") redirect({ href: aiEditorHref(store.id), locale: await getLocale() });

  // The same load as the AI layout (`ai/page.tsx`).
  const loaded = await loadEditorInitial(store);
  if (!loaded) notFound();

  return (
    <SmallScreenNoticeFrame>
      {/* The "AI | Manual" switch shows only while AI is on (the switch and an AI provider). */}
      <SellerEditor initial={loaded.initial} codeSections={loaded.codeSections} editorAgent={loaded.editorAgent} aiEditor={aiEnabled} />
    </SmallScreenNoticeFrame>
  );
}
