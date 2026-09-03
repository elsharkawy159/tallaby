import { db } from '@workspace/db'
import {
  categories,
  orderItems,
  orders,
  productTranslations,
  products,
  sellers,
  users
} from '@workspace/db'
import { and, desc, eq, gte, lt, notInArray, sql } from 'drizzle-orm'
import { getAdminUser } from '@/actions/auth'
import {
  eachUtcDay,
  fillCustomerSeries,
  fillDailySeries,
  percentChange,
  toNumber
} from './analytics.lib'
import type { CommerceAnalytics, PeriodMetric } from './analytics.types'

const EXCLUDED_REVENUE_STATUSES: Array<
  'cancelled' | 'refunded' | 'returned'
> = ['cancelled', 'refunded', 'returned']

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  payment_processing: '#f97316',
  confirmed: '#3b82f6',
  shipping_soon: '#06b6d4',
  shipped: '#10b981',
  out_for_delivery: '#14b8a6',
  delivered: '#6366f1',
  cancelled: '#ef4444',
  refund_requested: '#e11d48',
  refunded: '#9f1239',
  returned: '#78716c'
}

const countedOrders = notInArray(orders.status, EXCLUDED_REVENUE_STATUSES)

function metric (current: number, previous: number): PeriodMetric {
  return {
    current,
    previous,
    changePercent: percentChange(current, previous)
  }
}

