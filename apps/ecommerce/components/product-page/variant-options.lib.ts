import type { ProductLocale } from "@/lib/product-translations";
import { getVariantColors } from "@/lib/variant-colors";
import { getVariantImageUrls } from "@/lib/variant-images";
import { getVariantDisplayFields } from "@/lib/variant-localized";
import { variantHasStock, type ProductVariant } from "./product-page.lib";
import type { Product } from "./product-page.types";

/**
 * A product's variants split by option (Color, then Size…), so the shopper
 * picks one value per option instead of one merged "Black / 2XL" chip.
 * Options are the variant's `option1..3` slots ("Color: Black"); a variant
 * is found again from the picked values.
 */

export type OptionValue = { key: string; label: string; hex: string | null; image: string | null };
export type OptionGroup = { slot: number; name: string | null; isColor: boolean; values: OptionValue[] };
export type VariantMatrix = {
  groups: OptionGroup[];
  /** Each variant's value key per slot (null where it has none). */
  keys: ReadonlyMap<string, readonly (string | null)[]>;
};

type MatrixProduct = Pick<Product, "trackStock" | "productVariants">;

const SLOTS = [0, 1, 2] as const;
const norm = (value: string) => value.trim().toLowerCase();

/** "Color: Black" → name "Color", value "Black"; a bare value has no name. */
function splitOption(option: string): { name: string | null; value: string } {
  const match = option.match(/^(.+?):\s*(.+)$/);
  return match ? { name: match[1]!.trim(), value: match[2]!.trim() } : { name: null, value: option.trim() };
}

function slotOptions(variant: ProductVariant, locale: ProductLocale): (ReturnType<typeof splitOption> | null)[] {
  const display = getVariantDisplayFields(variant, locale);
  return [display.option1, display.option2, display.option3].map((option) => (option?.trim() ? splitOption(option) : null));
}

const APPAREL_SIZES = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl", "5xl", "6xl"];
const apparelRank = (key: string) => {
  const i = APPAREL_SIZES.indexOf(key.replace(/\s+/g, ""));
  // xxl = 2xl, xxxl = 3xl.
  return i < 0 ? -1 : key === "xxl" ? APPAREL_SIZES.indexOf("2xl") : key === "xxxl" ? APPAREL_SIZES.indexOf("3xl") : i;
};

/**
 * Sizes in size order whatever order the seller added them in: all numbers
 * (8, 10, 12; 38.5) small to large, or all apparel sizes (S, M, L, 2XL).
 * Anything else keeps the seller's order.
 */
export function sortSizes(values: OptionValue[]): OptionValue[] {
  const numbers = values.map((value) => (/^\d+(?:[.,]\d+)?$/.test(value.key) ? Number(value.key.replace(",", ".")) : Number.NaN));
  if (numbers.every((n) => !Number.isNaN(n))) return values.map((value, i) => ({ value, n: numbers[i]! })).sort((a, b) => a.n - b.n).map((x) => x.value);
  const ranks = values.map((value) => apparelRank(value.key));
  if (ranks.every((r) => r >= 0)) return values.map((value, i) => ({ value, r: ranks[i]! })).sort((a, b) => a.r - b.r).map((x) => x.value);
  return values;
}

/**
 * The option groups of a product, in slot order, each value once (in the
 * order the seller listed the variants). No groups (an empty matrix) when the
 * variants have no options, or two variants share the same values: the
 * picker then lists the variants themselves.
 */
export function buildVariantMatrix(variants: readonly ProductVariant[], locale: ProductLocale): VariantMatrix {
  const keys = new Map<string, (string | null)[]>();
  const groups = SLOTS.map((slot): OptionGroup => ({ slot, name: null, isColor: true, values: [] }));
  const seen = new Set<string>();

  for (const variant of variants) {
    const options = slotOptions(variant, locale);
    const colors = getVariantColors(variant, locale);
    const variantKeys = options.map((option) => (option ? norm(option.value) : null));
    keys.set(variant.id, variantKeys);
    seen.add(variantKeys.join("\u0000"));

    for (const slot of SLOTS) {
      const option = options[slot];
      const key = variantKeys[slot];
      if (!option || !key) continue;
      const group = groups[slot]!;
      group.name ??= option.name;
      let value = group.values.find((v) => v.key === key);
      if (!value) {
        value = { key, label: option.value, hex: colors.find((c) => c.value === key)?.hex ?? null, image: null };
        group.values.push(value);
      }
      value.image ??= getVariantImageUrls(variant)[0] ?? null;
    }
  }

  const used = groups.filter((group) => group.values.length > 0);
  for (const group of used) {
    group.isColor = group.values.every((value) => value.hex != null);
    // A photo on some chips only reads as a mistake: all of them or none.
    if (!group.values.every((value) => value.image)) for (const value of group.values) value.image = null;
    group.values = sortSizes(group.values);
  }
  // Duplicate value sets can't be told apart by option: list the variants instead.
  if (used.length === 0 || seen.size !== variants.length) return { groups: [], keys };
  return { groups: used, keys };
}

