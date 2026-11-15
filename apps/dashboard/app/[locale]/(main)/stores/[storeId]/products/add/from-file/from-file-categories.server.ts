import { cacheProfiles, categoryTags, createCachedQuery } from "@workspace/cache";
import { categories, db } from "@workspace/db";
import type { CategoryOption } from "../add-product.schema";
import { nestCategories } from "./from-file.lib";

/**
 * Every category, as a tree of any depth. `getAllCategories` stops at three levels
 * for the product form, which left only "Men's Skincare" for jeans (their real
 * category, Men > Bottoms > Jeans, is level four; live, 2026-11-04). Shared data
 * with no seller in it, refreshed with the same tags as the form's tree.
 */
const loadCategoryRows = createCachedQuery({
  name: "dashboard:categories:bulk-import:v1",
  ttl: cacheProfiles.taxonomy,
  tags: () => [categoryTags.all(), categoryTags.tree()],
  query: () =>
    db
      .select({ id: categories.id, name: categories.name, nameAr: categories.nameAr, slug: categories.slug, level: categories.level, parentId: categories.parentId })
      .from(categories),
});

export async function loadAllCategories(): Promise<CategoryOption[]> {
  return nestCategories(await loadCategoryRows()) as CategoryOption[];
}
