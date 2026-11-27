import { categories, db, eq } from "@workspace/db";
import { toProductKind, type ProductKind } from "./category-kind.lib";

/**
 * A Tallaby category's kind (0191, F-108e), or null when there is no such
 * category (the products FK reports that). One indexed read by primary key.
 */
export async function loadCategoryKind(categoryId: string): Promise<ProductKind | null> {
  const [row] = await db
    .select({ kind: categories.productKind })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  return row ? toProductKind(row.kind) : null;
}
