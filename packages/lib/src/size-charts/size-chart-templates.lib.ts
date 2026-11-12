import type { SizeChartDefinition, SizeChartInput, SizeChartName } from "./size-chart.lib";

/**
 * Tallaby's starting charts (ROADMAP.md F-92): the seller picks one and edits
 * every number. Common Egyptian and EU sizing, in cm and kg. A range left out
 * is ignored for that size.
 */

type Range = [number, number];

const height = (required = true): SizeChartInput => ({
  key: "height",
  label: { ar: "الطول", en: "Height" },
  unit: "cm",
  min: 100,
  max: 220,
  step: 1,
  required,
});
const weight: SizeChartInput = { key: "weight", label: { ar: "الوزن", en: "Weight" }, unit: "kg", min: 30, max: 200, step: 1, required: true };

function rows(keys: string[], table: [string, ...(Range | null)[]][]): SizeChartDefinition["sizes"] {
  return table.map(([label, ...ranges]) => ({
    label,
    ranges: Object.fromEntries(
      ranges.flatMap((range, i) => (range ? [[keys[i]!, { min: range[0], max: range[1] }]] : [])),
    ),
  }));
}

const NO_NOTE = { ar: "", en: "" };

export const SIZE_CHART_TEMPLATES = {
  tops: {
    name: { ar: "تيشيرتات وقمصان", en: "T-shirts & tops" },
    definition: {
      inputs: [height(), weight],
      sizes: rows(["height", "weight"], [
        ["XS", [150, 160], [40, 50]],
        ["S", [155, 165], [48, 58]],
        ["M", [163, 173], [56, 68]],
        ["L", [170, 180], [66, 78]],
        ["XL", [175, 185], [76, 88]],
        ["2XL", [180, 190], [86, 100]],
        ["3XL", [183, 195], [98, 115]],
      ]),
      fit: true,
      showTable: true,
      note: { ar: "لو بين مقاسين، اختار الأكبر لراحة أكتر.", en: "Between two sizes? Pick the larger one for a relaxed fit." },
    },
  },
  pants: {
    name: { ar: "بناطيل وجينز", en: "Pants & jeans" },
    definition: {
      inputs: [
        { key: "waist", label: { ar: "محيط الوسط", en: "Waist" }, unit: "cm", min: 50, max: 160, step: 1, required: true },
        height(false),
      ],
      sizes: rows(["waist", "height"], [
        ["28", [71, 74], [155, 170]],
        ["30", [75, 79], [160, 175]],
        ["32", [80, 84], [165, 180]],
        ["34", [85, 89], [168, 183]],
        ["36", [90, 94], [170, 188]],
        ["38", [95, 99], [172, 190]],
        ["40", [100, 105], [175, 195]],
      ]),
      fit: true,
      showTable: true,
      note: { ar: "قيس وسطك فوق السُرّة بشريط القياس من غير ما تشده.", en: "Measure around your natural waist, without pulling the tape tight." },
    },
  },
  shoes: {
    name: { ar: "أحذية", en: "Shoes" },
    definition: {
      inputs: [{ key: "foot", label: { ar: "طول القدم", en: "Foot length" }, unit: "cm", min: 15, max: 35, step: 0.1, required: true }],
      sizes: rows(["foot"], [
        ["36", [22.5, 23]],
        ["37", [23.1, 23.7]],
        ["38", [23.8, 24.4]],
        ["39", [24.5, 25]],
        ["40", [25.1, 25.7]],
        ["41", [25.8, 26.4]],
        ["42", [26.5, 27]],
        ["43", [27.1, 27.7]],
        ["44", [27.8, 28.4]],
        ["45", [28.5, 29]],
        ["46", [29.1, 29.7]],
      ]),
      fit: false,
      showTable: true,
      note: { ar: "اقف على ورقة وقيس من آخر الكعب لأطول صباع.", en: "Stand on paper and measure from the back of the heel to the longest toe." },
    },
  },
  dresses: {
    name: { ar: "فساتين وبلوزات حريمي", en: "Dresses & women's tops" },
    definition: {
      inputs: [
        height(),
        weight,
        { key: "bust", label: { ar: "محيط الصدر", en: "Bust" }, unit: "cm", min: 60, max: 160, step: 1, required: false },
      ],
      sizes: rows(["height", "weight", "bust"], [
        ["XS", [150, 160], [40, 48], [78, 82]],
        ["S", [155, 165], [47, 55], [83, 87]],
        ["M", [158, 168], [54, 62], [88, 92]],
        ["L", [160, 170], [61, 70], [93, 98]],
        ["XL", [162, 172], [69, 80], [99, 105]],
        ["2XL", [163, 175], [79, 92], [106, 113]],
      ]),
      fit: true,
      showTable: true,
      note: NO_NOTE,
    },
  },
} as const satisfies Record<string, { name: SizeChartName; definition: SizeChartDefinition }>;

export type SizeChartTemplateKey = keyof typeof SIZE_CHART_TEMPLATES;

/** An editable copy of a template (or a blank one-input chart). */
export function sizeChartFromTemplate(key: SizeChartTemplateKey | "blank"): { name: SizeChartName; definition: SizeChartDefinition } {
  if (key === "blank") {
    return {
      name: { ar: "جدول مقاسات جديد", en: "New size chart" },
      definition: { inputs: [height()], sizes: rows(["height"], [["M", [160, 175]]]), fit: false, showTable: true, note: NO_NOTE },
    };
  }
  return structuredClone(SIZE_CHART_TEMPLATES[key]) as { name: SizeChartName; definition: SizeChartDefinition };
}
