import { getSellerMetrics } from "@/actions/seller";
import { getSellerOrders } from "@/actions/orders";
import {
  getOrderDisplayNumber,
  resolveVendorOrderStatus,
} from "../orders/orders.lib";
import { UnansweredQuestionsData } from "./unanswered-questions.data";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate, formatMoney, formatNumber } from "@/lib/i18n/format";
import { translateStatus } from "@/lib/i18n/status";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import {
  Wallet,
  Package,
  Star,
  ThumbsUp,
  ShoppingBag,
  Settings,
  Truck,
  Percent,
  PlusCircle,
  BarChart3,
} from "lucide-react";

export async function VendorDashboardData() {
  const [metricsRes, ordersRes, t, tStatus, locale] = await Promise.all([
    getSellerMetrics(),
    getSellerOrders({ limit: 5, offset: 0 }),
    getTranslations("home"),
    getTranslations("status"),
    getLocale(),
  ]);
  const formatCurrency = (value?: string | number | null) =>
    formatMoney(value, locale);

  const metrics = metricsRes?.data ?? ({} as any);
  const latest = Array.isArray(ordersRes?.data)
    ? ordersRes!.data.slice(0, 5)
    : [];

  const metricCards = [
    {
      title: t("walletBalance"),
      value: formatCurrency(metrics.walletBalance ?? 0),
      icon: Wallet,
      href: "/financial",
    },
    {
      title: t("products"),
      value: formatNumber(metrics.productCount ?? 0, locale),
      icon: Package,
      href: "/products",
    },
    {
      title: t("storeRating"),
      value: t("storeRatingValue", {
        rating: formatNumber(metrics.storeRating ?? 0, locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
        count: metrics.totalRatings ?? 0,
      }),
      icon: Star,
      href: "/reviews",
    },
    {
      title: t("positiveRating"),
      value: formatNumber((metrics.positiveRatingPercent ?? 0) / 100, locale, {
        style: "percent",
        maximumFractionDigits: 0,
      }),
      icon: ThumbsUp,
      href: "/reviews",
    },
  ];

  const quickLinks: {
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<any>;
  }[] = [
    {
      title: t("quickLinks.addProduct"),
      description: t("quickLinks.addProductDescription"),
      href: "/products/add",
      icon: PlusCircle,
    },
    {
      title: t("quickLinks.orders"),
      description: t("quickLinks.ordersDescription"),
      href: "/orders",
      icon: ShoppingBag,
    },
    {
      title: t("quickLinks.shipping"),
      description: t("quickLinks.shippingDescription"),
      href: "/shipping",
      icon: Truck,
    },
    {
      title: t("quickLinks.promotions"),
      description: t("quickLinks.promotionsDescription"),
      href: "/marketing",
      icon: Percent,
    },
    {
      title: t("quickLinks.analytics"),
      description: t("quickLinks.analyticsDescription"),
      href: "/reports",
      icon: BarChart3,
    },
    {
      title: t("quickLinks.settings"),
      description: t("quickLinks.settingsDescription"),
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <Link key={m.title} href={m.href} className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
                <m.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{m.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t("quickLinks.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickLinks.map((q) => (
                <Link key={q.title} href={q.href} className="group">
                  <div className="border rounded-lg p-4 hover:bg-accent/40 transition-colors h-full">
                    <div className="flex items-center gap-3">
                      <q.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                      <div>
                        <div className="text-sm font-medium">{q.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {q.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latest Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("latestOrders")}</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/orders">{t("viewAll")}</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">{t("table.order")}</TableHead>
                    <TableHead>{t("table.customer")}</TableHead>
                    <TableHead>{t("table.product")}</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      {t("table.date")}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {t("table.status")}
                    </TableHead>
                    <TableHead className="text-end">{t("table.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latest.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {t("noRecentOrders")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    latest.map((item: any) => {
                      const orderNo = getOrderDisplayNumber(item);
                      const customer =
                        item.order?.user?.fullName ||
                        [
                          item.order?.user?.firstName,
                          item.order?.user?.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                        item.order?.user?.email ||
                        t("customer");
                      const product =
                        item.product?.title ?? item.productName ?? "—";
                      const when = formatDate(item.createdAt, locale);
                      const total = formatCurrency(item.total);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Link
                              href={`/orders/${item.orderId ?? item.order?.id ?? ""}`}
                              className="underline underline-offset-2"
                              dir="ltr"
                            >
                              {orderNo}
                            </Link>
                          </TableCell>
                          <TableCell>{customer}</TableCell>
                          <TableCell className="truncate max-w-[220px]">
                            {product}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {when}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary">
                              {translateStatus(
                                tStatus,
                                "order",
                                resolveVendorOrderStatus(item)
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end" dir="ltr">
                            {total}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unanswered questions */}
      <UnansweredQuestionsData />
    </div>
  );
}