/** The selected variant's value key in each group (null when nothing is selected). */
export function selectedKeys(matrix: VariantMatrix, variantId: string | null): (string | null)[] {
  const keys = variantId ? matrix.keys.get(variantId) : undefined;
  return matrix.groups.map((group) => keys?.[group.slot] ?? null);
}

/**
 * A value can be picked when an in-stock variant has it together with the
 * values already picked in the groups before it (Color first, then the sizes
 * that colour comes in). The first group only needs an in-stock variant.
 */
export function valueAvailable(product: MatrixProduct, matrix: VariantMatrix, current: readonly (string | null)[], groupIndex: number, key: string): boolean {
  const slot = matrix.groups[groupIndex]!.slot;
  return (product.productVariants ?? []).some((variant) => {
    const keys = matrix.keys.get(variant.id);
    if (!keys || keys[slot] !== key || !variantHasStock(product, variant)) return false;
    for (let i = 0; i < groupIndex; i += 1) {
      const earlier = current[i];
      if (earlier != null && keys[matrix.groups[i]!.slot] !== earlier) return false;
    }
    return true;
  });
}

/**
 * The variant for a picked value: the one keeping every other pick, else the
 * in-stock one keeping the most picks (earlier groups count more), else any
 * with the value.
 */
export function pickVariant(product: MatrixProduct, matrix: VariantMatrix, current: readonly (string | null)[], groupIndex: number, key: string): string | null {
  const slot = matrix.groups[groupIndex]!.slot;
  let best: { id: string; score: number } | null = null;
  for (const variant of product.productVariants ?? []) {
    const keys = matrix.keys.get(variant.id);
    if (!keys || keys[slot] !== key) continue;
    let score = variantHasStock(product, variant) ? 1000 : 0;
    matrix.groups.forEach((group, i) => {
      if (i === groupIndex || current[i] == null) return;
      if (keys[group.slot] === current[i]) score += i < groupIndex ? 100 : 10;
    });
    if (!best || score > best.score) best = { id: variant.id, score };
  }
  return best?.id ?? null;
}

/** "Black / 2XL": the variant's values in group order (its title when it has no options). */
export function variantSummary(matrix: VariantMatrix, variant: Pick<ProductVariant, "id" | "title"> | null): string {
  if (!variant) return "";
  const keys = matrix.keys.get(variant.id);
  const labels = matrix.groups
    .map((group) => group.values.find((value) => value.key === keys?.[group.slot])?.label)
    .filter((label): label is string => Boolean(label));
  return labels.length ? labels.join(" / ") : (variant.title ?? "");
}

/** How many of each variant a list of pieces holds, in first-seen order. */
export function countPieces(pieces: readonly (string | null)[]): { variantId: string | null; quantity: number }[] {
  const lines: { variantId: string | null; quantity: number }[] = [];
  for (const id of pieces) {
    const line = lines.find((l) => l.variantId === id);
    if (line) line.quantity += 1;
    else lines.push({ variantId: id, quantity: 1 });
  }
  return lines;
}

/**
 * The extra pieces' variants (pieces 2…quantity): a piece the shopper didn't
 * change copies the piece before it, so raising the quantity repeats the
 * last choice.
 */
export function resolvePieces(firstVariantId: string | null, picked: readonly (string | null | undefined)[], quantity: number): (string | null)[] {
  const pieces: (string | null)[] = [];
  let previous = firstVariantId;
  for (let i = 0; i < Math.max(0, quantity - 1); i += 1) {
    const own = picked[i];
    previous = own === undefined ? previous : own;
    pieces.push(previous);
  }
  return pieces;
}
