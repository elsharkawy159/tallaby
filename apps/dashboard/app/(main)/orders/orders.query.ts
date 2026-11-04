import {
  and,
  db,
  eq,
  inArray,
  orderItems,
  orders,
  sellerCustomDomains,
  storeBlockedPhones,
  stores as storesTable,
  userWalletTransactions,
  users,
} from "@workspace/db";
import { WALLET_REFERENCE_TYPES } from "@workspace/db/wallet";
import { hasOrderRisk, type OrderRisk } from "@workspace/lib/customers";
import { loadStoreOrderRisks } from "@workspace/lib/customers/server";
import { normalizeBlockedPhone } from "@workspace/lib/stores/blocked-phones";
import { storeUrl } from "@workspace/lib/storefront";
import { getStorefrontProductUrl } from "@/lib/constants";
import { loadProductStoreLinks } from "../products/_components/product-store-links.data";
import { isSellerHandledLine, resolveSellerOrderFlow } from "./order-flow.lib";
import { canRestockReturn } from "./order-stock.lib";
import {
  parseOrderConfirmTemplate,
  renderOrderConfirmMessage,
  unconfirmedHours,
} from "./order-confirm.lib";
import {
  pickProductSlug,
  resolveCustomerEmail,
  resolveCustomerName,
  resolveCustomerPhone,
} from "./orders.lib";
import type { OrderSummary, SellerOrderRow } from "./orders.types";

