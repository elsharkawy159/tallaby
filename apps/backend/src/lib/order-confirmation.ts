import { db, orders, eq } from "@workspace/db";
import { buildOrderPagePath } from "@workspace/lib/orders";
import {
  emailDateLocale,
  emailIntlLocale,
  emailPathPrefix,
  formatPaymentMethodLabel,
  resolveEmailLocale,
  type OrderConfirmationEmailProps,
} from "@workspace/emails";

const DEFAULT_CURRENCY = "EGP";

/** Business days padding used by the storefront's order page estimate. */
const ESTIMATED_DELIVERY_DAYS = 5;

function formatMoney(
  value: string | number | null | undefined,
  currency: string,
  locale: ReturnType<typeof resolveEmailLocale>
): string {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat(emailIntlLocale(locale), {
    style: "currency",
    currency: currency || DEFAULT_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

function formatDate(
  value: string | null | undefined,
  locale: ReturnType<typeof resolveEmailLocale>
): string {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

  return safeDate.toLocaleDateString(emailDateLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Resolves a product image to an absolute URL. Storage keys are expanded to
 * their Supabase public URL; anything we cannot resolve confidently is dropped
 * so the email never renders a broken image.
 */
function resolveImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;

  const first = images[0] as unknown;
  const key =
    typeof first === "string"
      ? first
      : typeof (first as { url?: unknown })?.url === "string"
        ? (first as { url: string }).url
        : null;

  if (!key?.trim()) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;

  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  if (!projectId) return null;

  return `https://${projectId}.supabase.co/storage/v1/object/public/products/${key}`;
}

export type OrderConfirmationBuildResult =
  | { success: true; data: OrderConfirmationEmailProps; recipient: string }
  | { success: false; error: string; status: 404 | 422 };

/**
 * Loads a committed order and shapes it into the customer-facing email
 * contract. Language comes from `users.preferred_language` (Arabic or English).
 */
export async function buildOrderConfirmationEmailData(
  orderId: string
): Promise<OrderConfirmationBuildResult> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      user: {
        columns: { email: true, fullName: true, preferredLanguage: true },
      },
      userAddress_shippingAddressId: true,
      orderItems: {
        with: {
          product: { columns: { images: true } },
          seller: { columns: { displayName: true } },
        },
      },
    },
  });

  if (!order) {
    return { success: false, error: "Order not found", status: 404 };
  }

  const recipient = order.user?.email?.trim();
  if (!recipient) {
    return {
      success: false,
      error: "Customer has no email address on file",
      status: 422,
    };
  }

  const locale = resolveEmailLocale(order.user?.preferredLanguage);
  const currency = order.currency || DEFAULT_CURRENCY;
  const address = order.userAddress_shippingAddressId;
  const discountAmount = Number(order.discountAmount ?? 0);

  const items: OrderConfirmationEmailProps["items"] = order.orderItems.map(
    (item) => ({
      productName: item.productName,
      variantName: item.variantName,
      sellerName: item.seller?.displayName ?? null,
      quantity: item.quantity,
      unitPrice: formatMoney(item.price, currency, locale),
      lineTotal: formatMoney(item.subtotal, currency, locale),
      imageUrl: resolveImageUrl(item.product?.images),
    })
  );

  const estimatedDelivery = order.isDigitalOnly
    ? null
    : formatDate(
        new Date(
          new Date(order.createdAt ?? Date.now()).getTime() +
            ESTIMATED_DELIVERY_DAYS * 24 * 60 * 60 * 1000
        ).toISOString(),
        locale
      );

  const siteUrl =
    process.env.ECOMMERCE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.tallaby.com";

  return {
    success: true,
    recipient,
    data: {
      locale,
      customer: {
        name: address?.fullName || order.user?.fullName || "there",
        email: recipient,
      },
      order: {
        orderNumber: order.orderNumber,
        orderDate: formatDate(order.createdAt, locale),
        estimatedDelivery,
      },
      items,
      pricing: {
        subtotal: formatMoney(order.subtotal, currency, locale),
        shipping: formatMoney(order.shippingCost, currency, locale),
        discount:
          discountAmount > 0
            ? formatMoney(discountAmount, currency, locale)
            : null,
        couponCode: order.couponCode ?? null,
        total: formatMoney(order.totalAmount, currency, locale),
      },
      paymentMethod: formatPaymentMethodLabel(order.paymentMethod, locale),
      shippingAddress: address
        ? {
            fullName: address.fullName,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone,
          }
        : null,
      links: {
        viewOrder: `${siteUrl.replace(/\/+$/, "")}${emailPathPrefix(locale)}${buildOrderPagePath(order.id)}`,
      },
    },
  };
}
