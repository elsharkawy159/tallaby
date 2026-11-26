"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, ImageOff, Loader2 } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Modal, Note, SellerButton } from "@/components/seller-ui";
import { Money } from "@/components/money";
import { formatNumber, type MoneyUnit } from "@/lib/i18n/format";
import { applyStorePriceRounding, previewStorePriceRounding } from "./price-rounding-apply.server";
import type { PriceRoundingApplyError, PriceRoundingPreviewResult } from "./price-rounding-apply.dto";
import { STORE_PRICE_ROUNDING_MAX_PRODUCTS, type PriceChangeView } from "./price-rounding-apply.lib";

type Preview = Extract<PriceRoundingPreviewResult, { success: true }>;

function ChangeLine({ change, money, locale }: { change: PriceChangeView; money: MoneyUnit; locale: string }) {
  const t = useTranslations("storePriceRounding.apply");
  return (
    <div className="flex flex-col gap-0.5 text-[13px]">
      <p className="flex flex-wrap items-center gap-1.5">
        <span className="text-(--s-subtle) line-through">
          <Money value={change.oldFinal} locale={locale} unit={money} />
        </span>
        <ArrowRight className="size-3.5 text-(--s-subtle) rtl:rotate-180" aria-hidden />
        <span className="font-bold text-(--s-ink)">
          <Money value={change.newFinal} locale={locale} unit={money} />
        </span>
      </p>
      {(change.oldCompareAt != null || change.newCompareAt != null) && (
        <p className="text-xs text-(--s-muted)">
          {change.discountRemoved ? (
            <span className="font-semibold text-destructive">{t("discountRemoved")}</span>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-1">
              {t("compareAt")}
              <Money value={change.oldCompareAt} locale={locale} unit={money} />
              <ArrowRight className="size-3 rtl:rotate-180" aria-hidden />
              <Money value={change.newCompareAt} locale={locale} unit={money} />
            </span>
          )}
        </p>
      )}
    </div>
  );
}

/**
 * "Round existing prices" (ROADMAP.md F-112c): previews old → new prices with
 * the SAVED rule, then applies on the server, which recomputes everything.
 */
export function StorePriceRoundingApplyDialog({
  storeId,
  money,
  open,
  onOpenChange,
}: {
  storeId: string;
  money: MoneyUnit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("storePriceRounding.apply");
  const locale = useLocale();
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<PriceRoundingApplyError | null>(null);
  const [loading, startLoading] = useTransition();
  const [applying, startApplying] = useTransition();
  const errorText = (code: PriceRoundingApplyError) => t(`errors.${code}`, { max: formatNumber(STORE_PRICE_ROUNDING_MAX_PRODUCTS, locale) });

  useEffect(() => {
    // Mounted only while open (the card renders it then), so state starts empty on every open.
    if (!open) return;
    startLoading(async () => {
      const result = await previewStorePriceRounding(storeId);
      if (result.success) setPreview(result);
      else setError(result.error);
    });
  }, [open, storeId]);

  const total = preview ? preview.productCount + preview.variantCount : 0;

  const apply = () =>
    startApplying(async () => {
      const result = await applyStorePriceRounding(storeId);
      if (!result.success) {
        toast.error(errorText(result.error));
        return;
      }
      const count = result.productCount + result.variantCount;
      if (count === 0) toast.info(t("nothingChanged"));
      else toast.success(t("applied", { count }));
      onOpenChange(false);
      router.refresh();
    });

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !applying && onOpenChange(next)}
      title={t("title")}
      description={t("description")}
      width={560}
      footer={
        <>
          <SellerButton type="button" variant="outline" disabled={applying} onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </SellerButton>
          <SellerButton type="button" variant="solid" disabled={loading || applying || total === 0} onClick={apply}>
            {applying && <Loader2 className="animate-spin" aria-hidden />}
            {t("confirm", { count: total })}
          </SellerButton>
        </>
      }
    >
      {loading && (
        <p className="flex items-center gap-2 text-sm text-(--s-muted)" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("loading")}
        </p>
      )}
      {error && <Note tone="danger">{errorText(error)}</Note>}
      {preview && total === 0 && <Note>{t("empty")}</Note>}
      {preview && total > 0 && (
        <>
          <p className="text-[13px] text-(--s-body)">
            {t("summary", { total, products: formatNumber(preview.productCount, locale), variants: formatNumber(preview.variantCount, locale) })}
          </p>
          <ul className="flex max-h-[min(55vh,480px)] flex-col gap-2 overflow-y-auto overscroll-contain pe-1">
            {preview.rows.map((row) => (
              <li key={row.id} className="flex gap-3 rounded-[14px] border border-(--s-line-soft) p-2.5">
                {row.image ? (
                  // Seller images come from Supabase storage or any https host, so a plain <img>.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image} alt="" loading="lazy" className="size-12 shrink-0 rounded-[10px] bg-white object-contain" />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-(--s-surface-2) text-(--s-subtle)">
                    <ImageOff className="size-4" aria-hidden />
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="truncate text-[13.5px] font-semibold text-(--s-ink)">{row.title || t("untitled")}</p>
                  {row.change && <ChangeLine change={row.change} money={money} locale={locale} />}
                  {row.variants.map((variant) => (
                    <div key={variant.id} className="border-s-2 border-(--s-line-soft) ps-2">
                      <p className="truncate text-xs text-(--s-muted)">{variant.title || t("variant")}</p>
                      <ChangeLine change={variant.change} money={money} locale={locale} />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {preview.more > 0 && <p className="text-xs text-(--s-subtle)">{t("more", { count: preview.more })}</p>}
          <Note tone="amber">{t("warning")}</Note>
        </>
      )}
    </Modal>
  );
}
