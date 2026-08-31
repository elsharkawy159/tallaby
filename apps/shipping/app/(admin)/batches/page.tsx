import { Suspense } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { formatDate } from "@/lib/format";
import { getBatches } from "./batches.server";

export const dynamic = "force-dynamic";

async function BatchesTable() {
  const t = await getTranslations("batches");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const result = await getBatches();

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
            <TableHead>{t("colBatch")}</TableHead>
            <TableHead>{t("colProvider")}</TableHead>
            <TableHead className="text-end">{t("colOrders")}</TableHead>
            <TableHead>{t("colCreatedBy")}</TableHead>
            <TableHead>{t("colDate")}</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.data.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">
                <Link href={`/batches/${batch.id}`} className="hover:underline">
                  {batch.label}
                </Link>
              </TableCell>
              <TableCell>{batch.providerName}</TableCell>
              <TableCell className="text-end">{batch.orderCount}</TableCell>
              <TableCell className="text-muted-foreground">
                {batch.createdByName ?? tCommon("emDash")}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(batch.createdAt, locale)}
              </TableCell>
              <TableCell>
                {batch.hasExport && (
                  <Button asChild variant="ghost" size="sm">
                    <a
                      href={`/batches/${batch.id}/export`}
                      aria-label={t("downloadAria", { label: batch.label })}
                    >
                      <Download className="size-4" />
                    </a>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function BatchesPage() {
  const t = await getTranslations("batches");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
        <BatchesTable />
      </Suspense>
    </div>
  );
}
