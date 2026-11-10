import { z } from "zod";

/**
 * Add many products from a file (PLAN.md AI-3): what the browser sends and what
 * the model returns. The browser reads the file; the server trusts none of it
 * and validates every row again. Cost rules: docs/ai.md.
 */

export const BULK_FEATURES = {
  /** Once per file, and only when the code can't read the headers itself. */
  map: "product_bulk_map",
  /** One call per page batch of a PDF. */
  pdf: "product_bulk_pdf",
  /** One call per batch of rows that need copy. */
  copy: "product_bulk_copy",
} as const;

/**
 * What one product costs when AI writes its copy. This is a default the owner
 * has not decided yet (ROADMAP.md §7), so it lives here alone. Rows that need
 * no AI cost nothing, and so do the mapping and reading a PDF.
 */
export const BULK_CREDITS_PER_AI_PRODUCT = 1;

export const BULK_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  maxProducts: 500,
  maxPdfPages: 20,
  /** Every PDF page is billed like an image, so a call reads a few at a time. */
  pdfPagesPerCall: 5,
  /** Under Vercel's 4.5 MB request body limit. */
  maxPdfChunkBytes: 4.4 * 1024 * 1024,
  /** Rows one PDF call may return (output is billed at six times the input). */
  maxRowsPerPdfCall: 60,
  maxColumns: 40,
  /** What the mapping call sees: headers and a few cut samples, never the sheet. */
  samplesPerColumn: 3,
  maxSampleChars: 60,
  maxHeaderChars: 60,
  /** Rows sent to the server, and to the model, at a time. */
  batchSize: 10,
  maxCellChars: 5000,
  /** Sheet row numbers the server accepts: the 500 products plus blank lines between them. */
  maxRowNumber: 20_000,
  maxImagesPerProduct: 3,
  maxVariantsPerProduct: 30,
  maxPrice: 10_000_000,
  maxStock: 1_000_000,
  maxSkuLength: 100,
  /** Characters of a seller's text the copy call reads for one row. */
  promptNameChars: 150,
  promptDescriptionChars: 400,
  promptHintChars: 60,
} as const;

/** The columns a file can fill. `cost` is read so it is never taken for the price; products have no cost field yet. */
export const BULK_FIELDS = [
  "name",
  "nameAr",
  "nameEn",
  "description",
  "descriptionAr",
  "descriptionEn",
  "price",
  "salePrice",
  "cost",
  "stock",
  "sku",
  "category",
  "brand",
  "images",
  "colors",
  "sizes",
] as const;
export type BulkField = (typeof BULK_FIELDS)[number];

/** Column index per field; null = not in this file. */
export type ColumnMapping = Record<BulkField, number | null>;

export type MappingSource = "template" | "dictionary" | "ai" | "fallback";

const cell = z.string().max(BULK_LIMITS.maxCellChars).optional();

/** One row after the mapping: still the seller's text, checked again on the server. */
export const mappedRowSchema = z
  .object({
    row: z.number().int().min(1).max(BULK_LIMITS.maxRowNumber),
    name: cell,
    nameAr: cell,
    nameEn: cell,
    description: cell,
    descriptionAr: cell,
    descriptionEn: cell,
    price: cell,
    salePrice: cell,
    cost: cell,
    stock: cell,
    sku: cell,
    category: cell,
    brand: cell,
    images: cell,
    colors: cell,
    sizes: cell,
  })
  .strict();
export type MappedRow = z.infer<typeof mappedRowSchema>;

export const FILE_KEY_PATTERN = /^[0-9a-f]{16,64}$/;

export const addBatchInputSchema = z
  .object({
    /** SHA-256 of the file, from the browser. It only ever names this seller's own SKUs. */
    fileKey: z.string().regex(FILE_KEY_PATTERN),
    source: z.enum(["sheet", "pdf"]),
    rows: z.array(mappedRowSchema).min(1).max(BULK_LIMITS.batchSize),
  })
  .strict();
