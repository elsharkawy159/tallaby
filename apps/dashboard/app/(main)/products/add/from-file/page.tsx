import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageContainer, PageHeader, TextAction } from "@/components/seller-ui";
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
    <PageContainer narrow>
      <div className="flex flex-col gap-1">
        <TextAction asChild className="w-fit">
          <Link href="/products/add?method=choose">
            <ArrowRight className="ltr:rotate-180" aria-hidden />
            {t("back")}
          </Link>
        </TextAction>
        <PageHeader title={t("title")} description={t("subtitle")} />
      </div>
      <FromFile aiEnabled={aiConfigured()} />
    </PageContainer>
  );
}
