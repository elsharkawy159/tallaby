"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileSpreadsheet, Sparkles } from "lucide-react";
import { IconTile, SellerButton } from "@/components/seller-ui";

/** The way in, beside the single-product AI box. Its own file so the product form doesn't load the importer. */
export function FromFileEntry() {
  const t = useTranslations("bulkFileImport");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-(--s-line) bg-(--s-glass) p-[18px] shadow-(--s-shadow-card) max-[600px]:rounded-[20px] max-[600px]:p-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconTile icon={FileSpreadsheet} tone="primary" />
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-(--s-ink)">{t("entryTitle")}</div>
          <p className="text-xs text-(--s-muted)">{t("entryBody")}</p>
        </div>
      </div>
      <SellerButton asChild variant="outline" size="sm" className="max-[600px]:w-full">
        <Link href="/products/add/from-file">
          <Sparkles aria-hidden />
          {t("title")}
        </Link>
      </SellerButton>
    </div>
  );
}
