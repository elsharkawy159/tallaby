import { describe, expect, it } from "vitest";
import {
  SIZE_CHART_LIMITS,
  SIZE_CHART_TEMPLATES,
  parseSizeChartDefinition,
  recommendSize,
  resolveSizeChartTarget,
  sizeChartFromTemplate,
  foreignTargetIds,
  sizeChartInputSchema,
  sizeChartTargetsSchema,
  sizeLabelsMatch,
  type SizeChartDefinition,
} from "./size-chart.lib";

const label = (en: string, ar = en) => ({ ar, en });

/** Height + weight tops: S 150–165 / 45–60, M 160–175 / 55–70, L 170–185 / 65–80, XL 180–195 / 75–95. */
const TOPS: SizeChartDefinition = {
  inputs: [
    { key: "height", label: label("Height", "الطول"), unit: "cm", min: 100, max: 230, step: 1, required: true },
    { key: "weight", label: label("Weight", "الوزن"), unit: "kg", min: 30, max: 200, step: 1, required: true },
  ],
  sizes: [
    { label: "S", ranges: { height: { min: 150, max: 165 }, weight: { min: 45, max: 60 } } },
    { label: "M", ranges: { height: { min: 160, max: 175 }, weight: { min: 55, max: 70 } } },
    { label: "L", ranges: { height: { min: 170, max: 185 }, weight: { min: 65, max: 80 } } },
    { label: "XL", ranges: { height: { min: 180, max: 195 }, weight: { min: 75, max: 95 } } },
  ],
  fit: true,
  showTable: true,
  note: label(""),
};

const SHOES: SizeChartDefinition = {
  inputs: [{ key: "foot", label: label("Foot length", "طول القدم"), unit: "cm", min: 15, max: 35, step: 0.1, required: true }],
  sizes: [
    { label: "40", ranges: { foot: { min: 25, max: 25.4 } } },
    { label: "41", ranges: { foot: { min: 25.5, max: 26.1 } } },
    { label: "42", ranges: { foot: { min: 26.2, max: 26.8 } } },
  ],
  fit: false,
  showTable: true,
  note: label(""),
};

describe("recommendSize", () => {
  it("picks the size whose every range holds the values", () => {
    const result = recommendSize(TOPS, { height: 172, weight: 67 });
    // M (160–175 / 55–70) and L (170–185 / 65–80) both hold them: the larger wins.
    expect(result).toMatchObject({ status: "exact", size: "L", index: 2 });
  });

  it("prefers the one exact size over a partly matching one", () => {
    expect(recommendSize(TOPS, { height: 162, weight: 50 })).toMatchObject({ status: "exact", size: "S" });
  });

  it("works with only some of the inputs when they are optional", () => {
    const optional: SizeChartDefinition = { ...TOPS, inputs: TOPS.inputs.map((input) => ({ ...input, required: false })) };
    expect(recommendSize(optional, { weight: 90 })).toMatchObject({ status: "exact", size: "XL" });
  });

  it("asks for a required input that is missing", () => {
    expect(recommendSize(TOPS, { height: 170 })).toEqual({ status: "incomplete", missing: ["weight"] });
  });

  it("returns the nearest size, with a hint, when the values are outside every range", () => {
    expect(recommendSize(TOPS, { height: 205, weight: 110 })).toMatchObject({ status: "closest", size: "XL", direction: "above" });
    expect(recommendSize(TOPS, { height: 140, weight: 40 })).toMatchObject({ status: "closest", size: "S", direction: "below" });
  });

  it("weighs inputs by their spread across the chart, so kilos don't outweigh centimetres", () => {
    // Height says S (exact), weight is 2 kg over S's 60: S is closest.
    expect(recommendSize(TOPS, { height: 152, weight: 62 })).toMatchObject({ status: "closest", size: "S" });
  });

  it("breaks a tie towards the larger size", () => {
    // 25.45 sits halfway between 40 (≤25.4) and 41 (≥25.5).
    expect(recommendSize(SHOES, { foot: 25.45 })).toMatchObject({ status: "closest", size: "41" });
  });

  it("handles a single-input chart (shoes)", () => {
    expect(recommendSize(SHOES, { foot: 26 })).toMatchObject({ status: "exact", size: "41" });
  });

  it("shifts one size for a tight or loose fit, within the chart", () => {
    expect(recommendSize(TOPS, { height: 172, weight: 67 }, "tight")).toMatchObject({ size: "M", shifted: true });
    expect(recommendSize(TOPS, { height: 172, weight: 67 }, "loose")).toMatchObject({ size: "XL", shifted: true });
    expect(recommendSize(TOPS, { height: 190, weight: 90 }, "loose")).toMatchObject({ size: "XL", shifted: false });
    expect(recommendSize(TOPS, { height: 155, weight: 50 }, "tight")).toMatchObject({ size: "S", shifted: false });
  });

  it("ignores the fit when the chart has no fit choice", () => {
    expect(recommendSize(SHOES, { foot: 26 }, "loose")).toMatchObject({ size: "41", shifted: false });
  });

  it("ignores junk values and never throws", () => {
    expect(recommendSize(TOPS, { height: Number.NaN, weight: Infinity })).toEqual({ status: "incomplete", missing: ["height", "weight"] });
    expect(recommendSize({ ...TOPS, sizes: [] }, { height: 170, weight: 70 })).toEqual({ status: "none" });
    // A size with no ranges for the given inputs is skipped, not chosen.
    const sparse: SizeChartDefinition = { ...SHOES, sizes: [{ label: "39", ranges: {} }, ...SHOES.sizes] };
    expect(recommendSize(sparse, { foot: 10 })).toMatchObject({ status: "closest", size: "40", direction: "below" });
  });

  it("is deterministic", () => {
    const values = { height: 177, weight: 74 };
    expect(recommendSize(TOPS, values)).toEqual(recommendSize(TOPS, values));
  });
});

