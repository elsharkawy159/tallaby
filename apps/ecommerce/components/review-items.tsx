"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { Badge } from "@workspace/ui/components/badge";
import { useLocale } from "next-intl";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { cn } from "@workspace/ui/lib/utils";
import { formatPrice } from "@workspace/lib";

export interface ReviewItem {
  id: string;
  quantity: number;
  price: number | string;
  product: {
    id: string;
    title: string;
    images?: Array<string | { url?: string } | unknown>;
  };
}

interface ReviewItemsProps {
  items: ReviewItem[];
  title?: string;
  showCount?: boolean;
  showTotal?: boolean;
  className?: string;
  itemClassName?: string;
  imageSize?: "sm" | "md" | "lg";
  layout?: "default" | "compact";
}

export function ReviewItems({
  items,
  title = "Review Items",
  showCount = true,
  showTotal = true,
  className,
  itemClassName,
  imageSize = "md",
  layout = "default",
}: ReviewItemsProps) {
  const locale = useLocale();

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => {
    const price =
      typeof item.price === "string" ? parseFloat(item.price) : item.price;
    return sum + price * item.quantity;
  }, 0);

  // Image size classes
  const imageSizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">No items to review</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        className,
        "rounded-2xl border border-gray-200 overflow-hidden pt-0!"
      )}
    >
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle
            className={cn(
              "flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900",
              layout === "compact" && "text-lg"
            )}
          >
            {title}
          </CardTitle>
          {showCount && (
            <Badge variant="secondary" className="text-sm">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </Badge>
          )}
        </div>
      </div>
      <CardContent className={cn("p-4 py-0", layout === "compact" && "pt-0")}>
        {/* Items List */}
        <div className={cn("space-y-0", layout === "compact" && "space-y-2")}>
          {items.map((item, index) => {
            const img = item.product.images?.[0]
              ? getPublicUrl(item.product.images[0] as string, "products")
              : "/png product.png";
            const price =
              typeof item.price === "string"
                ? parseFloat(item.price)
                : item.price;
            const lineTotal = price * item.quantity;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0",
                  layout === "compact" && "border-0 py-2",
                  itemClassName
                )}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Product Image */}
                  <div
                    className={cn(
                      "relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex-shrink-0 overflow-hidden",
                      imageSizeClasses[imageSize],
                      layout === "compact" && "w-12 h-12"
                    )}
                  >
                    <Image
                      src={img}
                      alt={item.product.title}
                      fill
                      className="object-contain p-1.5"
                      sizes="(max-width: 768px) 56px, 56px"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "font-medium text-sm text-gray-900 leading-tight line-clamp-2",
                        layout === "compact" && "text-xs"
                      )}
                    >
                      {item.product.title}
                    </h3>
                    <p
                      className={cn(
                        "text-xs text-muted-foreground mt-0.5",
                        layout === "compact" && "text-xs"
                      )}
                    >
                      Qty: {item.quantity}
                      {layout !== "compact" && item.quantity > 1 && (
                        <>
                          {" × "}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: formatPrice(price, locale),
                            }}
                          />
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div
                  className={cn(
                    "text-right flex-shrink-0 font-semibold text-sm text-gray-900 whitespace-nowrap",
                    layout === "compact" && "text-xs"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: formatPrice(lineTotal, locale),
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        {showTotal && (
          <>
            <Separator className="my-4 bg-gray-200" />
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-base text-gray-900">
                  Total ({itemCount} {itemCount === 1 ? "item" : "items"})
                </p>
                <p className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "product" : "products"}
                </p>
              </div>
              <div
                className="font-bold text-xl text-primary"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(totalAmount, locale),
                }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Compact variant for smaller spaces
export function CompactReviewItems(props: Omit<ReviewItemsProps, "layout">) {
  return <ReviewItems {...props} layout="compact" />;
}

// Minimal variant with just the list
export function MinimalReviewItems(
  props: Omit<ReviewItemsProps, "showCount" | "showTotal">
) {
  return <ReviewItems {...props} showCount={false} showTotal={false} />;
}
