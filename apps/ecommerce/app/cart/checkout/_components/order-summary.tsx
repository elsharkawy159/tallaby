"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Separator } from "@workspace/ui/components/separator";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { formatPrice } from "@workspace/lib";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatVariantTitle } from "@/lib/variant-utils";
import { Ticket, X, Loader2, LogIn } from "lucide-react";
import { applyCouponToCart, removeCouponFromCart } from "@/actions/coupons";
import { toast } from "sonner";
import type { CheckoutSummary } from "@/lib/coupon-utils";

interface OrderSummaryProps {
  checkoutData: {
    cart: {
      cartItems: Array<{
        id: string;
        quantity: number;
        price: string | number;
        variant?: any;
        product: {
          id: string;
          title: string;
        };
      }>;
    };
    summary: {
      subtotal: number;
      tax: number;
      shippingCost: number;
      total: number;
      itemCount: number;
      discountAmount?: number;
      shippingDiscount?: number;
      totalAfterDiscount?: number;
      appliedCoupon?: {
        code: string;
        name: string;
        discountType: string;
      } | null;
    };
  };
  children?: ReactNode;
  isLoggedIn?: boolean;
  onCouponApplied?: (data: {
    coupon: { code: string; name: string; discountType: string };
    summary: CheckoutSummary;
  }) => void;
  onCouponRemoved?: (summary: CheckoutSummary) => void;
  appliedCoupon?: {
    code: string;
    name: string;
    discountType: string;
  } | null;
}

export function OrderSummary({
  checkoutData,
  children,
  isLoggedIn = false,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}: OrderSummaryProps) {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const { cart, summary } = checkoutData;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApplyCoupon = () => {
    if (!code.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await applyCouponToCart({ code: code.trim() });

      if (result.success && result.data) {
        toast.success(t("couponApplied"));
        setCode("");
        onCouponApplied?.({
          coupon: result.data.summary.appliedCoupon!,
          summary: result.data.summary,
        });
      } else {
        const errorKey =
          "error" in result && result.error ? result.error : "invalidCoupon";
        
        // Handle minimum purchase error with the amount
        if (errorKey === "minPurchase" && "minimumPurchase" in result && result.minimumPurchase) {
          const formattedAmount = formatPrice(result.minimumPurchase, locale);
          const rawText = formattedAmount.replace(/<[^>]*>/g, "");
          setError(t("minPurchaseWithAmount", { amount: rawText }));
        } else {
          setError(t(errorKey));
        }
      }
    });
  };

  const handleRemoveCoupon = () => {
    startTransition(async () => {
      const result = await removeCouponFromCart();

      if (result.success && result.data) {
        toast.success(t("couponRemoved"));
        onCouponRemoved?.(result.data.summary);
      } else {
        toast.error(t("failedToRemoveCoupon"));
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
        <h2 className="text-sm md:text-xl font-bold text-gray-900">
          {t("orderSummary")}
        </h2>
      </div>

      {/* Items Breakdown */}
      <div className="p-3 md:p-5 pt-2 md:pt-3">
        <div className="space-y-0 mb-2 md:mb-3">
          {cart.cartItems.map((item) => {
            const unit = Number(item.price) ?? 0;
            const lineTotal = unit * item.quantity;
            const variant = item.variant as any;
            const variantTitle = variant ? formatVariantTitle(variant) : null;
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                    {item.product.title}
                  </p>
                  {variantTitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {variantTitle}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tCommon("quantity")}: {item.quantity}
                    {" × "}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: formatPrice(unit, locale),
                      }}
                    />
                  </p>
                </div>
                <div
                  className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap"
                  dangerouslySetInnerHTML={{
                    __html: formatPrice(lineTotal, locale),
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="space-y-2 md:space-y-3 pt-3 md:pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600">{t("subtotal")}</span>
            <span
              className="font-medium text-gray-900"
              dangerouslySetInnerHTML={{
                __html: formatPrice(summary.subtotal ?? 0, locale),
              }}
            />
          </div>

          {summary.shippingCost > 0 && (
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-gray-600">{t("shipping")}</span>
              <span
                className="font-medium text-gray-900"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(summary.shippingCost, locale),
                }}
              />
            </div>
          )}

          {summary.tax > 0 && (
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-gray-600">{t("tax")}</span>
              <span
                className="font-medium text-gray-900"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(summary.tax, locale),
                }}
              />
            </div>
          )}

          {(summary.discountAmount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                {t("discount")}
                {summary.appliedCoupon && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 font-mono text-[10px] px-1 py-0"
                  >
                    {summary.appliedCoupon.code}
                  </Badge>
                )}
              </span>
              <span
                className="font-medium text-green-600"
                dangerouslySetInnerHTML={{
                  __html: `-${formatPrice(summary.discountAmount ?? 0, locale)}`,
                }}
              />
            </div>
          )}

          {(summary.shippingDiscount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-green-600">{t("freeShipping")}</span>
              <span
                className="font-medium text-green-600"
                dangerouslySetInnerHTML={{
                  __html: `-${formatPrice(summary.shippingDiscount ?? 0, locale)}`,
                }}
              />
            </div>
          )}

          {/* Coupon Section - Inline */}
          {onCouponApplied && (
            <div className="pt-2">
              {!isLoggedIn ? (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground hover:text-primary"
                >
                  <Link
                    href="/auth?redirect=/cart/checkout"
                    className="flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="h-3 w-3" />
                    {t("loginToUseCoupon")}
                  </Link>
                </Button>
              ) : appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Ticket className="h-3 w-3 text-green-600 shrink-0" />
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 font-mono text-[10px] px-1.5 py-0"
                    >
                      {appliedCoupon.code}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCoupon}
                    disabled={isPending}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    aria-label={tCommon("remove")}
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <Input
                      type="text"
                      placeholder={t("enterCouponCode")}
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      onKeyDown={handleKeyDown}
                      disabled={isPending}
                      className="h-8 text-xs font-mono uppercase flex-1"
                      aria-label={t("couponCode")}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={isPending || !code.trim()}
                      className="h-8 px-3 text-xs"
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        tCommon("apply")
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="text-[10px] text-red-500">{error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <Separator className="bg-gray-200" />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm md:text-base font-bold text-gray-900">
              {t("total")}
            </span>
            <span
              className="text-base md:text-xl font-bold text-primary"
              dangerouslySetInnerHTML={{
                __html: formatPrice(
                  summary.totalAfterDiscount ?? summary.total ?? 0,
                  locale
                ),
              }}
            />
          </div>
        </div>
      </div>

      {/* Button Section */}
      {children && (
        <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-3 md:space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
