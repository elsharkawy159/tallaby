/**
 * Store and tallaby.com product lists (F-87c slice 6). Server only: this is
 * not a "use server" file, so a browser can never call it as a server action
 * with a store or seller id of its choice. Storefront callers pass the store the
 * request host resolved; the header search on tallaby.com goes through the
 * narrow `searchProductsByText` action in actions/products.ts.
 */
import {
  db,
  products,
  productVariants,
  categories,
  brands,
  sellerCategoryProductPositions,
  eq,
  and,
  or,
  gte,
  sql,
  desc,
  asc,
  isNull,
  inArray,
} from "@workspace/db"
import type { StoreCategoryFilter } from "@workspace/lib/store-sites/catalog-data"
import { productShownInStore } from "@workspace/lib/stores/scope/server"
import { isSwitchOn } from "@/lib/platform-switches.server"
import { mergeProductWithTranslation, pickTranslationFromArray, type ProductLocale } from "@/lib/product-translations"
import { cacheProfiles, createCachedQuery, productTags, storeTags } from "@workspace/cache"

export interface ProductFilters {
  categoryId?: string;
  /** Any of these categories, e.g. every leaf under one root. */
  categoryIds?: string[];
  /** One store category's products (`StorefrontCategory`), by the rule of `storeCategoryGroups`. Use with sellerId. */
  storeCategory?: StoreCategoryFilter;
  categoryName?: string;
  /** Any of these category names (multi-select filter on /products). */
  categoryNames?: string[];
  brandId?: string;
  brandName?: string;
  /** Any of these brand names (multi-select filter on /products). */
  brandNames?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  condition?: string;
  sellerId?: string;
  /** Only these products (store builder sections that list picked products). */
  productIds?: string[];
  /**
   * The store host's store (from the request host, never a client value): only
   * the products it shows (`productInStore`, scope `shown`: before the catalog
   * split every product of the seller in "all" mode and its picks in "selected"
   * mode (D24); after it the store's own). Use with sellerId. Every storefront
   * read passes it, so its cache entry and tags are per store (F-87c).
   */
  storeId?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isSeasonal?: boolean;
  isSponsored?: boolean;
  /** Only products whose list price is above the selling price. */
  onSale?: boolean;
  searchQuery?: string;
  /**
   * `featured`: a seller category's manual order (0128, ROADMAP.md F-24d):
   * placed products first by position, then the rest newest first. Without a
   * seller category it is newest first.
   */
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest" | "popular" | "featured";
  limit?: number;
  offset?: number;
  locale?: ProductLocale;
}

/**
 * Product lists. A store read (`storeId` set) reads `stores_catalog_split`
 * first, outside the cached function, and the value is the second key part:
 * an entry never mixes the catalog modes (F-87c).
 */
export async function getProducts(filters: ProductFilters = {}) {
  const catalogSplit = filters.storeId ? await isSwitchOn("stores_catalog_split") : false
  return listProducts(filters, catalogSplit)
}

/**
 * A cross-seller list (tallaby.com, no seller or store) never shows a store
 * copy made by the catalog split or "Copy to store" (stores-separation.md
 * §2.1.5): only kept rows and products created in a store, so one product is
 * listed once. `product_store_split` (0160) has no `copy` rows before 0163,
 * so this changes nothing until then.
 */
export function notAStoreCopy() {
  return sql`NOT EXISTS (SELECT 1 FROM product_store_split pss WHERE pss.entity = 'product' AND pss.kind = 'copy' AND pss.new_id = ${products.id})`
}

