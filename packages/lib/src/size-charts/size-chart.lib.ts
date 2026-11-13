/**
 * Size Chart app (ROADMAP.md F-92): a store's size charts, the customer's
 * measurements and the size Tallaby recommends. Pure and shared: the
 * dashboard validates a chart with the same schema the server saves with,
 * and the storefront runs `recommendSize` in the browser (instant, and
 * deterministic, so the result never differs from a server run).
 * Everything the shopper sees is drawn from this structured data; a chart
 * holds no markup or code (CLAUDE.md rule 9).
 */
import { z } from "zod";

export const SIZE_CHART_LIMITS = {
  inputs: 8,
  sizes: 30,
  chartsPerStore: 20,
  /** Products or categories one chart can be applied to. */
  targetsPerChart: 500,
  name: 60,
  label: 40,
  sizeLabel: 12,
  note: 500,
  /** The largest measurement (cm, kg …) any field takes. */
  value: 1000,
} as const;

export const SIZE_CHART_UNITS = ["cm", "kg", "in", "lb"] as const;
export type SizeChartUnit = (typeof SIZE_CHART_UNITS)[number];

export const FIT_PREFERENCES = ["tight", "regular", "loose"] as const;
export type FitPreference = (typeof FIT_PREFERENCES)[number];

const INPUT_KEY_RE = /^[a-z][a-z0-9_]{0,23}$/;

const text = (max: number) => z.string().trim().max(max);
const bilingual = (max: number) =>
  z
    .object({ ar: z.string().trim().max(max), en: z.string().trim().max(max) })
    .refine((value) => Boolean(value.ar || value.en), { message: "empty" });
const measure = z.number().finite().min(0).max(SIZE_CHART_LIMITS.value);

export const sizeChartInputSchema = z
  .object({
    key: z.string().regex(INPUT_KEY_RE),
    label: bilingual(SIZE_CHART_LIMITS.label),
    unit: z.enum(SIZE_CHART_UNITS),
    min: measure,
    max: measure,
    step: z.number().finite().gt(0).max(100),
    required: z.boolean(),
  })
  .refine((input) => input.min < input.max, { message: "min_max", path: ["max"] });

const rangeSchema = z
  .object({ min: measure.optional(), max: measure.optional() })
  .refine((range) => range.min === undefined || range.max === undefined || range.min <= range.max, { message: "min_max", path: ["max"] });

export const sizeChartSizeSchema = z.object({
  label: z.string().trim().min(1).max(SIZE_CHART_LIMITS.sizeLabel),
  ranges: z.record(z.string(), rangeSchema),
});

const normLabel = (label: string) => label.trim().toLowerCase();

export const sizeChartDefinitionSchema = z
  .object({
    inputs: z.array(sizeChartInputSchema).min(1).max(SIZE_CHART_LIMITS.inputs),
    sizes: z.array(sizeChartSizeSchema).min(1).max(SIZE_CHART_LIMITS.sizes),
    /** Offers Tight / Regular / Loose, which moves the result one size. */
    fit: z.boolean(),
    /** Shows the sizes as a readable table next to the finder. */
    showTable: z.boolean(),
    note: z.object({ ar: text(SIZE_CHART_LIMITS.note), en: text(SIZE_CHART_LIMITS.note) }),
  })
  .superRefine((chart, ctx) => {
    const keys = chart.inputs.map((input) => input.key);
    if (new Set(keys).size !== keys.length) ctx.addIssue({ code: "custom", message: "duplicate_input", path: ["inputs"] });
    const labels = chart.sizes.map((size) => normLabel(size.label));
    if (new Set(labels).size !== labels.length) ctx.addIssue({ code: "custom", message: "duplicate_size", path: ["sizes"] });
  })
  .transform((chart) => {
    const keys = new Set(chart.inputs.map((input) => input.key));
    return {
      ...chart,
      // Ranges of a removed input, and empty ones, are dropped.
      sizes: chart.sizes.map((size) => ({
        label: size.label,
        ranges: Object.fromEntries(
          Object.entries(size.ranges).filter(([key, range]) => keys.has(key) && (range.min !== undefined || range.max !== undefined)),
        ),
      })),
    };
  });

export type SizeChartInput = z.infer<typeof sizeChartInputSchema>;
export type SizeChartSize = z.infer<typeof sizeChartSizeSchema>;
export type SizeChartDefinition = z.infer<typeof sizeChartDefinitionSchema>;

export const sizeChartNameSchema = bilingual(SIZE_CHART_LIMITS.name);
export type SizeChartName = z.infer<typeof sizeChartNameSchema>;

/** What the dashboard sends to save a chart. */
export const sizeChartPayloadSchema = z.object({ name: sizeChartNameSchema, definition: sizeChartDefinitionSchema });
export type SizeChartPayload = z.infer<typeof sizeChartPayloadSchema>;

