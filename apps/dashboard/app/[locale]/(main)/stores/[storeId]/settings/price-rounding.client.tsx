"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator, Plus, Trash2, Wand2 } from "lucide-react";

import {
  PRICE_ROUNDING_DIRECTIONS,
  PRICE_ROUNDING_MAX_TIERS,
  PRICE_ROUNDING_STEP_PRESETS,
  roundPriceByRule,
  type PriceRoundingRule,
} from "@workspace/lib/products/price-rounding";
import { Field, IconButton, InputGroup, NativeSelect, Note, SectionCard, SellerButton, Toggle } from "@/components/seller-ui";
import { formatNumber, moneyUnitText, type MoneyUnit } from "@/lib/i18n/format";
import { saveStorePriceRounding } from "./price-rounding.server";
import { StorePriceRoundingApplyDialog } from "./price-rounding-apply.client";
import { CUSTOM_STEP, ruleToRows, rowStep, rowUpTo, rowsToRule, type PriceRoundingRow } from "./price-rounding.dto";

type Snapshot = { enabled: boolean; rows: PriceRoundingRow[] };

const sameRows = (a: readonly PriceRoundingRow[], b: readonly PriceRoundingRow[]) => JSON.stringify(a) === JSON.stringify(b);

/** The "Round prices" state (ROADMAP.md F-112a); saved by the app page's save bar. */
export function useStorePriceRounding(storeId: string, initial: PriceRoundingRule | null) {
  const t = useTranslations("storePriceRounding");
  const [saved, setSaved] = useState<Snapshot>(() => ({ enabled: initial?.enabled ?? false, rows: ruleToRows(initial) }));
  const [enabled, setEnabled] = useState(saved.enabled);
  const [rows, setRows] = useState<PriceRoundingRow[]>(saved.rows);
  const dirty = enabled !== saved.enabled || !sameRows(rows, saved.rows);

  /** Client-side checks while on; returns an error message or null. */
  const validate = () => {
    if (!dirty || !enabled) return null;
    const built = rowsToRule(true, rows);
    return built.ok ? null : t(`errors.${built.error}`, { row: built.row + 1 });
  };

  /** Saves when dirty; returns an error message or null. */
  const save = async () => {
    if (!dirty) return null;
    const built = rowsToRule(enabled, rows);
    if (!built.ok && enabled) return t(`errors.${built.error}`, { row: built.row + 1 });
    // Off with unfinished rows: drop the setting instead of keeping a broken one.
    const result = await saveStorePriceRounding(storeId, built.ok ? built.rule : null);
    if (!result.success) return t(`errors.${result.error}`, { row: 1 });
    const next: Snapshot = { enabled: result.rule?.enabled ?? false, rows: ruleToRows(result.rule) };
    setSaved(next);
    setEnabled(next.enabled);
    setRows(next.rows);
    return null;
  };

  const reset = () => {
    setEnabled(saved.enabled);
    setRows(saved.rows);
  };

  return { storeId, enabled, setEnabled, rows, setRows, dirty, validate, save, reset };
}

export type StorePriceRoundingState = ReturnType<typeof useStorePriceRounding>;

/** A price inside the row's range for the "e.g. 1,213 → 1,220" line, or null while the row is unfinished. */
function exampleFor(rows: readonly PriceRoundingRow[], index: number): { before: number; after: number } | null {
  const row = rows[index]!;
  const step = rowStep(row);
  if (step == null) return null;
  const last = index === rows.length - 1;
  const lower = index === 0 ? 0 : rowUpTo(rows[index - 1]!);
  if (lower == null) return null;
  const upper = last ? null : rowUpTo(row);
  if (!last && (upper == null || upper <= lower)) return null;

  let before: number;
  if (lower === 0 && upper == null) before = 1213;
  else {
    const top = upper ?? Math.max(lower * 2, lower + 1000);
    before = Math.floor(lower + (top - lower) * 0.61);
    if (before % 10 === 0) before += 3;
    if (upper != null && before > upper) before = Math.floor(upper);
    if (before <= lower) before = Math.min(upper ?? lower + 1, Math.floor(lower) + 1);
  }
  const after = roundPriceByRule(before, { enabled: true, tiers: [{ upTo: null, step, direction: row.direction }] });
  return { before, after };
}

/**
 * Store › Apps › Round prices (ROADMAP.md F-112; was in Store settings › General): on/off, then up
 * to 5 price ranges, each with a step and a direction. Applied when prices are
 * saved (F-112b); existing prices are not changed here.
 */
