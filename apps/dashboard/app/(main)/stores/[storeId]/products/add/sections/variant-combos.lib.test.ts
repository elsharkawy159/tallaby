import { describe, expect, it } from "vitest";
import {
  buildVariantLocalizedFromCombo,
  reconstructVariantTypesFromVariants,
  type VariantTypeFormValue,
} from "@/lib/utils/variant-types.lib";
import { missingComboCount, reconcileCombos, valueIndexCombinations, variantValueIndexes } from "./variant-combos.lib";

const type = (id: string, name: string, en: string[], ar: string[] = en.map(() => "")): VariantTypeFormValue => ({
  id,
  kind: "custom",
  localized: { en: { name, values: en }, ar: { name, values: ar } },
});

const color = type("c", "Color", ["Red", "Blue"]);
const size = type("s", "Size", ["S", "M"]);

/** Rows as the form holds them after a build. */
const rowsFor = (types: VariantTypeFormValue[], combos = valueIndexCombinations(types)) =>
  combos.map((optionValueIndexes, i) => ({
    sku: `SKU-${i}`,
    isDefault: i === 0,
    optionValueIndexes,
    localized: buildVariantLocalizedFromCombo(types, optionValueIndexes),
  }));

/** The rows as they come back from the database: no value indexes. */
const fromDb = (rows: ReturnType<typeof rowsFor>) =>
  rows.map(({ optionValueIndexes: _drop, ...row }) => ({
    ...row,
    option1: row.localized.en.option1,
    option2: row.localized.en.option2,
    option3: row.localized.en.option3,
  }));

const skus = (rows: { existing?: { sku: string } }[]) => rows.map((row) => row.existing?.sku ?? "new");

describe("reconstructVariantTypesFromVariants", () => {
  it("lists each value once, so a 2×2 product stays four combinations (it became 16)", () => {
    const rows = fromDb(rowsFor([color, size]));
    const types = reconstructVariantTypesFromVariants(rows);
    expect(types.map((t) => t.localized.en.values)).toEqual([
      ["Red", "Blue"],
      ["S", "M"],
    ]);
    expect(valueIndexCombinations(types)).toHaveLength(4);
  });

  it("rebuilds an Arabic-only product (its options used to vanish and the save deleted the variants)", () => {
    const arOnly = type("c", "", ["", ""], ["أحمر", "أزرق"]);
    arOnly.localized.ar.name = "اللون";
    const types = reconstructVariantTypesFromVariants(fromDb(rowsFor([arOnly])));
    expect(types).toHaveLength(1);
    expect(types[0]!.localized.ar.values).toEqual(["أحمر", "أزرق"]);
    expect(types[0]!.localized.en.values).toEqual(["", ""]);
  });

  it("keeps a value's place when only one option is translated", () => {
    const colorAr = type("c", "", ["", ""], ["أحمر", "أزرق"]);
    colorAr.localized.ar.name = "اللون";
    colorAr.kind = "color";
    const sizeBoth = type("s", "Size", ["S", "M"], ["S", "M"]);
    sizeBoth.localized.ar.name = "المقاس";
    sizeBoth.kind = "size";
    const types = reconstructVariantTypesFromVariants(fromDb(rowsFor([colorAr, sizeBoth])));
    expect(types.map((t) => t.kind)).toEqual(["color", "size"]);
    expect(types[0]!.localized.ar.values).toEqual(["أحمر", "أزرق"]);
    expect(types[1]!.localized.en.values).toEqual(["S", "M"]);
  });

  it("does not add the weight unit twice on each save", () => {
    const weight: VariantTypeFormValue = { ...type("w", "Weight", ["500", "1"]), kind: "weight", unit: "g" };
    const types = reconstructVariantTypesFromVariants(fromDb(rowsFor([weight])));
    expect(types[0]!.localized.en.values).toEqual(["500", "1"]);
    expect(types[0]!.unit).toBe("g");
  });
});

describe("stored shapes without translations", () => {
  const shopify = [
    { option1: "Red", option2: "S" },
    { option1: "Red", option2: "M" },
    { option1: "Blue", option2: "S" },
    { option1: "Blue", option2: "M" },
  ];

  it("keeps bare Shopify values in their options, so 2×2 stays four rows (it became four options and one row)", () => {
    const types = reconstructVariantTypesFromVariants(shopify);
    expect(types.map((type) => type.localized.en.values)).toEqual([["Red", "Blue"], ["S", "M"]]);
    expect(types.map((type) => type.localized.en.name)).toEqual(["Option 1", "Option 2"]);
    const rows = reconcileCombos({ nextTypes: types, variants: shopify });
    expect(rows.map((row) => row.existing)).toEqual(shopify);
  });

  it("still groups named column options", () => {
    const types = reconstructVariantTypesFromVariants([
      { option1: "Color: Red", option2: "Size: S" },
      { option1: "Color: Blue", option2: "Size: S" },
    ]);
    expect(types.map((type) => [type.kind, type.localized.en.name, type.localized.en.values])).toEqual([
      ["color", "Color", ["Red", "Blue"]],
      ["size", "Size", ["S"]],
    ]);
  });
});

