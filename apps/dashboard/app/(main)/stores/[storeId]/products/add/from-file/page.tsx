import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { aiConfigured } from "@workspace/ai";
import { loadProductStorePage } from "@/lib/products/product-store.server";
import { FromFile } from "./from-file.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Covers the server actions on this page too (Next docs, maxDuration): one batch writes copy, stores photos and saves. */
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("bulkFileImport");
  return { title: t("title"), description: t("subtitle") };
}

export default async function FromFilePage({ params }: { params: Promise<{ storeId: string }> }) {
  await loadProductStorePage((await params).storeId);
  return <FromFile aiEnabled={aiConfigured()} />;
}
