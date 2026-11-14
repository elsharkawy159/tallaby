"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link2, LoaderCircle } from "lucide-react";
import { Note, SellerButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import { BackIcon, backClassName, FlowIntro, FlowOrb, FlowStage } from "./add-flow.client";
import { TEXTAREA_CLASS } from "./form-kit";
import { useProductImport } from "./use-product-import";
import { parseProductUrlList } from "./product-url-list.lib";
import { MAX_BULK_IMPORT_URLS } from "./parse-product-import.types";
import type { CategoryOption } from "./add-product.schema";

/**
 * "Product link" on /products/add (?method=url): paste one link or many. One
 * link fills the product form (the same import as the form's import button);
 * several open the list that fetches them all (BulkUrlImport).
 */
export function UrlAddStage ({
  categories,
  sellerPricing,
  initialText = "",
  onBack,
  onSingleImported,
  onBulk,
}: {
  categories: CategoryOption[]
  sellerPricing: SellerPricingSettings
  /** The links of a list the seller came back from. */
  initialText?: string
  onBack: () => void
  /** The form is filled: show it. */
  onSingleImported: () => void
  onBulk: (urls: string[]) => void
}) {
  const t = useTranslations("productForm.urlStage");
  const [text, setText] = useState(initialText);
  const { importProduct, isImporting } = useProductImport({ categories, sellerPricing, onBulkUrls: onBulk });
  const list = useMemo(() => parseProductUrlList(text, MAX_BULK_IMPORT_URLS), [text]);
  const count = list.urls.length;
  const typed = text.trim() !== "";

  const submit = async () => {
    if (isImporting || count === 0) return;
    if (count === 1) {
      if (await importProduct(list.urls[0]!)) onSingleImported();
      return;
    }
    onBulk(list.urls);
  };

  return (
    <FlowStage
      back={
        <button type="button" className={backClassName} onClick={onBack} disabled={isImporting}>
          <BackIcon />
          {t("back")}
        </button>
      }
      icon={Link2}
      label={t("mode")}
    >
      <FlowIntro orb={<FlowOrb icon={Link2} />} title={t("title")} titleId="url-stage-title" body={t("body")} />

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor="url-stage-links" className="sr-only">
          {t("label")}
        </label>
        <textarea
          id="url-stage-links"
          dir="ltr"
          rows={6}
          autoFocus
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds a line; Ctrl/Cmd+Enter fetches.
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={t("placeholder")}
          aria-describedby="url-stage-status"
          className={cn(TEXTAREA_CLASS, "max-h-[50vh] min-h-36 font-mono text-[13px] leading-relaxed text-start")}
        />

        <div id="url-stage-status" aria-live="polite" className="flex flex-col gap-2">
          <p className="text-xs text-(--s-muted)">
            {!typed
              ? t("hint", { max: MAX_BULK_IMPORT_URLS })
              : count === 0
                ? t("noLinks")
                : t("found", { count })}
            {list.duplicates > 0 && <> {t("duplicates", { count: list.duplicates })}</>}
          </p>
          {list.invalid.length > 0 && (
            <Note tone="amber">
              {t("invalid", { count: list.invalid.length })}{" "}
              <span dir="ltr" className="font-mono break-all">
                {list.invalid.slice(0, 3).join("  ")}
              </span>
            </Note>
          )}
          {list.overLimit > 0 && (
            <Note tone="amber">{t("overLimit", { max: MAX_BULK_IMPORT_URLS, extra: list.overLimit })}</Note>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <SellerButton type="submit" disabled={isImporting || count === 0} aria-busy={isImporting} className="max-[600px]:w-full">
            {isImporting ? <LoaderCircle className="animate-spin" aria-hidden /> : <Link2 aria-hidden />}
            {isImporting ? t("fetching") : count > 1 ? t("fetchMany", { count }) : t("fetchOne")}
          </SellerButton>
        </div>
      </form>
    </FlowStage>
  );
}
