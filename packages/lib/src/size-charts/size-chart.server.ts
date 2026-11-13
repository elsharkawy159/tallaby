import { and, asc, db, eq, inArray, isNull, or, products, productTranslations, sellerProductCategories, sql, storeAppInstalls, stores, storeSizeCharts, storeSizeChartTargets } from "@workspace/db";
import { productInStore, taxonomyInStore } from "../stores/store-scope.server";
import {
  SIZE_CHART_LIMITS,
  foreignTargetIds,
  parseSizeChartDefinition,
  resolveSizeChartTarget,
  sizeChartNameSchema,
  type SizeChartDefinition,
  type SizeChartName,
  type SizeChartPayload,
  type SizeChartTargetsPayload,
} from "./size-chart.lib";

/**
 * Size Chart app (ROADMAP.md F-92, 0169). Server-only. Callers pass the
 * session's seller and a store they checked (`requireStore`); every query
 * filters on both, and every product or category id from the client is
 * checked to be this store's before it is saved (CLAUDE.md rule 5).
 */

/** The catalog key of the app (catalog.ts). */
export const SIZE_CHART_APP = "size_chart";

type Scope = { sellerId: string; storeId: string };

export type StoreSizeChart = {
  id: string;
  name: SizeChartName;
  definition: SizeChartDefinition;
  products: { id: string; title: string }[];
  categoryIds: string[];
  updatedAt: string;
};

export type SizeChartError = "not_found" | "limit" | "invalid" | "invalid_targets";
export type SizeChartResult<T> = { success: true; data: T } | { success: false; error: SizeChartError };

const ownChart = ({ sellerId, storeId }: Scope, chartId: string) =>
  and(eq(storeSizeCharts.id, chartId), eq(storeSizeCharts.sellerId, sellerId), eq(storeSizeCharts.storeId, storeId));

function nameOf(raw: unknown): SizeChartName {
  const parsed = sizeChartNameSchema.safeParse(raw);
  return parsed.success ? parsed.data : { ar: "", en: "" };
}

/** Does this store have the app installed? */
export async function isSizeChartAppInstalled(storeId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: storeAppInstalls.id })
    .from(storeAppInstalls)
    .where(and(eq(storeAppInstalls.storeId, storeId), eq(storeAppInstalls.appKey, SIZE_CHART_APP), isNull(storeAppInstalls.uninstalledAt)))
    .limit(1);
  return Boolean(row);
}

/** The store's charts with what each is applied to (product titles in `locale`, else any). */
export async function listStoreSizeCharts(scope: Scope, locale: string): Promise<StoreSizeChart[]> {
  const charts = await db
    .select()
    .from(storeSizeCharts)
    .where(and(eq(storeSizeCharts.sellerId, scope.sellerId), eq(storeSizeCharts.storeId, scope.storeId)))
    .orderBy(asc(storeSizeCharts.position), asc(storeSizeCharts.createdAt));
  if (!charts.length) return [];
  const targets = await db
    .select({
      chartId: storeSizeChartTargets.chartId,
      productId: storeSizeChartTargets.productId,
      categoryId: storeSizeChartTargets.categoryId,
      title: sql<string | null>`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${storeSizeChartTargets.productId} ORDER BY (t.locale = ${locale}) DESC LIMIT 1)`,
    })
    .from(storeSizeChartTargets)
    .where(and(eq(storeSizeChartTargets.sellerId, scope.sellerId), eq(storeSizeChartTargets.storeId, scope.storeId)));

  return charts.flatMap((chart) => {
    const definition = parseSizeChartDefinition(chart.definition);
    if (!definition) return [];
    const own = targets.filter((target) => target.chartId === chart.id);
    return [
      {
        id: chart.id,
        name: nameOf(chart.name),
        definition,
        products: own.flatMap((target) => (target.productId ? [{ id: target.productId, title: target.title ?? "" }] : [])),
        categoryIds: own.flatMap((target) => (target.categoryId ? [target.categoryId] : [])),
        updatedAt: chart.updatedAt,
      },
    ];
  });
}