function labelStatus (status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export async function getCommerceAnalytics (): Promise<CommerceAnalytics> {
  await getAdminUser()

  const now = new Date()
  const periodEnd = now
  const periodStart = new Date(now)
  periodStart.setUTCDate(periodStart.getUTCDate() - 30)
  const previousStart = new Date(periodStart)
  previousStart.setUTCDate(previousStart.getUTCDate() - 30)
  const yearStart = new Date(now)
  yearStart.setUTCMonth(yearStart.getUTCMonth() - 11, 1)
  yearStart.setUTCHours(0, 0, 0, 0)

  const periodStartIso = periodStart.toISOString()
  const periodEndIso = periodEnd.toISOString()
  const previousStartIso = previousStart.toISOString()
  const yearStartIso = yearStart.toISOString()

  const [
    currentTotals,
    previousTotals,
    currentCustomers,
    previousCustomers,
    currentProducts,
    previousProducts,
    dailyRevenueRows,
    monthlyRows,
    statusRows,
    categoryRows,
    previousCategoryRows,
    customerActivityRows,
    topProductRows,
    categoryProductCounts,
    recentOrderRows,
    topSellerRows
  ] = await Promise.all([
    db
      .select({
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
        orders: sql<number>`count(*)`
      })
      .from(orders)
      .where(and(countedOrders, gte(orders.createdAt, periodStartIso), lt(orders.createdAt, periodEndIso))),
    db
      .select({
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
        orders: sql<number>`count(*)`
      })
      .from(orders)
      .where(and(countedOrders, gte(orders.createdAt, previousStartIso), lt(orders.createdAt, periodStartIso))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'customer'), gte(users.createdAt, periodStartIso), lt(users.createdAt, periodEndIso))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'customer'), gte(users.createdAt, previousStartIso), lt(users.createdAt, periodStartIso))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.status, 'active'), lt(products.createdAt, periodEndIso))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.status, 'active'), lt(products.createdAt, periodStartIso))),
    db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
        value: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`
      })
      .from(orders)
      .where(and(countedOrders, gte(orders.createdAt, periodStartIso), lt(orders.createdAt, periodEndIso)))
      .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt})`),
    db
      .select({
        date: sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'YYYY-MM-01')`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
        orders: sql<number>`count(*)`,
        customers: sql<number>`count(distinct ${orders.userId})`
      })
      .from(orders)
      .where(and(countedOrders, gte(orders.createdAt, yearStartIso), lt(orders.createdAt, periodEndIso)))
      .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('month', ${orders.createdAt})`),
    db
      .select({
        status: orders.status,
        value: sql<number>`count(*)`
      })
      .from(orders)
      .groupBy(orders.status),
    db
      .select({
        categoryId: categories.id,
        name: sql<string>`coalesce(${categories.name}, ${categories.nameAr}, 'Uncategorized')`,
        revenue: sql<number>`coalesce(sum(${orderItems.total}), 0)`
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(countedOrders, gte(orders.createdAt, periodStartIso), lt(orders.createdAt, periodEndIso)))
      .groupBy(categories.id, categories.name, categories.nameAr)
      .orderBy(desc(sql`coalesce(sum(${orderItems.total}), 0)`))
      .limit(8),
    db
      .select({
        categoryId: categories.id,
        revenue: sql<number>`coalesce(sum(${orderItems.total}), 0)`
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(countedOrders, gte(orders.createdAt, previousStartIso), lt(orders.createdAt, periodStartIso)))
      .groupBy(categories.id),
    db.execute(sql`
      WITH first_orders AS (
        SELECT user_id, date_trunc('day', min(created_at)) AS first_day
        FROM orders
        WHERE status NOT IN ('cancelled', 'refunded', 'returned')
        GROUP BY user_id
      ),
      period_buyers AS (
        SELECT DISTINCT date_trunc('day', o.created_at) AS day, o.user_id
        FROM orders o
        WHERE o.created_at >= ${periodStartIso}
          AND o.created_at < ${periodEndIso}
          AND o.status NOT IN ('cancelled', 'refunded', 'returned')
      )
      SELECT
        to_char(p.day, 'YYYY-MM-DD') AS date,
        count(*) FILTER (WHERE p.day = f.first_day)::int AS "new",
        count(*) FILTER (WHERE p.day <> f.first_day)::int AS returning
      FROM period_buyers p
      JOIN first_orders f ON f.user_id = p.user_id
      GROUP BY p.day
      ORDER BY p.day
    `),
    db
      .select({
        productId: products.id,
        name: sql<string>`coalesce(
          max(${orderItems.productName}),
          max(${productTranslations.title}),
          'Untitled product'
        )`,
        revenue: sql<number>`coalesce(sum(${orderItems.total}), 0)`,
        orders: sql<number>`count(distinct ${orderItems.orderId})`,
        units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
        quantity: sql<number>`coalesce(max(${products.quantity}), 0)`
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.locale, 'en')
        )
      )
      .where(and(countedOrders, gte(orders.createdAt, yearStartIso), lt(orders.createdAt, periodEndIso)))
      .groupBy(products.id)
      .orderBy(desc(sql`coalesce(sum(${orderItems.total}), 0)`))
      .limit(8),
    db
      .select({
        categoryId: products.categoryId,
        products: sql<number>`count(*)`
      })
      .from(products)
      .where(eq(products.status, 'active'))
      .groupBy(products.categoryId),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customer: sql<string>`coalesce(${users.fullName}, ${users.email}, 'Guest')`,
        total: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(8),
    db
      .select({
        sellerId: sellers.id,
        name: sql<string>`coalesce(${sellers.displayName}, ${sellers.businessName})`,
        revenue: sql<number>`coalesce(sum(${orderItems.total}), 0)`,
        orders: sql<number>`count(distinct ${orderItems.orderId})`
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(sellers, eq(orderItems.sellerId, sellers.id))
      .where(and(countedOrders, gte(orders.createdAt, yearStartIso), lt(orders.createdAt, periodEndIso)))
      .groupBy(sellers.id, sellers.displayName, sellers.businessName)
      .orderBy(desc(sql`coalesce(sum(${orderItems.total}), 0)`))
      .limit(8)
  ])

  const currentRevenue = toNumber(currentTotals[0]?.revenue)
  const currentOrderCount = toNumber(currentTotals[0]?.orders)
  const previousRevenue = toNumber(previousTotals[0]?.revenue)
  const previousOrderCount = toNumber(previousTotals[0]?.orders)
  const currentAov = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0
  const previousAov = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0

  const days = eachUtcDay(periodStart, periodEnd)
  const previousCategoryMap = new Map(
    previousCategoryRows.map((row) => [row.categoryId, toNumber(row.revenue)])
  )
  const categoryProductMap = new Map(
    categoryProductCounts.map((row) => [row.categoryId, toNumber(row.products)])
  )

  const activityRaw = Array.isArray(customerActivityRows)
    ? customerActivityRows
    : ((customerActivityRows as { rows?: unknown[] }).rows ?? [])

  const activityMapped = (activityRaw as Array<Record<string, unknown>>).map((row) => ({
    date: String(row.date ?? ''),
    new: toNumber(row.new),
    returning: toNumber(row.returning)
  }))

  return {
    revenue: metric(currentRevenue, previousRevenue),
    orders: metric(currentOrderCount, previousOrderCount),
    customers: metric(toNumber(currentCustomers[0]?.count), toNumber(previousCustomers[0]?.count)),
    aov: metric(currentAov, previousAov),
    activeProducts: metric(
      toNumber(currentProducts[0]?.count),
      toNumber(previousProducts[0]?.count)
    ),
    dailyRevenue: fillDailySeries(
      days,
      dailyRevenueRows.map((row) => ({ date: row.date, value: toNumber(row.value) }))
    ),
    monthlyRevenue: monthlyRows.map((row) => ({
      date: row.date,
      value: toNumber(row.revenue)
    })),
    monthlyOrders: monthlyRows.map((row) => ({
      date: row.date,
      value: toNumber(row.orders)
    })),
    monthlyAov: monthlyRows.map((row) => {
      const orderCount = toNumber(row.orders)
      return {
        date: row.date,
        value: orderCount > 0 ? toNumber(row.revenue) / orderCount : 0
      }
    }),
    monthlyClv: monthlyRows.map((row) => {
      const customerCount = toNumber(row.customers)
      return {
        date: row.date,
        value: customerCount > 0 ? toNumber(row.revenue) / customerCount : 0
      }
    }),
    orderStatus: statusRows.map((row) => ({
      name: labelStatus(row.status ?? 'unknown'),
      value: toNumber(row.value),
      color: STATUS_COLORS[row.status ?? '']
    })),
    salesByCategory: categoryRows.map((row) => ({
      name: row.name || 'Uncategorized',
      value: toNumber(row.revenue)
    })),
    customerActivity: fillCustomerSeries(days, activityMapped),
    topProducts: topProductRows.map((row) => ({
      productId: row.productId,
      name: row.name,
      revenue: toNumber(row.revenue),
      orders: toNumber(row.orders),
      units: toNumber(row.units),
      quantity: toNumber(row.quantity)
    })),
    categories: categoryRows.map((row) => ({
      categoryId: row.categoryId ?? 'uncategorized',
      name: row.name || 'Uncategorized',
      revenue: toNumber(row.revenue),
      products: row.categoryId ? categoryProductMap.get(row.categoryId) ?? 0 : 0,
      growthPercent: percentChange(
        toNumber(row.revenue),
        row.categoryId ? previousCategoryMap.get(row.categoryId) ?? 0 : 0
      )
    })),
    recentOrders: recentOrderRows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      customer: row.customer,
      total: toNumber(row.total),
      status: labelStatus(row.status ?? 'unknown'),
      createdAt: row.createdAt ?? ''
    })),
    topSellers: topSellerRows.map((row) => ({
      sellerId: row.sellerId,
      name: row.name,
      revenue: toNumber(row.revenue),
      orders: toNumber(row.orders)
    }))
  }
}
