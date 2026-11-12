"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Ruler, X } from "lucide-react";
import {
  FIT_PREFERENCES,
  recommendSize,
  type FitPreference,
  type SizeChartDefinition,
  type SizeChartName,
} from "@workspace/lib/size-charts";
import { useOptionalProductPage } from "@/components/product-page/product-page-provider.client";
import type { ProductLocale } from "@/lib/product-translations";
import { cn } from "@workspace/ui/lib/utils";
import { findSizeVariant, readSavedMeasurements, saveMeasurements } from "./size-finder.lib";

const pick = (text: { ar: string; en: string }, locale: string) => (locale === "ar" ? text.ar || text.en : text.en || text.ar);

const FIELD =
  "h-12 w-full min-w-0 rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper) ps-3.5 pe-14 text-base tabular-nums text-(--sf-ink) outline-none transition-[border-color,box-shadow] focus-visible:border-(--sf-brand) focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--sf-brand)_22%,transparent)]";

/**
 * "Find my size" on a store product page (Size chart app, ROADMAP.md F-92).
 * The shopper types their measurements and sees the size at once (the same
 * pure engine the dashboard previews with). When the product has a variant
 * of that size, one tap selects it. Measurements are remembered per store on
 * this device, so other products prefill. A native <dialog>: it stays inside
 * the page's DOM, so the site's theme colours and direction apply, and it is a
 * bottom sheet on phones. Everything is drawn from the chart's data.
 */
