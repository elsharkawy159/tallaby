import { describe, expect, it } from "vitest";
import {
  EXCEL_UPDATE_HEADERS,
  applySheetPrice,
  buildUpdateSheet,
  hasRequiredColumns,
  mapHeaders,
  matchRow,
  buildCatalogIndex,
  parseMoney,
  parseSheetRows,
  parseStatus,
  parseStock,
  planExcelUpdate,
  previewFromPlan,
  type CatalogProduct,
  type ParsedSheetRow,
} from "./excel-update.lib";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const P3 = "33333333-3333-4333-8333-333333333333";
const V1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const V2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function product(over: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: P1,
    title: "Mug",
    sku: "MUG-1",
    status: "active",
    images: ["a.jpg"],
    quantity: 5,
    price: { base: 200, list: 200, final: 150, discountType: "amount", discountValue: 50 },
    state: "live",
    variants: [],
    ...over,
  };
}

function row(over: Partial<ParsedSheetRow> = {}): ParsedSheetRow {
  return {
    row: 2,
    productId: null,
    variantId: null,
    sku: null,
    title: "",
    variant: null,
    price: null,
    salePrice: null,
    stock: null,
    status: null,
    ...over,
  };
}

const ctx = { canPublish: true };

describe("headers", () => {
  it("maps English and Arabic headers (and aliases) to columns", () => {
    const en = mapHeaders(Object.values(EXCEL_UPDATE_HEADERS.en));
    const ar = mapHeaders(Object.values(EXCEL_UPDATE_HEADERS.ar));
    expect([...en.values()].sort()).toEqual([...ar.values()].sort());
    expect(en.size).toBe(9);
    expect(mapHeaders(["  product id ", "Quantity", "Final Price"]).get("Quantity")).toBe("stock");
  });

  it("needs a key column and a value column", () => {
    expect(hasRequiredColumns(["productId", "price"])).toBe(true);
    expect(hasRequiredColumns(["sku"])).toBe(true);
    expect(hasRequiredColumns(["price", "stock"])).toBe(false);
    expect(hasRequiredColumns(["productId", "title"])).toBe(false);
  });
});

describe("cells", () => {
  it("parses money to piastres, Arabic digits and currency included", () => {
    expect(parseMoney(150)).toBe(15000);
    expect(parseMoney("1,250.5")).toBe(125050);
    expect(parseMoney("١٢٠ ج.م")).toBe(12000);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBe("invalid");
    expect(parseMoney(-1)).toBe("invalid");
    expect(parseMoney(2_000_000)).toBe("invalid");
    expect(parseMoney(0.1 + 0.2)).toBe(30);
  });

  it("parses whole stock only", () => {
    expect(parseStock("12")).toBe(12);
    expect(parseStock(3.5)).toBe("invalid");
    expect(parseStock(-2)).toBe("invalid");
    expect(parseStock(" ")).toBeNull();
  });

  it("parses status words in both languages", () => {
    expect(parseStatus("Active")).toBe("active");
    expect(parseStatus("منشور")).toBe("active");
    expect(parseStatus("مسودة")).toBe("draft");
    expect(parseStatus("موقوف")).toBe("rejected");
    expect(parseStatus("maybe")).toBe("invalid");
  });

  it("drops empty rows and numbers rows from 2", () => {
    const headers = mapHeaders(["Product ID", "Price"]);
    const rows = parseSheetRows([{ "Product ID": "", Price: "" }, { "Product ID": P1, Price: 10 }], headers);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ row: 3, productId: P1, price: 1000 });
    expect(parseSheetRows([{ "Product ID": "nope", Price: 1 }], headers)[0]!.productId).toBe("invalid");
  });
});