/** Adds a chart; a store holds at most `SIZE_CHART_LIMITS.chartsPerStore`. */
export async function createStoreSizeChart(scope: Scope & { actorId: string }, payload: SizeChartPayload): Promise<SizeChartResult<{ id: string }>> {
  return db.transaction(async (tx) => {
    // Locks the store row, so two quick creates can't both pass the count.
    const [store] = await tx
      .select({ id: stores.id })
      .from(stores)
      .where(and(eq(stores.id, scope.storeId), eq(stores.sellerId, scope.sellerId), isNull(stores.deletedAt)))
      .for("update");
    if (!store) return { success: false, error: "not_found" } as const;
    const [{ count }] = (await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(storeSizeCharts)
      .where(eq(storeSizeCharts.storeId, scope.storeId))) as [{ count: number }];
    if (count >= SIZE_CHART_LIMITS.chartsPerStore) return { success: false, error: "limit" } as const;
    const [row] = await tx
      .insert(storeSizeCharts)
      .values({
        sellerId: scope.sellerId,
        storeId: scope.storeId,
        name: payload.name,
        definition: payload.definition,
        position: count,
        createdBy: scope.actorId,
      })
      .returning({ id: storeSizeCharts.id });
    return { success: true, data: { id: row!.id } } as const;
  });
}

export async function updateStoreSizeChart(scope: Scope, chartId: string, payload: SizeChartPayload): Promise<SizeChartResult<null>> {
  const rows = await db
    .update(storeSizeCharts)
    .set({ name: payload.name, definition: payload.definition, updatedAt: new Date().toISOString() })
    .where(ownChart(scope, chartId))
    .returning({ id: storeSizeCharts.id });
  return rows.length ? { success: true, data: null } : { success: false, error: "not_found" };
}

/** Deletes a chart and (FK cascade) what it was applied to. */
export async function deleteStoreSizeChart(scope: Scope, chartId: string): Promise<SizeChartResult<null>> {
  const rows = await db.delete(storeSizeCharts).where(ownChart(scope, chartId)).returning({ id: storeSizeCharts.id });
  return rows.length ? { success: true, data: null } : { success: false, error: "not_found" };
}

/**
 * Replaces what a chart is applied to. Every product must be this store's
 * (`productInStore`, scope `managed`) and every category in the store's list
 * (`taxonomyInStore`); one foreign id refuses the whole save. A product or
 * category another chart had moves to this one (one chart each per store).
 * `moved` counts those.
 */
