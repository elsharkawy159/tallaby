import { parseVariantOption, type VariantLocalizedFields, type VariantTypeFormValue } from "@/lib/utils/variant-types.lib";

/**
 * Which combination rows the variants editor keeps when the option types change.
 * Combinations are not rebuilt from scratch: a row keeps its database id, price
 * and stock, and a combination the seller removed stays removed.
 */

type Locale = "en" | "ar";
const LOCALES: Locale[] = ["en", "ar"];

/** The parts of a variant row this file reads. */
export type ComboVariant = {
  optionValueIndexes?: number[] | null;
  localized?: unknown;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  isDefault?: boolean | null;
};

export const isValidVariantType = (type: VariantTypeFormValue) =>
  LOCALES.some(
    (locale) => type.localized[locale].name.trim().length > 0 && type.localized[locale].values.some((value) => value.trim()),
  );

const valueCount = (type: VariantTypeFormValue) => Math.max(type.localized.en.values.length, type.localized.ar.values.length, 0);

export function valueIndexCombinations(types: VariantTypeFormValue[]): number[][] {
  const counts = types.map(valueCount);
  if (types.length === 0 || counts.some((count) => count === 0)) return [];
  return counts.reduce<number[][]>(
    (combos, count) => combos.flatMap((combo) => Array.from({ length: count }, (_, i) => [...combo, i])),
    [[]],
  );
}

const norm = (value: string | undefined | null) => (value ?? "").trim().toLowerCase();

/** The index of a value in an option, by its text in either language. */
function findValueIndex(type: VariantTypeFormValue, text: Record<Locale, string>): number {
  const count = valueCount(type);
  for (const locale of LOCALES) {
    if (!text[locale]) continue;
    for (let i = 0; i < count; i += 1) {
      if (norm(type.localized[locale].values[i]) === text[locale]) return i;
    }
  }
  return -1;
}

/** A variant's value text for one option. Stored weights carry their unit ("500 g"). */
function storedOptionText(type: VariantTypeFormValue, typeIndex: number, variant: ComboVariant, locale: Locale): string {
  const key = `option${typeIndex + 1}` as "option1" | "option2" | "option3";
  const localized = variant.localized && typeof variant.localized === "object" ? (variant.localized as Record<string, VariantLocalizedFields | undefined>)[locale] : undefined;
  const raw = localized?.[key] ?? (locale === "en" ? variant[key] : undefined);
  const value = parseVariantOption(raw)?.value ?? "";
  const unit = type.kind === "weight" && type.unit ? ` ${type.unit}` : "";
  return norm(unit && value.endsWith(unit) ? value.slice(0, -unit.length) : value);
}

/** A variant's value index in each option, or null when one of its values is not in the options. */
export function variantValueIndexes(types: VariantTypeFormValue[], variant: ComboVariant): number[] | null {
  const stored = variant.optionValueIndexes;
  if (Array.isArray(stored) && stored.length === types.length && stored.every((index, i) => index < valueCount(types[i]!))) {
    return stored;
  }
  const indexes: number[] = [];
  for (const [typeIndex, type] of types.entries()) {
    const index = findValueIndex(type, {
      en: storedOptionText(type, typeIndex, variant, "en"),
      ar: storedOptionText(type, typeIndex, variant, "ar"),
    });
    if (index < 0) return null;
    indexes.push(index);
  }
  return indexes;
}

/** Old value index to new, for one option. A value whose text changed but kept its place was renamed. */
function mapValueIndexes(prev: VariantTypeFormValue, next: VariantTypeFormValue): Map<number, number> {
  const map = new Map<number, number>();
  const sameLength = valueCount(prev) === valueCount(next);
  for (let i = 0; i < valueCount(prev); i += 1) {
    const found = findValueIndex(next, { en: norm(prev.localized.en.values[i]), ar: norm(prev.localized.ar.values[i]) });
    if (found >= 0) map.set(i, found);
    else if (sameLength) map.set(i, i);
  }
  return map;
}