export function SizeFinder({ storeId, chart }: { storeId: string; chart: { name: SizeChartName; definition: SizeChartDefinition } }) {
  const t = useTranslations("sizeFinder");
  const locale = useLocale() as ProductLocale;
  const page = useOptionalProductPage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { definition } = chart;
  const [tab, setTab] = useState<"find" | "chart">("find");
  const [values, setValues] = useState<Record<string, number | undefined>>({});
  const [fit, setFit] = useState<FitPreference>("regular");


  const result = useMemo(() => recommendSize(definition, values, fit), [definition, values, fit]);
  const sized = result.status === "exact" || result.status === "closest" ? result : null;
  const match = sized && page ? findSizeVariant(page.product, locale, sized.size, page.variantId) : null;
  const note = pick(definition.note, locale);

  const setValue = (key: string, text: string) => {
    const value = text.trim() === "" ? undefined : Number(text.replace(",", "."));
    setValues((current) => {
      const next = { ...current, [key]: Number.isFinite(value) ? value : undefined };
      saveMeasurements(storeId, next);
      return next;
    });
  };

  const open = () => {
    // Prefilled from this device on open (never in the server render); what was typed here wins.
    setValues((current) => ({ ...readSavedMeasurements(storeId), ...current }));
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  };
  const close = () => dialogRef.current?.close();

  const selectSize = () => {
    if (!match || !page) return;
    page.selectVariant(match.variantId);
    close();
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="inline-flex min-h-10 items-center gap-2 rounded-full text-sm font-semibold text-(--sf-ink) underline decoration-(--sf-line) decoration-2 underline-offset-[6px] transition-colors hover:decoration-(--sf-brand) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand)"
      >
        <Ruler className="size-4 shrink-0 text-(--sf-brand)" aria-hidden />
        {t("open")}
      </button>
      {sized && (
        <span className="text-sm text-(--sf-muted)">
          {t("yourSizeInline")}{" "}
          <b dir="ltr" className="font-bold text-(--sf-ink)">
            {sized.size}
          </b>
        </span>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // A click on the backdrop (the dialog element itself, outside its panel) closes it.
        onClick={(event) => event.target === event.currentTarget && close()}
        className={cn(
          "m-auto w-[min(100%-32px,480px)] max-w-none overflow-visible bg-transparent p-0 text-(--sf-ink) backdrop:bg-black/45 backdrop:backdrop-blur-[2px]",
          // Phones: a sheet on the bottom edge.
          "max-sm:mb-0 max-sm:w-full",
          "open:motion-safe:animate-in open:motion-safe:fade-in-0 max-sm:open:motion-safe:slide-in-from-bottom-8",
        )}
      >
        <div className="flex max-h-[min(88dvh,720px)] flex-col overflow-hidden rounded-[calc(var(--sf-radius,12px)+8px)] bg-(--sf-paper) shadow-[0_24px_60px_rgb(0_0_0/0.22)] max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]">
          <header className="flex items-start gap-3 px-5 pt-5 pb-3">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-bold leading-snug">
                {t("title")}
              </h2>
              <p dir="auto" className="mt-0.5 text-sm text-(--sf-muted)">
                {pick(chart.name, locale)}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="-me-1.5 grid size-10 shrink-0 place-items-center rounded-full bg-(--sf-shelf) text-(--sf-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand)"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          {definition.showTable && (
            <div role="tablist" aria-label={t("title")} className="mx-5 mb-1 grid grid-cols-2 gap-1 rounded-full bg-(--sf-shelf) p-1">
              {(["find", "chart"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className="h-10 rounded-full text-sm font-semibold text-(--sf-muted) transition-colors aria-selected:bg-(--sf-paper) aria-selected:text-(--sf-ink) aria-selected:shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
                >
                  {t(`tabs.${key}`)}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-5">
            {tab === "find" || !definition.showTable ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
                  {definition.inputs.map((input) => (
                    <label key={input.key} className="flex min-w-0 flex-col gap-1.5">
                      <span className="text-sm font-semibold">
                        {pick(input.label, locale)}
                        {!input.required && <span className="ms-1 text-xs font-normal text-(--sf-muted)">{t("optional")}</span>}
                      </span>
                      <span className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={input.min}
                          max={input.max}
                          step={input.step}
                          required={input.required}
                          value={values[input.key] ?? ""}
                          onChange={(event) => setValue(input.key, event.target.value)}
                          className={FIELD}
                        />
                        <span className="pointer-events-none absolute inset-y-0 end-3.5 grid place-items-center text-sm text-(--sf-muted)">{t(`units.${input.unit}`)}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {definition.fit && (
                  <fieldset className="flex flex-col gap-1.5">
                    <legend className="mb-1.5 text-sm font-semibold">{t("fit")}</legend>
                    <div className="grid grid-cols-3 gap-1 rounded-full bg-(--sf-shelf) p-1">
                      {FIT_PREFERENCES.map((value) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={fit === value}
                          onClick={() => setFit(value)}
                          className="h-10 rounded-full text-sm font-medium text-(--sf-muted) aria-pressed:bg-(--sf-ink) aria-pressed:text-(--sf-paper)"
                        >
                          {t(`fits.${value}`)}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <div aria-live="polite" className="min-h-[104px]">
                  {sized ? (
                    <div className="flex items-center gap-4 rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-shelf) p-4">
                      {/* A swing tag: the one bold piece of the finder. */}
                      <span className="relative grid h-[76px] min-w-[76px] place-items-center rounded-[14px] bg-(--sf-brand) px-3 text-(--sf-brand-ink) shadow-[0_6px_18px_color-mix(in_srgb,var(--sf-brand)_35%,transparent)]">
                        <span aria-hidden className="absolute top-2 start-1/2 size-2 -translate-x-1/2 rounded-full bg-(--sf-shelf) rtl:translate-x-1/2" />
                        <b dir="ltr" className="mt-1.5 text-[28px] leading-none font-extrabold tracking-tight">
                          {sized.size}
                        </b>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-(--sf-muted)">{sized.status === "exact" ? t("yourSize") : t("closest")}</p>
                        {sized.status === "closest" && sized.direction && <p className="mt-0.5 text-sm text-(--sf-ink)">{t(`hint.${sized.direction}`)}</p>}
                        {sized.shifted && <p className="mt-0.5 text-xs text-(--sf-muted)">{t("shifted", { size: sized.baseSize })}</p>}
                        {match &&
                          (match.selected ? (
                            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-(--sf-brand)">
                              <Check className="size-4" aria-hidden />
                              {t("selected")}
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={selectSize}
                              className="mt-2 inline-flex h-10 items-center rounded-full bg-(--sf-ink) px-4 text-sm font-bold text-(--sf-paper) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand)"
                            >
                              {t("select", { size: sized.size })}
                            </button>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-(--sf-radius,12px) border border-dashed border-(--sf-line) p-4 text-center text-sm text-(--sf-muted)">
                      {result.status === "none" ? t("noResult") : t("fill")}
                    </p>
                  )}
                </div>

                {note && (
                  <p dir="auto" className="text-sm text-(--sf-muted)">
                    {note}
                  </p>
                )}
                <p className="text-xs text-(--sf-muted)">{t("remembered")}</p>
              </div>
            ) : (
              <SizeTable definition={definition} highlight={sized?.size ?? null} locale={locale} />
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}

function SizeTable({ definition, highlight, locale }: { definition: SizeChartDefinition; highlight: string | null; locale: string }) {
  const t = useTranslations("sizeFinder");
  const range = (min?: number, max?: number) =>
    min !== undefined && max !== undefined ? `${min}–${max}` : min !== undefined ? `≥ ${min}` : max !== undefined ? `≤ ${max}` : "—";
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-(--sf-line) text-(--sf-muted)">
            <th scope="col" className="py-2 pe-3 text-start font-semibold">
              {t("size")}
            </th>
            {definition.inputs.map((input) => (
              <th key={input.key} scope="col" className="py-2 pe-3 text-start font-semibold">
                {pick(input.label, locale)} <span className="font-normal">({t(`units.${input.unit}`)})</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {definition.sizes.map((size) => {
            const on = highlight === size.label;
            return (
              <tr key={size.label} aria-current={on || undefined} className={cn("border-b border-(--sf-line) last:border-0", on && "bg-(--sf-shelf)")}>
                <th scope="row" dir="ltr" className={cn("py-2.5 pe-3 text-start font-bold rtl:text-end", on && "text-(--sf-brand)")}>
                  {size.label}
                </th>
                {definition.inputs.map((input) => (
                  <td key={input.key} dir="ltr" className="py-2.5 pe-3 text-start tabular-nums rtl:text-end">
                    {range(size.ranges[input.key]?.min, size.ranges[input.key]?.max)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
