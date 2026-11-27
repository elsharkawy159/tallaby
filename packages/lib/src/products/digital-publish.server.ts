import { and, db, digitalFiles, digitalProducts, eq, inArray, isNotNull, ne, or, products } from "@workspace/db";
import { digitalIdsWithoutFiles } from "./digital-publish.lib";

export { DIGITAL_FILE_REQUIRED, digitalIdsWithoutFiles } from "./digital-publish.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

/** Ids per query; a bulk publish sends at most a few thousand. */
const CHUNK = 500;

/**
 * The seller's DIGITAL products among `productIds` that have no file yet
 * (F-108b), so must not become `active`. Two batched queries per 500 ids,
 * whatever the count: the seller's digital products among them, then which of
 * those have a `digital_files` row or a legacy `digital_products.file_url`.
 * Physical products, other sellers' products and unknown ids are never returned.
 */
export async function digitalProductsWithoutFiles(sellerId: string, productIds: readonly string[], q: Queryable = db): Promise<Set<string>> {
  const ids = [...new Set(productIds.filter((id) => typeof id === "string" && id))];
  const out = new Set<string>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const digital = await q
      .select({ id: products.id })
      .from(products)
      .where(and(inArray(products.id, chunk), eq(products.sellerId, sellerId), eq(products.productType, "digital")));
    if (!digital.length) continue;
    const digitalIds = digital.map((row) => row.id);
    const withFile = await q
      .selectDistinct({ productId: digitalProducts.productId })
      .from(digitalProducts)
      .leftJoin(digitalFiles, eq(digitalFiles.digitalProductId, digitalProducts.id))
      .where(
        and(
          inArray(digitalProducts.productId, digitalIds),
          eq(digitalProducts.sellerId, sellerId),
          or(isNotNull(digitalFiles.id), and(isNotNull(digitalProducts.fileUrl), ne(digitalProducts.fileUrl, ""))),
        ),
      );
    for (const id of digitalIdsWithoutFiles(digitalIds, withFile.map((row) => row.productId))) out.add(id);
  }
  return out;
}
