import {
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Calendar,
  ArrowRight,
  Clock,
  Shield,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import Image from "next/image";
import Link from "next/link";
import type { OrderConfirmationData } from "./order-confirmation.types";
import {
  formatCurrency,
  formatDate,
  getOrderStatusStyle,
  getPaymentStatusStyle,
  getEstimatedDeliveryDate,
  isOrderEligibleForReturn,
} from "./order-confirmation.lib";
import { Button } from "@workspace/ui/components/button";
import { getPublicUrl } from "@workspace/ui/lib/utils";

interface OrderConfirmationContentProps {
  data: OrderConfirmationData;
}

export function OrderConfirmationContent({
  data,
}: OrderConfirmationContentProps) {
  const { order, orderItems, shippingAddress, billingAddress, summary } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your order has been successfully
            placed.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Order placed on {formatDate(order.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Order Summary Card */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-green-600" />
            <span>Order Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Order Number:
                </span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Status:
                </span>
                <Badge
                  variant="outline"
                  className={`${getOrderStatusStyle(order.status).bg} ${getOrderStatusStyle(order.status).text} ${getOrderStatusStyle(order.status).border}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Payment:
                </span>
                <Badge
                  variant="outline"
                  className={`${getPaymentStatusStyle(order.paymentStatus).bg} ${getPaymentStatusStyle(order.paymentStatus).text} ${getPaymentStatusStyle(order.paymentStatus).border}`}
                >
                  {order.paymentStatus.charAt(0).toUpperCase() +
                    order.paymentStatus.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Total Amount:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(Number(order.totalAmount), order.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Payment Method:
                </span>
                <span className="text-sm text-gray-900">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Items:
                </span>
                <span className="text-sm text-gray-900">
                  {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Order Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  {item.product.images && item.product.images.length > 0 ? (
                    <Image
                      src={getPublicUrl(
                        item.product.images[0] || "",
                        "products"
                      )}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="font-medium text-gray-900">
                    {item.productName}
                  </h3>
                  {item.variantName && (
                    <p className="text-sm text-gray-600">
                      Variant: {item.variantName}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Sold by {item.seller.displayName}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(Number(item.price), order.currency)}
                  </p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(Number(item.subtotal), order.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipping & Billing Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Shipping Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium text-gray-900">
              {shippingAddress.fullName}
            </p>
            <p className="text-gray-600">{shippingAddress.addressLine1}</p>
            {shippingAddress.addressLine2 && (
              <p className="text-gray-600">{shippingAddress.addressLine2}</p>
            )}
            <p className="text-gray-600">
              {shippingAddress.city}, {shippingAddress.state}{" "}
              {shippingAddress.postalCode}
            </p>
            <p className="text-gray-600">{shippingAddress.country}</p>
            {shippingAddress.phone && (
              <p className="text-gray-600">Phone: {shippingAddress.phone}</p>
            )}
          </CardContent>
        </Card>

        {/* Billing Address */}
        {billingAddress && (
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
        )}
      </div>

      {/* Gift Message */}
      {order.isGift && order.giftMessage && (
        <Card className="border-pink-200 bg-pink-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-pink-800">
              <span className="text-xl">🎁</span>
              <span>Gift Message</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-pink-700 italic">"{order.giftMessage}"</p>
          </CardContent>
        </Card>
      )}

      {/* Order Notes */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Delivery Information */}
      <Card className="border-indigo-200 bg-indigo-50/50">
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
      </Card>

      {/* Next Steps */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <ArrowRight className="w-5 h-5" />
            <span>What's Next?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-blue-900">Order Processing</p>
                <p className="text-sm text-blue-700">
                  We'll prepare your order for shipment within 1-2 business
                  days.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  Shipping Notification
                </p>
                <p className="text-sm text-blue-700">
                  You'll receive an email with tracking information once your
                  order ships.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-blue-900">Delivery</p>
                <p className="text-sm text-blue-700">
                  Your order will be delivered to the address provided.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <Button asChild variant="default" size="lg">
          <Link href="/profile">
            <Package className="w-4 h-4 mr-2" />
            View All Orders
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg">
          <Link href={`/orders/${order.id}/track`}>
            <Truck className="w-4 h-4 mr-2" />
            Track Order
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg">
          <Link href="/products">
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {/* Support Information */}
      <div className="text-center py-8 border-t">
        <p className="text-sm text-gray-600 mb-4">Need help with your order?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/help">Help Center</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/contact">Contact Support</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/returns">Return Policy</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