const listProducts = createCachedQuery({
  name: "ecommerce:products:list",
  ttl: cacheProfiles.listing,
  // categoryName/brandName resolve to an id inside the query, so a
  // name-filtered call can only be tagged with the general listing tag —
  // it still gets purged by any structural product change (see
  // invalidateProduct in packages/cache/src/invalidate.ts), just not by a
  // change scoped to a single OTHER category/brand.
  // A seller-scoped call (every storefront grid) is tagged by seller, never
  // listing(): every product write and stock-boundary change bumps
  // productTags.seller, and listing() would refill every store whenever any
  // seller changed a product (docs/egress-audit.md §6). A store read also
  // carries its store's product and catalog tags (F-87c): the seller tag can
  // go once every product belongs to one store (stores_catalog_split on).
  tags: (filters: ProductFilters, _catalogSplit: boolean) => {
    const tags = filters.sellerId ? [] : [productTags.listing()];
    if (filters.categoryId) tags.push(productTags.category(filters.categoryId));
    if (filters.brandId) tags.push(productTags.brand(filters.brandId));
    if (filters.sellerId) tags.push(productTags.seller(filters.sellerId));
    if (filters.sellerId && filters.storeId) {
      tags.push(productTags.store(filters.sellerId, filters.storeId), storeTags.catalog(filters.sellerId, filters.storeId));
    }
    if (filters.isFeatured) tags.push(productTags.featured());
    if (filters.isTrending) tags.push(productTags.trending());
    if (filters.isSeasonal) tags.push(productTags.seasonal());
    if (filters.isSponsored) tags.push(productTags.sponsored());
    return tags;
  },
  query: async (filters: ProductFilters, catalogSplit: boolean) => {
    try {
      const locale = (filters.locale ?? "en") as ProductLocale
      // Storefront visibility: an admin-approved product the seller has left on.
      const conditions = [eq(products.status, "active")];

      if (filters.categoryId) {
        conditions.push(eq(products.categoryId, filters.categoryId));
      }

      if (filters.categoryIds?.length) {
        conditions.push(inArray(products.categoryId, filters.categoryIds));
      }

      if (filters.storeCategory) {
        const { sellerCategoryId, sourceCategoryId, categoryIds } = filters.storeCategory;
        // Its own products, plus unlinked ones of the Tallaby category it was picked from;
        // a Tallaby root group holds only unlinked products (its ids leave out picked categories).
        conditions.push(
          sellerCategoryId
            ? (or(
                eq(products.sellerCategoryId, sellerCategoryId),
                sourceCategoryId ? and(isNull(products.sellerCategoryId), eq(products.categoryId, sourceCategoryId)) : undefined,
              ) ?? sql`false`)
            : (and(
                isNull(products.sellerCategoryId),
                inArray(products.categoryId, categoryIds.length ? categoryIds : ["00000000-0000-0000-0000-000000000000"]),
              ) ?? sql`false`)
        );
      }

      if (filters.productIds) {
        conditions.push(inArray(products.id, filters.productIds.length ? filters.productIds : ["00000000-0000-0000-0000-000000000000"]));
      }

      if (filters.storeId) {
        conditions.push(productShownInStore({ storeId: filters.storeId, catalogSplit }));
      }

      if (!filters.sellerId && !filters.storeId) {
        conditions.push(notAStoreCopy());
      }

      const categoryNames = [
        ...(filters.categoryNames ?? []),
        ...(filters.categoryName ? [filters.categoryName] : []),
      ]
      if (categoryNames.length > 0) {
        // Category names aren't unique in the DB (duplicate rows with the
        // same name exist across parents), so match every id sharing the
        // name rather than an arbitrary single row via .limit(1).
        const matchingCategories = await db.select({ id: categories.id }).from(categories).where(inArray(categories.name, categoryNames))
        // An unknown name must narrow to nothing, not silently drop the filter.
        conditions.push(
          matchingCategories.length > 0
            ? inArray(products.categoryId, matchingCategories.map((c) => c.id))
            : sql`false`
        )
      }

      if (filters.brandId) {
        conditions.push(eq(products.brandId, filters.brandId));
      }

      const brandNames = [
        ...(filters.brandNames ?? []),
        ...(filters.brandName ? [filters.brandName] : []),
      ]
      if (brandNames.length > 0) {
        const matchingBrands = await db.select({ id: brands.id }).from(brands).where(inArray(brands.name, brandNames))
        conditions.push(
          matchingBrands.length > 0
            ? inArray(products.brandId, matchingBrands.map((b) => b.id))
            : sql`false`
        )
      }

      if (filters.minPrice !== undefined) {
        conditions.push(
          sql`(${products.price}->>'final')::numeric >= ${filters.minPrice}`
        );
      }

      if (filters.maxPrice !== undefined) {
        conditions.push(
          sql`(${products.price}->>'final')::numeric <= ${filters.maxPrice}`
        );
      }

      if (filters.minRating !== undefined) {
        conditions.push(gte(products.averageRating, filters.minRating));
      }

      if (filters.condition) {
        conditions.push(eq(products.condition, filters.condition as any));
      }

      if (filters.sellerId) {
        conditions.push(eq(products.sellerId, filters.sellerId));
      }

      if (filters.isFeatured !== undefined) {
        conditions.push(eq(products.isFeatured, filters.isFeatured));
      }

      if (filters.isTrending !== undefined) {
        conditions.push(eq(products.isTrending, filters.isTrending));
      }

      if (filters.isSeasonal !== undefined) {
        conditions.push(eq(products.isSeasonal, filters.isSeasonal));
      }

      if (filters.isSponsored !== undefined) {
        conditions.push(eq(products.sponsored, filters.isSponsored));
      }

      if (filters.onSale) {
        conditions.push(
          sql`(${products.price}->>'list')::numeric > (${products.price}->>'final')::numeric`
        );
      }

      if (filters.searchQuery) {
        const pattern = `%${filters.searchQuery}%`;
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM product_translations pt
            WHERE pt.product_id = ${products.id}
            AND pt.locale IN ('en', 'ar')
            AND (pt.title ILIKE ${pattern} OR pt.description ILIKE ${pattern})
          )`
        );
      }

      // Determine ordering
      const orderBy = [];
      switch (filters.sortBy) {
        case "price_asc":
          orderBy.push(asc(sql`(${products.price}->>'final')::numeric`));
          break;
        case "price_desc":
          orderBy.push(desc(sql`(${products.price}->>'final')::numeric`));
          break;
        case "rating":
          orderBy.push(desc(products.averageRating));
          break;
        case "newest":
          orderBy.push(desc(products.createdAt));
          break;
        case "popular":
          orderBy.push(desc(products.reviewCount));
          break;
        case "featured": {
          const sellerCategoryId = filters.storeCategory?.sellerCategoryId;
          if (sellerCategoryId) {
            orderBy.push(
              sql`(SELECT scp.position FROM ${sellerCategoryProductPositions} scp WHERE scp.seller_category_id = ${sellerCategoryId} AND scp.product_id = ${products.id} AND scp.seller_id = ${products.sellerId}) ASC NULLS LAST`,
            );
          }
          orderBy.push(desc(products.createdAt), asc(products.id));
          break;
        }
        default:
          orderBy.push(desc(products.createdAt));
      }

      const productsListRaw = await db.query.products.findMany({
        where: and(...conditions),
        with: {
          brand: true,
          category: true,
          // Cards never show the long product page content.
          productTranslations: { columns: { content: false } },
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
        orderBy,
        limit: filters.limit || 30,
        offset: filters.offset || 0,
        extras: {
          totalCount: sql<number>`count(*) over ()`.as("total_count"),
        },
      })

      type ProductWithTranslations = Record<string, unknown> & {
        totalCount: number
        productTranslations?: Array<{ locale: string; title: string; description?: string | null; bulletPoints?: unknown; slug?: string | null; metaTitle?: string | null; metaDescription?: string | null }>
      }
      const productsList = (productsListRaw as ProductWithTranslations[]).map((p) => {
        const translation = pickTranslationFromArray(p.productTranslations ?? [], locale)
        return mergeProductWithTranslation(p, translation)
      })

      // count(*) over () on the same query replaces a second round-trip count query.
      const totalCount = (productsListRaw[0] as ProductWithTranslations | undefined)?.totalCount ?? 0;

      return {
        success: true,
        data: productsList,
        totalCount: Number(totalCount),
        hasMore:
          (filters.offset || 0) + productsList.length < Number(totalCount),
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },
});
