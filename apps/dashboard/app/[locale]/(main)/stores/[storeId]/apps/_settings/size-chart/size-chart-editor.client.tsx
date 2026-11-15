"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronLeft, LoaderCircle, Plus, Ruler, SlidersHorizontal, Trash2, X } from "lucide-react";

import {
  FIT_PREFERENCES,
  SIZE_CHART_LIMITS,
  SIZE_CHART_UNITS,
  recommendSize,
  sizeChartPayloadSchema,
  type FitPreference,
  type SizeChartDefinition,
  type SizeChartInput,
  type SizeChartName,
} from "@workspace/lib/size-charts";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { Field, FieldRow, IconButton, NativeSelect, SectionCard, Segmented, SellerButton, SellerCard, TextAction, TextArea, TextInput, Toggle } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { deleteSizeChart, saveSizeChart } from "./size-chart.server";
import { MEASUREMENT_PRESETS, canAddInput, canAddSize, freeInputKey, nextSizeLabel, pickText, toNumber } from "./size-chart-form.lib";

type Draft = { id: string | null; name: SizeChartName; definition: SizeChartDefinition };

const NUM = "h-9 w-full min-w-0 rounded-[10px] border border-(--s-field) bg-(--s-surface) px-2 text-center font-montserrat text-[13px] tabular-nums text-(--s-ink) outline-none focus-visible:border-(--s-primary) focus-visible:shadow-[0_0_0_3px_var(--s-focus-soft)] max-[600px]:h-10";

/**
 * The size chart editor (F-92): name, the measurements the shopper types,
 * the sizes with a from–to range per measurement, and options. The panel on
 * the side runs the storefront's own engine, so the seller sees exactly what
 * a shopper with those numbers is told.
 */
