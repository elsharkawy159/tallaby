import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { aiConfigured } from "@workspace/ai";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { FromFile } from "./from-file.client";

export const dynamic = "force-dynamic";

/** Covers the server actions on this page too (Next docs, maxDuration): one batch writes copy, stores photos and saves. */
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("bulkFileImport");
  return { title: t("title"), description: t("subtitle") };
}

export default async function FromFilePage() {
  await requireSeller();
  return <FromFile aiEnabled={aiConfigured()} />;
}
