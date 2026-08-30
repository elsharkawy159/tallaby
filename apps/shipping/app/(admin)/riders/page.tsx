import { Suspense } from "react";
import Link from "next/link";

import { Badge } from "@workspace/ui/components/badge";
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
          No rider accounts yet. Promote an existing user with{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            UPDATE users SET role = &apos;driver&apos; WHERE email = &apos;…&apos;
          </code>
          .
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
            <TableHead className="text-right">Active deliveries</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.data.map((rider) => (
            <TableRow key={rider.id}>
              <TableCell className="font-medium">
                {rider.fullName ?? "—"}
              </TableCell>
              <TableCell>{rider.email ?? "—"}</TableCell>
              <TableCell>{rider.phone ?? "—"}</TableCell>
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
                <Badge
                  className={
                    rider.isSuspended
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }
                >
                  {rider.isSuspended ? "Suspended" : "Active"}
                </Badge>
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Riders</h1>
        <p className="text-sm text-muted-foreground">
          Users with the rider role. Assign them to orders from the order page.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-md" />}>
        <RidersTable />
      </Suspense>
    </div>
  );
}
