import type { VendorProduct } from "@/app/(main)/products/_components/vendor-products.section";

/**
 * The vendor product sheet contract, shared by Export and Download Template.
 *
 * Every header here normalises (lowercase, spaces stripped) to a key that
 * `bulkUploadProductsAction`'s `headerMap` already accepts, so an exported
 * sheet can be edited and imported straight back. Note the importer's key is
 * `isactive`, not `status` — hence "Is Active".
 */
export const PRODUCT_EXCEL_COLUMNS = [
  "Title",
  "SKU",
  "Description",
  "Category",
  "Brand",
  "Quantity",
  "Base Price",
  "List Price",
  "Final Price",
  "Images",
  "Condition",
  "Is Active",
] as const;

export type ProductExcelColumn = (typeof PRODUCT_EXCEL_COLUMNS)[number];
export type ProductExcelRow = Record<ProductExcelColumn, string | number>;

/** A single filled example row so vendors can see the expected shape. */
export const PRODUCT_EXCEL_TEMPLATE_ROW: ProductExcelRow = {
  Title: "Jsdoin Portable Handheld Fan, 5 Speeds, LED Display",
  SKU: "PROD_132",
  Description:
    "Portable Jsdoin fan with 5 speeds, a rechargeable 5000mAh battery and foldable design.",
  Category: "Fans",
  Brand: "Jsdoin",
  Quantity: 17,
  "Base Price": 300,
  "List Price": 300,
  "Final Price": 150,
  Images: "https://example.com/images/fan-main.jpg",
  Condition: "new",
  "Is Active": "true",
};

const toNumber = (value: string | number | null | undefined) => {
  if (value == null) return "";
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : "";
};

export function productsToExcelRows(
  products: VendorProduct[]
): ProductExcelRow[] {
  return products.map((product) => ({
    Title: product.title ?? "",
    SKU: product.sku ?? "",
    Description: product.description ?? "",
    Category: product.category?.name ?? "",
    Brand: product.brand?.name ?? "",
    Quantity: product.quantity ?? 0,
    "Base Price": toNumber(product.basePrice),
    "List Price": toNumber(product.basePrice),
    "Final Price": toNumber(product.salePrice ?? product.basePrice),
    // The importer splits on `;` — keep one separator, no spaces.
    Images: (product.images ?? []).join(";"),
    Condition: product.condition ?? "new",
    "Is Active": product.status === "active" ? "true" : "false",
  }));
}

/**
 * Builds an .xlsx client-side and hands it to the browser. SheetJS is pulled
 * in dynamically so it stays out of the products page bundle until a vendor
 * actually clicks Export or Download Template.
 */
export async function downloadXlsx(
  rows: Record<string, string | number>[],
  options: {
    fileName: string;
    sheetName?: string;
    header?: readonly string[];
  }
) {
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: options.header ? [...options.header] : undefined,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    options.sheetName ?? "Products"
  );

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = options.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export const todayStamp = () => new Date().toISOString().split("T")[0];
