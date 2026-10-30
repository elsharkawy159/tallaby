/**
 * Update products from Excel (ROADMAP.md F-24c). The seller downloads the
 * update sheet (one row per product and one per variant, with their ids),
 * edits prices, sale prices, stock, status or SKU, and uploads it back. The
 * server matches each row to the seller's own products (by id or SKU), shows
 * a preview, then applies every change in one transaction.
 *
 * The client sends only the file; every value written is parsed and checked
 * on the server against rows it reads scoped by the session's seller.
 */

/** Most rows one upload may hold (products plus variants). */
export const EXCEL_UPDATE_MAX_ROWS = 3000;
/** Server actions accept 1 MB bodies; a 3000-row sheet is far below this. */
export const EXCEL_UPDATE_MAX_BYTES = 900 * 1024;
/** Same cap as the bulk edit's prices (pounds). */
export const EXCEL_UPDATE_MAX_PRICE = 1_000_000;
export const EXCEL_UPDATE_MAX_STOCK = 1_000_000;
export const EXCEL_UPDATE_SKU_MAX = 100;

export const EXCEL_UPDATE_COLUMNS = [
  "productId",
  "variantId",
  "title",
  "variant",
  "sku",
  "price",
  "salePrice",
  "stock",
  "status",
] as const;
export type ExcelUpdateColumn = (typeof EXCEL_UPDATE_COLUMNS)[number];

/** Why a sheet row is left out. Labels live under `excelUpdate.skip`. */
export type ExcelSkipReason =
  | "noKey"
  | "badId"
  | "notFound"
  | "inTrash"
  | "ambiguousSku"
  | "duplicateRow"
  | "variantMismatch"
  | "invalidPrice"
  | "invalidSalePrice"
  | "saleAboveRegular"
  | "noPrice"
  | "invalidStock"
  | "invalidStatus"
  | "invalidSku"
  | "skuTaken"
  | "rejected"
  | "needsImage"
  | "cannotPublish";

export type ExcelPreviewField = "price" | "salePrice" | "stock" | "status" | "sku";

export type ExcelPreviewLine = {
  field: ExcelPreviewField;
  before: string | number | null;
  after: string | number | null;
};

export type ExcelPreviewRow = {
  /** The sheet row number (header is row 1). */
  row: number;
  title: string;
  /** Variant title, or null for a product row. */
  variant: string | null;
  outcome: "change" | "skip";
  reason?: ExcelSkipReason;
  lines: ExcelPreviewLine[];
};

export type ExcelActionError =
  | "unauthorized"
  | "readOnly"
  | "noFile"
  | "tooBig"
  | "badFile"
  | "noRows"
  | "tooManyRows"
  | "missingColumns"
  | "generic";

export type ExcelPreviewResult =
  | {
      success: true;
      /** Rows that change or are skipped ("same" rows are only counted). */
      rows: ExcelPreviewRow[];
      changeCount: number;
      sameCount: number;
      skipCount: number;
      /** Distinct products that will change. */
      productCount: number;
    }
  | { success: false; error: ExcelActionError };

export type ExcelApplyResult =
  | { success: true; changedRows: number; changedProducts: number; skipped: number }
  | { success: false; error: ExcelActionError };

export type ExcelExportResult =
  | {
      success: true;
      header: string[];
      rows: Record<string, string | number>[];
      productCount: number;
      /** True when the sheet stops before every product (row cap). */
      truncated: boolean;
    }
  | { success: false; error: ExcelActionError };
