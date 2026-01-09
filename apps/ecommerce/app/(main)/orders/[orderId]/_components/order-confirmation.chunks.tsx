import {
  CheckCircle,
  Package,
  Truck,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import Image from "next/image";
import Link from "next/link";
import type { OrderConfirmationData } from "./order-confirmation.types";
import {
  formatDate,
  getOrderStatusStyle,
  getPaymentStatusStyle,
} from "./order-confirmation.lib";
import { Button } from "@workspace/ui/components/button";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { formatPrice } from "@workspace/lib";
import { OrderStatusTracker } from "./order-status-tracker";
import { OrderItemRow } from "./order-item-row";
import { cn } from "@/lib/utils";

interface OrderConfirmationContentProps {
  data: OrderConfirmationData;
  locale: string;
}

export function OrderConfirmationContent({
  data,
  locale,
}: OrderConfirmationContentProps) {
  const { order, orderItems, shippingAddress, summary } = data;

  return (
    <div className="space-y-4 md:space-y-8 px-4 max-w-6xl mx-auto">
      {/* Success Header */}
      <div className="text-center space-y-3 md:space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center",
                order.status === "pending"
                  ? "bg-green-100"
                  : getOrderStatusStyle(order.status).bg
              )}
            >
              <CheckCircle
                className={cn(
                  "w-8 h-8 md:w-12 md:h-12",
                  order.status === "pending"
                    ? "text-green-500"
                    : getOrderStatusStyle(order.status).text
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">
            {order.status === "pending"
              ? "Order Placed!"
              : `${order.status
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}`}
          </h1>
          <p className="text-xs md:text-lg text-gray-600">
            Thank you for your purchase. Your order has been successfully
            placed.
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs md:text-sm text-gray-500">
            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
            <span>Order placed on {formatDate(order.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Order Summary Card */}

      <Card className="rounded-xl md:rounded-2xl border overflow-hidden pt-0 border-green-200 bg-green-50/50">
        <div className="bg-green-50/50 px-4 md:px-6 py-3 md:py-5 border-b border-green-200">
          <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
            Order Summary
          </CardTitle>
        </div>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between">
                <span className="text-xs md:text-sm font-medium text-gray-600">
                  Order Number:
                </span>
                <span className="text-xs md:text-sm font-mono font-bold text-gray-900">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs md:text-sm font-medium text-gray-600">
                  Status:
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${getOrderStatusStyle(order.status).bg} ${getOrderStatusStyle(order.status).text} ${getOrderStatusStyle(order.status).border}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              {/* <div className="flex justify-between">
                <span className="text-xs md:text-sm font-medium text-gray-600">
                  Payment:
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${getPaymentStatusStyle(order.paymentStatus).bg} ${getPaymentStatusStyle(order.paymentStatus).text} ${getPaymentStatusStyle(order.paymentStatus).border}`}
                >
                  {order.paymentStatus.charAt(0).toUpperCase() +
                    order.paymentStatus.slice(1)}
                </Badge>
              </div> */}
            </div>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between">
                <span className="text-xs md:text-sm font-medium text-gray-600">
                  Payment Method:
                </span>
                <span className="text-xs md:text-sm text-gray-900 capitalize">
                  {order.paymentMethod.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs md:text-sm font-medium text-gray-600">
                  Items:
                </span>
                <span className="text-xs md:text-sm text-gray-900">
                  {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Status Tracking */}
      <OrderStatusTracker
        status={order.status}
        paymentMethod={order.paymentMethod}
      />

      {/* Order Items */}
      <Card className="rounded-xl md:rounded-2xl border overflow-hidden pt-0 bg-white">
        <div className="bg-linear-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
            <Package className="h-4 w-4 md:h-5 md:w-5" /> Order Items
          </CardTitle>
        </div>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {orderItems.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                orderId={order.id}
                orderStatus={order.status}
                locale={locale}
              />
            ))}

            {/* Invoice Breakdown */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t space-y-2 md:space-y-3">
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span
                  className="text-gray-900 font-medium"
                  dangerouslySetInnerHTML={{
                    __html: formatPrice(summary.subtotal, locale),
                  }}
                />
              </div>

              {summary.shippingCost > 0 && (
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span
                    className="text-gray-900 font-medium"
                    dangerouslySetInnerHTML={{
                      __html: formatPrice(summary.shippingCost, locale),
                    }}
                  />
                </div>
              )}

              {summary.tax > 0 && (
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span
                    className="text-gray-900 font-medium"
                    dangerouslySetInnerHTML={{
                      __html: formatPrice(summary.tax, locale),
                    }}
                  />
                </div>
              )}

              {summary.discountAmount > 0 && (
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span
                    className="text-green-600 font-medium"
                    dangerouslySetInnerHTML={{
                      __html: `-${formatPrice(summary.discountAmount, locale)}`,
                    }}
                  />
                </div>
              )}

              <div className="flex justify-between pt-2 md:pt-3 border-t">
                <span className="text-sm md:text-base font-semibold text-gray-900">
                  Total Amount:
                </span>
                <span
                  className="text-base md:text-lg font-bold text-gray-900"
                  dangerouslySetInnerHTML={{
                    __html: formatPrice(summary.totalAmount, locale),
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping & Billing Information */}
      {/* Shipping Address */}
      <Card className="rounded-xl md:rounded-2xl border overflow-hidden pt-0 bg-white">
        <div className="bg-linear-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
            <Truck className="h-4 w-4 md:h-5 md:w-5" /> Shipping Address
          </CardTitle>
        </div>
        <CardContent>
          <p className="text-xs md:text-sm font-medium text-gray-900">
            {shippingAddress.fullName}
          </p>
          <p className="text-xs md:text-sm text-gray-600">
            {shippingAddress.addressLine1}
          </p>
          {shippingAddress.addressLine2 && (
            <p className="text-xs md:text-sm text-gray-600">
              {shippingAddress.addressLine2}
            </p>
          )}
          <p className="text-xs md:text-sm text-gray-600">
            {shippingAddress.city}, {shippingAddress.state}{" "}
            {shippingAddress.postalCode}
          </p>
          <p className="text-xs md:text-sm text-gray-600">
            {shippingAddress.country}
          </p>
          {shippingAddress.phone && (
            <p className="text-xs md:text-sm text-gray-600">
              Phone: {shippingAddress.phone}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Billing Address */}
      {/* {billingAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>Billing Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium text-gray-900">
                {billingAddress.fullName}
              </p>
              <p className="text-gray-600">{billingAddress.addressLine1}</p>
              {billingAddress.addressLine2 && (
                <p className="text-gray-600">{billingAddress.addressLine2}</p>
              )}
              <p className="text-gray-600">
                {billingAddress.city}, {billingAddress.state}{" "}
                {billingAddress.postalCode}
              </p>
              <p className="text-gray-600">{billingAddress.country}</p>
            </CardContent>
          </Card>
        )} */}

      {/* Gift Message */}
      {order.isGift && order.giftMessage && (
        <Card className="rounded-xl md:rounded-2xl border overflow-hidden pt-0 bg-white">
          <div className="bg-linear-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
              <span className="text-base md:text-xl">🎁</span> Gift Message
            </CardTitle>
          </div>
          <CardContent>
            <p className="text-xs md:text-sm text-pink-700 italic">
              "{order.giftMessage}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order Notes */}
      {order.notes && (
        <Card className="rounded-xl md:rounded-2xl border overflow-hidden pt-0 bg-white">
          <div className="bg-linear-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
              <span className="text-base md:text-xl">📝</span> Order Notes
            </CardTitle>
          </div>
          <CardContent className="p-4 md:p-6">
            <p className="text-xs md:text-sm text-gray-700">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Delivery Information */}
      {/* <Card className="border-indigo-200 bg-indigo-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-800">
            <Clock className="w-5 h-5" />
            <span>Delivery Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-indigo-900">
                  Estimated Delivery
                </p>
                <p className="text-sm text-indigo-700">
                  {getEstimatedDeliveryDate(order.createdAt)}
                </p>
              </div>
            </div>
            <Separator className="bg-indigo-200" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-indigo-900">Processing</div>
                <div className="text-indigo-700">1-2 business days</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-indigo-900">Shipping</div>
                <div className="text-indigo-700">3-5 business days</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-indigo-900">Total</div>
                <div className="text-indigo-700">4-7 business days</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Next Steps */}
      <Card className="rounded-xl md:rounded-2xl border overflow-hidden pt-0 bg-white">
        <div className="bg-linear-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            What's Next?
          </CardTitle>
        </div>
        <CardContent>
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-start space-x-2 md:space-x-3">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-900">
                  Order Processing
                </p>
                <p className="text-xs md:text-sm text-blue-700">
                  We'll prepare your order for shipment days.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2 md:space-x-3">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-900">
                  Shipping Notification
                </p>
                <p className="text-xs md:text-sm text-blue-700">
                  You'll receive an email with tracking information once your
                  order ships.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2 md:space-x-3">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-900">
                  Delivery
                </p>
                <p className="text-xs md:text-sm text-blue-700">
                  Your order will be delivered to the address provided.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Support */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Shield className="w-5 h-5" />
              <span>Secure Transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              Your payment information is encrypted and secure. We use
              industry-standard security measures to protect your data.
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <RefreshCw className="w-5 h-5" />
              <span>Easy Returns</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700">
              {isOrderEligibleForReturn(order.createdAt)
                ? "You have 30 days from delivery to return items if needed."
                : "Return period has expired for this order."}
            </p>
          </CardContent>
        </Card>
      </div> */}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4 md:pt-6">
        <Button
          asChild
          variant="default"
          size="lg"
          className="h-10 md:h-12 text-xs md:text-base"
        >
          <Link href="/profile/orders">
            <Package className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            View All Orders
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-10 md:h-12 text-xs md:text-base"
        >
          <Link href="/products">
            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {/* Support Information */}
      <div className="text-center py-6 md:py-8 border-t">
        <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
          Need help with your order?
        </p>
        <div className="flex justify-center">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-xs md:text-sm"
          >
            <Link
              href="https://wa.me/15551234567"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 32 32"
                fill="currentColor"
                className="w-6 h-6 md:w-8 md:h-8 text-green-600"
              >
                <path d="M16 2C8.28 2 2 8.28 2 16c0 2.63.68 5.21 1.97 7.47L2 30l6.77-1.76A13.87 13.87 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.77c-2.35 0-4.66-.65-6.65-1.88l-.48-.29-4.03 1.05 1.08-3.93-.31-.51A11.8 11.8 0 0 1 4.21 16c0-6.51 5.29-11.79 11.79-11.79 6.51 0 11.79 5.28 11.79 11.79S22.51 27.77 16 27.77zm6.41-8.76c-.35-.18-2.04-1.01-2.35-1.13-.31-.12-.53-.18-.75.18-.22.35-.86 1.13-1.05 1.36-.19.22-.39.26-.74.09-.35-.18-1.48-.54-2.83-1.72-1.05-.94-1.76-2.1-1.97-2.45-.21-.35-.02-.53.16-.7.16-.16.35-.39.52-.58.18-.18.24-.31.35-.53.12-.22.06-.41-.03-.59-.09-.18-.75-1.81-1.03-2.49-.27-.65-.55-.56-.74-.57l-.63-.01c-.22 0-.58.08-.88.39-.3.3-1.15 1.12-1.15 2.72 0 1.59 1.17 3.14 1.33 3.36.16.22 2.3 3.52 5.57 4.79.78.34 1.39.55 1.87.7.79.25 1.5.22 2.07.14.63-.09 2.04-.83 2.33-1.63.29-.8.29-1.48.2-1.62-.09-.13-.32-.21-.67-.38z" />
              </svg>
              Chat with us
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
