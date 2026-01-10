"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  CreditCard,
  Calendar,
  Truck,
  Building,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderDetailWithRelations } from "./order-detail.types";
import {
  updateOrderStatus,
  updateOrderPaymentStatus,
} from "@/actions/orders";
import { formatCurrency, formatDate, getStatusColor, getPaymentStatusColor, getStatusLabel } from "../orders.lib";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";

const ORDER_STATUSES = [
  "pending",
  "payment_processing",
  "confirmed",
  "shipping_soon",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded",
  "returned",
] as const;

const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

interface OrderDetailContentProps {
  order: OrderDetailWithRelations;
}

export function OrderDetailContent({ order }: OrderDetailContentProps) {
  const router = useRouter();
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      const result = await updateOrderStatus(order.id, newStatus as any);

      if (result.success) {
        setOrderStatus(newStatus as any);
        toast.success(`Order status updated to ${getStatusLabel(newStatus)}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update order status");
      }
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      const result = await updateOrderPaymentStatus(order.id, newStatus as any);

      if (result.success) {
        setPaymentStatus(newStatus as any);
        toast.success(`Payment status updated to ${getStatusLabel(newStatus)}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update payment status");
      }
    } catch (error) {
      toast.error("Failed to update payment status");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatAddress = (address: typeof order.userAddress_shippingAddressId) => {
    if (!address) return "No address provided";
    
    const parts = [
      address.addressLine1,
      address.addressLine2,
      `${address.city}${address.state ? `, ${address.state}` : ""} ${address.postalCode}`,
      address.country,
    ].filter(Boolean);

    return parts.join("\n");
  };

  const customerName = order.user
    ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() || order.user.email
    : "Unknown Customer";

  const subtotal = Number(order.subtotal);
  const shippingCost = Number(order.shippingCost);
  const tax = Number(order.tax);
  const discountAmount = Number(order.discountAmount);
  const totalAmount = Number(order.totalAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(orderStatus)}>
                {getStatusLabel(orderStatus)}
              </Badge>
            </div>
            <Select
              value={orderStatus}
              onValueChange={handleStatusChange}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={getPaymentStatusColor(paymentStatus)}>
                {getStatusLabel(paymentStatus)}
              </Badge>
            </div>
            <Select
              value={paymentStatus}
              onValueChange={handlePaymentStatusChange}
              disabled={isUpdating || order.paymentMethod !== "online"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {order.paymentMethod !== "online" && (
              <p className="text-xs text-muted-foreground">
                Payment status can only be changed for online payments
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
              <CardDescription>
                {order.orderItems.length} item{order.orderItems.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item) => {
                  const imageUrl =
                    item.productVariant?.imageUrl ||
                    (item.product?.images && item.product.images.length > 0
                      ? item.product.images[0]
                      : null);

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 border rounded-lg"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {imageUrl ? (
                          <Image
                            src={getPublicUrl(imageUrl, "products")}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        {item.variantName && (
                          <p className="text-sm text-muted-foreground">
                            Variant: {item.variantName}
                          </p>
                        )}
                        {item.seller && (
                          <p className="text-sm text-muted-foreground">
                            Sold by {item.seller.displayName}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        <div className="flex items-center gap-4 pt-2">
                          <span className="text-sm">Qty: {item.quantity}</span>
                          <span className="font-medium">
                            {formatCurrency(Number(item.price))} each
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(Number(item.total))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(shippingCost)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer & Addresses */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{customerName}</p>
                {order.user && (
                  <>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a
                        href={`mailto:${order.user.email}`}
                        className="hover:underline"
                      >
                        {order.user.email}
                      </a>
                    </div>
                    {order.user.phone && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a
                          href={`tel:${order.user.phone}`}
                          className="hover:underline"
                        >
                          {order.user.phone}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
              {order.user && (
                <Link href={`/customers/${order.user.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Customer Profile
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.userAddress_shippingAddressId ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {order.userAddress_shippingAddressId.firstName}{" "}
                    {order.userAddress_shippingAddressId.lastName}
                  </p>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {formatAddress(order.userAddress_shippingAddressId)}
                  </p>
                  {order.userAddress_shippingAddressId.phone && (
                    <p className="text-muted-foreground">
                      Phone: {order.userAddress_shippingAddressId.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No shipping address</p>
              )}
            </CardContent>
          </Card>

          {/* Billing Address */}
          {order.userAddress_billingAddressId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {order.userAddress_billingAddressId.firstName}{" "}
                    {order.userAddress_billingAddressId.lastName}
                  </p>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {formatAddress(order.userAddress_billingAddressId)}
                  </p>
                  {order.userAddress_billingAddressId.phone && (
                    <p className="text-muted-foreground">
                      Phone: {order.userAddress_billingAddressId.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod.replace(/_/g, " ")}
                </span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coupon Code</span>
                  <span className="font-medium">{order.couponCode}</span>
                </div>
              )}
              {order.payments && order.payments.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Payment Transactions</p>
                  {order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="text-xs space-y-1 p-2 bg-muted rounded"
                    >
                      <div className="flex justify-between">
                        <span>Amount</span>
                        <span className="font-medium">
                          {formatCurrency(Number(payment.amount))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <Badge
                          variant="outline"
                          className={getPaymentStatusColor(payment.status)}
                        >
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </div>
                      {payment.transactionId && (
                        <div className="flex justify-between">
                          <span>Transaction ID</span>
                          <span className="font-mono text-xs">
                            {payment.transactionId}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.processedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processed At</span>
                  <span>{formatDate(order.processedAt)}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipped At</span>
                  <span>{formatDate(order.shippedAt)}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivered At</span>
                  <span>{formatDate(order.deliveredAt)}</span>
                </div>
              )}
              {order.cancelledAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancelled At</span>
                  <span>{formatDate(order.cancelledAt)}</span>
                </div>
              )}
              {order.notes && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipments */}
          {order.shipments && order.shipments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="p-3 border rounded-lg space-y-2 text-sm"
                  >
                    {shipment.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tracking</span>
                        <span className="font-mono">{shipment.trackingNumber}</span>
                      </div>
                    )}
                    {shipment.carrier && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carrier</span>
                        <span>{shipment.carrier}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline">{shipment.status}</Badge>
                    </div>
                    {shipment.shippedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipped</span>
                        <span>{formatDate(shipment.shippedAt)}</span>
                      </div>
                    )}
                    {shipment.estimatedDeliveryAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. Delivery</span>
                        <span>{formatDate(shipment.estimatedDeliveryAt)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}