import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  const t = await getTranslations("bulkFileImport");
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <div>
        <Link href="/products/add" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
          {t("back")}
        </Link>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <FromFile aiEnabled={aiConfigured()} />
    </section>
  );
}