describe("matching", () => {
  const variant = { id: V1, title: "Red", sku: "MUG-RED", price: null, stock: 2, discountEndsAt: null };
  const catalog = [
    product({ variants: [variant] }),
    product({ id: P2, sku: "TRASHED", state: "trashed" }),
    product({ id: P3, sku: "SHARED", variants: [{ ...variant, id: V2, sku: "SHARED" }] }),
  ];
  const index = buildCatalogIndex(catalog);

  it("matches by variant id, product id or SKU (any case)", () => {
    expect(matchRow(row({ variantId: V1 }), index)).toMatchObject({ kind: "variant", by: "id" });
    expect(matchRow(row({ productId: P1 }), index)).toMatchObject({ kind: "product", by: "id" });
    expect(matchRow(row({ sku: " mug-1 " }), index)).toMatchObject({ kind: "product", by: "sku" });
    expect(matchRow(row({ sku: "MUG-RED" }), index)).toMatchObject({ kind: "variant", by: "sku" });
  });

  it("prefers the product when a variant repeats its SKU", () => {
    expect(matchRow(row({ sku: "SHARED" }), index)).toMatchObject({ kind: "product", product: { id: P3 } });
  });

  it("skips trashed, unknown, mismatched and keyless rows", () => {
    expect(matchRow(row({ productId: P2 }), index)).toEqual({ kind: "skip", reason: "inTrash" });
    expect(matchRow(row({ sku: "trashed" }), index)).toEqual({ kind: "skip", reason: "inTrash" });
    expect(matchRow(row({ sku: "NOPE" }), index)).toEqual({ kind: "skip", reason: "notFound" });
    expect(matchRow(row({ variantId: V1, productId: P3 }), index)).toEqual({ kind: "skip", reason: "variantMismatch" });
    expect(matchRow(row({ productId: "invalid" }), index)).toEqual({ kind: "skip", reason: "badId" });
    expect(matchRow(row({}), index)).toEqual({ kind: "skip", reason: "noKey" });
  });

  it("calls a SKU shared by two variants ambiguous", () => {
    const twin = buildCatalogIndex([
      product({ sku: null, variants: [{ ...variant, sku: "X" }] }),
      product({ id: P2, sku: null, variants: [{ ...variant, id: V2, sku: "X" }] }),
    ]);
    expect(matchRow(row({ sku: "x" }), twin)).toEqual({ kind: "skip", reason: "ambiguousSku" });
  });
});

describe("prices", () => {
  it("changes the regular and sale price and keeps an amount discount", () => {
    const out = applySheetPrice({ base: 200, list: 200, final: 150, discountType: "amount", discountValue: 50 }, 30000, 25000);
    expect(out).toMatchObject({ next: { base: 300, list: 300, final: 250, discountType: "amount", discountValue: 50 } });
  });

  it("keeps a percent discount that still matches", () => {
    const out = applySheetPrice({ list: 200, final: 180, discountType: "percent", discountValue: 10 }, 30000, 27000);
    expect(out).toMatchObject({ next: { final: 270, discountType: "percent", discountValue: 10 } });
  });

  it("removes the discount for sale price 0 or equal to the price", () => {
    const price = { list: 200, final: 150, discountType: "amount", discountValue: 50, discountEndsAt: "2026-12-01T00:00:00.000Z" };
    const out = applySheetPrice(price, null, 0);
    expect(out).toMatchObject({ next: { list: 200, final: 200, discountType: null, discountValue: null, discountEndsAt: null }, removedDiscount: true });
    expect(applySheetPrice(price, 20000, 20000)).toMatchObject({ removedDiscount: true });
  });

  it("follows the price when there was no discount and only the price changes", () => {
    expect(applySheetPrice({ list: 100, final: 100 }, 12000, null)).toMatchObject({ next: { list: 120, final: 120 } });
  });

  it("refuses a sale price above the price, and a sale without any price", () => {
    expect(applySheetPrice({ list: 100, final: 100 }, null, 15000)).toEqual({ fail: "saleAboveRegular" });
    expect(applySheetPrice(null, null, 5000)).toEqual({ fail: "noPrice" });
  });

  it("reports unchanged prices as the same", () => {
    expect(applySheetPrice({ base: 200, list: 200, final: 150 }, 20000, 15000)).toEqual({ same: true });
  });
});

