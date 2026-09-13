"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import { Separator } from "@workspace/ui/components/separator";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Package,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { updateOrderPricing } from "@/actions/orders";
import type { OrderDetailWithRelations } from "../order-detail.types";
import {
  formatCurrency,
  getPaymentStatusColor,
  getStatusColor,
  getStatusLabel,
} from "../../orders.lib";
import { parseProductImages } from "../../../products/products.lib";
import { getPublicUrl } from "@/lib/utils";

interface OrderEditContentProps {
  order: OrderDetailWithRelations;
}

/** Money inputs are held as strings so a field can be cleared while typing. */
function toAmount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toInput(value: string | number | null | undefined): string {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? String(Number(parsed.toFixed(2))) : "0";
}

export function OrderEditContent({ order }: OrderEditContentProps) {
  const router = useRouter();

  const initialPrices = useMemo(
    () =>
      Object.fromEntries(
        order.orderItems.map((item) => [item.id, toInput(item.price)])
      ),
    [order.orderItems]
  );

  const [prices, setPrices] = useState<Record<string, string>>(initialPrices);
  const [shippingCost, setShippingCost] = useState(toInput(order.shippingCost));
  const [tax, setTax] = useState(toInput(order.tax));
  const [discountAmount, setDiscountAmount] = useState(
    toInput(order.discountAmount)
  );
  const [notes, setNotes] = useState(order.notes ?? "");
  const [isManualTotal, setIsManualTotal] = useState(false);
  const [manualTotal, setManualTotal] = useState(toInput(order.totalAmount));
  const [isSaving, setIsSaving] = useState(false);

  const subtotal = order.orderItems.reduce(
    (sum, item) => sum + toAmount(prices[item.id] ?? "0") * item.quantity,
    0
  );
  const computedTotal =
    subtotal + toAmount(shippingCost) + toAmount(tax) - toAmount(discountAmount);
  const finalTotal = isManualTotal ? toAmount(manualTotal) : computedTotal;

  const originalTotal = Number(order.totalAmount);
  const totalDelta = finalTotal - originalTotal;

  // Coupon discounts are pinned to coupon_usage / affiliate records, so the
  // server keeps them as a floor — surfacing it here avoids a surprising save.
  const couponDiscountFloor = (order.discounts ?? [])
    .filter(
      (line) => line.type === "coupon" || line.type === "free_shipping_coupon"
    )
    .reduce((sum, line) => sum + Number(line.amount), 0);

  const hasRecordedPayment =
    order.paymentStatus === "paid" || (order.payments?.length ?? 0) > 0;

  const handleReset = () => {
    setPrices(initialPrices);
    setShippingCost(toInput(order.shippingCost));
    setTax(toInput(order.tax));
    setDiscountAmount(toInput(order.discountAmount));
    setNotes(order.notes ?? "");
    setIsManualTotal(false);
    setManualTotal(toInput(order.totalAmount));
  };

  const handleSave = async () => {
    if (finalTotal < 0) {
      toast.error("Order total cannot be negative");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateOrderPricing(order.id, {
        items: order.orderItems.map((item) => ({
          id: item.id,
          price: toAmount(prices[item.id] ?? "0"),
        })),
        shippingCost: toAmount(shippingCost),
        tax: toAmount(tax),
        discountAmount: toAmount(discountAmount),
        totalAmount: isManualTotal ? toAmount(manualTotal) : null,
        notes,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to update order");
        return;
      }

      toast.success("Order pricing updated");
      router.push(`/orders/${order.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/orders/${order.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Order
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit {order.orderNumber}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
              <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                {getStatusLabel(order.paymentStatus)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>

      {hasRecordedPayment && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">
              This order already has a payment recorded against it.
            </p>
            <p className="text-amber-800">
              Editing the price here does not move money: payment rows, wallet
              transactions and affiliate commissions keep their original
              amounts, so any difference has to be reconciled separately.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item prices
              </CardTitle>
              <CardDescription>
                Set the unit price charged for each line. Quantities are fixed
                here because the stock was already taken at checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.orderItems.map((item) => {
                const rawImage =
                  item.productVariant?.imageUrl?.trim() ||
                  parseProductImages(item.product?.images)[0] ||
                  null;
                const imageSrc = rawImage
                  ? rawImage.startsWith("http://") ||
                    rawImage.startsWith("https://")
                    ? rawImage
                    : getPublicUrl(rawImage, "products")
                  : null;

                const price = toAmount(prices[item.id] ?? "0");
                const originalPrice = Number(item.price);

                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-48 flex-1 space-y-1">
                      <p className="font-medium">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-muted-foreground">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.sku} · Qty: {item.quantity}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor={`price-${item.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        Unit price
                      </Label>
                      <Input
                        id={`price-${item.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-32"
                        value={prices[item.id] ?? ""}
                        onChange={(e) =>
                          setPrices((current) => ({
                            ...current,
                            [item.id]: e.target.value,
                          }))
                        }
                      />
                      {price !== originalPrice && (
                        <button
                          type="button"
                          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                          onClick={() =>
                            setPrices((current) => ({
                              ...current,
                              [item.id]: toInput(item.price),
                            }))
                          }
                        >
                          Was {formatCurrency(originalPrice)}
                        </button>
                      )}
                    </div>

                    <div className="w-28 space-y-1 text-right">
                      <p className="text-xs text-muted-foreground">
                        Line total
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal notes</CardTitle>
              <CardDescription>
                A good place to record why the price was changed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes on this order"
              />
            </CardContent>
          </Card>
        </div>

        {/* Totals */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order totals</CardTitle>
              <CardDescription>
                Amounts are in {order.currency ?? "EGP"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="shipping" className="text-muted-foreground">
                  Shipping
                </Label>
                <Input
                  id="shipping"
                  type="number"
                  min={0}
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="tax" className="text-muted-foreground">
                  Tax
                </Label>
                <Input
                  id="tax"
                  type="number"
                  min={0}
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="discount" className="text-muted-foreground">
                  Discount
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
                {couponDiscountFloor > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(couponDiscountFloor)} of this comes from a
                    coupon and is kept even if you enter less.
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="manual-total" className="font-medium">
                    Set final total manually
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Otherwise it is calculated from the lines above.
                  </p>
                </div>
                <Switch
                  id="manual-total"
                  checked={isManualTotal}
                  onCheckedChange={(checked) => {
                    setIsManualTotal(checked);
                    if (checked) {
                      setManualTotal(toInput(computedTotal));
                    }
                  }}
                />
              </div>

              {isManualTotal ? (
                <div className="space-y-1">
                  <Label htmlFor="total" className="text-muted-foreground">
                    Final total
                  </Label>
                  <Input
                    id="total"
                    type="number"
                    min={0}
                    step="0.01"
                    value={manualTotal}
                    onChange={(e) => setManualTotal(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Calculated total is {formatCurrency(computedTotal)}.
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Was {formatCurrency(originalTotal)}</span>
                {Math.abs(totalDelta) >= 0.01 && (
                  <span
                    className={
                      totalDelta > 0 ? "text-amber-700" : "text-green-700"
                    }
                  >
                    {totalDelta > 0 ? "+" : ""}
                    {formatCurrency(totalDelta)}
                  </span>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
