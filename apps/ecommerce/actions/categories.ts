"use server";

import { db } from "@workspace/db";
import {
  categories,
  products,
  productVariants,
  eq,
  and,
  or,
  desc,
  sql,
  isNull,
  isNotNull,
  asc,
  inArray,
  gt,
} from "@workspace/db";
import { unstable_cache } from "next/cache";
import { categoryTags, productTags } from "@workspace/cache";
import {
  mergeProductWithTranslation,
  pickTranslationFromArray,
  type ProductLocale,
} from "@/lib/product-translations";

export const getAllCategories = unstable_cache(
  async () => {
    try {
      const allCategories = await db.query.categories.findMany({
        orderBy: [asc(categories.level), asc(categories.name)],
      });

      // Build category tree
      const categoryTree = buildCategoryTree(allCategories);

      return { success: true, data: categoryTree };
    } catch (error) {
      console.error("Error fetching categories:", error);
      return { success: false, error: "Failed to fetch categories" };
    }
  },
  ["all-categories"],
  {
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24,
  },
);

export const getCategoryTree = unstable_cache(
  async () => {
    try {
      // Get root categories
      const rootCategories = await db.query.categories.findMany({
        where: isNull(categories.parentId),
        with: {
          categories: {
            with: {
              categories: true,
            },
          },
        },
        orderBy: [asc(categories.name)],
      });

      return { success: true, data: rootCategories };
    } catch (error) {
      console.error("Error fetching category tree:", error);
      return { success: false, error: "Failed to fetch category tree" };
    }
  },
  ["category-tree"],
  {
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24,
  },
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, slug),
        with: {
          category: true, // Parent
          categories: true, // Children
        },
      });

      if (!category) {
        return { success: false, error: "Category not found" };
      }

      // Get breadcrumb
      const breadcrumb = await getCategoryBreadcrumb(category.id);

      // Get product count
      const productCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(
          and(
            eq(products.categoryId, category.id),
            eq(products.status, "active"),
          ),
        );

      return {
        success: true,
        data: {
          ...category,
          breadcrumb,
          productCount: productCount[0]?.count || 0,
        },
      };
    } catch (error) {
      console.error("Error fetching category:", error);
      return { success: false, error: "Failed to fetch category" };
    }
  },
  ["category-by-slug"],
  {
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24,
  },
);

export const getAllCategorySlugs = unstable_cache(
  async () => {
    try {
      const rows = await db
        .select({ slug: categories.slug })
        .from(categories)

      const data = rows.map((r) => r.slug).filter((s): s is string => Boolean(s))
      return { success: true, data }
    } catch (error) {
      console.error("Error fetching category slugs:", error);
      return { success: false, error: "Failed to fetch category slugs" };
    }
  },
  ["all-category-slugs"],
  {
    tags: [categoryTags.all()],
    revalidate: 60 * 60 * 24,
  },
);

export const getTopCategories = unstable_cache(
  async () => {
    try {
      // Category names aren't unique (duplicate rows with the same
      // name/nameAr exist across parents), which showed up as the same
      // category appearing twice in the homepage carousel. Fetch extra
      // rows and collapse by name so a full page of 12 distinct names
      // survives the merge.
      const rawTopCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          nameAr: categories.nameAr,
          slug: categories.slug,
          imageUrl: categories.imageUrl,
          productCount: categories.productCount,
        })
        .from(categories)
        .where(
          and(
            gt(categories.productCount, 0),
            isNotNull(categories.slug),
            or(isNotNull(categories.name), isNotNull(categories.nameAr)),
          ),
        )
        .orderBy(desc(categories.productCount))
        .limit(40);

      const dedupedByName = new Map<string, (typeof rawTopCategories)[number]>();
      for (const category of rawTopCategories) {
        const key = `${category.name}|${category.nameAr ?? ""}`
          .trim()
          .toLowerCase();
        const existing = dedupedByName.get(key);
        if (existing) {
          existing.productCount += category.productCount;
        } else {
          dedupedByName.set(key, { ...category });
        }
      }

      const topCategories = Array.from(dedupedByName.values())
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, 12);

      // For categories without image, fetch first product image as fallback
      const needFallback = topCategories.filter((c) => !c.imageUrl);
      const fallbackMap = new Map<string, string>();

      if (needFallback.length > 0) {
        const categoryIds = needFallback.map((c) => c.id);
        const fallbackRows = await db
          .select({
            categoryId: products.categoryId,
            firstImage: sql<string>`(${products.images}->>0)`.as("first_image"),
          })
          .from(products)
          .where(
            and(
              inArray(products.categoryId, categoryIds),
              eq(products.status, "active"),
              sql`${products.images} IS NOT NULL`,
              sql`jsonb_array_length(${products.images}) > 0`,
            ),
          );

        // Pick first product image per category (query may return multiple per category)
        for (const row of fallbackRows) {
          const img = row.firstImage;
          if (row.categoryId && img && !fallbackMap.has(row.categoryId)) {
            fallbackMap.set(row.categoryId, img);
          }
        }
      }

      const data = topCategories.map((c) => ({
        ...c,
        fallbackImageUrl: fallbackMap.get(c.id) ?? null,
      }));

      return { success: true, data };
    } catch (error) {
      console.error("Error fetching top categories:", error);
      throw error;
    }
  },
  ["top-categories"],
  {
    tags: [categoryTags.all(), categoryTags.tree(), categoryTags.top()],
    revalidate: 60 * 60 * 24, // 1 day
  },
);

