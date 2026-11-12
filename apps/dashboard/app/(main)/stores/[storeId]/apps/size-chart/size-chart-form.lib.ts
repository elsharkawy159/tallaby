import { SIZE_CHART_LIMITS, type SizeChartDefinition, type SizeChartInput } from "@workspace/lib/size-charts";

/** The text in the page's language, else the other one. */
export function pickText(value: { ar: string; en: string }, locale: string): string {
  return (locale === "ar" ? value.ar || value.en : value.en || value.ar) || "";
}

/** Measurements the seller adds with one click; every field stays editable. */
export const MEASUREMENT_PRESETS: SizeChartInput[] = [
  { key: "height", label: { ar: "الطول", en: "Height" }, unit: "cm", min: 100, max: 220, step: 1, required: true },
  { key: "weight", label: { ar: "الوزن", en: "Weight" }, unit: "kg", min: 30, max: 200, step: 1, required: true },
  { key: "chest", label: { ar: "محيط الصدر", en: "Chest" }, unit: "cm", min: 60, max: 160, step: 1, required: false },
  { key: "waist", label: { ar: "محيط الوسط", en: "Waist" }, unit: "cm", min: 50, max: 160, step: 1, required: false },
  { key: "hips", label: { ar: "محيط الأرداف", en: "Hips" }, unit: "cm", min: 60, max: 170, step: 1, required: false },
  { key: "foot", label: { ar: "طول القدم", en: "Foot length" }, unit: "cm", min: 15, max: 35, step: 0.1, required: true },
];

/** A key no input of the chart uses yet: the preset's own, else `m1`, `m2`… */
export function freeInputKey(chart: SizeChartDefinition, wanted?: string): string {
  const used = new Set(chart.inputs.map((input) => input.key));
  if (wanted && !used.has(wanted)) return wanted;
  for (let i = 1; ; i += 1) if (!used.has(`m${i}`)) return `m${i}`;
}

/** The next size label after the last one (S → M, 40 → 41), else empty. */
export function nextSizeLabel(chart: SizeChartDefinition): string {
  const ladder = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
  const last = chart.sizes.at(-1)?.label.trim().toUpperCase() ?? "";
  const i = ladder.indexOf(last === "XXL" ? "2XL" : last);
  if (i >= 0 && i < ladder.length - 1) return ladder[i + 1]!;
  if (!/^\d+$/.test(last)) return "";
  // Keeps the chart's step: 28, 30 → 32; 40, 41 → 42.
  const before = Number(chart.sizes.at(-2)?.label);
  const step = Number.isInteger(before) && Number(last) - before > 0 && Number(last) - before <= 10 ? Number(last) - before : 1;
  return String(Number(last) + step);
}

export const canAddInput = (chart: SizeChartDefinition) => chart.inputs.length < SIZE_CHART_LIMITS.inputs;
export const canAddSize = (chart: SizeChartDefinition) => chart.sizes.length < SIZE_CHART_LIMITS.sizes;

/** A number field's text as a number, or undefined when it is empty or not a number. */
export function toNumber(text: string): number | undefined {
  const value = Number(text.replace(",", "."));
  return text.trim() === "" || !Number.isFinite(value) ? undefined : value;
}
