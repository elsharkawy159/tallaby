import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { formatAddress, formatCurrency } from "@/lib/format";
import { translateShippingStatus } from "@/lib/rider-labels";
import { getStatusColor } from "@/lib/shipping-status";

import { RiderFormDialog } from "../_components/rider-form-dialog";
import { RiderActiveToggle, RiderAvailableToggle } from "../_components/rider-toggles";
import { getRiderDetail } from "../riders.server";

export const dynamic = "force-dynamic";

interface RiderDetailPageProps {
  params: Promise<{ riderId: string }>;
}

interface DeliveryRow {
  shipmentId: string;
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  customerName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

interface DeliveryTableLabels {
  empty: string;
  colOrder: string;
  colCustomer: string;
  colAddress: string;
  colAmount: string;
  colStatus: string;
  emDash: string;
}

async function RiderDetailContent({ riderId }: { riderId: string }) {
  const t = await getTranslations("riders");
  const tCommon = await getTranslations("common");
  const tStatus = await getTranslations("status");
  const result = await getRiderDetail(riderId);

  if (!result.success || !result.data) notFound();

  const rider = result.data;
  const stats = result.stats!;
  const activeOrders = result.activeOrders ?? [];
  const completedOrders = result.completedOrders ?? [];

  const tableLabels = {
    colOrder: t("colOrder"),
    colCustomer: t("colCustomer"),
    colAddress: t("colAddress"),
    colAmount: t("colAmount"),
    colStatus: t("colStatus"),
    emDash: tCommon("emDash"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/riders" aria-label={t("backAria")}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
          <Avatar className="size-10">
            {rider.avatarUrl && <AvatarImage src={rider.avatarUrl} alt="" />}
            <AvatarFallback>
              {(rider.fullName ?? rider.email ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {rider.fullName ?? tCommon("emDash")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {rider.email} · {rider.phone ?? t("noPhone")}
            </p>
          </div>
        </div>
        <RiderFormDialog rider={rider} />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("active")}</span>
          <RiderActiveToggle riderId={rider.id} isActive={!rider.isSuspended} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("available")}</span>
          <RiderAvailableToggle riderId={rider.id} isAvailable={rider.isAvailable} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label={t("activeDeliveries")} value={stats.activeDeliveries} />
        <StatCard label={t("todaysDeliveries")} value={stats.todayDeliveries} />
        <StatCard label={t("deliveredToday")} value={stats.deliveredToday} />
        <StatCard label={t("failedToday")} value={stats.failedToday} />
        <StatCard label={t("codHeld")} value={formatCurrency(stats.codHeld)} />
        <StatCard
          label={t("codCollectedToday")}
          value={formatCurrency(stats.codCollectedToday)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("activeOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryTable
            rows={activeOrders}
            labels={{ ...tableLabels, empty: t("noActive") }}
            translateStatus={(status) => translateShippingStatus(tStatus, status)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("completedOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryTable
            rows={completedOrders}
            labels={{ ...tableLabels, empty: t("noCompleted") }}
            translateStatus={(status) => translateShippingStatus(tStatus, status)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function DeliveryTable({
  rows,
  labels,
  translateStatus,
}: {
  rows: DeliveryRow[];
  labels: DeliveryTableLabels;
  translateStatus: (status: string) => string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{labels.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{labels.colOrder}</TableHead>
            <TableHead>{labels.colCustomer}</TableHead>
            <TableHead>{labels.colAddress}</TableHead>
            <TableHead className="text-end">{labels.colAmount}</TableHead>
            <TableHead>{labels.colStatus}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.shipmentId}>
              <TableCell>
                <Link href={`/orders/${row.orderId}`} className="font-medium hover:underline">
                  {row.orderNumber}
                </Link>
              </TableCell>
              <TableCell>{row.customerName ?? labels.emDash}</TableCell>
              <TableCell className="max-w-64 truncate text-muted-foreground">
                {formatAddress(
                  row.addressLine1
                    ? {
                        addressLine1: row.addressLine1,
                        addressLine2: row.addressLine2,
                        city: row.city ?? "",
                        state: row.state ?? "",
                        postalCode: row.postalCode,
                        country: row.country,
                      }
                    : null
                )}
              </TableCell>
              <TableCell className="text-end">
                {formatCurrency(Number(row.totalAmount))}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(row.status)}>
                  {translateStatus(row.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function RiderDetailPage({ params }: RiderDetailPageProps) {
  const { riderId } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-md" />}>
      <RiderDetailContent riderId={riderId} />
    </Suspense>
  );
}