export async function setSizeChartTargets(
  scope: Scope & { catalogSplit: boolean },
  chartId: string,
  targets: SizeChartTargetsPayload,
): Promise<SizeChartResult<{ moved: number }>> {
  const { productIds, categoryIds } = targets;
  return db.transaction(async (tx) => {
    const [chart] = await tx.select({ id: storeSizeCharts.id }).from(storeSizeCharts).where(ownChart(scope, chartId)).for("update");
    if (!chart) return { success: false, error: "not_found" } as const;

    const [ownedProducts, ownedCategories] = await Promise.all([
      productIds.length
        ? tx
            .select({ id: products.id })
            .from(products)
            .where(
              and(
                inArray(products.id, productIds),
                eq(products.sellerId, scope.sellerId),
                isNull(products.deletedAt),
                productInStore(scope.storeId, { catalogSplit: scope.catalogSplit, scope: "managed" }),
              ),
            )
        : [],
      categoryIds.length
        ? tx
            .select({ id: sellerProductCategories.id })
            .from(sellerProductCategories)
            .where(
              and(
                inArray(sellerProductCategories.id, categoryIds),
                taxonomyInStore(sellerProductCategories, { sellerId: scope.sellerId, storeId: scope.storeId, catalogSplit: scope.catalogSplit }),
              ),
            )
        : [],
    ]);
    const foreign = [
      ...foreignTargetIds(productIds, new Set(ownedProducts.map((row) => row.id))),
      ...foreignTargetIds(categoryIds, new Set(ownedCategories.map((row) => row.id))),
    ];
    if (foreign.length) return { success: false, error: "invalid_targets" } as const;

    // This chart's old targets go; the same products and categories on another chart move here.
    await tx.delete(storeSizeChartTargets).where(and(eq(storeSizeChartTargets.chartId, chartId), eq(storeSizeChartTargets.storeId, scope.storeId)));
    const others = productIds.length || categoryIds.length
      ? await tx
          .delete(storeSizeChartTargets)
          .where(
            and(
              eq(storeSizeChartTargets.storeId, scope.storeId),
              or(
                productIds.length ? inArray(storeSizeChartTargets.productId, productIds) : sql`false`,
                categoryIds.length ? inArray(storeSizeChartTargets.categoryId, categoryIds) : sql`false`,
              ),
            ),
          )
          .returning({ id: storeSizeChartTargets.id })
      : [];

    const rows = [
      ...productIds.map((productId) => ({ productId, categoryId: null })),
      ...categoryIds.map((categoryId) => ({ productId: null, categoryId })),
    ].map((target) => ({ ...target, chartId, storeId: scope.storeId, sellerId: scope.sellerId }));
    if (rows.length) await tx.insert(storeSizeChartTargets).values(rows);
    await tx.update(storeSizeCharts).set({ updatedAt: new Date().toISOString() }).where(eq(storeSizeCharts.id, chartId));
    return { success: true, data: { moved: others.length } } as const;
  });
}

/** What the storefront draws: the chart's name and definition. */
export type ProductSizeChart = { id: string; name: SizeChartName; definition: SizeChartDefinition };

/**
 * The size chart of one product on its store's storefront, or null: the app
 * must be installed in this store, and the chart applied to the product, to
 * its store category or to that category's main category. The store comes
 * from the request host, never a client.
 */
export async function loadProductSizeChart(
  scope: Scope,
  product: { id: string; categoryId: string | null },
): Promise<ProductSizeChart | null> {
  if (!(await isSizeChartAppInstalled(scope.storeId))) return null;
  const targets = await db
    .select({ chartId: storeSizeChartTargets.chartId, productId: storeSizeChartTargets.productId, categoryId: storeSizeChartTargets.categoryId })
    .from(storeSizeChartTargets)
    .where(
      and(
        eq(storeSizeChartTargets.sellerId, scope.sellerId),
        eq(storeSizeChartTargets.storeId, scope.storeId),
        or(
          eq(storeSizeChartTargets.productId, product.id),
          product.categoryId ? eq(storeSizeChartTargets.categoryId, product.categoryId) : sql`false`,
          // Its main category when it is a sub-category (0171), in the same query.
          product.categoryId
            ? eq(
                storeSizeChartTargets.categoryId,
                sql`(select ${sellerProductCategories.parentId} from ${sellerProductCategories} where ${sellerProductCategories.id} = ${product.categoryId} and ${sellerProductCategories.storeId} = ${scope.storeId})`,
              )
            : sql`false`,
        ),
      ),
    );
  // A category target that isn't the product's own category can only be its main category.
  const parentCategoryId = targets.find((target) => target.categoryId && target.categoryId !== product.categoryId)?.categoryId ?? null;
  const chartId = resolveSizeChartTarget(targets, { ...product, parentCategoryId });
  if (!chartId) return null;
  const [chart] = await db.select().from(storeSizeCharts).where(ownChart(scope, chartId)).limit(1);
  const definition = chart ? parseSizeChartDefinition(chart.definition) : null;
  return chart && definition ? { id: chart.id, name: nameOf(chart.name), definition } : null;
}
