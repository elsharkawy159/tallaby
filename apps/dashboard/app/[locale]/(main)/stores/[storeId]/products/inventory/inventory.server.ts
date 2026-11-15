"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateProductInventory } from "@workspace/cache";
import { and, db, eq, isNotNull, isNull, productVariants, products, sql } from "@workspace/db";
import { setStockContext } from "@workspace/db/inventory";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";
import { parseRestockInput } from "./inventory.lib";
import { STORE_PRODUCTS_PATTERN } from "@/lib/products/product-routes.lib";

/**
 * Quick restock on Products › Inventory (ROADMAP.md F-10c). Adds units to a
 * product without variants or to one tracked variant, atomically (`+ n`, no
 * read-then-write). The seller comes from the session; the page's store must be
 * the seller's and the product in it (F-87c: `productInStore`, scope
 * `managed`, in the same WHERE) and not in Trash; anything else is `notFound`. The 0125 trigger records the movement as an
 * 'edit' by the seller.
 */

export type RestockResult =
  | { success: true; stock: number }
  | { success: false; error: "invalidInput" | "notFound" | "unauthorized" | "readOnly" | "generic" };

function accessErrorCode(code: string): "readOnly" | "notFound" | "unauthorized" {
  if (code === "seller_blocked" || code === "store_read_only") return "readOnly";
  return code === "not_found" ? "notFound" : "unauthorized";
}

export async function restockAction(storeId: string, input: unknown): Promise<RestockResult> {
  try {
    const { seller, inStore } = await requireProductStore(storeId);
    const parsed = parseRestockInput(input);
    if (!parsed) return { success: false, error: "invalidInput" };
    const { productId, variantId, add } = parsed;
    const now = new Date().toISOString();

    const outcome = await db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: products.id, sellerId: products.sellerId, storeId: products.storeId, categoryId: products.categoryId, brandId: products.brandId })
        .from(products)
        .where(and(eq(products.id, productId), eq(products.sellerId, seller.sellerId), isNull(products.deletedAt), isNull(products.purgedAt), eq(products.trackStock, true), inStore))
        .limit(1);
      if (!product) return null;

      await setStockContext(tx, { reason: "edit", actorId: seller.userId });

      if (variantId) {
        const [row] = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${add}`, updatedAt: now })
          .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, product.id), isNotNull(productVariants.stock)))
          .returning({ stock: productVariants.stock });
        return row ? { product, stock: Number(row.stock) } : null;
      }

      // A product with variants sells from its variants: restock one of them instead.
      const [row] = await tx
        .update(products)
        .set({ quantity: sql`${products.quantity} + ${add}`, updatedAt: now })
        .where(
          and(
            eq(products.id, product.id),
            eq(products.sellerId, seller.sellerId),
            sql`NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = ${product.id})`,
          ),
        )
        .returning({ quantity: products.quantity });
      return row ? { product, stock: Math.round(Number(row.quantity)) } : null;
    });

    if (!outcome) return { success: false, error: "notFound" };

    await applyInvalidation(
      invalidateProductInventory([
        {
          snapshot: {
            id: outcome.product.id,
            sellerId: outcome.product.sellerId,
            storeId: outcome.product.storeId,
            categoryId: outcome.product.categoryId,
            brandId: outcome.product.brandId,
          },
          stockBoundaryCrossed: outcome.stock - add <= 0,
        },
      ]),
      { from: "dashboard", mode: "action" },
    );
    revalidatePath(`${STORE_PRODUCTS_PATTERN}/inventory`, "page");
    return { success: true, stock: outcome.stock };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: accessErrorCode(error.code) };
    console.error("[inventory] restock failed", error);
    return { success: false, error: "generic" };
  }
}
