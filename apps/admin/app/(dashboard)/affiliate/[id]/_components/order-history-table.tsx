"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { getAffiliateOrderHistory } from "@/actions/affiliates";
import type { AffiliateOrderRow } from "../affiliate-detail.types";
import {
  commissionStatusLabel,
  commissionStatusVariant,
  formatDate,
  money,
  orderStatusVariant,
} from "../../affiliate.lib";

const PAGE_SIZE = 20;

export function OrderHistoryTable({
  affiliateId,
  initialRows,
  initialTotal,
}: {
  affiliateId: string;
  initialRows: AffiliateOrderRow[];
  initialTotal: number;
}) {
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadPage = (nextPage: number) => {
    startTransition(async () => {
      const result = await getAffiliateOrderHistory(affiliateId, {
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
        No orders have used this affiliate code yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Order Amount</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Eligible Amount</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Commission Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.commissionId}>
                <TableCell className="font-medium">
                  <Link href={`/orders/${row.orderId}`} className="hover:underline">
                    #{row.orderNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(row.orderDate)}
                </TableCell>
                <TableCell>{money(row.orderTotalAmount)}</TableCell>
                <TableCell>{money(row.shippingAmount)}</TableCell>
                <TableCell>{money(row.eligibleAmount)}</TableCell>
                <TableCell>{money(row.discountAmount)}</TableCell>
                <TableCell className="font-medium">
                  {money(row.commissionAmount)}
                </TableCell>
                <TableCell>
                  <Badge variant={orderStatusVariant(row.orderStatus)} className="capitalize">
                    {row.orderStatus.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={commissionStatusVariant(row.commissionStatus)}>
                    {commissionStatusLabel(row.commissionStatus)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages} · {total} order{total === 1 ? "" : "s"}
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
