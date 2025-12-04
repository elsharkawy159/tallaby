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
    <Card className={cn(className, "gap-0 pb-3")}>
      <CardHeader className={cn("pb-4", layout === "compact" && "pb-2")}>
        <div className="flex items-center justify-between">
          <CardTitle
            className={cn(
              "text-xl font-bold",
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
      </CardHeader>
      <CardContent className={cn("space-y-0", layout === "compact" && "pt-0")}>
        {/* Items List */}
        <div
          className={cn(
            "divide-y",
            layout === "compact" && "space-y-2 divide-y-0"
          )}
        >
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
                  "flex items-center gap-3 py-1.5",
                  layout === "compact" && "py-2",
                  itemClassName
                )}
              >
                {/* Product Image */}
                <div
                  className={cn(
                    "relative bg-gray-100 rounded flex-shrink-0",
                    imageSizeClasses[imageSize],
                    layout === "compact" && "w-12 h-12"
                  )}
                >
                  <Image
                    src={img}
                    alt={item.product.title}
                    fill
                    className="object-contain bg-white rounded"
                    sizes="(max-width: 768px) 56px, 56px"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "font-medium text-sm leading-tight line-clamp-2",
                      layout === "compact" && "text-xs"
                    )}
                  >
                    {item.product.title}
                  </h3>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground mt-1",
                      layout === "compact" && "text-xs"
                    )}
                  >
                    Qty: {item.quantity}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <div
                    className={cn(
                      "font-semibold text-sm",
                      layout === "compact" && "text-xs"
                    )}
                    dangerouslySetInnerHTML={{
                      __html: formatPrice(lineTotal, locale),
                    }}
                  />

                  {layout !== "compact" && item.quantity > 1 && (
                    <div
                      className="text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: formatPrice(price, locale),
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        {showTotal && (
          <>
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-base">
                  Total ({itemCount} {itemCount === 1 ? "item" : "items"})
                </p>
                <p className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "product" : "products"}
                </p>
              </div>
              <div
                className="font-bold text-lg text-primary"
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
