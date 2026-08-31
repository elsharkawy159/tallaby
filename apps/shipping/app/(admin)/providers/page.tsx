import { Suspense } from "react";
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

import { DeleteProviderButton } from "./_components/delete-provider-button";
import { ProviderFormDialog } from "./_components/provider-form-dialog";
import { ProviderToggle } from "./providers.client";
import { getProviders } from "./providers.server";

export const dynamic = "force-dynamic";

async function ProvidersTable() {
  const t = await getTranslations("providers");
  const tCommon = await getTranslations("common");
  const result = await getProviders();

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
            <TableHead>{t("colProvider")}</TableHead>
            <TableHead>{t("colCode")}</TableHead>
            <TableHead>{t("colContact")}</TableHead>
            <TableHead className="text-end">{t("colActive")}</TableHead>
            <TableHead className="text-end">{t("colDelivered")}</TableHead>
            <TableHead className="text-end">{t("colFailed")}</TableHead>
            <TableHead className="text-end">{t("colReturned")}</TableHead>
            <TableHead className="w-24">{t("colActive")}</TableHead>
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
                    {provider.contactName ?? tCommon("emDash")}
                    {provider.contactPhone && ` · ${provider.contactPhone}`}
                  </>
                ) : (
                  tCommon("emDash")
                )}
              </TableCell>
              <TableCell className="text-end">{provider.activeCount}</TableCell>
              <TableCell className="text-end">{provider.deliveredCount}</TableCell>
              <TableCell className="text-end">{provider.failedCount}</TableCell>
              <TableCell className="text-end">{provider.returnedCount}</TableCell>
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

export default async function ProvidersPage() {
  const t = await getTranslations("providers");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <ProviderFormDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
        <ProvidersTable />
      </Suspense>
    </div>
  );
}