/** A stored or sent definition, or null when it isn't valid (never throws). */
export function parseSizeChartDefinition(raw: unknown): SizeChartDefinition | null {
  const parsed = sizeChartDefinitionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export type SizeRecommendation =
  | { status: "incomplete"; missing: string[] }
  | { status: "none" }
  | {
      /** exact: every given value is inside the size's ranges; closest: the nearest size. */
      status: "exact" | "closest";
      size: string;
      index: number;
      /** The size before the fit moved it. */
      baseSize: string;
      shifted: boolean;
      /** For "closest": the values are above the size (bigger than the chart) or below it. */
      direction: "above" | "below" | null;
    };

const EPSILON = 1e-6;

/**
 * The recommended size for the shopper's values. Only inputs with a finite
 * value count; a missing required one asks for it. Each size is scored by how
 * far the values are outside its ranges, each input divided by its spread
 * across the chart (so kilos and centimetres weigh alike); a size with no range
 * for any given input is skipped. Lowest score wins, a tie goes to the larger
 * size (later in the list), and a tight or loose fit moves one size within the
 * chart.
 */
export function recommendSize(
  chart: SizeChartDefinition,
  values: Readonly<Record<string, number | null | undefined>>,
  fit: FitPreference = "regular",
): SizeRecommendation {
  const given = new Map<string, number>();
  for (const input of chart.inputs) {
    const value = values[input.key];
    if (typeof value === "number" && Number.isFinite(value)) given.set(input.key, value);
  }
  const missing = chart.inputs.filter((input) => input.required && !given.has(input.key)).map((input) => input.key);
  if (missing.length) return { status: "incomplete", missing };

  // Each input's spread over the whole chart: its lowest min to its highest max.
  const spread = new Map<string, number>();
  for (const input of chart.inputs) {
    let low = Infinity;
    let high = -Infinity;
    for (const size of chart.sizes) {
      const range = size.ranges[input.key];
      if (!range) continue;
      for (const bound of [range.min, range.max]) {
        if (bound === undefined) continue;
        low = Math.min(low, bound);
        high = Math.max(high, bound);
      }
    }
    const width = high - low;
    spread.set(input.key, Number.isFinite(width) && width > 0 ? width : Math.max(input.max - input.min, 1));
  }

  let best: { index: number; score: number; above: number; below: number } | null = null;
  chart.sizes.forEach((size, index) => {
    let compared = 0;
    let score = 0;
    let above = 0;
    let below = 0;
    for (const [key, value] of given) {
      const range = size.ranges[key];
      if (!range) continue;
      compared += 1;
      const scale = spread.get(key) ?? 1;
      if (range.min !== undefined && value < range.min) {
        score += (range.min - value) / scale;
        below += 1;
      } else if (range.max !== undefined && value > range.max) {
        score += (value - range.max) / scale;
        above += 1;
      }
    }
    if (compared === 0) return;
    // `<=` with a tolerance: an equal score later in the list (a larger size) wins.
    if (!best || score <= best.score + EPSILON) best = { index, score, above, below };
  });
  if (!best) return { status: "none" };
  const chosen: { index: number; score: number; above: number; below: number } = best;

  const exact = chosen.score <= EPSILON;
  const step = chart.fit ? (fit === "tight" ? -1 : fit === "loose" ? 1 : 0) : 0;
  const index = Math.min(chart.sizes.length - 1, Math.max(0, chosen.index + step));
  return {
    status: exact ? "exact" : "closest",
    size: chart.sizes[index]!.label,
    index,
    baseSize: chart.sizes[chosen.index]!.label,
    shifted: index !== chosen.index,
    direction: exact ? null : chosen.above && !chosen.below ? "above" : chosen.below && !chosen.above ? "below" : null,
  };
}

export type SizeChartTarget = { chartId: string; productId: string | null; categoryId: string | null };

/**
 * The chart a product shows: one applied to the product itself beats one
 * applied to its category, which beats one applied to that category's main
 * category when it is a sub-category (0171). The caller passes only this
 * store's targets.
 */
export function resolveSizeChartTarget(
  targets: readonly SizeChartTarget[],
  product: { id: string; categoryId: string | null; parentCategoryId?: string | null },
): string | null {
  const own = targets.find((target) => target.productId === product.id);
  if (own) return own.chartId;
  if (!product.categoryId) return null;
  const byCategory = targets.find((target) => target.categoryId === product.categoryId);
  if (byCategory) return byCategory.chartId;
  if (!product.parentCategoryId) return null;
  return targets.find((target) => target.categoryId === product.parentCategoryId)?.chartId ?? null;
}

const SIZE_ALIASES: Record<string, string> = { xxl: "2xl", xxxl: "3xl", xxxxl: "4xl", xxxxxl: "5xl", xxs: "2xs" };

function sizeKey(label: string): string {
  const key = label.replace(/\s+/g, "").toLowerCase();
  return SIZE_ALIASES[key] ?? key;
}

/** A variant value and a chart size are the same size: case and spaces aside, XXL = 2XL. */
export function sizeLabelsMatch(a: string, b: string): boolean {
  const left = sizeKey(a);
  return left !== "" && left === sizeKey(b);
}

const uniqueIds = z
  .array(z.string().uuid())
  .max(SIZE_CHART_LIMITS.targetsPerChart)
  .transform((ids) => [...new Set(ids)]);

/** What a chart is applied to, as the dashboard sends it. The server checks every id is this store's. */
export const sizeChartTargetsSchema = z.object({ productIds: uniqueIds, categoryIds: uniqueIds });
export type SizeChartTargetsPayload = z.infer<typeof sizeChartTargetsSchema>;

/** The requested ids the store doesn't own (`owned` is what the server found in the store). */
export function foreignTargetIds(requested: readonly string[], owned: ReadonlySet<string>): string[] {
  return requested.filter((id) => !owned.has(id));
}

export { SIZE_CHART_TEMPLATES, sizeChartFromTemplate, type SizeChartTemplateKey } from "./size-chart-templates.lib";
