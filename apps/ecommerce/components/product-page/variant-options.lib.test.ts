import { describe, expect, it } from "vitest";
import type { ProductVariant } from "./product-page.lib";
import { buildVariantMatrix, countPieces, pickVariant, resolvePieces, selectedKeys, valueAvailable, variantSummary } from "./variant-options.lib";

const v = (id: string, color: string, size: string, stock = 5) =>
  ({ id, title: `${color} / ${size}`, option1: `Color: ${color}`, option2: `Size: ${size}`, option3: null, stock, localized: null, images: null }) as unknown as ProductVariant;

const variants = [v("bk-l", "Black", "L"), v("bk-2xl", "Black", "2XL"), v("rd-l", "Red", "L"), v("rd-2xl", "Red", "2XL", 0)];
const product = { trackStock: true, productVariants: variants } as never;

describe("buildVariantMatrix", () => {
  it("splits the variants into one group per option, each value once", () => {
    const m = buildVariantMatrix(variants, "en");
    expect(m.groups.map((g) => g.name)).toEqual(["Color", "Size"]);
    expect(m.groups[0]!.values.map((x) => x.label)).toEqual(["Black", "Red"]);
    expect(m.groups[0]!.isColor).toBe(true);
    expect(m.groups[1]!.values.map((x) => x.label)).toEqual(["L", "2XL"]);
    expect(m.groups[1]!.isColor).toBe(false);
  });

  it("puts sizes in size order", () => {
    const sized = (sizes: string[]) => buildVariantMatrix(sizes.map((s, i) => v(`v${i}`, "Black", s)), "en").groups[1]!.values.map((x) => x.label);
    expect(sized(["12", "16", "8", "10"])).toEqual(["8", "10", "12", "16"]);
    expect(sized(["2XL", "S", "XL", "M"])).toEqual(["S", "M", "XL", "2XL"]);
    expect(sized(["Big", "Small"])).toEqual(["Big", "Small"]);
  });

  it("has no groups when two variants share the same values", () => {
    expect(buildVariantMatrix([v("a", "Black", "L"), v("b", "Black", "L")], "en").groups).toEqual([]);
  });
});

describe("picking", () => {
  const m = buildVariantMatrix(variants, "en");

  it("greys out a size the picked colour has none of", () => {
    const red = selectedKeys(m, "rd-l");
    expect(valueAvailable(product, m, red, 1, "2xl")).toBe(false);
    expect(valueAvailable(product, m, red, 1, "l")).toBe(true);
    // The first group only needs one in-stock variant with the value.
    expect(valueAvailable(product, m, red, 0, "black")).toBe(true);
  });

  it("keeps the other picks when it can", () => {
    expect(pickVariant(product, m, selectedKeys(m, "bk-2xl"), 0, "red")).toBe("rd-l");
    expect(pickVariant(product, m, selectedKeys(m, "bk-l"), 0, "red")).toBe("rd-l");
    expect(pickVariant(product, m, selectedKeys(m, "bk-l"), 1, "2xl")).toBe("bk-2xl");
  });

  it("names a variant by its values", () => {
    expect(variantSummary(m, variants[1]!)).toBe("Black / 2XL");
  });
});

describe("pieces", () => {
  it("copies the piece before for every piece not changed", () => {
    expect(resolvePieces("bk-2xl", [], 3)).toEqual(["bk-2xl", "bk-2xl"]);
    expect(resolvePieces("bk-2xl", [undefined, "rd-l"], 4)).toEqual(["bk-2xl", "rd-l", "rd-l"]);
    expect(resolvePieces("bk-2xl", ["rd-l"], 1)).toEqual([]);
  });

  it("groups the pieces into cart lines", () => {
    expect(countPieces(["bk-2xl", "bk-2xl", "rd-l"])).toEqual([
      { variantId: "bk-2xl", quantity: 2 },
      { variantId: "rd-l", quantity: 1 },
    ]);
  });
});
