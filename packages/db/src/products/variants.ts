import { and, eq, inArray } from "drizzle-orm";
import { productVariants } from "../drizzle/schema";
import type { db as dbType } from "../drizzle/database";

/** The transaction callback's `tx` parameter type, derived from db.transaction itself. */
type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

export type VariantWriteValues = Omit<
  Partial<typeof productVariants.$inferInsert>,
  "id" | "productId" | "createdAt" | "updatedAt"
>;

export type VariantWriteInput = VariantWriteValues & { id?: string | null };

export type ExistingVariantRow = typeof productVariants.$inferSelect;

const normalizeSku = (sku: string | null | undefined) =>
  (sku ?? "").trim().toLowerCase();

/**
 * Reconciles a product's variants with an edited list IN PLACE instead of
 * delete-all + re-insert.
 *
 * Variant ids are referenced from outside this table — storefront pages
 * (cached and already open in shoppers' browsers), cart_items.variant,
 * wishlist_items and order_items — so re-creating every row on each save
 * minted fresh ids and broke all of those ("Variant not found" on add to
 * cart). Here an incoming row keeps its identity when it carries a known id,
 * or failing that, when its SKU matches an existing variant; only genuinely
 * new rows are inserted and only rows missing from the list are deleted.
 *
 * Only the keys present on each input row are written, so a caller that
 * doesn't manage a column (e.g. the admin form and `localized`) leaves it
 * untouched on existing variants.
 */
export async function syncProductVariants(
  tx: Tx,
  productId: string,
  rows: readonly VariantWriteInput[]
): Promise<void> {
  const existing = await tx
    .select({ id: productVariants.id, sku: productVariants.sku })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  const unmatched = new Map(existing.map((row) => [row.id, row]));
  const now = new Date().toISOString();
  const toInsert: (typeof productVariants.$inferInsert)[] = [];

  for (const { id, ...values } of rows) {
    let targetId = id && unmatched.has(id) ? id : undefined;
    if (!targetId && values.sku) {
      const sku = normalizeSku(values.sku);
      targetId = [...unmatched.values()].find(
        (row) => normalizeSku(row.sku) === sku
      )?.id;
    }

    if (targetId) {
      unmatched.delete(targetId);
      await tx
        .update(productVariants)
        .set({ ...values, updatedAt: now })
        .where(
          and(
            eq(productVariants.id, targetId),
            eq(productVariants.productId, productId)
          )
        );
    } else {
      toInsert.push({ ...values, productId });
    }
  }

  if (unmatched.size > 0) {
    await tx
      .delete(productVariants)
      .where(
        and(
          eq(productVariants.productId, productId),
          inArray(productVariants.id, [...unmatched.keys()])
        )
      );
  }

  if (toInsert.length > 0) {
    await tx.insert(productVariants).values(toInsert);
  }
}
