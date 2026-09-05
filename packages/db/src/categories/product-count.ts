import { eq, sql } from "drizzle-orm";

import { db } from "../drizzle/database";
import { categories } from "../drizzle/schema";

type ProductStatus = "draft" | "pending" | "active" | "rejected";

export async function adjustCategoryProductCount(
  categoryId: string,
  delta: number
): Promise<void> {
  if (!categoryId || delta === 0) return;

  await db
    .update(categories)
    .set({
      productCount: sql`GREATEST(0, ${categories.productCount} + ${delta})`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(categories.id, categoryId));
}

export async function syncCategoryProductCountForProductChange(params: {
  categoryId: string;
  previousStatus: ProductStatus | string | null | undefined;
  nextStatus: ProductStatus | string | null | undefined;
}): Promise<void> {
  const wasActive = params.previousStatus === "active";
  const isActive = params.nextStatus === "active";

  if (wasActive === isActive) return;

  await adjustCategoryProductCount(params.categoryId, isActive ? 1 : -1);
}

export async function syncCategoryProductCountForCategoryMove(params: {
  previousCategoryId: string;
  nextCategoryId: string;
  status: ProductStatus | string | null | undefined;
}): Promise<void> {
  if (params.status !== "active") return;
  if (params.previousCategoryId === params.nextCategoryId) return;

  await adjustCategoryProductCount(params.previousCategoryId, -1);
  await adjustCategoryProductCount(params.nextCategoryId, 1);
}

export async function syncCategoryProductCountOnDelete(params: {
  categoryId: string;
  status: ProductStatus | string | null | undefined;
}): Promise<void> {
  if (params.status !== "active") return;

  await adjustCategoryProductCount(params.categoryId, -1);
}

/**
 * Applies all category product_count deltas for a product mutation that may
 * change status and/or categoryId. Prefer this when both can change together.
 */
export async function syncCategoryProductCountForProductMutation(params: {
  previousCategoryId: string;
  nextCategoryId: string;
  previousStatus: ProductStatus | string | null | undefined;
  nextStatus: ProductStatus | string | null | undefined;
}): Promise<void> {
  const wasActive = params.previousStatus === "active";
  const isActive = params.nextStatus === "active";
  const categoryChanged =
    params.previousCategoryId !== params.nextCategoryId;

  if (!wasActive && !isActive) return;

  if (wasActive && isActive && categoryChanged) {
    await syncCategoryProductCountForCategoryMove({
      previousCategoryId: params.previousCategoryId,
      nextCategoryId: params.nextCategoryId,
      status: "active",
    });
    return;
  }

  if (wasActive && !isActive) {
    await adjustCategoryProductCount(params.previousCategoryId, -1);
    return;
  }

  if (!wasActive && isActive) {
    await adjustCategoryProductCount(params.nextCategoryId, 1);
  }
}
