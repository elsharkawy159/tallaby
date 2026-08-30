"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { CheckCircle, ShoppingBag, MoreVertical, Truck, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { formatPrice } from "@workspace/lib";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

interface OrderItem {
  id: string;
  sellerId: string;
  productName: string;
  quantity: number;
  price: string;
  deliveredAt?: string | null;
  hasReview?: boolean;
  reviewId?: string | null;
  product: {
    title: string;
    slug: string;
    images: string[] | null;
    description: string | null;
  };
}

interface StoreSeller {
  sellerId: string;
  hasStoreReview: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  deliveredAt?: string | null;
  orderItems: OrderItem[];
  storeSellers?: StoreSeller[];
}

interface OrdersClientProps {
  initialOrders: Order[];
  isGuest?: boolean;
}

export function OrdersClient({
  initialOrders,
  isGuest = false,
}: OrdersClientProps) {
  const locale = useLocale();
  const t = useTranslations("profile");
  const tOrders = useTranslations("orders");
  const orders = initialOrders;

  const getDeliveryDate = (order: Order, orderItem: OrderItem) => {
    return orderItem.deliveredAt || order.deliveredAt || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale || "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale || "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isCancelled = (status: string) =>
    ["cancelled", "refunded", "returned"].includes(status);

  const isDelivered = (order: Order) => order.status === "delivered";

  return (
    <div>
      {isGuest && (
        <Card className="mb-6 border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                {t("guestOrdersPageTitle")}
              </p>
              <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
                {t("guestOrdersPageDescription")}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/auth?redirect=/profile/orders">
                  {t("signInToSaveAccount")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="sr-only">{tOrders("orderHistory")}</h2>
      <div className="space-y-4 sm:px-4 lg:px-0">
        {orders.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            defaultValue={orders[0]?.id}
            className="space-y-4"
          >
            {orders.map((order) => (
              <AccordionItem
                key={order.id}
                value={order.id}
                className="border-t border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg sm:border"
              >
                <AccordionTrigger className="hover:no-underline bg-transparent hover:bg-transparent px-0 py-0 [&>svg]:ml-auto items-center pr-6">
                  <div className="flex items-center w-full p-4 sm:grid sm:grid-cols-4 sm:gap-x-6 sm:p-6">
                    <dl className="grid flex-1 grid-cols-2 gap-x-6 text-sm sm:col-span-3 sm:grid-cols-3 lg:col-span-2">
                      <div>
                        <dt className="font-medium text-gray-900 dark:text-gray-100">
                          {tOrders("orderNumber")}
                        </dt>
                        <dd className="mt-1 text-gray-500 dark:text-gray-400">
                          {order.orderNumber}
                        </dd>
                      </div>
                      <div className="hidden sm:block">
                        <dt className="font-medium text-gray-900 dark:text-gray-100">
                          {tOrders("datePlaced")}
                        </dt>
                        <dd className="mt-1 text-gray-500 dark:text-gray-400">
                          <time dateTime={order.createdAt}>
                            {formatDate(order.createdAt)}
                          </time>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-900 dark:text-gray-100">
                          {tOrders("totalAmount")}
                        </dt>
                        <dd
                          className="mt-1 font-medium text-gray-900 dark:text-gray-100"
                          dangerouslySetInnerHTML={{
                            __html: formatPrice(
                              Number(order.totalAmount),
                              locale || "en-US"
                            ),
                          }}
                        />
                      </div>
                    </dl>

                    <div className="hidden sm:flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="flex justify-end lg:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="relative flex items-center text-gray-400 hover:text-gray-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-6 w-6" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!isCancelled(order.status) && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/orders/${order.id}#order-status-tracking`}
                              >
                                {tOrders("trackOrder")}
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/orders/${order.id}`}>
                              {tOrders("viewOrder")}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="hidden lg:col-span-2 lg:flex lg:items-center lg:justify-end lg:gap-2">
                      {!isCancelled(order.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/orders/${order.id}#order-status-tracking`}
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            {tOrders("trackOrder")}
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/orders/${order.id}`}>
                          {tOrders("viewOrder")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <ul
                    role="list"
                    className="divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    {order.orderItems.map((item) => {
                      const deliveryDate = getDeliveryDate(order, item);
                      const storeSeller = order.storeSellers?.find(
                        (s) => s.sellerId === item.sellerId
                      );
                      const showReviewActions = isDelivered(order);

                      return (
                        <li key={item.id} className="p-4 px-5">
                          <div className="flex items-center sm:items-start">
                            <div className="h-10 w-10 shrink-0 overflow-hidden sm:h-16 sm:w-16">
                              {item.product?.images?.[0] ? (
                                <Image
                                  src={getPublicUrl(
                                    item.product.images[0],
                                    "products"
                                  )}
                                  width={100}
                                  height={100}
                                  alt={item.productName}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-6 flex-1 text-sm">
                              <div className="font-medium text-gray-900 dark:text-gray-100 sm:flex text-sm sm:justify-between">
                                <h5>{item.productName}</h5>
                                <p
                                  className="mt-2 sm:mt-0"
                                  dangerouslySetInnerHTML={{
                                    __html: formatPrice(
                                      Number(item.price),
                                      locale || "en-US"
                                    ),
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 sm:flex sm:justify-between">
                            {deliveryDate && (
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <p className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                  {tOrders("deliveredOn")}{" "}
                                  <time dateTime={deliveryDate}>
                                    {formatFullDate(deliveryDate)}
                                  </time>
                                </p>
                              </div>
                            )}

                            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-medium sm:mt-0 border-t border-gray-200 dark:border-gray-700 pt-4 sm:border-none sm:pt-0">
                              <Link
                                href={`/products/${item.product.slug}`}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                              >
                                {tOrders("viewProduct")}
                              </Link>
                              <Link
                                href={`/products/${item.product.slug}`}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                              >
                                {tOrders("buyAgain")}
                              </Link>
                              {showReviewActions && !item.hasReview && (
                                <Link
                                  href={`/orders/${order.id}#review-item-${item.id}`}
                                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                                >
                                  <Star className="h-4 w-4" />
                                  {tOrders("reviewProduct")}
                                </Link>
                              )}
                              {showReviewActions && item.hasReview && (
                                <Link
                                  href={`/orders/${order.id}?review=${item.id}#review-item-${item.id}`}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                                >
                                  {tOrders("editReview")}
                                </Link>
                              )}
                              {showReviewActions &&
                                storeSeller &&
                                !storeSeller.hasStoreReview && (
                                  <Link
                                    href={`/orders/${order.id}#store-review-${item.sellerId}`}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                                  >
                                    {tOrders("rateStore")}
                                  </Link>
                                )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="border-t border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg sm:border p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {tOrders("noOrders")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t("startShoppingDescription")}
              </p>
              <Button asChild>
                <Link href="/products">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {tOrders("startShopping")}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