export function StorePriceRoundingCard({
  money,
  state,
  disabled,
}: {
  money: MoneyUnit;
  state: StorePriceRoundingState;
  disabled: boolean;
}) {
  const t = useTranslations("storePriceRounding");
  const locale = useLocale();
  const unit = moneyUnitText(locale, money);
  const { enabled, setEnabled, rows, setRows } = state;
  const [applyOpen, setApplyOpen] = useState(false);
  // "Round existing prices" uses the SAVED rule, so it waits for the save bar.
  const canApply = enabled && !state.dirty && !disabled;
  const num = (value: number) => formatNumber(value, locale, { maximumFractionDigits: 2 });

  const update = (index: number, patch: Partial<PriceRoundingRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  // A new range goes before the open "and above" one, with the same step and direction.
  const addRow = () =>
    setRows((current) => {
      if (current.length >= PRICE_ROUNDING_MAX_TIERS) return current;
      const last = current[current.length - 1]!;
      return [...current.slice(0, -1), { ...last, upTo: "" }, last];
    });

  const removeRow = (index: number) =>
    setRows((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));

  return (
    <SectionCard
      id="price-rounding"
      icon={Calculator}
      title={t("title")}
      description={t("description")}
      action={<Toggle className="max-[600px]:min-h-10" checked={enabled} disabled={disabled} onCheckedChange={setEnabled} aria-label={t("enabled")} />}
    >
      {enabled && (
        <>
          <ol className="flex flex-col gap-3">
            {rows.map((row, index) => {
              const last = index === rows.length - 1;
              const previous = index > 0 ? rowUpTo(rows[index - 1]!) : null;
              const example = exampleFor(rows, index);
              const id = `price-rounding-${index}`;
              return (
                <li key={index} className="rounded-[14px] border border-(--s-line-soft) p-3">
                  <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3 max-[720px]:grid-cols-2">
                    <div className="max-[720px]:col-span-2">
                      {last ? (
                        <Field label={t("rangeLabel")}>
                          <p className="flex h-[46px] items-center rounded-[14px] bg-(--s-surface-2) px-3 text-sm text-(--s-muted)">
                            {rows.length === 1 ? t("allPrices") : previous != null ? t("above", { amount: num(previous), unit }) : t("andAbove")}
                          </p>
                        </Field>
                      ) : (
                        <Field label={t("upToLabel")} htmlFor={`${id}-up-to`}>
                          <InputGroup
                            id={`${id}-up-to`}
                            inputMode="decimal"
                            dir="ltr"
                            maxLength={12}
                            end={unit}
                            inputClassName="font-montserrat"
                            value={row.upTo}
                            disabled={disabled}
                            placeholder={t("upToPlaceholder")}
                            onChange={(e) => update(index, { upTo: e.target.value })}
                          />
                        </Field>
                      )}
                    </div>
                    <Field label={t("stepLabel")} htmlFor={`${id}-step`}>
                      <NativeSelect
                        id={`${id}-step`}
                        value={row.step}
                        disabled={disabled}
                        onChange={(e) => update(index, { step: e.target.value })}
                      >
                        {PRICE_ROUNDING_STEP_PRESETS.map((step) => (
                          <option key={step} value={String(step)}>
                            {num(step)}
                          </option>
                        ))}
                        <option value={CUSTOM_STEP}>{t("stepCustom")}</option>
                      </NativeSelect>
                    </Field>
                    <Field label={t("directionLabel")} htmlFor={`${id}-direction`}>
                      <NativeSelect
                        id={`${id}-direction`}
                        value={row.direction}
                        disabled={disabled}
                        onChange={(e) => update(index, { direction: e.target.value as PriceRoundingRow["direction"] })}
                      >
                        {PRICE_ROUNDING_DIRECTIONS.map((direction) => (
                          <option key={direction} value={direction}>
                            {t(`direction.${direction}`)}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <IconButton
                      type="button"
                      className="mb-[5px] max-[720px]:col-span-2 max-[720px]:justify-self-end"
                      disabled={disabled || rows.length <= 1}
                      onClick={() => removeRow(index)}
                      aria-label={t("removeRange")}
                      title={t("removeRange")}
                    >
                      <Trash2 aria-hidden />
                    </IconButton>
                  </div>
                  {row.step === CUSTOM_STEP && (
                    <Field label={t("customStepLabel")} htmlFor={`${id}-custom`} note={t("customStepHint")} className="mt-3 max-w-[240px]">
                      <InputGroup
                        id={`${id}-custom`}
                        inputMode="numeric"
                        dir="ltr"
                        maxLength={5}
                        end={unit}
                        inputClassName="font-montserrat"
                        value={row.customStep}
                        disabled={disabled}
                        onChange={(e) => update(index, { customStep: e.target.value })}
                      />
                    </Field>
                  )}
                  {example && (
                    <p className="mt-2 text-xs text-(--s-subtle)">
                      {t("example", { before: num(example.before), after: num(example.after) })}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          <div>
            <SellerButton type="button" variant="mini" size="sm" onClick={addRow} disabled={disabled || rows.length >= PRICE_ROUNDING_MAX_TIERS}>
              <Plus aria-hidden />
              {t("addRange")}
            </SellerButton>
          </div>
        </>
      )}
      <Note>{t("appliesOnSave")}</Note>
      {enabled && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <SellerButton type="button" variant="mini" size="sm" onClick={() => setApplyOpen(true)} disabled={!canApply}>
            <Wand2 aria-hidden />
            {t("apply.open")}
          </SellerButton>
          {state.dirty && !disabled && <span className="text-xs text-(--s-subtle)">{t("apply.saveFirst")}</span>}
        </div>
      )}
      {applyOpen && <StorePriceRoundingApplyDialog storeId={state.storeId} money={money} open onOpenChange={setApplyOpen} />}
    </SectionCard>
  );
}
