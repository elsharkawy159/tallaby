import { describe, expect, it } from "vitest";
import {
  PRODUCT_EXCEL_COLUMNS,
  PRODUCT_EXCEL_TEMPLATE_ROW,
  productsToExcelRows,
} from "./product-excel";
import {
  normalizeHeaderKey,
  PRODUCT_IMPORT_HEADER_MAP,
} from "./product-import-headers";

describe("product excel sheet contract", () => {
  it("every exported header is one the importer accepts", () => {
    const unsupported = PRODUCT_EXCEL_COLUMNS.filter(
      (header) => !(normalizeHeaderKey(header) in PRODUCT_IMPORT_HEADER_MAP)
    );

    // If this fails, Export and Download Template produce sheets that Import
    // silently drops columns from. Add an alias in product-import-headers.ts.
    expect(unsupported).toEqual([]);
  });

  it("the template row fills every column", () => {
    expect(Object.keys(PRODUCT_EXCEL_TEMPLATE_ROW).sort()).toEqual(
      [...PRODUCT_EXCEL_COLUMNS].sort()
    );
  });

  it("maps a product row to the sheet shape", () => {
    const [row] = productsToExcelRows([
      {
        id: "p1",
        title: "Portable Fan",
        sku: "PROD_1",
        description: "A fan.",
        images: ["a.jpg", "b.jpg"],
        status: "active",
        condition: "new",
        quantity: 7,
        basePrice: "300.00",
        salePrice: "150.00",
        brand: { name: "Jsdoin" },
        category: { name: "Fans" },
      },
    ]);

    expect(row).toMatchObject({
      Title: "Portable Fan",
      SKU: "PROD_1",
      Category: "Fans",
      Brand: "Jsdoin",
      Quantity: 7,
      "Base Price": 300,
      "Final Price": 150,
      Condition: "new",
      "Is Active": "true",
    });
    // The importer splits image cells on [;,.\n] — a single `;` is the only
    // separator that survives round-tripping.
    expect(row!.Images).toBe("a.jpg;b.jpg");
  });

  it("marks non-active products as inactive", () => {
    const [row] = productsToExcelRows([
      { id: "p2", title: "Draft", status: "draft" },
    ]);
    expect(row!["Is Active"]).toBe("false");
  });
});
