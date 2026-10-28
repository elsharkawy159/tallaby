import { type SQL } from "drizzle-orm";
import { aiUsageLogs, and, db, desc, eq, gte, products, sellers, sql } from "@workspace/db";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { aiUsageRangeStart, toNumber, type AiUsageRange } from "./ai-usage.lib";
import type {
  AiProductCounts,
  AiUsageCallRow,
  AiUsageFeatureRow,
  AiUsageOverview,
  AiUsageSellerRow,
  AiUsageTotals,
  SellerAiUsage,
} from "./ai-usage.types";

/**
 * Admin reads of `ai_usage_logs` (0110) and `products.ai_source` (0112).
 * Server-only (RLS on, no policies: read through Drizzle). Queries run one
 * after another: the serverless DB pool is small (see pending-carts.data.tsx).
 */

const SELLER_ROWS_LIMIT = 200;
const RECENT_CALLS_LIMIT = 50;

/** Since Cairo midnight, like the dashboard's daily cap (packages/ai cairoDayStart). */
const cairoToday = sql`date_trunc('day', now() at time zone 'Africa/Cairo') at time zone 'Africa/Cairo'`;

const aggregates = {
  ok: sql<number>`count(*) filter (where ${aiUsageLogs.status} = 'ok')::int`,
  errors: sql<number>`count(*) filter (where ${aiUsageLogs.status} = 'error')::int`,
  blocked: sql<number>`count(*) filter (where ${aiUsageLogs.status} = 'blocked')::int`,
  inputTokens: sql<string>`coalesce(sum(${aiUsageLogs.inputTokens}), 0)`,
  cachedInputTokens: sql<string>`coalesce(sum(${aiUsageLogs.cachedInputTokens}), 0)`,
  outputTokens: sql<string>`coalesce(sum(${aiUsageLogs.outputTokens}), 0)`,
  costMicroUsd: sql<string>`coalesce(sum(${aiUsageLogs.costMicroUsd}), 0)`,
};

function rangeWhere(range: AiUsageRange, sellerId?: string): SQL | undefined {
  const since = aiUsageRangeStart(range);
  const conditions: SQL[] = [];
  if (since) conditions.push(gte(aiUsageLogs.createdAt, since.toISOString()));
  if (sellerId) conditions.push(eq(aiUsageLogs.sellerId, sellerId));
  return conditions.length ? and(...conditions) : undefined;
}

async function loadTotals(where: SQL | undefined): Promise<AiUsageTotals> {
  const [row] = await db
    .select({
      ...aggregates,
      sellers: sql<number>`count(distinct ${aiUsageLogs.sellerId})::int`,
      avgLatencyMs: sql<string | null>`avg(${aiUsageLogs.latencyMs}) filter (where ${aiUsageLogs.status} = 'ok')`,
    })
    .from(aiUsageLogs)
    .where(where);
  return {
    ok: toNumber(row?.ok),
    errors: toNumber(row?.errors),
    blocked: toNumber(row?.blocked),
    inputTokens: toNumber(row?.inputTokens),
    cachedInputTokens: toNumber(row?.cachedInputTokens),
    outputTokens: toNumber(row?.outputTokens),
    costMicroUsd: toNumber(row?.costMicroUsd),
    sellers: toNumber(row?.sellers),
    avgLatencyMs: row?.avgLatencyMs == null ? null : Math.round(toNumber(row.avgLatencyMs)),
  };
}

async function loadFeatures(where: SQL | undefined): Promise<AiUsageFeatureRow[]> {
  const rows = await db
    .select({ feature: aiUsageLogs.feature, model: aiUsageLogs.model, ...aggregates })
    .from(aiUsageLogs)
    .where(where)
    .groupBy(aiUsageLogs.feature, aiUsageLogs.model)
    .orderBy(desc(sql`sum(${aiUsageLogs.costMicroUsd})`));
  return rows.map((row) => ({
    feature: row.feature,
    model: row.model,
    ok: toNumber(row.ok),
    errors: toNumber(row.errors),
    blocked: toNumber(row.blocked),
    tokens: toNumber(row.inputTokens) + toNumber(row.outputTokens),
    costMicroUsd: toNumber(row.costMicroUsd),
  }));
}

