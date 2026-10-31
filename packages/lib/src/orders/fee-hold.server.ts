import { and, db, eq, gt, inArray, ne, orderItems, orders, sellers, sql, userAddresses, users } from '@workspace/db'
import {
  DUPLICATE_WINDOW_MINUTES,
  isDuplicateOrder,
  isOwnAccount,
  itemsFingerprint,
  orderJunkReasons,
  type FeeHoldReason,
  type FeeHolds,
  type RecentSellerOrder,
} from './fee-hold.lib'

type OrderLine = { sellerId: string; productId: string; variantId?: string | null; quantity: number }

/**
 * Which sellers of a new order get their EGP 5 fee only on delivery, and why
 * (owner, 2026-10-31; rules in fee-hold.lib.ts). Read-only, runs before the
 * order transaction. A lookup failure holds nothing: the fee is then taken
 * at creation as for any order, so an error never makes an order free.
 */
export async function detectFeeHolds(input: {
  userId: string
  address: { fullName?: string | null; phone?: string | null; addressLine1?: string | null } | null | undefined
  lines: ReadonlyArray<OrderLine>
}): Promise<FeeHolds> {
  const sellerIds = [...new Set(input.lines.map((line) => line.sellerId))]
  if (sellerIds.length === 0) return {}
  const orderWide = orderJunkReasons(input.address)

  try {
    const since = sql`now() - make_interval(mins => ${DUPLICATE_WINDOW_MINUTES})`
    const [contacts, customer, recentRows] = await Promise.all([
      db
        .select({
          sellerId: sellers.id,
          supportEmail: sellers.supportEmail,
          supportPhone: sellers.supportPhone,
          email: users.email,
          phone: users.phone,
        })
        .from(sellers)
        .leftJoin(users, eq(users.id, sellers.id))
        .where(inArray(sellers.id, sellerIds)),
      db.query.users.findFirst({ where: eq(users.id, input.userId), columns: { email: true } }),
      // The same sellers' orders in the window. Card orders still waiting for
      // their payment are not a "first" order: a customer retrying a failed
      // payment places a real order.
      db
        .select({
          orderId: orders.id,
          userId: orders.userId,
          phone: userAddresses.phone,
          sellerId: orderItems.sellerId,
          productId: orderItems.productId,
          variantId: orderItems.variantId,
          quantity: orderItems.quantity,
        })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .leftJoin(userAddresses, eq(userAddresses.id, orders.shippingAddressId))
        .where(
          and(
            inArray(orderItems.sellerId, sellerIds),
            gt(orders.createdAt, since),
            ne(orders.status, 'payment_processing'),
          ),
        )
        .limit(2000),
    ])

    // Recent orders per seller, each reduced to that seller's items.
    const recentBySeller = new Map<string, Map<string, { userId: string | null; phone: string | null; lines: OrderLine[] }>>()
    for (const row of recentRows) {
      const perSeller = recentBySeller.get(row.sellerId) ?? new Map()
      recentBySeller.set(row.sellerId, perSeller)
      const entry = perSeller.get(row.orderId) ?? { userId: row.userId, phone: row.phone, lines: [] }
      perSeller.set(row.orderId, entry)
      entry.lines.push({ sellerId: row.sellerId, productId: row.productId, variantId: row.variantId, quantity: row.quantity })
    }

    const holds: FeeHolds = {}
    for (const sellerId of sellerIds) {
      const reasons: FeeHoldReason[] = [...orderWide]
      const seller = contacts.find((c) => c.sellerId === sellerId)
      if (
        seller &&
        isOwnAccount(
          { userId: input.userId, phone: input.address?.phone, email: customer?.email },
          { sellerId, phones: [seller.phone, seller.supportPhone], emails: [seller.email, seller.supportEmail] },
        )
      ) {
        reasons.push('own_account')
      }
      const recent: RecentSellerOrder[] = [...(recentBySeller.get(sellerId)?.values() ?? [])].map((order) => ({
        userId: order.userId,
        phone: order.phone,
        fingerprint: itemsFingerprint(order.lines),
      }))
      const fingerprint = itemsFingerprint(input.lines.filter((line) => line.sellerId === sellerId))
      if (isDuplicateOrder({ userId: input.userId, phone: input.address?.phone, fingerprint }, recent)) {
        reasons.push('duplicate')
      }
      if (reasons.length > 0) holds[sellerId] = reasons
    }
    return holds
  } catch (error) {
    console.error('[fee] detectFeeHolds failed; charging at creation', error)
    return Object.fromEntries(orderWide.length > 0 ? sellerIds.map((id) => [id, orderWide]) : [])
  }
}
