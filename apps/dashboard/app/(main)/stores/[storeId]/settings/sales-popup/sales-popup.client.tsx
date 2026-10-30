"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, ShoppingBag } from "lucide-react";

import {
  SALES_FEED_DAYS,
  SALES_FEED_MIN_ORDERS,
  SALES_POPUP_DELAY,
  SALES_POPUP_PAGES,
  type SalesPopupPage,
  type StoreSalesPopupSettings as Settings,
} from "@workspace/lib/stores/sales-popup";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { saveStoreSalesPopup } from "./sales-popup.server";

/**
 * Store settings › Sales pop-up (ROADMAP.md F-22b). Small toasts with the
 * store's real recent orders ("Someone from Giza ordered …"), no names or
 * phones. The seller picks on/off, the delay and the pages; cart, checkout
 * and account pages never show it.
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

  const dirty =
    Number(delay) !== saved.delaySeconds ||
    pages.length !== saved.pages.length ||
    pages.some((p) => !saved.pages.includes(p));
  const disabled = readOnly || isPending;

  return (
    <div className="space-y-5">
      {readOnly && <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

      <section className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <label htmlFor="sales-popup-enabled" className="flex items-center gap-2 font-semibold">
            <ShoppingBag className="size-4" />
            {t("title")}
          </label>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          <p className="text-sm text-muted-foreground">{t("realOnly", { min: SALES_FEED_MIN_ORDERS, days: SALES_FEED_DAYS })}</p>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary-ink underline-offset-4 hover:underline"
          >
            {t("viewStore")}
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <Switch id="sales-popup-enabled" checked={enabled} disabled={disabled} onCheckedChange={toggle} aria-label={t("title")} />
      </section>

      {/* An example of the toast, with made-up text clearly marked as a preview. */}
      <section className="space-y-2 rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">{t("previewTitle")}</h2>
        <div className="flex max-w-sm items-start gap-3 rounded-2xl border bg-background p-3 shadow-sm">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-ink">
            <ShoppingBag className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 text-sm leading-snug">
            <p className="text-muted-foreground">{t("previewFrom")}</p>
            <p className="font-semibold">{t("previewProduct")}</p>
            <p className="text-xs text-muted-foreground">{t("previewAgo")}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("previewHint")}</p>
      </section>

      <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-2">
          <Label htmlFor="sales-popup-delay" className="font-semibold">
            {t("delayLabel")}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="sales-popup-delay"
              type="number"
              inputMode="numeric"
              min={SALES_POPUP_DELAY.min}
              max={SALES_POPUP_DELAY.max}
              value={delay}
              disabled={disabled}
              onChange={(e) => setDelay(e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">{t("seconds")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("delayHint", { min: SALES_POPUP_DELAY.min, max: SALES_POPUP_DELAY.max })}</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="font-semibold">{t("pagesLabel")}</legend>
          {SALES_POPUP_PAGES.map((page) => (
            <div key={page} className="flex items-center gap-2">
              <Checkbox
                id={`sales-popup-page-${page}`}
                checked={pages.includes(page)}
                disabled={disabled}
                onCheckedChange={(value) => togglePage(page, value === true)}
              />
              <Label htmlFor={`sales-popup-page-${page}`} className="font-normal">
                {t(`pages.${page}`)}
              </Label>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{t("pagesHint")}</p>
        </fieldset>

        <Button type="button" disabled={disabled || !dirty} onClick={() => save({ enabled, delaySeconds: delay, pages })}>
          {t("save")}
        </Button>
      </section>
    </div>
  );
}
