import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { getRiders } from "../orders/orders.server";
import { RiderFormDialog } from "./_components/rider-form-dialog";
import { RiderActiveToggle, RiderAvailableToggle } from "./_components/rider-toggles";

export const dynamic = "force-dynamic";

async function RidersTable() {
  const t = await getTranslations("riders");
  const tCommon = await getTranslations("common");
  const result = await getRiders();

  if (!result.success) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? t("loadError")}
      </p>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="rounded-md border bg-white p-10 text-center dark:bg-gray-950">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm dark:bg-gray-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("colName")}</TableHead>
            <TableHead>{t("colEmail")}</TableHead>
            <TableHead>{t("colPhone")}</TableHead>
            <TableHead className="text-end">{t("colToday")}</TableHead>
            <TableHead className="text-end">{t("colActive")}</TableHead>
            <TableHead>{t("colAvailable")}</TableHead>
            <TableHead>{t("colActive")}</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.data.map((rider) => (
            <TableRow key={rider.id}>
              <TableCell className="font-medium">
                <Link href={`/riders/${rider.id}`} className="hover:underline">
                  {rider.fullName ?? tCommon("emDash")}
                </Link>
              </TableCell>
              <TableCell>{rider.email ?? tCommon("emDash")}</TableCell>
              <TableCell>{rider.phone ?? tCommon("emDash")}</TableCell>
              <TableCell className="text-end">{rider.todayDeliveries}</TableCell>
              <TableCell className="text-end">
                {rider.activeDeliveries > 0 ? (
                  <Link
                    href={`/orders?riderId=${rider.id}`}
                    className="hover:underline"
                  >
                    {rider.activeDeliveries}
                  </Link>
                ) : (
                  0
                )}
              </TableCell>
              <TableCell>
                <RiderAvailableToggle
                  riderId={rider.id}
                  isAvailable={rider.isAvailable ?? true}
                />
              </TableCell>
              <TableCell>
                <RiderActiveToggle riderId={rider.id} isActive={!rider.isSuspended} />
              </TableCell>
              <TableCell>
                <RiderFormDialog rider={rider} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function RidersPage() {
  const t = await getTranslations("riders");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <RiderFormDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-md" />}>
        <RidersTable />
      </Suspense>
    </div>
  );
}