export type ComboRow<T> = { valueIndexes: number[]; existing?: T };

const comboKey = (indexes: number[]) => indexes.join(".");

/** Every combination with its existing row, and only those. */
function matchExisting<T extends ComboVariant>(types: VariantTypeFormValue[], variants: T[], fillMissing: boolean): ComboRow<T>[] {
  const byKey = new Map<string, T>();
  for (const variant of variants) {
    const indexes = variantValueIndexes(types, variant);
    if (indexes && !byKey.has(comboKey(indexes))) byKey.set(comboKey(indexes), variant);
  }
  const combos = valueIndexCombinations(types);
  // Nothing matches (first build, or options replaced): every combination is new.
  if (byKey.size === 0 || fillMissing) {
    return combos.map((valueIndexes) => ({ valueIndexes, existing: byKey.get(comboKey(valueIndexes)) }));
  }
  return combos.filter((combo) => byKey.has(comboKey(combo))).map((valueIndexes) => ({ valueIndexes, existing: byKey.get(comboKey(valueIndexes)) }));
}

/**
 * The rows after the options change.
 *
 * `prevTypes` is what the seller just edited from. Without it the change came
 * from outside (page load, draft, import, undo): the rows given are taken as
 * they are, so a removed combination stays removed. `fillMissing` adds back
 * every absent combination: the seller's Restore, or an AI fill that only wrote
 * the options.
 */
export function reconcileCombos<T extends ComboVariant>({
  prevTypes,
  nextTypes,
  variants,
  fillMissing = false,
}: {
  prevTypes?: VariantTypeFormValue[] | null;
  nextTypes: VariantTypeFormValue[];
  variants: T[];
  fillMissing?: boolean;
}): ComboRow<T>[] {
  const next = nextTypes.filter(isValidVariantType);
  if (next.length === 0) return [];
  const prev = prevTypes?.filter(isValidVariantType);
  if (!prev || prev.length === 0 || variants.length === 0) return matchExisting(next, variants, fillMissing);

  // Options on both sides, as positions in each list.
  const shared = next.flatMap((type, nextPos) => {
    const prevPos = prev.findIndex((p) => p.id === type.id);
    return prevPos < 0 ? [] : [{ nextPos, prevPos, map: mapValueIndexes(prev[prevPos]!, type) }];
  });

  // Rows by their values in the shared options, the default row first so it survives when options merge.
  const byBase = new Map<string, T[]>();
  for (const variant of [...variants].sort((a, b) => Number(b.isDefault === true) - Number(a.isDefault === true))) {
    const old = variantValueIndexes(prev, variant);
    if (!old) continue;
    const base = shared.map(({ prevPos, map }) => map.get(old[prevPos]!));
    // Its value was removed, so the row goes with it.
    if (base.some((index) => index === undefined)) continue;
    const key = base.join(".");
    byBase.set(key, [...(byBase.get(key) ?? []), variant]);
  }

  const oldValues = shared.map(({ map }) => new Set(map.values()));
  const seen = new Set<string>();
  const rows: ComboRow<T>[] = [];
  for (const valueIndexes of valueIndexCombinations(next)) {
    const baseIndexes = shared.map(({ nextPos }) => valueIndexes[nextPos]!);
    const base = baseIndexes.join(".");
    const existing = byBase.get(base)?.shift();
    const firstOfBase = !seen.has(base);
    seen.add(base);
    if (existing) {
      rows.push({ valueIndexes, existing });
      continue;
    }
    // Every value here existed before and this combination had no row: the seller removed it.
    const removed = !fillMissing && firstOfBase && shared.length > 0 && baseIndexes.every((index, i) => oldValues[i]!.has(index));
    if (!removed) rows.push({ valueIndexes });
  }
  return rows;
}

/** How many combinations have no row, so the seller can be offered Restore. */
export function missingComboCount(types: VariantTypeFormValue[], rowCount: number): number {
  const valid = types.filter(isValidVariantType);
  return Math.max(0, valueIndexCombinations(valid).length - rowCount);
}