const toNumber = (value: string | number | null | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** The seller's stores and integrations a row needs. Loaded once per request. */
export type OrderRowContext = {
  stores: { id: string; name: string; subdomain: string }[];
  /** Stores of this seller with Bosta connected, and when they ship (BS-08/09). */
  bostaStores: ReadonlyMap<string, { autoShip: "manual" | "on_confirm"; canCancel: boolean }>;
  /** Stores of this seller with Wassalha (Egypt Post) set up (F-12c). */
  wassalhaStores: ReadonlySet<string>;
};

/** Only orders with at least one line of this seller, whatever ids were asked for. */
const ownOrders = (sellerId: string) =>
  inArray(orders.id, db.select({ id: orderItems.orderId }).from(orderItems).where(eq(orderItems.sellerId, sellerId)));

const loadWalletPaid = async (ids: string[]) => {
  const rows = await db
    .select({ orderId: userWalletTransactions.referenceId })
    .from(userWalletTransactions)
    .where(
      and(
        eq(userWalletTransactions.referenceType, WALLET_REFERENCE_TYPES.order),
        eq(userWalletTransactions.type, "order_payment"),
        eq(userWalletTransactions.status, "completed"),
        inArray(userWalletTransactions.referenceId, ids),
      ),
    );
  return new Set(rows.map((w) => w.orderId));
};

/** One flow for the list, the selection and the server action. */
function orderFlow(
  sellerId: string,
  order: {
    id: string;
    status: string | null;
    paymentStatus: string | null;
    isDigitalOnly: boolean | null;
    orderItems: { sellerId: string; fulfillmentType: string | null }[];
    shipments: { status: string; sellerId: string | null; externalId: string | null }[];
  },
  walletPaid: ReadonlySet<string | null>,
) {
  const mine = order.orderItems.filter((i) => i.sellerId === sellerId);
  const shipment = order.shipments[0] ?? null;
  return resolveSellerOrderFlow({
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    isDigitalOnly: order.isDigitalOnly,
    allLinesOwned: order.orderItems.every((i) => i.sellerId === sellerId),
    sellerFulfilled: mine.some((i) => isSellerHandledLine(i.fulfillmentType)),
    shipment: shipment
      ? { status: shipment.status, ownedBySeller: shipment.sellerId === sellerId, carrierManaged: Boolean(shipment.externalId) }
      : null,
    walletPaid: walletPaid.has(order.id),
  });
}

/**
 * What selecting or queueing an order needs, without the rest of the row: the
 * whole filtered list can be selected, and most of it never reaches the page.
 * In the order of `ids`; ids that are not this seller's are dropped.
 */
export async function loadOrderSummaries(
  sellerId: string,
  ids: string[],
  { bostaStores, wassalhaStores }: Pick<OrderRowContext, "bostaStores" | "wassalhaStores">,
): Promise<OrderSummary[]> {
  if (ids.length === 0) return [];
  const [list, walletPaid] = await Promise.all([
    db.query.orders.findMany({
      where: and(inArray(orders.id, ids), ownOrders(sellerId)),
      columns: { id: true, status: true, paymentStatus: true, isDigitalOnly: true, storeId: true },
      with: {
        shipments: { columns: { status: true, sellerId: true, externalId: true, carrier: true, trackingNumber: true } },
        orderItems: { columns: { sellerId: true, fulfillmentType: true } },
      },
    }),
    loadWalletPaid(ids),
  ]);
  const byId = new Map(list.map((o) => [o.id, o]));
  return ids.flatMap((id) => {
    const o = byId.get(id);
    if (!o) return [];
    const shipment = o.shipments[0] ?? null;
    return [
      {
        id: o.id,
        storeId: o.storeId,
        flow: orderFlow(sellerId, o, walletPaid),
        bostaConnected: Boolean(o.storeId && bostaStores.has(o.storeId)),
        wassalhaConnected: Boolean(o.storeId && wassalhaStores.has(o.storeId)),
        wassalhaExported: shipment?.carrier === "wassalha" && shipment.sellerId === sellerId,
        bosta:
          shipment?.carrier === "bosta" && shipment.sellerId === sellerId
            ? { trackingNumber: shipment.trackingNumber }
            : null,
      },
    ];
  });
}

/**
 * Full rows for /orders, in the order of `ids`: orders with at least one of
 * this seller's lines (other ids are dropped), carrying only their lines plus
 * what the order panel and its status actions need (no second fetch when a
 * seller opens one). The ids come from orders-list.query.ts.
 */
export async function loadSellerOrders(
  sellerId: string,
  ids: string[],
  { stores, bostaStores, wassalhaStores }: OrderRowContext,
  /** The export has no risk column, and risks are the costly part of a row. */
  options: { withRisks?: boolean } = {},
): Promise<SellerOrderRow[]> {
  if (ids.length === 0) return [];
  const found = await db.query.orders.findMany({
    where: and(inArray(orders.id, ids), ownOrders(sellerId)),
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
      metadata: true,
      orderSource: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
      cancelledAt: true,
    },
    with: {
      user: { columns: { email: true, fullName: true, phone: true, isGuest: true } },
      userAddress_shippingAddressId: {
        columns: {
          fullName: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          deliveryInstructions: true,
          latitude: true,
          longitude: true,
        },
      },
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

  if (found.length === 0) return [];
  const byId = new Map(found.map((o) => [o.id, o]));
  const list = ids.flatMap((id) => byId.get(id) ?? []);
  const riderIds = [
    ...new Set(list.flatMap((o) => o.shipments.map((s) => s.riderId)).filter((id): id is string => Boolean(id))),
  ];

  const ownLines = list.flatMap((o) => o.orderItems.filter((i) => i.sellerId === sellerId));
  const slugByProduct = new Map(
    ownLines.map((i) => [i.productId, pickProductSlug(i.product?.productTranslations)]),
  );

  const ownStoreIds = stores.map((s) => s.id);
  const [walletPaidOrders, riders, domains, marketplaceLinks, blocked, storeConfirm, risks] = await Promise.all([
    loadWalletPaid(ids),
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
    // Phones this seller blocked on their stores (ROADMAP.md F-02).
    ownStoreIds.length
      ? db
          .select({ storeId: storeBlockedPhones.storeId, phone: storeBlockedPhones.phone })
          .from(storeBlockedPhones)
          .where(inArray(storeBlockedPhones.storeId, ownStoreIds))
      : Promise.resolve([]),
    // Each store's WhatsApp confirm template and language (ROADMAP.md F-02g).
    ownStoreIds.length
      ? db
          .select({ id: storesTable.id, settings: storesTable.settings, defaultLocale: storesTable.defaultLocale })
          .from(storesTable)
          .where(and(eq(storesTable.sellerId, sellerId), inArray(storesTable.id, ownStoreIds)))
      : Promise.resolve([]),
    // Refusals and quick duplicates of the same phone on the same store (ROADMAP.md F-02d).
    options.withRisks === false
      ? Promise.resolve(new Map<string, OrderRisk>())
      : loadStoreOrderRisks(
          sellerId,
          list.map((o) => ({
            orderId: o.id,
            storeId: o.storeId,
            addressPhone: o.userAddress_shippingAddressId?.phone ?? null,
            userPhone: o.user?.phone ?? null,
          })),
        ),
  ]);
  const confirmByStore = new Map(
    storeConfirm.map((row) => [
      row.id,
      {
        template: parseOrderConfirmTemplate(row.settings),
        locale: row.defaultLocale === "en" ? ("en" as const) : ("ar" as const),
      },
    ]),
  );
  const now = Date.now();
  const blockedKeys = new Set(blocked.map((b) => `${b.storeId}:${b.phone}`));
  const isBlocked = (storeId: string | null, phone: string | null) => {
    const normalized = phone ? normalizeBlockedPhone(phone) : null;
    return Boolean(storeId && normalized && blockedKeys.has(`${storeId}:${normalized}`));
  };

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
    const customerPhone = resolveCustomerPhone(o);

    const flow = orderFlow(sellerId, o, walletPaidOrders);

    const confirm = o.storeId ? confirmByStore.get(o.storeId) : undefined;
    const createdAt = o.createdAt ?? new Date(now).toISOString();

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt,
      storeId: o.storeId,
      storeName: store?.name ?? null,
      customerName: resolveCustomerName(o, ""),
      customerPhone,
      customerBlocked: Boolean(store) && isBlocked(o.storeId, customerPhone),
      risk: (() => {
        const risk = risks.get(o.id);
        return hasOrderRisk(risk) ? risk : null;
      })(),
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
      bostaAutoShip: Boolean(o.storeId && bostaStores.get(o.storeId)?.autoShip === "on_confirm"),
      bostaCanCancel: Boolean(o.storeId && bostaStores.get(o.storeId)?.canCancel),
      wassalhaConnected: Boolean(o.storeId && wassalhaStores.has(o.storeId)),
      wassalhaExported: shipment?.carrier === "wassalha" && shipment.sellerId === sellerId,
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
      isManual: o.orderSource === "manual",
      canRestockReturn: canRestockReturn(flow.stage, o.metadata, Boolean(flow.readOnly)),
      confirmMessage:
        store && confirm && customerPhone && flow.stage === "new"
          ? renderOrderConfirmMessage(confirm.template, {
              order: {
                customerName: resolveCustomerName(o, ""),
                orderNumber: o.orderNumber,
                totalAmount: o.totalAmount ?? "0",
                lines: mine.map((i) => ({ productName: i.productName, variantName: i.variantName, quantity: i.quantity ?? 1 })),
                address: addr
                  ? {
                      line: [addr.addressLine1, addr.addressLine2].filter(Boolean).join(", "),
                      area: [addr.city, addr.state].filter(Boolean).join(", "),
                    }
                  : null,
              },
              storeName: store.name,
              locale: confirm.locale,
            })
          : null,
      unconfirmedHours: unconfirmedHours(flow.stage, createdAt, now),
      shippedAt: o.shippedAt,
      deliveredAt: o.deliveredAt,
      cancelledAt: o.cancelledAt,
    } satisfies SellerOrderRow;
  });
}