async function loadAiProducts(sellerId?: string): Promise<{ bySeller: Map<string, number>; counts: AiProductCounts }> {
  const rows = await db
    .select({
      sellerId: products.sellerId,
      added: sql<number>`count(*) filter (where ${products.aiSource} = 'autofill_add')::int`,
      edited: sql<number>`count(*) filter (where ${products.aiSource} = 'autofill_edit')::int`,
    })
    .from(products)
    .where(
      sellerId
        ? and(sql`${products.aiSource} is not null`, eq(products.sellerId, sellerId))
        : sql`${products.aiSource} is not null`
    )
    .groupBy(products.sellerId);
  const bySeller = new Map<string, number>();
  const counts: AiProductCounts = { added: 0, edited: 0 };
  for (const row of rows) {
    const added = toNumber(row.added);
    const edited = toNumber(row.edited);
    if (row.sellerId) bySeller.set(row.sellerId, added + edited);
    counts.added += added;
    counts.edited += edited;
  }
  return { bySeller, counts };
}

/** Platform-wide AI usage for a date range, with one row per seller. */
export async function getAiUsageOverview(range: AiUsageRange): Promise<AiUsageOverview | null> {
  try {
    await getCurrentAdminUser();
    const where = rangeWhere(range);
    const totals = await loadTotals(where);
    const features = await loadFeatures(where);

    const sellerRows = await db
      .select({
        sellerId: aiUsageLogs.sellerId,
        name: sql<string>`coalesce(nullif(${sellers.businessName}, ''), ${sellers.displayName}, 'Seller')`,
        slug: sellers.slug,
        ...aggregates,
        okToday: sql<number>`count(*) filter (where ${aiUsageLogs.status} = 'ok' and ${aiUsageLogs.createdAt} >= ${cairoToday})::int`,
        lastUsedAt: sql<string | null>`max(${aiUsageLogs.createdAt})`,
      })
      .from(aiUsageLogs)
      .leftJoin(sellers, eq(sellers.id, aiUsageLogs.sellerId))
      .where(where)
      .groupBy(aiUsageLogs.sellerId, sellers.businessName, sellers.displayName, sellers.slug)
      .orderBy(desc(sql`sum(${aiUsageLogs.costMicroUsd})`), desc(sql`count(*)`))
      .limit(SELLER_ROWS_LIMIT);

    const { bySeller, counts } = await loadAiProducts();
    const rows: AiUsageSellerRow[] = sellerRows.map((row) => ({
      sellerId: row.sellerId,
      name: row.name,
      slug: row.slug ?? null,
      ok: toNumber(row.ok),
      errors: toNumber(row.errors),
      blocked: toNumber(row.blocked),
      okToday: toNumber(row.okToday),
      tokens: toNumber(row.inputTokens) + toNumber(row.outputTokens),
      costMicroUsd: toNumber(row.costMicroUsd),
      lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
      aiProducts: bySeller.get(row.sellerId) ?? 0,
    }));

    return { totals, sellers: rows, features, products: counts };
  } catch (error) {
    console.error("Error loading AI usage overview:", error);
    return null;
  }
}

/** One seller's AI usage for a date range, with their latest calls. */
export async function getSellerAiUsage(sellerId: string, range: AiUsageRange): Promise<SellerAiUsage | null> {
  try {
    await getCurrentAdminUser();
    const where = rangeWhere(range, sellerId);
    const totals = await loadTotals(where);
    const features = await loadFeatures(where);

    const [today] = await db
      .select({ ok: sql<number>`count(*)::int` })
      .from(aiUsageLogs)
      .where(
        and(eq(aiUsageLogs.sellerId, sellerId), eq(aiUsageLogs.status, "ok"), sql`${aiUsageLogs.createdAt} >= ${cairoToday}`)
      );

    const recentRows = await db
      .select({
        id: aiUsageLogs.id,
        feature: aiUsageLogs.feature,
        model: aiUsageLogs.model,
        status: aiUsageLogs.status,
        inputTokens: aiUsageLogs.inputTokens,
        cachedInputTokens: aiUsageLogs.cachedInputTokens,
        outputTokens: aiUsageLogs.outputTokens,
        costMicroUsd: aiUsageLogs.costMicroUsd,
        latencyMs: aiUsageLogs.latencyMs,
        errorCode: aiUsageLogs.errorCode,
        createdAt: aiUsageLogs.createdAt,
      })
      .from(aiUsageLogs)
      .where(where)
      .orderBy(desc(aiUsageLogs.createdAt))
      .limit(RECENT_CALLS_LIMIT);

    const { counts } = await loadAiProducts(sellerId);
    const recent: AiUsageCallRow[] = recentRows.map((row) => ({
      ...row,
      status: row.status as AiUsageCallRow["status"],
      costMicroUsd: toNumber(row.costMicroUsd),
    }));

    return { totals, okToday: toNumber(today?.ok), features, recent, products: counts };
  } catch (error) {
    console.error("Error loading seller AI usage:", error);
    return null;
  }
}
