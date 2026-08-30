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

import { DeleteProviderButton } from "./_components/delete-provider-button";
import { ProviderFormDialog } from "./_components/provider-form-dialog";
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

  if (result.data.length === 0) {
    return (
      <div className="rounded-md border bg-white p-10 text-center dark:bg-gray-950">
        <p className="text-sm text-muted-foreground">No providers yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm dark:bg-gray-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Active</TableHead>
            <TableHead className="text-right">Delivered</TableHead>
            <TableHead className="text-right">Failed</TableHead>
            <TableHead className="text-right">Returned</TableHead>
            <TableHead className="w-24">Active</TableHead>
            <TableHead className="w-20" />
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
              <TableCell className="text-sm text-muted-foreground">
                {provider.contactName || provider.contactPhone ? (
                  <>
                    {provider.contactName ?? "—"}
                    {provider.contactPhone && ` · ${provider.contactPhone}`}
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">{provider.activeCount}</TableCell>
              <TableCell className="text-right">{provider.deliveredCount}</TableCell>
              <TableCell className="text-right">{provider.failedCount}</TableCell>
              <TableCell className="text-right">{provider.returnedCount}</TableCell>
              <TableCell>
                <ProviderToggle
                  providerId={provider.id}
                  name={provider.name}
                  isActive={provider.isActive}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <ProviderFormDialog provider={provider} />
                  <DeleteProviderButton
                    providerId={provider.id}
                    name={provider.name}
                    shipmentCount={provider.shipmentCount}
                  />
                </div>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
          <p className="text-sm text-muted-foreground">
            Only active providers can be assigned to an order. Carrier API
            integrations live in <code>providers/</code> and are wired up per
            provider code.
          </p>
        </div>
        <ProviderFormDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
        <ProvidersTable />
      </Suspense>
    </div>
  );
}
