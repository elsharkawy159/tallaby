import { formatPrice } from "@workspace/lib";
import { getLocale, getTranslations } from "next-intl/server";
import type { getPaymobPaymentOrder } from "@/actions/paymob";

type PaymentOrder = NonNullable<
  Awaited<ReturnType<typeof getPaymobPaymentOrder>>["data"]
>;

interface PaymentOrderSummaryProps {
  order: PaymentOrder;
}

function formatAddressLines(
  address: PaymentOrder["userAddress_shippingAddressId"]
) {
  if (!address) {
    return null;
  }

  const lines = [
    address.fullName,
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);

  return lines;
}

export async function PaymentOrderSummary({ order }: PaymentOrderSummaryProps) {
  const locale = await getLocale();
  const tCheckout = await getTranslations("checkout");
  const tOrders = await getTranslations("orders");
  const tCommon = await getTranslations("common");
  const tAuth = await getTranslations("auth");

  const shippingAddress = order.userAddress_shippingAddressId;
  const contactName =
    shippingAddress?.fullName || order.user?.fullName || null;
  const contactPhone = shippingAddress?.phone || order.user?.phone || null;
  const contactEmail = order.user?.email || null;
  const addressLines = formatAddressLines(shippingAddress);
  const discountAmount = Number(order.discountAmount ?? 0);
  const shippingCost = Number(order.shippingCost ?? 0);
  const tax = Number(order.tax ?? 0);
  const subtotal = Number(order.subtotal ?? 0);
  const totalAmount = Number(order.totalAmount ?? 0);

  return (
    <section
      aria-label={tCheckout("orderDetails")}
      className="rounded-lg border border-gray-200 bg-white p-3 md:p-4 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {tCheckout("orderDetails")}
          </h2>
          <div className="space-y-1 text-xs text-gray-700">
            <p>
              <span className="font-medium text-gray-500">
                {tOrders("orderNumber")}:
              </span>{" "}
              <span className="font-mono font-semibold text-gray-900">
                {order.orderNumber}
              </span>
            </p>
            <p>
              <span className="font-medium text-gray-500">
                {tCheckout("paymentMethod")}:
              </span>{" "}
              {tCheckout("onlinePayment")}
            </p>
            {order.couponCode && (
              <p>
                <span className="font-medium text-gray-500">
                  {tCheckout("coupon")}:
                </span>{" "}
                <span className="font-mono">{order.couponCode}</span>
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {tOrders("orderItems")} ({order.orderItems.length})
          </h2>
          <ul className="max-h-28 space-y-1.5 overflow-y-auto pr-1 text-xs text-gray-700">
            {order.orderItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 border-b border-gray-100 pb-1.5 last:border-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.variantName}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {tCommon("quantity")}: {item.quantity}
                  </p>
                </div>
                <span
                  className="shrink-0 font-medium text-gray-900"
                  dangerouslySetInnerHTML={{
                    __html: formatPrice(Number(item.total), locale),
                  }}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {tCheckout("shippingAddress")}
          </h2>
          {addressLines ? (
            <address className="space-y-0.5 text-xs not-italic leading-relaxed text-gray-700">
              {addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {shippingAddress?.deliveryInstructions && (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  <span className="font-medium">
                    {tCheckout("deliveryInstructions")}
                  </span>{" "}
                  {shippingAddress.deliveryInstructions}
                </p>
              )}
            </address>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {tCheckout("contactInfo")}
          </h2>
          <div className="space-y-1 text-xs text-gray-700">
            {contactName && (
              <p>
                <span className="font-medium text-gray-500">
                  {tAuth("fullName")}:
                </span>{" "}
                {contactName}
              </p>
            )}
            {contactPhone && (
              <p>
                <span className="font-medium text-gray-500">
                  {tOrders("phone")}:
                </span>{" "}
                {contactPhone}
              </p>
            )}
            {contactEmail && (
              <p className="break-all">
                <span className="font-medium text-gray-500">
                  {tAuth("email")}:
                </span>{" "}
                {contactEmail}
              </p>
            )}
            {!contactName && !contactPhone && !contactEmail && (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs">
        <span className="text-gray-500">
          {tCheckout("subtotal")}:{" "}
          <span
            className="font-medium text-gray-900"
            dangerouslySetInnerHTML={{
              __html: formatPrice(subtotal, locale),
            }}
          />
        </span>
        {shippingCost > 0 && (
          <span className="text-gray-500">
            {tCheckout("shipping")}:{" "}
            <span
              className="font-medium text-gray-900"
              dangerouslySetInnerHTML={{
                __html: formatPrice(shippingCost, locale),
              }}
            />
          </span>
        )}
        {tax > 0 && (
          <span className="text-gray-500">
            {tCheckout("tax")}:{" "}
            <span
              className="font-medium text-gray-900"
              dangerouslySetInnerHTML={{
                __html: formatPrice(tax, locale),
              }}
            />
          </span>
        )}
        {discountAmount > 0 && (
          <span className="text-green-600">
            {tCheckout("discount")}:{" "}
            <span
              className="font-medium"
              dangerouslySetInnerHTML={{
                __html: `-${formatPrice(discountAmount, locale)}`,
              }}
            />
          </span>
        )}
        <span className="text-sm font-bold text-primary">
          {tCheckout("total")}:{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: formatPrice(totalAmount, locale),
            }}
          />
        </span>
      </div>
    </section>
  );
}
