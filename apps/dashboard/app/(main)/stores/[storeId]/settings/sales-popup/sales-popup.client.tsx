"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BellRing, ExternalLink, Minus, Plus, Shield, ShoppingBag } from "lucide-react";

import {
  SALES_FEED_DAYS,
  SALES_FEED_MIN_ORDERS,
  SALES_POPUP_DELAY,
  SALES_POPUP_PAGES,
  type SalesPopupPage,
  type StoreSalesPopupSettings as Settings,
} from "@workspace/lib/stores/sales-popup";
import { CheckRow, Field, IconTile, Note, SaveBar, SectionCard, TextAction, Toggle } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { saveStoreSalesPopup } from "./sales-popup.server";

/**
 * Store settings › Sales pop-up (ROADMAP.md F-22b). Small toasts with the
 * store's real recent orders ("Someone from Giza ordered …"), no names or
 * phones. The seller picks on/off, the delay and the pages; cart, checkout
 * and account pages never show it. The switch saves at once; the delay and
 * pages use the save bar.
 */
export function StoreSalesPopupSettings({
  storeId,
  siteUrl,
  initial,
  readOnly,
}: {
  storeId: string;
  siteUrl: string;
  initial: Settings;
  readOnly: boolean;
}) {
  const t = useTranslations("storeSalesPopup");
  const [saved, setSaved] = useState(initial);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [delay, setDelay] = useState(String(initial.delaySeconds));
  const [pages, setPages] = useState<SalesPopupPage[]>(initial.pages);
  const [isPending, startTransition] = useTransition();

  const save = (next: { enabled: boolean; delaySeconds: string; pages: SalesPopupPage[] }) => {
    startTransition(async () => {
      const result = await saveStoreSalesPopup(storeId, { ...next, delaySeconds: Number(next.delaySeconds) });
      if (!result.success) {
        setEnabled(saved.enabled);
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setSaved(result.settings);
      setEnabled(result.settings.enabled);
      setDelay(String(result.settings.delaySeconds));
      setPages(result.settings.pages);
      toast.success(t("saved"));
    });
  };

  const toggle = (next: boolean) => {
    setEnabled(next);
    save({ enabled: next, delaySeconds: delay, pages });
  };

  const togglePage = (page: SalesPopupPage, on: boolean) =>
    setPages((current) => (on ? [...current, page] : current.filter((p) => p !== page)));

  const step = (delta: 1 | -1) =>
    setDelay((current) => String(Math.min(SALES_POPUP_DELAY.max, Math.max(SALES_POPUP_DELAY.min, (Number(current) || SALES_POPUP_DELAY.min) + delta))));

  const dirty =
    Number(delay) !== saved.delaySeconds ||
    pages.length !== saved.pages.length ||
    pages.some((p) => !saved.pages.includes(p));
  const disabled = readOnly || isPending;
  const stepButton =
    "grid h-full w-[42px] cursor-pointer place-items-center text-(--s-link) transition-colors duration-150 hover:bg-(--s-hover) disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4";

  return (
    <SectionCard
      icon={BellRing}
      title={t("title")}
      description={t("description")}
      action={<Toggle className="max-[600px]:min-h-10" id="sales-popup-enabled" checked={enabled} disabled={disabled} onCheckedChange={toggle} aria-label={t("title")} />}
    >
      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}
      <Note icon={Shield}>{t("realOnly", { min: SALES_FEED_MIN_ORDERS, days: SALES_FEED_DAYS })}</Note>

      <div className="grid grid-cols-2 items-start gap-4 max-[860px]:grid-cols-1">
        {/* An example of the toast, with made-up text clearly marked as a preview. */}
        <div className="flex flex-col gap-2">
          <span className="text-[13.5px] font-bold text-(--s-text)">{t("previewTitle")}</span>
          <div className="relative min-h-[220px] overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-tint)">
            <div aria-hidden className="absolute inset-x-0 top-0 flex h-[34px] items-center gap-1.5 border-b border-(--s-line-soft) bg-(--s-surface) px-3">
              <i className="size-2 rounded-full bg-(--s-field-strong)" />
              <i className="size-2 rounded-full bg-(--s-field-strong)" />
              <i className="size-2 rounded-full bg-(--s-field-strong)" />
            </div>
            <div
              className={cn(
                "absolute start-3.5 bottom-3.5 flex max-w-[calc(100%-28px)] items-center gap-2.5 rounded-2xl bg-(--s-surface) p-2.5 pe-3.5 shadow-(--s-shadow-pop) transition-[opacity,filter] duration-300",
                !enabled && "opacity-40 grayscale",
              )}
            >
              <IconTile icon={ShoppingBag} size="lg" className="rounded-[11px]" />
              <div className="min-w-0 leading-snug">
                <small className="block text-[11.5px] text-(--s-subtle)">{t("previewFrom")}</small>
                <b className="block text-[13px] font-bold text-(--s-text)">{t("previewProduct")}</b>
                <small className="block text-[11px] text-(--s-faint)">{t("previewAgo")}</small>
              </div>
            </div>
          </div>
          <p className="text-pretty text-xs text-(--s-faint)">{t("previewHint")}</p>
          <TextAction asChild className="self-start max-[600px]:min-h-10">
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
              {t("viewStore")}
            </a>
          </TextAction>
        </div>

        <div className="flex flex-col gap-4">
          <Field
            label={t("delayLabel")}
            htmlFor="sales-popup-delay"
            note={t("delayHint", { min: SALES_POPUP_DELAY.min, max: SALES_POPUP_DELAY.max })}
          >
            <div className="inline-flex items-center gap-2.5 text-[13px] text-(--s-muted)">
              <span dir="ltr" className="inline-flex h-11 items-center overflow-hidden rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface)">
                <button type="button" className={stepButton} disabled={disabled} aria-label={`−1 ${t("seconds")}`} onClick={() => step(-1)}>
                  <Minus aria-hidden />
                </button>
                <input
                  id="sales-popup-delay"
                  type="number"
                  inputMode="numeric"
                  min={SALES_POPUP_DELAY.min}
                  max={SALES_POPUP_DELAY.max}
                  value={delay}
                  disabled={disabled}
                  onChange={(e) => setDelay(e.target.value)}
                  className="h-full w-14 border-0 bg-transparent text-center font-montserrat text-[15px] font-bold text-(--s-ink) outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button type="button" className={stepButton} disabled={disabled} aria-label={`+1 ${t("seconds")}`} onClick={() => step(1)}>
                  <Plus aria-hidden />
                </button>
              </span>
              {t("seconds")}
            </div>
          </Field>

          <Field label={t("pagesLabel")} note={t("pagesHint")}>
            <div className="flex flex-col gap-2.5">
              {SALES_POPUP_PAGES.map((page) => (
                <CheckRow
                  key={page}
                  label={t(`pages.${page}`)}
                  checked={pages.includes(page)}
                  disabled={disabled}
                  className="max-[600px]:min-h-10 max-[600px]:items-center"
                  onChange={(e) => togglePage(page, e.target.checked)}
                />
              ))}
            </div>
          </Field>
        </div>
      </div>

      {!readOnly && (
        <SaveBar
          dirty={dirty}
          saving={isPending}
          onSave={() => save({ enabled, delaySeconds: delay, pages })}
          onDiscard={() => {
            setDelay(String(saved.delaySeconds));
            setPages(saved.pages);
          }}
        />
      )}
    </SectionCard>
  );
}