export type AddBatchInput = z.infer<typeof addBatchInputSchema>;
export type BulkSource = AddBatchInput["source"];

export const columnSampleSchema = z
  .object({
    index: z.number().int().min(0).max(BULK_LIMITS.maxColumns),
    header: z.string().max(BULK_LIMITS.maxHeaderChars),
    samples: z.array(z.string().max(BULK_LIMITS.maxSampleChars)).max(BULK_LIMITS.samplesPerColumn),
  })
  .strict();
export type ColumnSample = z.infer<typeof columnSampleSchema>;

export const mapColumnsInputSchema = z
  .object({
    fileBytes: z.number().int().min(0),
    totalRows: z.number().int().min(0),
    columns: z.array(columnSampleSchema).min(1).max(BULK_LIMITS.maxColumns),
  })
  .strict();
export type MapColumnsInput = z.infer<typeof mapColumnsInputSchema>;

export const findExistingInputSchema = z
  .object({ skus: z.array(z.string().min(1).max(BULK_LIMITS.maxSkuLength)).max(BULK_LIMITS.maxProducts) })
  .strict();

/** Why a row can't be added. Labels: `bulkFileImport.problems.*`. */
export type BulkProblem = "noName" | "noPrice" | "badPrice" | "badSku" | "duplicateSku" | "duplicateRow" | "noCategory";

/** Why a product was saved as a draft, or what it lost. Labels: `bulkFileImport.notes.*`. */
export type BulkNote =
  | "noImage"
  | "imageFailed"
  | "imageNotHttps"
  | "noStock"
  /** The code isn't sure of the category: hidden until the seller checks it. */
  | "checkCategory"
  /** The name doesn't look like a product, or the AI's translation looks borrowed: hidden until checked. */
  | "checkName"
  | "saleIgnored"
  | "variantsIgnored"
  | "accountRestricted";

export type BulkOutcome =
  /** Saved and live. */
  | "live"
  /** Saved, hidden until the seller finishes it. */
  | "draft"
  /** Its SKU is already on this account (an earlier run of this file, or another product). */
  | "already"
  /** Not added; `problem` says why. */
  | "skipped"
  /** Something went wrong; a retry can add it. */
  | "failed"
  /** Not tried: credits or the daily limit ran out first. */
  | "remaining";

export type BulkRowResult = {
  row: number;
  outcome: BulkOutcome;
  sku?: string;
  title?: string;
  problem?: BulkProblem;
  notes?: BulkNote[];
  /** Saved: where the seller fixes it (`/stores/<storeId>/products/<id>/edit`). */
  productId?: string;
  /** The category it was saved under. */
  categoryName?: string;
  /** Already added: the product with this SKU is in Trash. */
  inTrash?: boolean;
};

export type BulkStop = "noCredits" | "dailyLimit" | "disabled";

export type BulkErrorCode =
  | "unauthorized"
  | "disabled"
  | "invalid"
  | "tooLarge"
  | "tooManyProducts"
  | "pdfTooLong"
  | "rateLimited"
  | "dailyLimit"
  | "busy"
  | "timeout"
  | "failed";

export type AddBatchResult =
  | {
      ok: true;
      results: BulkRowResult[];
      creditsUsed: number;
      /** Set when no more rows should be sent until the seller acts. */
      stop: BulkStop | null;
      /** Some rows failed for a reason a second try can fix. */
      retryable: boolean;
    }
  | { ok: false; error: BulkErrorCode };

export type BulkStatus =
  | {
      ok: true;
      aiEnabled: boolean;
      /** False before the USD switch: AI runs on the daily limit alone, like the autofill. */
      creditsLive: boolean;
      creditsLeft: number | null;
      /** AI calls left today; each writes up to `batchSize` products. */
      callsLeftToday: number;
    }
  | { ok: false; error: BulkErrorCode };