describe("variant titles with an untranslated value", () => {
  it("name the variant in the language each value has, so orders can tell them apart", () => {
    const color = { id: "c", kind: "color" as const, localized: { en: { name: "Color", values: [""] }, ar: { name: "اللون", values: ["نبيتي"] } } };
    const size = { id: "s", kind: "size" as const, localized: { en: { name: "Size", values: ["S"] }, ar: { name: "المقاس", values: ["S"] } } };
    const localized = buildVariantLocalizedFromCombo([color, size], [0, 0]);
    expect(localized.en.title).toBe("نبيتي / S");
    expect(localized.en.option1).toBeUndefined();
    expect(localized.en.option2).toBe("Size: S");
  });
});

describe("variantValueIndexes", () => {
  it("finds a stored variant by its text in either language", () => {
    const types = [type("c", "Color", ["Red", "Blue"], ["أحمر", "أزرق"])];
    const row = { localized: { en: { title: "" }, ar: { title: "", option1: "اللون: أزرق" } } };
    expect(variantValueIndexes(types, row)).toEqual([1]);
    expect(variantValueIndexes(types, { option1: "Color: Green" })).toBeNull();
  });
});

describe("reconcileCombos", () => {
  it("builds every combination the first time", () => {
    expect(reconcileCombos({ nextTypes: [color, size], variants: [] })).toHaveLength(4);
  });

  it("keeps stored rows and their order on page load", () => {
    const rows = fromDb(rowsFor([color, size]));
    const types = reconstructVariantTypesFromVariants(rows);
    expect(skus(reconcileCombos({ nextTypes: types, variants: rows }))).toEqual(["SKU-0", "SKU-1", "SKU-2", "SKU-3"]);
  });

  it("does not bring back a removed combination on page load", () => {
    const rows = fromDb(rowsFor([color, size])).filter((row) => row.sku !== "SKU-3");
    const types = reconstructVariantTypesFromVariants(rows);
    expect(skus(reconcileCombos({ nextTypes: types, variants: rows }))).toEqual(["SKU-0", "SKU-1", "SKU-2"]);
    expect(missingComboCount(types, rows.length)).toBe(1);
  });

  it("removing a value drops its rows only, and the others keep their own price (they used to shift)", () => {
    const rows = rowsFor([color, size]);
    const next = [type("c", "Color", ["Blue"]), size];
    const result = reconcileCombos({ prevTypes: [color, size], nextTypes: next, variants: rows });
    expect(skus(result)).toEqual(["SKU-2", "SKU-3"]);
    expect(result.map((row) => row.valueIndexes)).toEqual([
      [0, 0],
      [0, 1],
    ]);
  });

  it("adding a value adds its combinations and keeps a removed one removed", () => {
    const rows = rowsFor([color, size]).filter((row) => row.sku !== "SKU-3");
    const next = [type("c", "Color", ["Red", "Blue", "Green"]), size];
    expect(skus(reconcileCombos({ prevTypes: [color, size], nextTypes: next, variants: rows }))).toEqual([
      "SKU-0",
      "SKU-1",
      "SKU-2",
      "new",
      "new",
    ]);
  });

  it("renaming a value keeps its rows", () => {
    const rows = rowsFor([color]);
    const next = [type("c", "Color", ["Crimson", "Blue"])];
    expect(skus(reconcileCombos({ prevTypes: [color], nextTypes: next, variants: rows }))).toEqual(["SKU-0", "SKU-1"]);
  });

  it("adding an option keeps rows on its first value", () => {
    const rows = rowsFor([color]);
    expect(skus(reconcileCombos({ prevTypes: [color], nextTypes: [color, size], variants: rows }))).toEqual(["SKU-0", "new", "SKU-1", "new"]);
  });

  it("removing an option merges rows and keeps the default", () => {
    const rows = rowsFor([color, size]);
    const result = reconcileCombos({ prevTypes: [color, size], nextTypes: [size], variants: rows });
    expect(skus(result)).toEqual(["SKU-0", "SKU-1"]);
  });

  it("an option with no values yet changes nothing", () => {
    const rows = rowsFor([color]);
    const empty = type("s", "Size", []);
    expect(skus(reconcileCombos({ prevTypes: [color], nextTypes: [color, empty], variants: rows }))).toEqual(["SKU-0", "SKU-1"]);
  });

  it("restore adds back what was removed", () => {
    const rows = rowsFor([color, size]).filter((row) => row.sku !== "SKU-3");
    expect(skus(reconcileCombos({ nextTypes: [color, size], variants: rows, fillMissing: true }))).toEqual(["SKU-0", "SKU-1", "SKU-2", "new"]);
  });

  it("no options means no rows", () => {
    expect(reconcileCombos({ prevTypes: [color], nextTypes: [], variants: rowsFor([color]) })).toEqual([]);
  });
});
