import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  CheckCircle2,
  CircleAlert,
  Clock,
  Package,
  RotateCcw,
  Truck,
  UserCheck,
} from "lucide-react";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { formatCurrency } from "@/lib/format";

import { OrdersTable } from "./orders/_components/orders-table";
import {
  getOperationalStats,
  getRecentShipments,
  getShippingStats,
} from "./orders/orders.server";
import type { ShippingStats } from "./orders/orders.types";

export const dynamic = "force-dynamic";

const CARDS: {
  key: keyof ShippingStats;
  labelKey:
    | "totalOrders"
    | "pending"
    | "assigned"
    | "outForDelivery"
    | "delivered"
    | "failed"
    | "returned";
  href: string;
  icon: React.ElementType;
  tone: string;
}[] = [
  { key: "total", labelKey: "totalOrders", href: "/orders", icon: Package, tone: "text-gray-600" },
  { key: "pending", labelKey: "pending", href: "/orders?status=pending", icon: Clock, tone: "text-yellow-600" },
  { key: "assigned", labelKey: "assigned", href: "/orders?status=assigned", icon: UserCheck, tone: "text-blue-600" },
  { key: "outForDelivery", labelKey: "outForDelivery", href: "/orders?status=out_for_delivery", icon: Truck, tone: "text-purple-600" },
  { key: "delivered", labelKey: "delivered", href: "/orders?status=delivered", icon: CheckCircle2, tone: "text-green-600" },
  { key: "failed", labelKey: "failed", href: "/orders?status=failed", icon: CircleAlert, tone: "text-red-600" },
  { key: "returned", labelKey: "returned", href: "/orders?status=returned", icon: RotateCcw, tone: "text-orange-600" },
];

async function StatsGrid() {
  const t = await getTranslations("dashboard");
  const result = await getShippingStats();

  if (!result.success || !result.data) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? t("statsLoadError")}
      </p>
    );
  }

  const stats = result.data;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {CARDS.map((card) => (
        <Link key={card.key} href={card.href} className="block">
          <Card className="gap-0 py-4 transition-colors hover:border-primary/40">
            <CardContent className="px-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <card.icon className={`size-4 ${card.tone}`} />
                {t(card.labelKey)}
              </div>
              <p className="mt-2 text-2xl font-bold">{stats[card.key]}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {CARDS.map((card) => (
        <Card key={card.key} className="gap-0 py-4">
          <CardContent className="px-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const OPERATIONAL_CARDS: {
  key:
    | "unassignedOrders"
    | "withoutProvider"
    | "withoutRider"
    | "delayedOrders"
    | "todaysDeliveries";
  labelKey:
    | "unassignedOrders"
    | "withoutProvider"
    | "withoutRider"
    | "delayedOrders"
    | "todaysDeliveries";
  href: string;
}[] = [
  { key: "unassignedOrders", labelKey: "unassignedOrders", href: "/orders?status=pending" },
  { key: "withoutProvider", labelKey: "withoutProvider", href: "/orders" },
  { key: "withoutRider", labelKey: "withoutRider", href: "/orders" },
  { key: "delayedOrders", labelKey: "delayedOrders", href: "/orders?status=out_for_delivery" },
  { key: "todaysDeliveries", labelKey: "todaysDeliveries", href: "/orders" },
];

async function OperationalSection() {
  const t = await getTranslations("dashboard");
  const [statsResult, shipmentsResult] = await Promise.all([
    getOperationalStats(),
    getRecentShipments(10),
  ]);

  if (!statsResult.success || !statsResult.data) {
    return (
      <p className="text-sm text-destructive">
        {statsResult.error ?? t("operationalLoadError")}
      </p>
    );
  }

  const stats = statsResult.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {OPERATIONAL_CARDS.map((card) => (
          <Link key={card.key} href={card.href} className="block">
            <Card className="gap-0 py-4 transition-colors hover:border-primary/40">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">{t(card.labelKey)}</p>
                <p className="mt-2 text-2xl font-bold">{stats[card.key]}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="gap-0 py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">{t("codOutstanding")}</p>
            <p className="mt-2 text-xl font-bold">
              {formatCurrency(stats.codOutstanding)}
            </p>
          </CardContent>
        </Card>
        <Card className="gap-0 py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">{t("codCollectedToday")}</p>
            <p className="mt-2 text-xl font-bold">
              {formatCurrency(stats.codCollectedToday)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          {t("recentActivity")}
        </h2>
        <OrdersTable rows={shipmentsResult.data} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-md" />}>
        <OperationalSection />
      </Suspense>
    </div>
  );
}
