import { Suspense } from "react";
import Link from "next/link";
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

import { getShippingStats } from "./orders/orders.server";
import type { ShippingStats } from "./orders/orders.types";

export const dynamic = "force-dynamic";

const CARDS: {
  key: keyof ShippingStats;
  label: string;
  href: string;
  icon: React.ElementType;
  tone: string;
}[] = [
  { key: "total", label: "Total Orders", href: "/orders", icon: Package, tone: "text-gray-600" },
  { key: "pending", label: "Pending", href: "/orders?status=pending", icon: Clock, tone: "text-yellow-600" },
  { key: "assigned", label: "Assigned", href: "/orders?status=assigned", icon: UserCheck, tone: "text-blue-600" },
  { key: "outForDelivery", label: "Out for Delivery", href: "/orders?status=out_for_delivery", icon: Truck, tone: "text-purple-600" },
  { key: "delivered", label: "Delivered", href: "/orders?status=delivered", icon: CheckCircle2, tone: "text-green-600" },
  { key: "failed", label: "Failed", href: "/orders?status=failed", icon: CircleAlert, tone: "text-red-600" },
  { key: "returned", label: "Returned", href: "/orders?status=returned", icon: RotateCcw, tone: "text-orange-600" },
];

async function StatsGrid() {
  const result = await getShippingStats();

  if (!result.success || !result.data) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? "Failed to load shipping statistics"}
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
                {card.label}
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

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Delivery status across all physical orders.
        </p>
      </div>

      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid />
      </Suspense>
    </div>
  );
}