export function SizeChartEditor({
  storeId,
  initial,
  readOnly,
  onClose,
  onSaved,
}: {
  storeId: string;
  initial: Draft;
  readOnly: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("sizeChartApp");
  const locale = useLocale();
  const [name, setName] = useState(initial.name);
  const [chart, setChart] = useState<SizeChartDefinition>(initial.definition);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = (fn: (draft: SizeChartDefinition) => SizeChartDefinition) => setChart((current) => fn(current));
  const setInput = (index: number, patch: Partial<SizeChartInput>) =>
    update((c) => ({ ...c, inputs: c.inputs.map((input, i) => (i === index ? { ...input, ...patch } : input)) }));
  const addInput = (preset?: SizeChartInput) =>
    update((c) => {
      const base = preset ?? { key: "", label: { ar: "", en: "" }, unit: "cm" as const, min: 0, max: 200, step: 1, required: false };
      return { ...c, inputs: [...c.inputs, { ...base, key: freeInputKey(c, preset?.key) }] };
    });
  const removeInput = (index: number) =>
    update((c) => {
      const key = c.inputs[index]?.key;
      return {
        ...c,
        inputs: c.inputs.filter((_, i) => i !== index),
        sizes: c.sizes.map((size) => ({ ...size, ranges: Object.fromEntries(Object.entries(size.ranges).filter(([k]) => k !== key)) })),
      };
    });
  const setSize = (index: number, label: string) => update((c) => ({ ...c, sizes: c.sizes.map((size, i) => (i === index ? { ...size, label } : size)) }));
  const setRange = (index: number, key: string, bound: "min" | "max", value: number | undefined) =>
    update((c) => ({
      ...c,
      sizes: c.sizes.map((size, i) => {
        if (i !== index) return size;
        const range = { ...size.ranges[key], [bound]: value };
        if (range.min === undefined) delete range.min;
        if (range.max === undefined) delete range.max;
        return { ...size, ranges: { ...size.ranges, [key]: range } };
      }),
    }));
  const moveSize = (index: number, by: -1 | 1) =>
    update((c) => {
      const sizes = [...c.sizes];
      const [row] = sizes.splice(index, 1);
      sizes.splice(index + by, 0, row!);
      return { ...c, sizes };
    });

  const presets = MEASUREMENT_PRESETS.filter((preset) => !chart.inputs.some((input) => input.key === preset.key));

  const save = () => {
    const parsed = sizeChartPayloadSchema.safeParse({ name, definition: chart });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const known = ["duplicate_input", "duplicate_size", "min_max", "empty"];
      toast.error(t(`check.${known.includes(issue?.message ?? "") ? issue!.message : "generic"}`));
      return;
    }
    startSave(async () => {
      const result = await saveSizeChart(storeId, initial.id, parsed.data);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("editor.saved"));
      onSaved();
    });
  };

  const remove = () => {
    if (!initial.id) return;
    const id = initial.id;
    startDelete(async () => {
      const result = await deleteSizeChart(storeId, id);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("editor.deleted"));
      onSaved();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3">
        <TextAction type="button" onClick={onClose} className="-ms-2.5 max-[600px]:min-h-10">
          <ChevronLeft className="rtl:rotate-180" aria-hidden />
          {t("editor.back")}
        </TextAction>
        <h1 className="min-w-0 flex-1 basis-full text-[clamp(20px,2.2vw,26px)] font-bold text-(--s-ink) sm:basis-auto">
          {initial.id ? t("editor.editTitle") : t("editor.newTitle")}
        </h1>
        {initial.id && !readOnly && (
          <SellerButton size="sm" variant="outline" onClick={() => setConfirmDelete(true)} disabled={deleting}>
            <Trash2 aria-hidden />
            {t("editor.delete")}
          </SellerButton>
        )}
        {!readOnly && (
          <SellerButton size="sm" variant="amber" onClick={save} disabled={saving}>
            {saving && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("editor.save")}
          </SellerButton>
        )}
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-5">
          <SectionCard title={t("editor.nameTitle")} description={t("editor.nameBody")}>
            <FieldRow>
              <Field label={t("editor.nameAr")} htmlFor="sc-name-ar">
                <TextInput id="sc-name-ar" dir="rtl" maxLength={SIZE_CHART_LIMITS.name} value={name.ar} onChange={(e) => setName({ ...name, ar: e.target.value })} />
              </Field>
              <Field label={t("editor.nameEn")} htmlFor="sc-name-en">
                <TextInput id="sc-name-en" dir="ltr" maxLength={SIZE_CHART_LIMITS.name} value={name.en} onChange={(e) => setName({ ...name, en: e.target.value })} />
              </Field>
            </FieldRow>
          </SectionCard>

          <SectionCard icon={Ruler} title={t("editor.inputsTitle")} description={t("editor.inputsBody", { max: SIZE_CHART_LIMITS.inputs })}>
            <ul className="flex flex-col gap-3">
              {chart.inputs.map((input, index) => (
                <li key={input.key} className="rounded-2xl border border-(--s-line) bg-(--s-surface) p-3.5">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Field label={t("editor.labelAr")}>
                      <TextInput dir="rtl" maxLength={SIZE_CHART_LIMITS.label} value={input.label.ar} onChange={(e) => setInput(index, { label: { ...input.label, ar: e.target.value } })} />
                    </Field>
                    <Field label={t("editor.labelEn")}>
                      <TextInput dir="ltr" maxLength={SIZE_CHART_LIMITS.label} value={input.label.en} onChange={(e) => setInput(index, { label: { ...input.label, en: e.target.value } })} />
                    </Field>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 items-end gap-2.5 sm:grid-cols-[110px_1fr_1fr_1fr_auto]">
                    <Field label={t("editor.unit")}>
                      <NativeSelect value={input.unit} onChange={(e) => setInput(index, { unit: e.target.value as SizeChartInput["unit"] })}>
                        {SIZE_CHART_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {t(`units.${unit}`)}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label={t("editor.min")}>
                      <input type="number" inputMode="decimal" className={NUM} value={input.min} onChange={(e) => setInput(index, { min: toNumber(e.target.value) ?? 0 })} />
                    </Field>
                    <Field label={t("editor.max")}>
                      <input type="number" inputMode="decimal" className={NUM} value={input.max} onChange={(e) => setInput(index, { max: toNumber(e.target.value) ?? 0 })} />
                    </Field>
                    <Field label={t("editor.step")}>
                      <input type="number" inputMode="decimal" step="0.1" min="0.1" className={NUM} value={input.step} onChange={(e) => setInput(index, { step: toNumber(e.target.value) ?? 1 })} />
                    </Field>
                    <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:pb-1.5">
                      <Toggle checked={input.required} onCheckedChange={(required) => setInput(index, { required })} label={t("editor.required")} />
                      <IconButton type="button" aria-label={t("editor.removeInput")} disabled={chart.inputs.length <= 1} onClick={() => removeInput(index)}>
                        <X aria-hidden />
                      </IconButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {canAddInput(chart) && (
              <div className="flex flex-wrap items-center gap-2">
                {presets.map((preset) => (
                  <SellerButton key={preset.key} type="button" size="xs" variant="mini" onClick={() => addInput(preset)}>
                    <Plus aria-hidden />
                    {pickText(preset.label, locale)}
                  </SellerButton>
                ))}
                <SellerButton type="button" size="xs" variant="mini" onClick={() => addInput()}>
                  <Plus aria-hidden />
                  {t("editor.customInput")}
                </SellerButton>
              </div>
            )}
          </SectionCard>

          <SectionCard title={t("editor.sizesTitle")} description={t("editor.sizesBody", { max: SIZE_CHART_LIMITS.sizes })}>
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <table className="w-full min-w-[480px] border-separate border-spacing-y-1.5 text-[13px]">
                <thead>
                  <tr className="text-start text-xs text-(--s-subtle)">
                    <th className="w-[84px] pb-1 text-start font-semibold">{t("editor.size")}</th>
                    {chart.inputs.map((input) => (
                      <th key={input.key} className="pb-1 text-start font-semibold">
                        {pickText(input.label, locale) || "—"} <span className="font-normal text-(--s-faint)">({t(`units.${input.unit}`)})</span>
                      </th>
                    ))}
                    <th className="w-[108px]" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {chart.sizes.map((size, index) => (
                    <tr key={index}>
                      <td className="pe-2 align-middle">
                        <input
                          dir="ltr"
                          aria-label={t("editor.size")}
                          maxLength={SIZE_CHART_LIMITS.sizeLabel}
                          className={cn(NUM, "font-bold")}
                          value={size.label}
                          onChange={(e) => setSize(index, e.target.value)}
                        />
                      </td>
                      {chart.inputs.map((input) => {
                        const range = size.ranges[input.key];
                        const label = pickText(input.label, locale);
                        return (
                          <td key={input.key} className="pe-2 align-middle">
                            <div dir="ltr" className="flex items-center gap-1">
                              <input
                                type="number"
                                inputMode="decimal"
                                step={input.step}
                                aria-label={`${size.label} ${label} ${t("editor.from")}`}
                                placeholder={t("editor.from")}
                                className={NUM}
                                value={range?.min ?? ""}
                                onChange={(e) => setRange(index, input.key, "min", toNumber(e.target.value))}
                              />
                              <span aria-hidden className="text-(--s-faint)">–</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                step={input.step}
                                aria-label={`${size.label} ${label} ${t("editor.to")}`}
                                placeholder={t("editor.to")}
                                className={NUM}
                                value={range?.max ?? ""}
                                onChange={(e) => setRange(index, input.key, "max", toNumber(e.target.value))}
                              />
                            </div>
                          </td>
                        );
                      })}
                      <td className="align-middle">
                        <div className="flex justify-end gap-0.5">
                          <IconButton type="button" aria-label={t("editor.moveUp")} disabled={index === 0} onClick={() => moveSize(index, -1)}>
                            <ArrowUp aria-hidden />
                          </IconButton>
                          <IconButton type="button" aria-label={t("editor.moveDown")} disabled={index === chart.sizes.length - 1} onClick={() => moveSize(index, 1)}>
                            <ArrowDown aria-hidden />
                          </IconButton>
                          <IconButton
                            type="button"
                            aria-label={t("editor.removeSize")}
                            disabled={chart.sizes.length <= 1}
                            onClick={() => update((c) => ({ ...c, sizes: c.sizes.filter((_, i) => i !== index) }))}
                          >
                            <X aria-hidden />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-(--s-faint)">{t("editor.sizesHint")}</p>
            {canAddSize(chart) && (
              <SellerButton
                type="button"
                size="sm"
                variant="mini"
                className="self-start"
                onClick={() => update((c) => ({ ...c, sizes: [...c.sizes, { label: nextSizeLabel(c), ranges: {} }] }))}
              >
                <Plus aria-hidden />
                {t("editor.addSize")}
              </SellerButton>
            )}
          </SectionCard>

          <SectionCard icon={SlidersHorizontal} title={t("editor.optionsTitle")}>
            <Toggle checked={chart.fit} onCheckedChange={(fit) => update((c) => ({ ...c, fit }))} label={t("editor.fit")} />
            <Toggle checked={chart.showTable} onCheckedChange={(showTable) => update((c) => ({ ...c, showTable }))} label={t("editor.showTable")} />
            <FieldRow>
              <Field label={t("editor.noteAr")} hint={t("optional")}>
                <TextArea dir="rtl" rows={3} maxLength={SIZE_CHART_LIMITS.note} value={chart.note.ar} onChange={(e) => update((c) => ({ ...c, note: { ...c.note, ar: e.target.value } }))} />
              </Field>
              <Field label={t("editor.noteEn")} hint={t("optional")}>
                <TextArea dir="ltr" rows={3} maxLength={SIZE_CHART_LIMITS.note} value={chart.note.en} onChange={(e) => update((c) => ({ ...c, note: { ...c.note, en: e.target.value } }))} />
              </Field>
            </FieldRow>
          </SectionCard>
        </fieldset>

        <TryIt chart={chart} />
      </div>

      <ConfirmActionDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("editor.deleteTitle")}
        description={t("editor.deleteBody")}
        confirmLabel={t("editor.delete")}
        destructive
        pending={deleting}
        onConfirm={remove}
      />
    </div>
  );
}

/** The shopper's view, live: type numbers, see the size the storefront would say. */
function TryIt({ chart }: { chart: SizeChartDefinition }) {
  const t = useTranslations("sizeChartApp");
  const locale = useLocale();
  const [values, setValues] = useState<Record<string, number | undefined>>({});
  const [fit, setFit] = useState<FitPreference>("regular");
  const result = useMemo(() => recommendSize(chart, values, fit), [chart, values, fit]);

  return (
    <SellerCard className="flex flex-col gap-3.5 p-5 lg:sticky lg:top-24">
      <div>
        <b className="block text-[14.5px] text-(--s-ink)">{t("tryIt.title")}</b>
        <small className="text-xs text-(--s-subtle)">{t("tryIt.body")}</small>
      </div>
      {chart.inputs.map((input) => (
        <Field key={input.key} label={`${pickText(input.label, locale) || "—"} (${t(`units.${input.unit}`)})`} required={input.required}>
          <input
            type="number"
            inputMode="decimal"
            min={input.min}
            max={input.max}
            step={input.step}
            className={NUM}
            value={values[input.key] ?? ""}
            onChange={(e) => setValues((current) => ({ ...current, [input.key]: toNumber(e.target.value) }))}
          />
        </Field>
      ))}
      {chart.fit && (
        <Segmented
          value={fit}
          onChange={setFit}
          label={t("tryIt.fit")}
          options={FIT_PREFERENCES.map((value) => ({ value, label: t(`fit.${value}`) }))}
        />
      )}
      <div aria-live="polite" className="grid min-h-[92px] place-items-center rounded-2xl bg-(--s-tint) px-4 py-3 text-center">
        {result.status === "exact" || result.status === "closest" ? (
          <div>
            <small className="block text-xs text-(--s-subtle)">{result.status === "exact" ? t("tryIt.yourSize") : t("tryIt.closest")}</small>
            <b dir="ltr" className="block font-montserrat text-[34px] leading-tight font-extrabold text-(--s-ink)">
              {result.size}
            </b>
            {result.status === "closest" && result.direction && <small className="block text-xs text-(--s-muted)">{t(`tryIt.${result.direction}`)}</small>}
          </div>
        ) : (
          <small className="text-xs text-(--s-subtle)">{result.status === "none" ? t("tryIt.none") : t("tryIt.fill")}</small>
        )}
      </div>
    </SellerCard>
  );
}
