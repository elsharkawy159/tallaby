import { describe, expect, it } from "vitest";
import type { ProductVariant } from "@/components/product-page/product-page.lib";
import { findSizeVariant, readSavedMeasurements, saveMeasurements } from "./size-finder.lib";

const v = (id: string, color: string, size: string, stock = 5) =>
  ({ id, title: `${color} / ${size}`, option1: `Color: ${color}`, option2: `Size: ${size}`, option3: null, stock, localized: null, images: null }) as unknown as ProductVariant;

const product = (variants: ProductVariant[]) => ({ trackStock: true, productVariants: variants }) as never;

describe("findSizeVariant", () => {
  const variants = [v("bk-l", "Black", "L"), v("bk-xxl", "Black", "XXL"), v("rd-l", "Red", "L"), v("rd-xxl", "Red", "XXL")];

  it("keeps the shopper's colour and picks the recommended size (2XL = XXL)", () => {
    expect(findSizeVariant(product(variants), "en", "2XL", "rd-l")).toEqual({ variantId: "rd-xxl", selected: false });
    expect(findSizeVariant(product(variants), "en", "l", "rd-l")).toEqual({ variantId: "rd-l", selected: true });
  });

  it("returns null when no variant value is that size", () => {
    expect(findSizeVariant(product(variants), "en", "M", "rd-l")).toBeNull();
    expect(findSizeVariant(product([]), "en", "M", null)).toBeNull();
  });

  it("matches a product listed by plain variant titles", () => {
    const plain = [
      { id: "a", title: "40", option1: null, option2: null, option3: null, stock: 1, localized: null, images: null },
      { id: "b", title: "41", option1: null, option2: null, option3: null, stock: 1, localized: null, images: null },
    ] as unknown as ProductVariant[];
    expect(findSizeVariant(product(plain), "en", "41", "a")).toEqual({ variantId: "b", selected: false });
  });
});

describe("saved measurements", () => {
  it("round-trips finite numbers per store and survives a broken storage", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, val: string) => void store.set(k, val) };
    saveMeasurements("s1", { height: 170, weight: Number.NaN }, storage);
    expect(readSavedMeasurements("s1", storage)).toEqual({ height: 170 });
    expect(readSavedMeasurements("s2", storage)).toEqual({});
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(readSavedMeasurements("s1", broken)).toEqual({});
    expect(() => saveMeasurements("s1", { height: 1 }, broken)).not.toThrow();
    store.set("tallaby:size-finder:s3", "{bad json");
    expect(readSavedMeasurements("s3", storage)).toEqual({});
  });
});
