import { Suspense } from "react";
import Link from "next/link";

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
  const result = await getRiders();

  if (!result.success) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? "Failed to load riders"}
      </p>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="rounded-md border bg-white p-10 text-center dark:bg-gray-950">
        <p className="text-sm text-muted-foreground">
          No rider accounts yet. Add one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm dark:bg-gray-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Today</TableHead>
            <TableHead className="text-right">Active</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.data.map((rider) => (
            <TableRow key={rider.id}>
              <TableCell className="font-medium">
                <Link href={`/riders/${rider.id}`} className="hover:underline">
                  {rider.fullName ?? "—"}
                </Link>
              </TableCell>
              <TableCell>{rider.email ?? "—"}</TableCell>
              <TableCell>{rider.phone ?? "—"}</TableCell>
              <TableCell className="text-right">{rider.todayDeliveries}</TableCell>
              <TableCell className="text-right">
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

export default function RidersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riders</h1>
          <p className="text-sm text-muted-foreground">
            Users with the rider role. Assign them to orders from the order page.
          </p>
        </div>
        <RiderFormDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-md" />}>
        <RidersTable />
      </Suspense>
    </div>
  );
}
