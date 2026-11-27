import type { SQL } from "drizzle-orm";
import { and, asc, db, digitalFiles, digitalProducts, eq, products } from "@workspace/db";
import type { ProductDigitalState } from "./digital-files.dto";

/**
 * The edit form's product type and file list (F-108a). Callers pass the
 * session seller's id and the checked page store's `inStore` condition
 * (`loadProductStorePage`); a product outside the store reads as physical with
 * no files. Only names, sizes and storage paths are returned, never a link.
 */
export async function loadProductDigital(sellerId: string, productId: string, inStore: SQL): Promise<ProductDigitalState> {
  const [product] = await db
    .select({ productType: products.productType })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.sellerId, sellerId), inStore))
    .limit(1);
  if (!product || product.productType !== "digital") return { productType: "physical", files: [] };

  const owners = await db
    .select({ id: digitalProducts.id })
    .from(digitalProducts)
    .where(and(eq(digitalProducts.productId, productId), eq(digitalProducts.sellerId, sellerId)))
    .orderBy(asc(digitalProducts.createdAt));
  const main = owners[0];
  if (!main) return { productType: "digital", files: [] };

  const rows = await db
    .select({ path: digitalFiles.fileUrl, name: digitalFiles.fileName, size: digitalFiles.fileSize, type: digitalFiles.fileType })
    .from(digitalFiles)
    .where(eq(digitalFiles.digitalProductId, main.id))
    .orderBy(asc(digitalFiles.sortOrder), asc(digitalFiles.createdAt));
  return { productType: "digital", files: rows };
}
