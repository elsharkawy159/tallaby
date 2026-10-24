import { db, eq, orders, shipments } from "@workspace/db";
import {
  emailPathPrefix,
  formatPaymentMethodLabel,
  PLATFORM_BRAND,
  resolveEmailLocale,
  type EmailAddress,
  type EmailBrand,
  type EmailLineItem,
  type EmailLocale,
} from "@workspace/emails";
import { buildOrderPagePath } from "@workspace/lib/orders";
import { DEFAULT_CURRENCY, formatMoney, joinUrl, resolveImageUrl, SITE_URL } from "./format";
import { loadStoreEmailContext, type StoreEmailContext } from "./store-brand";

/** Everything the order lifecycle mail needs, loaded fresh from the database. */
export interface OrderEmailContext {
  order: NonNullable<Awaited<ReturnType<typeof loadOrder>>>;
  locale: EmailLocale;
  currency: string;
  recipient: string | null;
  customerName: string;
  /** Store of a storefront order, else null (marketplace order). */
  store: StoreEmailContext | null;
  brand: EmailBrand;
  /** Origin the customer shops on: the store host or tallaby.com. */
  siteUrl: string;
  orderUrl: string;
  address: EmailAddress | null;
  paymentMethod: string | null;
  isCashOnDelivery: boolean;
  money: (value: string | number | null | undefined) => string;
  shipment: { carrier: string | null; trackingNumber: string | null; deliveredAt: string | null; estimatedDeliveryDate: string | null } | null;
}

async function loadOrder(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      user: { columns: { email: true, fullName: true, preferredLanguage: true, receiveMarketingEmails: true } },
      userAddress_shippingAddressId: true,
      orderItems: {
        with: {
          product: { columns: { images: true, sku: true, quantity: true } },
          productVariant: { columns: { sku: true, stock: true, imageUrl: true } },
          seller: { columns: { displayName: true } },
        },
      },
    },
  });
}

const COD_METHODS = new Set(["cash", "cash_on_delivery", "cod"]);

export async function loadOrderEmailContext(orderId: string): Promise<OrderEmailContext | null> {
  const order = await loadOrder(orderId);
  if (!order) return null;

  const preferred = order.user?.preferredLanguage;
  let locale = resolveEmailLocale(preferred);
  let brandStore = order.storeId ? await loadStoreEmailContext(order.storeId, locale) : null;
  // No saved language: a storefront order speaks the store's default language
  // (reloaded so the brand picks that language's font).
  if (!preferred && brandStore?.defaultLocale && brandStore.defaultLocale !== locale) {
    locale = brandStore.defaultLocale;
    brandStore = await loadStoreEmailContext(brandStore.storeId, locale);
  }

  const currency = order.currency || DEFAULT_CURRENCY;
  const siteUrl = brandStore?.url ?? SITE_URL;
  const address = order.userAddress_shippingAddressId;
  const [shipment] = await db
    .select({
      carrier: shipments.carrier,
      trackingNumber: shipments.trackingNumber,
      deliveredAt: shipments.deliveredAt,
      estimatedDeliveryDate: shipments.estimatedDeliveryDate,
    })
    .from(shipments)
    .where(eq(shipments.orderId, order.id))
    .limit(1);

  return {
    order,
    locale,
    currency,
    recipient: order.user?.email?.trim() || null,
    customerName: address?.fullName || order.user?.fullName || "",
    store: brandStore,
    brand: brandStore?.brand ?? PLATFORM_BRAND,
    siteUrl,
    orderUrl: joinUrl(siteUrl, `${emailPathPrefix(locale)}${buildOrderPagePath(order.id)}`),
    address: address
      ? {
          fullName: address.fullName,
          lines: [
            address.addressLine1,
            address.addressLine2 ?? "",
            [address.city, address.state].filter(Boolean).join(", ") + (address.postalCode ? ` ${address.postalCode}` : ""),
            address.country,
          ].filter((line) => line.trim().length > 0),
          phone: address.phone,
        }
      : null,
    paymentMethod: formatPaymentMethodLabel(order.paymentMethod, locale),
    isCashOnDelivery: COD_METHODS.has((order.paymentMethod ?? "").toLowerCase()),
    money: (value) => formatMoney(value, locale, currency),
    shipment: shipment ?? null,
  };
}

type OrderItemRow = OrderEmailContext["order"]["orderItems"][number];

export function lineItem(ctx: OrderEmailContext, item: OrderItemRow): EmailLineItem {
  return {
    name: item.productName,
    variant: item.variantName,
    quantity: item.quantity,
    price: ctx.money(item.subtotal),
    imageUrl: resolveImageUrl(item.productVariant?.imageUrl) ?? resolveImageUrl(item.product?.images),
    sellerName: item.seller?.displayName ?? null,
    sku: item.productVariant?.sku ?? item.product?.sku ?? null,
  };
}

/** Items grouped by seller, in order. The first item id is the seller's email reference. */
export function itemsBySeller(ctx: OrderEmailContext): Map<string, OrderItemRow[]> {
  const groups = new Map<string, OrderItemRow[]>();
  for (const item of ctx.order.orderItems) {
    if (!item.sellerId) continue;
    const list = groups.get(item.sellerId) ?? [];
    list.push(item);
    groups.set(item.sellerId, list);
  }
  return groups;
}
