"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { OrderItemReviewForm } from "./order-item-review-form";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { formatPrice } from "@workspace/lib";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OrderConfirmationData } from "./order-confirmation.types";

interface OrderItemRowProps {
  item: OrderConfirmationData["orderItems"][number];
  orderId: string;
  orderStatus: string;
  locale: string;
  autoExpandReview?: boolean;
}

export function OrderItemRow({
  item,
  orderId,
  orderStatus,
  locale,
  autoExpandReview = false,
}: OrderItemRowProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const [showReviewForm, setShowReviewForm] = useState(autoExpandReview);
  const canReview = orderStatus === "delivered" && !item.hasReview;
  const canEditReview = orderStatus === "delivered" && item.hasReview;

  return (
    <div
      id={`review-item-${item.id}`}
      className="scroll-mt-24 border rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-2 md:space-x-4 p-3 md:p-4">
        <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
          {(() => {
            const imageUrl =
              item.variant?.imageUrl ||
              (item.product.images && item.product.images.length > 0
                ? item.product.images[0]
                : null);

            return imageUrl ? (
              <Image
                src={getPublicUrl(imageUrl, "products")}
                alt={item.productName}
                width={64}
                height={64}
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-6 h-6 md:w-8 md:h-8" />
              </div>
            );
          })()}
        </div>

        <div className="flex-1 space-y-1 min-w-0">
          {item.product.slug ? (
            <Link
              href={`/products/${item.product.slug}`}
              target="_blank"
              className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2"
            >
              {item.productName}
            </Link>
          ) : (
            <p className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2">
              {item.productName}
            </p>
          )}
          {item.variantName && (
            <p className="text-xs text-gray-600">
              {t("variant")}: {item.variantName}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {t("soldBy")} {item.seller.displayName}
          </p>
        </div>

        <div className="text-right space-y-1 shrink-0">
          <p
            className="text-xs md:text-sm font-medium text-gray-900"
            dangerouslySetInnerHTML={{
              __html: formatPrice(Number(item.price), locale),
            }}
          />
          <p className="text-xs text-gray-500">
            {tCommon("quantity")}: {item.quantity}
          </p>
          <p
            className="text-xs md:text-sm font-semibold text-gray-900"
            dangerouslySetInnerHTML={{
              __html: formatPrice(Number(item.subtotal), locale),
            }}
          />
        </div>
      </div>

      {canReview && !showReviewForm && (
        <div className="px-3 md:px-4 py-3 md:py-4 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowReviewForm(true)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Star className="h-4 w-4" />
            {t("reviewThisProduct")}
          </Button>
        </div>
      )}

      {canReview && showReviewForm && (
        <div className="px-3 md:px-4 py-3 md:py-4 border-t">
          <OrderItemReviewForm
            orderId={orderId}
            orderItemId={item.id}
            productId={item.productId}
            sellerId={item.sellerId}
            productName={item.productName}
            productImage={
              item.variant?.imageUrl || item.product.images?.[0] || undefined
            }
            mode="create"
          />
        </div>
      )}

      {canEditReview && !showReviewForm && (
        <div className="px-3 md:px-4 py-3 md:py-4 border-t">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between gap-3">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              {t("youHaveReviewedThisProduct")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReviewForm(true)}
            >
              {t("editReview")}
            </Button>
          </div>
        </div>
      )}

      {canEditReview && showReviewForm && item.review && (
        <div className="px-3 md:px-4 py-3 md:py-4 border-t">
          <OrderItemReviewForm
            orderId={orderId}
            orderItemId={item.id}
            productId={item.productId}
            sellerId={item.sellerId}
            productName={item.productName}
            productImage={
              item.variant?.imageUrl || item.product.images?.[0] || undefined
            }
            mode="edit"
            existingReview={item.review}
          />
        </div>
      )}
    </div>
  );
}
