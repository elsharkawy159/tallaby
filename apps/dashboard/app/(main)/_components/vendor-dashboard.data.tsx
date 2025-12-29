import { getSellerMetrics } from "@/actions/seller";
import { getSellerOrders } from "@/actions/orders";
import { UnansweredQuestionsData } from "./unanswered-questions.data";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
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

const formatCurrency = (value?: string | number | null) => {
  const num =
    value == null ? 0 : typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(num);
};

export async function VendorDashboardData() {
  const [metricsRes, ordersRes] = await Promise.all([
    getSellerMetrics(),
    getSellerOrders({ limit: 5, offset: 0 }),
  ]);

  console.log("metricsRes", metricsRes);

  const metrics = metricsRes?.data ?? ({} as any);
  const latest = Array.isArray(ordersRes?.data)
    ? ordersRes!.data.slice(0, 5)
    : [];

  const metricCards = [
    {
      title: "Wallet Balance",
      value: formatCurrency(metrics.walletBalance ?? 0),
      icon: Wallet,
      href: "/financial",
    },
    {
      title: "Products",
      value: String(metrics.productCount ?? 0),
      icon: Package,
      href: "/products",
    },
    {
      title: "Store Rating",
      value: `${metrics.storeRating ? metrics.storeRating.toFixed(1) : "0"}/5 (${metrics.totalRatings ?? 0} ratings)`,
      icon: Star,
      href: "/reviews",
    },
    {
      title: "Positive Rating",
      value: `${metrics.positiveRatingPercent ? Math.round(metrics.positiveRatingPercent) : 0}%`,
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
      title: "Add Product",
      description: "List a new item",
      href: "/products/add",
      icon: PlusCircle,
    },
    {
      title: "Orders",
      description: "Manage recent orders",
      href: "/orders",
      icon: ShoppingBag,
    },
    {
      title: "Shipping",
      description: "Ship & track",
      href: "/shipping",
      icon: Truck,
    },
    {
      title: "Promotions",
      description: "Create a coupon",
      href: "/marketing",
      icon: Percent,
    },
    {
      title: "Analytics",
      description: "Performance overview",
      href: "/reports",
      icon: BarChart3,
    },
    {
      title: "Settings",
      description: "Store preferences",
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
            <CardTitle>Quick Links</CardTitle>
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
              <CardTitle>Latest Orders</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/orders">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latest.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        No recent orders
                      </TableCell>
                    </TableRow>
                  ) : (
                    latest.map((item: any) => {
                      const orderNo =
                        item.order?.orderNumber ??
                        item.orderId?.slice(0, 8) ??
                        "—";
                      const customer =
                        item.order?.user?.fullName ||
                        [
                          item.order?.user?.firstName,
                          item.order?.user?.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                        item.order?.user?.email ||
                        "Customer";
                      const product =
                        item.product?.title ?? item.productName ?? "—";
                      const when = item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "—";
                      const total = formatCurrency(item.total);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Link
                              href={`/orders/${item.orderId ?? item.order?.id ?? ""}`}
                              className="underline underline-offset-2"
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
                            <Badge variant="secondary" className="capitalize">
                              {String(item.status || "pending").replaceAll(
                                "_",
                                " "
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{total}</TableCell>
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