describe("size chart schema", () => {
  it("accepts every Tallaby template", () => {
    for (const key of Object.keys(SIZE_CHART_TEMPLATES) as (keyof typeof SIZE_CHART_TEMPLATES)[]) {
      const chart = sizeChartFromTemplate(key);
      expect(parseSizeChartDefinition(chart.definition), key).not.toBeNull();
      expect(chart.name.ar && chart.name.en, key).toBeTruthy();
    }
  });

  it("caps inputs, sizes and text", () => {
    const input = (i: number) => ({ ...TOPS.inputs[0]!, key: `m${i}` });
    expect(parseSizeChartDefinition({ ...TOPS, inputs: Array.from({ length: SIZE_CHART_LIMITS.inputs + 1 }, (_, i) => input(i)) })).toBeNull();
    const size = (i: number) => ({ label: `S${i}`, ranges: {} });
    expect(parseSizeChartDefinition({ ...TOPS, sizes: Array.from({ length: SIZE_CHART_LIMITS.sizes + 1 }, (_, i) => size(i)) })).toBeNull();
    expect(parseSizeChartDefinition({ ...TOPS, sizes: Array.from({ length: SIZE_CHART_LIMITS.sizes }, (_, i) => size(i)) })).not.toBeNull();
    expect(parseSizeChartDefinition({ ...TOPS, note: label("x".repeat(SIZE_CHART_LIMITS.note + 1)) })).toBeNull();
    expect(sizeChartInputSchema.safeParse({ ...TOPS.inputs[0], label: label("x".repeat(SIZE_CHART_LIMITS.label + 1)) }).success).toBe(false);
  });

  it("needs at least one input and one size", () => {
    expect(parseSizeChartDefinition({ ...TOPS, inputs: [] })).toBeNull();
    expect(parseSizeChartDefinition({ ...TOPS, sizes: [] })).toBeNull();
  });

  it("rejects duplicate input keys and size labels, bad keys and inverted ranges", () => {
    expect(parseSizeChartDefinition({ ...TOPS, inputs: [TOPS.inputs[0], TOPS.inputs[0]] })).toBeNull();
    expect(parseSizeChartDefinition({ ...TOPS, sizes: [TOPS.sizes[0], { ...TOPS.sizes[1], label: " s " }] })).toBeNull();
    expect(parseSizeChartDefinition({ ...TOPS, inputs: [{ ...TOPS.inputs[0], key: "Height!" }, TOPS.inputs[1]] })).toBeNull();
    expect(parseSizeChartDefinition({ ...TOPS, sizes: [{ label: "S", ranges: { height: { min: 170, max: 160 } } }] })).toBeNull();
    expect(parseSizeChartDefinition({ ...TOPS, inputs: [{ ...TOPS.inputs[0], min: 200, max: 100 }, TOPS.inputs[1]] })).toBeNull();
  });

  it("drops ranges for inputs the chart doesn't have", () => {
    const parsed = parseSizeChartDefinition({ ...SHOES, sizes: [{ label: "40", ranges: { foot: { min: 25, max: 25.4 }, chest: { min: 1, max: 2 } } }] });
    expect(parsed?.sizes[0]?.ranges).toEqual({ foot: { min: 25, max: 25.4 } });
  });

  it("returns null for junk instead of throwing", () => {
    expect(parseSizeChartDefinition(null)).toBeNull();
    expect(parseSizeChartDefinition("x")).toBeNull();
  });
});