describe("planExcelUpdate", () => {
  const variant = { id: V1, title: "Red", sku: "MUG-RED", price: { list: 100, final: 100 }, stock: 2, discountEndsAt: null };

  it("plans product and variant rows into one write per product", () => {
    const plan = planExcelUpdate(
      [row({ row: 2, productId: P1, stock: 9, status: "draft" }), row({ row: 3, variantId: V1, price: 12000, stock: 4 })],
      [product({ variants: [variant] })],
      ctx,
    );
    expect(plan.edits).toHaveLength(1);
    expect(plan.edits[0]!.after).toEqual({
      quantity: 9,
      status: "draft",
      variants: [{ id: V1, price: { list: 120, base: 120, final: 120, discountType: null, discountValue: null }, stock: 4 }],
    });
    expect(plan.edits[0]!.before).toMatchObject({ quantity: 5, status: "active", variants: [{ id: V1, stock: 2 }] });
    const preview = previewFromPlan(plan);
    expect(preview).toMatchObject({ changeCount: 2, sameCount: 0, skipCount: 0, productCount: 1 });
    expect(preview.rows[0]!.lines).toEqual([
      { field: "stock", before: 5, after: 9 },
      { field: "status", before: "active", after: "draft" },
    ]);
  });

  it("counts unchanged rows as the same and writes nothing", () => {
    const plan = planExcelUpdate([row({ productId: P1, price: 20000, salePrice: 15000, stock: 5, status: "active", sku: "MUG-1" })], [product()], ctx);
    expect(plan.edits).toHaveLength(0);
    expect(previewFromPlan(plan)).toMatchObject({ sameCount: 1, changeCount: 0 });
  });

  it("follows the Publish switch rules", () => {
    const draft = product({ status: "draft" });
    expect(planExcelUpdate([row({ productId: P1, status: "active" })], [draft], { canPublish: false }).rows[0]).toMatchObject({ reason: "cannotPublish" });
    expect(planExcelUpdate([row({ productId: P1, status: "active" })], [{ ...draft, images: [] }], ctx).rows[0]).toMatchObject({ reason: "needsImage" });
    expect(planExcelUpdate([row({ productId: P1, status: "draft" })], [product({ status: "rejected" })], ctx).rows[0]).toMatchObject({ reason: "rejected" });
    // A legacy "pending" product reads as draft: "draft" leaves it alone.
    expect(planExcelUpdate([row({ productId: P1, status: "draft" })], [product({ status: "pending" })], ctx).rows[0]).toMatchObject({ outcome: "same" });
  });

  it("skips bad cells, duplicates and taken SKUs, row by row", () => {
    const plan = planExcelUpdate(
      [
        row({ row: 2, productId: P1, price: "invalid" }),
        row({ row: 3, productId: P1, stock: 1 }),
        row({ row: 4, productId: P1, stock: 2 }),
        row({ row: 5, productId: P3, sku: "MUG-1" }),
        row({ row: 6, productId: P3, price: 0 }),
        row({ row: 7, productId: P3, stock: "invalid" }),
      ],
      [product(), product({ id: P3, sku: "OTHER" })],
      ctx,
    );
    // A product belongs to its first row, even when that row is skipped: later rows are duplicates.
    expect(plan.edits).toHaveLength(0);
    expect(plan.rows.map((r) => (r.outcome === "skip" ? r.reason : r.outcome))).toEqual([
      "invalidPrice",
      "duplicateRow",
      "duplicateRow",
      "skuTaken",
      "duplicateRow",
      "duplicateRow",
    ]);
  });

  it("changes a SKU only on rows found by id, and frees the old one", () => {
    const plan = planExcelUpdate(
      [row({ row: 2, productId: P1, sku: "NEW" }), row({ row: 3, productId: P3, sku: "MUG-1" })],
      [product(), product({ id: P3, sku: "OTHER" })],
      ctx,
    );
    expect(plan.edits.map((e) => e.after.sku)).toEqual(["NEW", "MUG-1"]);
  });

  it("clears a variant's discount end date when its discount is removed", () => {
    const discounted = { ...variant, price: { list: 100, final: 80, discountType: "amount", discountValue: 20 }, discountEndsAt: "2026-12-01T00:00:00.000Z" };
    const plan = planExcelUpdate([row({ variantId: V1, salePrice: 0 })], [product({ variants: [discounted] })], ctx);
    expect(plan.edits[0]!.after.variants![0]).toMatchObject({ discountEndsAt: null });
  });
});

describe("buildUpdateSheet", () => {
  it("writes a product row then its variant rows, in the seller's language", () => {
    const sheet = buildUpdateSheet(
      [product({ variants: [{ id: V1, title: "Red", sku: "R", price: null, stock: 3, discountEndsAt: null }] }), product({ id: P2, state: "trashed" })],
      "ar",
      100,
    );
    expect(sheet.header[0]).toBe("رقم المنتج");
    expect(sheet.productCount).toBe(1);
    expect(sheet.rows).toHaveLength(2);
    expect(sheet.rows[0]).toMatchObject({ "رقم المنتج": P1, السعر: 200, "سعر الخصم": 150, الحالة: "منشور" });
    expect(sheet.rows[1]).toMatchObject({ "رقم النوع": V1, السعر: "", المخزون: 3 });
  });

  it("round-trips: an exported sheet parses back with no changes", () => {
    const catalog = [product({ variants: [{ id: V1, title: "Red", sku: "R", price: { list: 90, final: 90 }, stock: 3, discountEndsAt: null }] })];
    const sheet = buildUpdateSheet(catalog, "en", 100);
    const rows = parseSheetRows(sheet.rows, mapHeaders(sheet.header));
    const plan = planExcelUpdate(rows, catalog, ctx);
    expect(previewFromPlan(plan)).toMatchObject({ changeCount: 0, skipCount: 0, sameCount: 2 });
  });

  it("stops before the row cap without splitting a product", () => {
    const many = [product(), product({ id: P2, variants: [{ id: V1, title: "A", sku: null, price: null, stock: 1, discountEndsAt: null }] })];
    expect(buildUpdateSheet(many, "en", 2)).toMatchObject({ productCount: 1, truncated: true });
  });
});
