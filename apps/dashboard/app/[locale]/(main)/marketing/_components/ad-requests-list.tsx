"use client";

import { Megaphone } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import type { AdRequestRow } from "@/actions/ads";
import type { AdRequestStatus } from "@/lib/ad-packages";
import { ProductThumb } from "./product-thumb";

const STATUS_VARIANT: Record<AdRequestStatus, "warning" | "info" | "success" | "muted" | "danger"> = {
  pending: "warning",
  approved: "info",
  active: "success",
  completed: "muted",
  rejected: "danger",
};

export function AdRequestsList({ requests }: { requests: AdRequestRow[] }) {
  const t = useTranslations("advertise.requests");
  const tPackage = useTranslations("advertise.package");
  const format = useFormatter();
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium" });

  return (
    <section id="ad-requests" aria-labelledby="ad-requests-title" className="scroll-mt-24 space-y-3 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="ad-requests-title" className="text-lg font-bold">
          {t("title")}
        </h2>
        <Badge variant="count">{requests.length}</Badge>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-5 py-9 text-center text-muted-foreground">
            <span className="mb-1.5 flex size-11 items-center justify-center rounded-xl border bg-card text-primary-ink">
              <Megaphone className="size-4.5" aria-hidden />
            </span>
            <b className="text-sm text-foreground">{t("empty")}</b>
            <span className="text-[13px]">{t("emptyHint")}</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="ps-4.5">{t("columns.product")}</TableHead>
                <TableHead className="max-sm:hidden">{t("columns.package")}</TableHead>
                <TableHead>{t("columns.amount")}</TableHead>
                <TableHead className="pe-4.5">{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="ps-4.5">
                    <div className="flex items-center gap-3">
                      <ProductThumb image={r.product.image} size={40} />
                      <div className="min-w-0">
                        <p className="max-w-56 truncate text-[13px] font-medium">{r.product.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.startsAt && r.endsAt
                            ? t("runs", { start: date(r.startsAt), end: date(r.endsAt) })
                            : t("submittedOn", { date: date(r.createdAt) })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] max-sm:hidden">
                    {tPackage.has(`${r.packageKey}.name`) ? tPackage(`${r.packageKey}.name`) : r.packageKey}
                  </TableCell>
                  <TableCell className="text-[13px] tabular-nums">
                    {r.amount.toLocaleString()} {tPackage("currency")}
                  </TableCell>
                  <TableCell className="pe-4.5">
                    <Badge variant={STATUS_VARIANT[r.status]}>{t(`status.${r.status}`)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
