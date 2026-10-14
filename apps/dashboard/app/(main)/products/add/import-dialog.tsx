"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, FileDown, LoaderCircle, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@/lib/utils";
import { BUTTON_CLASS, SectionIcon, TEXTAREA_CLASS } from "@/components/form/form-ui";
import { Textarea } from "@workspace/ui/components/textarea";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import { useProductImport } from "./use-product-import";
import type { CategoryOption } from "./add-product.schema";

const TABS = ["url", "data", "bulk"] as const;
type ImportTab = (typeof TABS)[number];

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  sellerPricing: SellerPricingSettings;
  onBulkUrls?: (urls: string[]) => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  categories,
  sellerPricing,
  onBulkUrls,
}: ImportDialogProps) {
  const t = useTranslations("productForm.import");
  const [tab, setTab] = useState<ImportTab>("url");
  const [value, setValue] = useState("");
  const { importProduct, isImporting } = useProductImport({
    categories,
    sellerPricing,
    onBulkUrls,
  });
  const tabs = onBulkUrls ? TABS : TABS.filter((item) => item !== "bulk");

  const submit = async (input = value) => {
    // Close first so the seller watches the form fill in behind the toasts.
    if (!input.trim()) return;
    onOpenChange(false);
    const ok = await importProduct(input);
    if (ok) setValue("");
    else onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-[18px] bg-card p-0 sm:max-w-[560px]"
      >
        <div className="flex items-start gap-3 px-[22px] pt-5 pb-1">
          <SectionIcon icon={FileDown} compact />
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base leading-normal font-bold">{t("title")}</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              {t("description")}
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="soft" size="icon" className="size-9 rounded-[10px]" aria-label={t("close")}>
              <X />
            </Button>
          </DialogClose>
        </div>

        <div role="tablist" className="flex gap-4 border-b px-[22px]">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className={cn(
                "-mb-px border-b-2 px-1 py-2.5 text-[13px] transition-colors",
                tab === item
                  ? "border-primary font-semibold text-primary-ink"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`tabs.${item}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 px-[22px] pt-[18px] pb-[22px]">
          <Textarea
            autoFocus
            dir="ltr"
            rows={5}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onPaste={(e) => {
              // A single pasted URL imports straight away — the common case.
              const pasted = e.clipboardData.getData("text/plain").trim();
              if (tab === "url" && /^https?:\/\/\S+$/.test(pasted)) {
                e.preventDefault();
                setValue(pasted);
                void submit(pasted);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && tab === "url") {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={t(`placeholders.${tab}`)}
            className={cn(TEXTAREA_CLASS, "max-h-60 font-mono text-[13px]")}
          />
          <p className="text-xs text-faint">{t(`help.${tab}`)}</p>
        </div>

        <div className="flex justify-end gap-2 border-t bg-muted px-[22px] py-3.5">
          <DialogClose asChild>
            <Button type="button" variant="soft" className={BUTTON_CLASS}>
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="secondary"
            className={cn(BUTTON_CLASS, "rounded-xl")}
            onClick={() => void submit()}
            disabled={isImporting || !value.trim()}
          >
            {isImporting ? <LoaderCircle className="animate-spin" /> : <Download />}
            {t("submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
