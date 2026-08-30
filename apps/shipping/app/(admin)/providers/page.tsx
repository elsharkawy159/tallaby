import { Suspense } from "react";

import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { ProviderToggle } from "./providers.client";
import { getProviders } from "./providers.server";

export const dynamic = "force-dynamic";

async function ProvidersTable() {
  const result = await getProviders();

  if (!result.success) {
    return (
      <p className="text-sm text-destructive">
        {result.error ?? "Failed to load providers"}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm dark:bg-gray-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="text-right">Shipments</TableHead>
            <TableHead className="w-24">Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.data.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell className="font-medium">{provider.name}</TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {provider.code}
                </code>
              </TableCell>
              <TableCell className="text-right">
                {provider.shipmentCount}
              </TableCell>
              <TableCell>
                <ProviderToggle
                  providerId={provider.id}
                  name={provider.name}
                  isActive={provider.isActive}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
        <p className="text-sm text-muted-foreground">
          Only active providers can be assigned to an order. Carrier API
          integrations live in <code>providers/</code> and are wired up per
          provider code.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
        <ProvidersTable />
      </Suspense>
    </div>
  );
}