describe("resolveSizeChartTarget", () => {
  const targets = [
    { chartId: "c-cat", productId: null, categoryId: "cat-1" },
    { chartId: "c-prod", productId: "p-1", categoryId: null },
  ];

  it("lets a product assignment beat its category's", () => {
    expect(resolveSizeChartTarget(targets, { id: "p-1", categoryId: "cat-1" })).toBe("c-prod");
  });

  it("falls back to the category, then to nothing", () => {
    expect(resolveSizeChartTarget(targets, { id: "p-2", categoryId: "cat-1" })).toBe("c-cat");
    expect(resolveSizeChartTarget(targets, { id: "p-2", categoryId: null })).toBeNull();
    expect(resolveSizeChartTarget([], { id: "p-1", categoryId: "cat-1" })).toBeNull();
  });

  it("then falls back to the main category of a sub-category (0171)", () => {
    const withMain = [...targets, { chartId: "c-main", productId: null, categoryId: "main" }];
    expect(resolveSizeChartTarget(withMain, { id: "p-1", categoryId: "sub", parentCategoryId: "main" })).toBe("c-prod");
    expect(resolveSizeChartTarget(withMain, { id: "p-2", categoryId: "cat-1", parentCategoryId: "main" })).toBe("c-cat");
    expect(resolveSizeChartTarget(withMain, { id: "p-2", categoryId: "sub", parentCategoryId: "main" })).toBe("c-main");
    expect(resolveSizeChartTarget(withMain, { id: "p-2", categoryId: "sub" })).toBeNull();
    expect(resolveSizeChartTarget(withMain, { id: "p-2", categoryId: "sub", parentCategoryId: "other" })).toBeNull();
  });
});

describe("sizeLabelsMatch", () => {
  it("compares sizes case- and space-insensitively, with XXL = 2XL", () => {
    expect(sizeLabelsMatch("xl", "XL")).toBe(true);
    expect(sizeLabelsMatch(" 2XL ", "xxl")).toBe(true);
    expect(sizeLabelsMatch("3xl", "XXXL")).toBe(true);
    expect(sizeLabelsMatch("42", "42")).toBe(true);
    expect(sizeLabelsMatch("L", "XL")).toBe(false);
    expect(sizeLabelsMatch("", "")).toBe(false);
  });
});

describe("sizeChartTargetsSchema / foreignTargetIds", () => {
  const A = "00000000-0000-4000-8000-000000000001";
  const B = "00000000-0000-4000-8000-000000000002";

  it("names every requested product or category the store doesn't own", () => {
    // B is another store's product: the server found only A in this store.
    expect(foreignTargetIds([A, B], new Set([A]))).toEqual([B]);
    expect(foreignTargetIds([A], new Set([A]))).toEqual([]);
  });

  it("takes unique uuids only, up to the cap", () => {
    expect(sizeChartTargetsSchema.parse({ productIds: [A, A], categoryIds: [] })).toEqual({ productIds: [A], categoryIds: [] });
    expect(sizeChartTargetsSchema.safeParse({ productIds: ["x"], categoryIds: [] }).success).toBe(false);
    const many = Array.from({ length: SIZE_CHART_LIMITS.targetsPerChart + 1 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    expect(sizeChartTargetsSchema.safeParse({ productIds: many, categoryIds: [] }).success).toBe(false);
  });
});