export const getCategoriesWithProducts = unstable_cache(
  async () => {
    try {
      const categoriesWithProducts = await db.query.categories.findMany({
        where: eq(categories.level, 1),
        with: {
          categories: {
            with: {
              categories: true,
            },
          },
        },
      });

      // Add product counts
      const categoriesWithCounts = await Promise.all(
        categoriesWithProducts.map(async (category) => {
          const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(
              and(
                eq(products.categoryId, category.id),
                eq(products.status, "active"),
              ),
            );

          return {
            ...category,
            productCount: count[0]?.count || 0,
          };
        }),
      );

      return { success: true, data: categoriesWithCounts };
    } catch (error) {
      console.error("Error fetching categories:", error);
      return { success: false, error: "Failed to fetch categories" };
    }
  },
  ["categories-with-products"],
  {
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24, // 1 day
  },
);

export interface CategoryPageSection {
  id: string;
  name: string | null;
  nameAr: string | null;
  slug: string;
  imageUrl: string | null;
  productCount: number;
  products: Array<Record<string, unknown>>;
}

const PRODUCTS_PER_CATEGORY = 8;

/** Postgres drivers often return array_agg as `{uuid}` / `{a,b}` strings. */
function normalizeCategoryIds(
  value: unknown,
  fallbackId?: string | null,
): string[] {
  let ids: string[] = [];

  if (Array.isArray(value)) {
    ids = value.filter((id): id is string => typeof id === "string" && id.length > 0);
  } else if (typeof value === "string" && value.length > 0) {
    const inner = value.replace(/^\{|\}$/g, "").trim();
    if (inner) {
      ids = inner
        .split(",")
        .map((part) => part.trim().replace(/^"|"$/g, ""))
        .filter(Boolean);
    }
  }

  if (ids.length === 0 && fallbackId) {
    ids = [fallbackId];
  }

  return [...new Set(ids)];
}

async function getSampleProductsForCategoryIds(
  categoryIds: string[],
  locale: ProductLocale,
  limit: number,
) {
  const ids = normalizeCategoryIds(categoryIds);
  if (ids.length === 0) return [];

  const categoryCondition =
    ids.length === 1
      ? eq(products.categoryId, ids[0]!)
      : inArray(products.categoryId, ids);

  const productsListRaw = await db.query.products.findMany({
    where: and(categoryCondition, eq(products.status, "active")),
    with: {
      brand: true,
      category: true,
      productTranslations: true,
      productVariants: {
        columns: {
          id: true,
          localized: true,
          option1: true,
          option2: true,
          option3: true,
          images: true,
          imageUrl: true,
          position: true,
        },
        orderBy: [asc(productVariants.position)],
      },
    },
    orderBy: [desc(products.reviewCount), desc(products.averageRating)],
    limit,
  });

  return productsListRaw.map((product) => {
    const translation = pickTranslationFromArray(
      product.productTranslations ?? [],
      locale,
    );
    return mergeProductWithTranslation(product, translation);
  });
}

/**
 * Storefront /categories page: distinct category names that have active
 * products, each with a sample product grid. Falls back to the full
 * category catalog (no products) when none are linked yet.
 */
