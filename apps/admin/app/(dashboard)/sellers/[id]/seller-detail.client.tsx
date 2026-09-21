"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowLeft,
  Banknote,
  CheckCircle,
  Mail,
  Package,
  Percent,
  Phone,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../sellers.lib";
import type { SellerDetail } from "../sellers.types";

interface MetricProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

function Metric({ label, value, hint, icon: Icon, href }: MetricProps) {
  const body = (
    <Card className={href ? "h-full transition-colors hover:bg-muted/50" : "h-full"}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function SellerDetailContent({ detail }: { detail: SellerDetail }) {
  const {
    seller,
    owner,
    products,
    sales,
    topCustomers,
    topProducts,
    recentOrders,
  } = detail;

  const productsHref = `/products?seller=${encodeURIComponent(seller.slug)}`;
  const initials = seller.businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Link href="/sellers">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sellers
        </Button>
      </Link>

      {/* Header */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={seller.logoUrl || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-semibold">{seller.businessName}</h1>
                {seller.isVerified && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{seller.displayName}</span>
                <span>·</span>
                <span>/{seller.slug}</span>
                <Badge className={getStatusColor(seller.status ?? "pending")}>
                  {getStatusLabel(seller.status ?? "pending")}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {seller.sellerLevel}
                </Badge>
                <span>· Joined {formatDate(seller.joinDate)}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {seller.supportEmail}
                </span>
                {seller.supportPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {seller.supportPhone}
                  </span>
                )}
              </div>
            </div>
            <Button asChild>
              <Link href={productsHref}>
                <Package className="mr-2 h-4 w-4" />
                View products ({products.total})
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric
          label="Products"
          value={products.total}
          hint={`${products.active} active · ${products.pending} pending · ${products.draft} draft · ${products.rejected} rejected`}
          icon={Package}
          href={productsHref}
        />
        <Metric
          label="Orders"
          value={sales.orders}
          hint={`${sales.itemsSold} items sold`}
          icon={ShoppingCart}
        />
        <Metric
          label="Customers"
          value={sales.customers}
          hint="Unique buyers"
          icon={Users}
        />
        <Metric
          label="Gross sales"
          value={formatCurrency(sales.grossSales)}
          hint={`Avg order ${formatCurrency(sales.averageOrderValue)}`}
          icon={TrendingUp}
        />
        <Metric
          label="Seller earnings"
          value={formatCurrency(sales.earnings)}
          hint="After commission"
          icon={Banknote}
        />
        <Metric
          label="Platform commission"
          value={formatCurrency(sales.commission)}
          hint={
            seller.isCommissionExempt
              ? "Exempt"
              : `${seller.commissionRate}% rate`
          }
          icon={Percent}
        />
        <Metric
          label="Wallet balance"
          value={formatCurrency(seller.walletBalance)}
          hint={
            seller.lastPayoutDate
              ? `Last payout ${formatDate(seller.lastPayoutDate)}`
              : `Payouts ${seller.payoutSchedule}`
          }
          icon={Wallet}
        />
        <Metric
          label="Rating"
          value={(seller.storeRating ?? 0).toFixed(1)}
          hint={`${seller.totalRatings} reviews · ${sales.refundedItems} refunded/returned items`}
          icon={Star}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Owner */}
        <Card>
          <CardHeader>
            <CardTitle>Owner account</CardTitle>
          </CardHeader>
          <CardContent>
            {owner ? (
              <div className="space-y-1 text-sm">
                <Link
                  href={`/customers/${owner.id}`}
                  className="text-base font-medium hover:underline"
                >
                  {owner.fullName ?? owner.email ?? owner.id}
                </Link>
                {owner.email && <div>{owner.email}</div>}
                {owner.phone && <div>{owner.phone}</div>}
                <div className="text-muted-foreground">
                  {owner.isSuspended ? "Suspended · " : ""}
                  {owner.lastLoginAt
                    ? `Last login ${formatDate(owner.lastLoginAt)}`
                    : "Never logged in"}
                </div>
              </div>
            ) : (
              <EmptyRow>No linked user account.</EmptyRow>
            )}
          </CardContent>
        </Card>

        {/* Top customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top customers</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <EmptyRow>No customer orders yet.</EmptyRow>
            ) : (
              <ul className="divide-y">
                {topCustomers.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/customers/${c.id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {c.fullName ?? c.email ?? c.id}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {c.orders} order{c.orders === 1 ? "" : "s"}
                        {c.lastOrderAt && ` · last ${formatDate(c.lastOrderAt)}`}
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(c.totalSpent)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Best-selling products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <EmptyRow>No sales yet.</EmptyRow>
            ) : (
              <ul className="divide-y">
                {topProducts.map((p) => (
                  <li
                    key={p.productId}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/products/${p.productId}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {p.unitsSold} sold
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <EmptyRow>No orders yet.</EmptyRow>
            ) : (
              <ul className="divide-y">
                {recentOrders.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/orders/${o.id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        #{o.orderNumber}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {o.customerName ?? "Guest"}
                        {o.createdAt && ` · ${formatDate(o.createdAt)}`}
                        {o.status && ` · ${o.status.replaceAll("_", " ")}`}
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(o.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
