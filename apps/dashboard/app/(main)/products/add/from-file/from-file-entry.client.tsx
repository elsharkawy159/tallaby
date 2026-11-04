"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileSpreadsheet, Sparkles } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

/** The way in, beside the single-product AI box. Its own file so the product form doesn't load the importer. */
export function FromFileEntry() {
  const t = useTranslations("bulkFileImport");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <FileSpreadsheet className="size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <div className="text-sm font-semibold">{t("entryTitle")}</div>
          <p className="text-xs text-muted-foreground">{t("entryBody")}</p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href="/products/add/from-file">
          <Sparkles aria-hidden />
          {t("title")}
        </Link>
      </Button>
    </div>
  );
}
