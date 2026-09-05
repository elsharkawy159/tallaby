"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";

import { getAffiliateLedger } from "@/actions/affiliates";
import type { AffiliateLedgerRow } from "../affiliate-detail.types";
import {
  commissionStatusLabel,
  commissionStatusVariant,
  formatDateTime,
  money,
} from "../../affiliate.lib";

const PAGE_SIZE = 20;

export function CommissionLedger({
  affiliateId,
  initialRows,
  initialTotal,
}: {
  affiliateId: string;
  initialRows: AffiliateLedgerRow[];
  initialTotal: number;
}) {
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadPage = (nextPage: number) => {
    startTransition(async () => {
      const result = await getAffiliateLedger(affiliateId, {
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRows(result.data.rows);
      setTotal(result.data.total);
      setPage(nextPage);
    });
  };

  if (initialTotal === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No commission activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="divide-y">
        {rows.map((row) => {
          const isReversal = row.type === "reversal";
          return (
            <div
              key={row.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={
                    isReversal
                      ? "rounded-full bg-destructive/10 p-2"
                      : "rounded-full bg-emerald-500/10 p-2"
                  }
                >
                  {isReversal ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isReversal ? "Commission Reversal" : "Affiliate Commission"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(row.createdAt)} ·{" "}
                    <Link
                      href={`/orders/${row.orderId}`}
                      className="hover:underline"
                    >
                      #{row.orderNumber}
                    </Link>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={
                    isReversal
                      ? "font-semibold text-destructive"
                      : "font-semibold text-emerald-600"
                  }
                >
                  {isReversal ? "-" : "+"}
                  {money(row.commissionAmount)}
                </p>
                <Badge variant={commissionStatusVariant(row.status)} className="mt-1">
                  {commissionStatusLabel(row.status)}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages} · {total} entr{total === 1 ? "y" : "ies"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending || page === 0}
            onClick={() => loadPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending || page + 1 >= totalPages}
            onClick={() => loadPage(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
