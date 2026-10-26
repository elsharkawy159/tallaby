import {
  and,
  db,
  desc,
  eq,
  inArray,
  orderItems,
  orders,
  sellerCustomDomains,
  userWalletTransactions,
  users,
} from "@workspace/db";
import { WALLET_REFERENCE_TYPES } from "@workspace/db/wallet";
import { storeUrl } from "@workspace/lib/storefront";
import { getStorefrontProductUrl } from "@/lib/constants";
import { loadProductStoreLinks } from "../products/_components/product-store-links.data";
import { isSellerHandledLine, resolveSellerOrderFlow } from "./order-flow.lib";
import {
  pickProductSlug,
  resolveCustomerEmail,
  resolveCustomerName,
  resolveCustomerPhone,
} from "./orders.lib";
import type { SellerOrderRow } from "./orders.types";

const LIST_LIMIT = 200;

const toNumber = (value: string | number | null | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * The seller's orders for /orders, newest first: every order with at least
 * one of their lines, carrying only their lines plus what the order panel
 * and its status actions need (no second fetch when a seller opens one).
 */
export async function loadSellerOrders(
  sellerId: string,
  stores: { id: string; name: string; subdomain: string }[],
  /** Stores of this seller with Bosta connected, and when they ship (BS-08/09). */
  bostaStores: ReadonlyMap<string, "manual" | "on_confirm"> = new Map(),
): Promise<SellerOrderRow[]> {
  const list = await db.query.orders.findMany({
    where: inArray(
      orders.id,
      db.select({ id: orderItems.orderId }).from(orderItems).where(eq(orderItems.sellerId, sellerId)),
    ),
    orderBy: [desc(orders.createdAt)],
    limit: LIST_LIMIT,
    columns: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      subtotal: true,
      shippingCost: true,
      discountAmount: true,
      totalAmount: true,
      notes: true,
      isGift: true,
      giftMessage: true,
      isDigitalOnly: true,
      storeId: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
      cancelledAt: true,
    },
    with: {
      user: { columns: { email: true, fullName: true, phone: true, isGuest: true } },
      userAddress_shippingAddressId: true,
      shipments: {
        columns: {
          id: true,
          status: true,
          sellerId: true,
          riderId: true,
          failureReason: true,
          carrier: true,
          externalId: true,
          trackingNumber: true,
          externalStateCode: true,
          externalState: true,
          needsAttention: true,
          lastError: true,
          lastSyncedAt: true,
        },
      },
      // Every line, so a multi-seller order is recognised; only ours are shown.
      orderItems: {
        columns: {
          id: true,
          sellerId: true,
          productId: true,
          productName: true,
          variantName: true,
          sku: true,
          quantity: true,
          price: true,
          total: true,
          fulfillmentType: true,
        },
        with: {
          product: {
            columns: { images: true },
            with: { productTranslations: { columns: { locale: true, slug: true } } },
          },
        },
      },
    },
  });

  if (list.length === 0) return [];
  const ids = list.map((o) => o.id);
  const riderIds = [
    ...new Set(list.flatMap((o) => o.shipments.map((s) => s.riderId)).filter((id): id is string => Boolean(id))),
  ];

  const ownLines = list.flatMap((o) => o.orderItems.filter((i) => i.sellerId === sellerId));
  const slugByProduct = new Map(
    ownLines.map((i) => [i.productId, pickProductSlug(i.product?.productTranslations)]),
  );

  const [walletPaid, riders, domains, marketplaceLinks] = await Promise.all([
    db
      .select({ orderId: userWalletTransactions.referenceId })
      .from(userWalletTransactions)
      .where(
        and(
          eq(userWalletTransactions.referenceType, WALLET_REFERENCE_TYPES.order),
          eq(userWalletTransactions.type, "order_payment"),
          eq(userWalletTransactions.status, "completed"),
          inArray(userWalletTransactions.referenceId, ids),
        ),
      ),
    riderIds.length
      ? db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, riderIds))
      : Promise.resolve([]),
    db
      .select({ storeId: sellerCustomDomains.storeId, domain: sellerCustomDomains.domain })
      .from(sellerCustomDomains)
      .where(and(eq(sellerCustomDomains.sellerId, sellerId), eq(sellerCustomDomains.status, "active"))),
    // Marketplace orders have no store: link the store site that shows the product.
    loadProductStoreLinks(
      [...slugByProduct].map(([id, slug]) => ({ id, slug })),
    ),
  ]);

  const walletPaidOrders = new Set(walletPaid.map((w) => w.orderId));
  const riderNames = new Map(riders.map((r) => [r.id, r.fullName]));
  const domainByStore = new Map(domains.map((d) => [d.storeId, d.domain]));
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const productUrl = (storeId: string | null, productId: string): string | null => {
    const slug = slugByProduct.get(productId);
    if (!slug) return null;
    const store = storeId ? storeById.get(storeId) : undefined;
    if (store) {
      return `${storeUrl(store.subdomain, domainByStore.get(store.id) ?? null)}/products/${encodeURIComponent(slug)}`;
    }
    return marketplaceLinks.get(productId) ?? getStorefrontProductUrl(encodeURIComponent(slug));
  };

  return list.map((o) => {
    const mine = o.orderItems.filter((i) => i.sellerId === sellerId);
    const shipment = o.shipments[0] ?? null;
    const addr = o.userAddress_shippingAddressId;
    const store = o.storeId ? storeById.get(o.storeId) : undefined;

    const flow = resolveSellerOrderFlow({
      orderStatus: o.status,
      paymentStatus: o.paymentStatus,
      isDigitalOnly: o.isDigitalOnly,
      allLinesOwned: o.orderItems.every((i) => i.sellerId === sellerId),
      sellerFulfilled: mine.some((i) => isSellerHandledLine(i.fulfillmentType)),
      shipment: shipment
        ? { status: shipment.status, ownedBySeller: shipment.sellerId === sellerId, carrierManaged: Boolean(shipment.externalId) }
        : null,
      walletPaid: walletPaidOrders.has(o.id),
    });

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt ?? new Date().toISOString(),
      storeId: o.storeId,
      storeName: store?.name ?? null,
      customerName: resolveCustomerName(o, ""),
      customerPhone: resolveCustomerPhone(o),
      customerEmail: resolveCustomerEmail(o),
      isGuest: o.user?.isGuest ?? false,
      address: addr
        ? {
            fullName: addr.fullName,
            phone: addr.phone,
            line: [addr.addressLine1, addr.addressLine2].filter(Boolean).join(", "),
            area: [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
            country: addr.country,
            instructions: addr.deliveryInstructions,
            latitude: toNumber(addr.latitude),
            longitude: toNumber(addr.longitude),
          }
        : null,
      notes: o.notes,
      giftMessage: o.isGift ? o.giftMessage : null,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      subtotal: o.subtotal ?? "0",
      shippingCost: o.shippingCost ?? "0",
      discountAmount: o.discountAmount ?? "0",
      totalAmount: o.totalAmount ?? "0",
      lines: mine.map((i) => ({
        id: i.id,
        productName: i.productName,
        variantName: i.variantName,
        sku: i.sku,
        quantity: i.quantity ?? 1,
        price: i.price ?? "0",
        total: i.total ?? "0",
        image: (i.product?.images as string[] | null | undefined)?.[0] ?? null,
        productUrl: productUrl(o.storeId, i.productId),
      })),
      itemCount: mine.reduce((n, i) => n + (i.quantity ?? 1), 0),
      failureReason: shipment?.failureReason ?? null,
      riderName: shipment?.riderId ? (riderNames.get(shipment.riderId) ?? null) : null,
      bostaConnected: Boolean(o.storeId && bostaStores.has(o.storeId)),
      bostaAutoShip: Boolean(o.storeId && bostaStores.get(o.storeId) === "on_confirm"),
      bosta:
        shipment?.carrier === "bosta" && shipment.sellerId === sellerId
          ? {
              trackingNumber: shipment.trackingNumber,
              stateCode: shipment.externalStateCode,
              state: shipment.externalState === "creating" ? null : shipment.externalState,
              creating: shipment.externalState === "creating" && !shipment.externalId,
              needsAttention: shipment.needsAttention,
              lastError: shipment.lastError,
              lastSyncedAt: shipment.lastSyncedAt,
            }
          : null,
      flow,
      shippedAt: o.shippedAt,
      deliveredAt: o.deliveredAt,
      cancelledAt: o.cancelledAt,
    } satisfies SellerOrderRow;
  });
}
