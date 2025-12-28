"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { CheckCircle, ShoppingBag, MoreVertical } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { formatPrice } from "@workspace/lib";
import { useLocale } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

// Format date utility
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  deliveredAt?: string | null;
  orderItems: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: string;
    deliveredAt?: string | null;
    product: {
      title: string;
      slug: string;
      images: string[] | null;
      description: string | null;
    };
  }>;
}

interface OrdersClientProps {
  initialOrders: Order[];
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const locale = useLocale();
  const orders = initialOrders;

  const getDeliveryDate = (order: Order, orderItem: Order["orderItems"][0]) => {
    return orderItem.deliveredAt || order.deliveredAt || null;
  };

  return (
    <div>
      <h2 className="sr-only">Recent orders</h2>
      <div>
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
                  <h3 className="sr-only">
                    Order placed on{" "}
                    <time dateTime={order.createdAt}>
                      {formatDate(order.createdAt)}
                    </time>
                  </h3>

                  {/* Order Header - Accordion Trigger */}
                  <AccordionTrigger className="hover:no-underline bg-transparent hover:bg-transparent px-0 py-0 [&>svg]:ml-auto items-center pr-6">
                    <div className="flex items-center w-full p-4 sm:grid sm:grid-cols-4 sm:gap-x-6 sm:p-6">
                      <dl className="grid flex-1 grid-cols-2 gap-x-6 text-sm sm:col-span-3 sm:grid-cols-3 lg:col-span-2">
                        <div>
                          <dt className="font-medium text-gray-900 dark:text-gray-100">
                            Order number
                          </dt>
                          <dd className="mt-1 text-gray-500 dark:text-gray-400">
                            {order.orderNumber}
                          </dd>
                        </div>
                        <div className="hidden sm:block">
                          <dt className="font-medium text-gray-900 dark:text-gray-100">
                            Date placed
                          </dt>
                          <dd className="mt-1 text-gray-500 dark:text-gray-400">
                            <time dateTime={order.createdAt}>
                              {formatDate(order.createdAt)}
                            </time>
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-900 dark:text-gray-100">
                            Total amount
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

                      {/* Mobile Menu */}
                      <div className="flex justify-end lg:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="relative flex items-center text-gray-400 hover:text-gray-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="absolute -inset-2" />
                              <span className="sr-only">
                                Options for order {order.orderNumber}
                              </span>
                              <MoreVertical className="h-6 w-6" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/orders/${order.id}/confirmation`}>
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/orders/${order.id}/confirmation`}>
                                Invoice
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Desktop Buttons */}
                      <div className="hidden lg:col-span-2 lg:flex lg:items-center lg:justify-end lg:space-x-4">
                        <Button
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/orders/${order.id}/confirmation`}>
                            View Order
                            <span className="sr-only">{order.orderNumber}</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>

                  {/* Products - Accordion Content */}
                  <AccordionContent>
                    <h4 className="sr-only">Items</h4>
                    <ul
                      role="list"
                      className="divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      {order.orderItems.map((item) => {
                        const deliveryDate = getDeliveryDate(order, item);
                        return (
                          <li key={item.id} className="p-4 px-5!">
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
                                {item.product.description && (
                                  <p className="mt-1 hidden text-gray-500 dark:text-gray-400 sm:block text-xs line-clamp-1!">
                                    {item.product.description?.slice(0, 100)}...
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-6 sm:flex sm:justify-between">
                              {deliveryDate && (
                                <div className="flex items-center">
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                  <p className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Delivered on{" "}
                                    <time dateTime={deliveryDate}>
                                      {formatFullDate(deliveryDate)}
                                    </time>
                                  </p>
                                </div>
                              )}

                              <div className="mt-6 flex items-center divide-x divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700 pt-4 text-sm font-medium sm:mt-0 sm:border-none sm:pt-0">
                                <div className="flex flex-1 justify-center pr-4">
                                  <Link
                                    href={`/products/${item.product.slug}`}
                                    className="whitespace-nowrap text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                                  >
                                    View product
                                  </Link>
                                </div>
                                <div className="flex flex-1 justify-center pl-4">
                                  <Link
                                    href={`/products/${item.product.slug}`}
                                    className="whitespace-nowrap text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                                  >
                                    Buy again
                                  </Link>
                                </div>
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
                  No orders yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Start shopping to see your orders here
                </p>
                <Button asChild>
                  <Link href="/products">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Start Shopping
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

