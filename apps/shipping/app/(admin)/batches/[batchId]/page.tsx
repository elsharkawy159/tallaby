import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Download } from "lucide-react";

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

import { formatCurrency, formatDate } from "@/lib/format";
import { getBatchDetail } from "../batches.server";

export const dynamic = "force-dynamic";

interface BatchDetailPageProps {
  params: Promise<{ batchId: string }>;
}

async function BatchDetailContent({ batchId }: { batchId: string }) {
  const t = await getTranslations("batches");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const result = await getBatchDetail(batchId);

  if (!result.success || !result.data) notFound();

  const batch = result.data;
  const meta =
    batch.orderCount === 1
      ? t("meta", {
          provider: batch.providerName,
          count: batch.orderCount,
          date: formatDate(batch.createdAt, locale),
        })
      : t("meta_other", {
          provider: batch.providerName,
          count: batch.orderCount,
          date: formatDate(batch.createdAt, locale),
        });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/batches" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4 rtl:rotate-180" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{batch.label}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {meta}
            {batch.createdByName ? t("metaBy", { name: batch.createdByName }) : ""}
          </p>
        </div>
        {batch.hasExport && (
          <Button asChild variant="outline">
            <a href={`/batches/${batch.id}/export`}>
              <Download className="size-4" />
              {t("downloadSheet")}
            </a>
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border bg-white shadow-sm dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colOrder")}</TableHead>
              <TableHead>{t("colCustomer")}</TableHead>
              <TableHead className="text-end">{t("colAmount")}</TableHead>
              <TableHead>{t("colRider")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batch.orders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-medium">
                  <Link href={`/orders/${order.orderId}`} className="hover:underline">
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{order.customerName ?? tCommon("emDash")}</TableCell>
                <TableCell className="text-end">
                  {formatCurrency(Number(order.totalAmount))}
                </TableCell>
                <TableCell>{order.riderName ?? tCommon("emDash")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { batchId } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-md" />}>
      <BatchDetailContent batchId={batchId} />
    </Suspense>
  );
}