export type MapColumnsResult = { ok: true; mapping: ColumnMapping; source: MappingSource } | { ok: false; error: BulkErrorCode };

export type PdfChunkResponse = { ok: true; rows: Omit<MappedRow, "row">[] } | { ok: false; error: BulkErrorCode };

// Sent to Gemini as structured output: flat and nullable, only used fields, no
// enums (docs/ai.md). Every value is checked again in code after the call.

const columnIndex = z.number().int().nullable();

export const columnMappingOutputSchema = z.object({
  name: columnIndex.describe("Product name when one column holds it, whatever the language."),
  nameAr: columnIndex.describe("Only when there is a separate Arabic name column."),
  nameEn: columnIndex.describe("Only when there is a separate English name column."),
  description: columnIndex.describe("Product description when one column holds it."),
  descriptionAr: columnIndex.describe("Only when there is a separate Arabic description column."),
  descriptionEn: columnIndex.describe("Only when there is a separate English description column."),
  price: columnIndex.describe("The selling price a customer pays before any offer."),
  salePrice: columnIndex.describe("The lower offer or discounted price."),
  cost: columnIndex.describe("What the seller paid: cost, purchase or wholesale price. Never the selling price."),
  stock: columnIndex.describe("Quantity in stock."),
  sku: columnIndex.describe("The seller's item code, SKU or barcode."),
  category: columnIndex.describe("Category, department or product type."),
  brand: columnIndex.describe("Brand or manufacturer."),
  images: columnIndex.describe("Links to product photos."),
  colors: columnIndex.describe("Available colors."),
  sizes: columnIndex.describe("Available sizes."),
});
export type ColumnMappingOutput = z.infer<typeof columnMappingOutputSchema>;

const pdfValue = z.string().nullable();

export const pdfRowsOutputSchema = z.object({
  rows: z
    .array(
      z.object({
        name: pdfValue.describe("The product name exactly as written."),
        price: pdfValue.describe("The selling price exactly as written."),
        salePrice: pdfValue.describe("A lower offer price when shown. Else null."),
        stock: pdfValue.describe("Quantity when shown. Else null."),
        sku: pdfValue.describe("Item code when shown. Else null."),
        category: pdfValue.describe("The catalogue section or heading it sits under. Else null."),
        brand: pdfValue.describe("Brand when written. Else null."),
        description: pdfValue.describe("Its description as written, at most 300 characters. Else null."),
        colors: pdfValue.describe("Colors when listed, separated by commas. Else null."),
        sizes: pdfValue.describe("Sizes when listed, separated by commas. Else null."),
      }),
    )
    .describe("One entry per product on these pages, top to bottom. Empty when the pages list no products."),
});
export type PdfRowsOutput = z.infer<typeof pdfRowsOutputSchema>;

export const bulkCopyOutputSchema = z.object({
  products: z.array(
    z.object({
      row: z.number().int().describe("The row number given for this product."),
      titleAr: z.string().describe("Arabic product name, at most 120 characters. No price, no emojis."),
      titleEn: z.string().describe("English product name, at most 120 characters. No price, no emojis."),
      descriptionAr: z.string().describe("Arabic sales description, 1 or 2 short sentences, plain text."),
      descriptionEn: z.string().describe("English sales description, 1 or 2 short sentences, plain text."),
      bulletsAr: z.array(z.string()).describe("Up to 3 short Arabic feature lines. Empty if the input gives no facts."),
      bulletsEn: z.array(z.string()).describe("Up to 3 short English feature lines. Empty if the input gives no facts."),
      keywordsAr: z.array(z.string()).describe("5 Arabic search keywords, 1 to 3 words each."),
      keywordsEn: z.array(z.string()).describe("5 English search keywords, 1 to 3 words each."),
      categoryHint: z.string().nullable().describe("The product type in plain English, 1 to 4 words."),
    }),
  ),
});
export type BulkCopyOutput = z.infer<typeof bulkCopyOutputSchema>;