export async function getCategoriesPageData(
  locale: ProductLocale,
  productsPerCategory: number = PRODUCTS_PER_CATEGORY,
) {
  return unstable_cache(
    async (): Promise<
      | { success: true; data: CategoryPageSection[] }
      | { success: false; error: string }
    > => {
      try {
        const withProducts = await db
          .select({
            id: sql<string>`(array_agg(${categories.id} ORDER BY ${categories.productCount} DESC NULLS LAST))[1]`.as(
              "id",
            ),
            name: categories.name,
            nameAr: categories.nameAr,
            slug: sql<string>`(array_agg(${categories.slug} ORDER BY ${categories.productCount} DESC NULLS LAST))[1]`.as(
              "slug",
            ),
            imageUrl: sql<
              string | null
            >`(array_agg(${categories.imageUrl} ORDER BY ${categories.productCount} DESC NULLS LAST))[1]`.as(
              "image_url",
            ),
            categoryIds: sql<string[]>`array_agg(DISTINCT ${categories.id})`.as(
              "category_ids",
            ),
            productCount: sql<number>`COUNT(${products.id})`.as("product_count"),
          })
          .from(categories)
          .innerJoin(
            products,
            and(
              eq(products.categoryId, categories.id),
              eq(products.status, "active"),
            ),
          )
          .where(
            and(
              isNotNull(categories.slug),
              or(isNotNull(categories.name), isNotNull(categories.nameAr)),
            ),
          )
          .groupBy(categories.name, categories.nameAr)
          .orderBy(desc(sql`COUNT(${products.id})`));

        let sections: CategoryPageSection[];

        if (withProducts.length > 0) {
          sections = await Promise.all(
            withProducts.map(async (category) => {
              const sampleProducts = await getSampleProductsForCategoryIds(
                normalizeCategoryIds(category.categoryIds, category.id),
                locale,
                productsPerCategory,
              );

              return {
                id: category.id,
                name: category.name,
                nameAr: category.nameAr,
                slug: category.slug,
                imageUrl: category.imageUrl,
                productCount: Number(category.productCount) || 0,
                products: sampleProducts,
              };
            }),
          );
        } else {
          // No active products linked — still list the catalog so the page
          // isn't blank while inventory/category assignments catch up.
          const allCategories = await db
            .select({
              id: categories.id,
              name: categories.name,
              nameAr: categories.nameAr,
              slug: categories.slug,
              imageUrl: categories.imageUrl,
              productCount: categories.productCount,
            })
            .from(categories)
            .where(
              and(
                isNotNull(categories.slug),
                or(isNotNull(categories.name), isNotNull(categories.nameAr)),
              ),
            )
            .orderBy(asc(categories.level), asc(categories.name));

          const deduped = new Map<string, (typeof allCategories)[number]>();
          for (const category of allCategories) {
            if (!category.slug) continue;
            const key = `${category.name ?? ""}|${category.nameAr ?? ""}`
              .trim()
              .toLowerCase();
            const existing = deduped.get(key);
            if (!existing || category.productCount > existing.productCount) {
              deduped.set(key, category);
            }
          }

          sections = Array.from(deduped.values()).map((category) => ({
            id: category.id,
            name: category.name,
            nameAr: category.nameAr,
            slug: category.slug!,
            imageUrl: category.imageUrl,
            productCount: category.productCount ?? 0,
            products: [],
          }));
        }

        return { success: true, data: sections };
      } catch (error) {
        console.error("Error fetching categories page data:", error);
        return { success: false, error: "Failed to fetch categories" };
      }
    },
    [`categories-page-${locale}-${productsPerCategory}`],
    {
      tags: [
        categoryTags.all(),
        categoryTags.tree(),
        categoryTags.top(),
        productTags.listing(),
        productTags.filterOptions(),
      ],
      revalidate: 600,
    },
  )();
}

const buildCategoryTree = unstable_cache(
  async (categories: any[]) => {
    const categoryMap = new Map();
    const tree: any[] = [];

    // Create a map of categories
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build the tree
    categories.forEach((cat) => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(cat.id));
        }
      } else {
        tree.push(categoryMap.get(cat.id));
      }
    });

    return tree;
  },
  ["build-category-tree"],
  {
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24, // 1 day
  },
);

const getCategoryBreadcrumb = unstable_cache(
  async (categoryId: string) => {
    const breadcrumb = [];
    let currentId = categoryId;

    while (currentId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, currentId),
      });

      if (category) {
        breadcrumb.unshift(category);
        currentId = category.parentId || "";
      } else {
        break;
      }
    }

    return breadcrumb;
  },
  ["get-category-breadcrumb"],
  {
    tags: [categoryTags.all(), categoryTags.tree()],
    revalidate: 60 * 60 * 24, // 1 day
  },
);
