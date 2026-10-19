import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { formatCurrency } from "@workspace/lib";
import { AD_STATUS_TRANSITIONS, type AdRequestStatus } from "@workspace/lib/admin";
import type { AdminAdRequestRow } from "@workspace/lib/admin/server";
import { ReasonActionButton } from "../_components/dialogs/reason-action.client";
import { formatAdminDate } from "../stores/stores.lib";
import { adStatusAction, retryAdRefundAction } from "./ad-requests.server";

export const AD_STATUS_LABELS: Record<AdRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  active: "Live",
  completed: "Completed",
  rejected: "Rejected",
};

const AD_STATUS_CLASSES: Record<AdRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  approved: "bg-blue-100 text-blue-900 border-blue-200",
  active: "bg-green-100 text-green-900 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  rejected: "bg-red-100 text-red-900 border-red-200",
};

const ACTION_LABELS: Record<AdRequestStatus, string> = {
  pending: "",
  approved: "Approve",
  active: "Mark live",
  completed: "Complete",
  rejected: "Reject",
};

/** Ad requests with their allowed next steps (docs/admin-saas.md §3.8). */
export function AdRequestsTable({ rows, showSeller = true }: { rows: AdminAdRequestRow[]; showSeller?: boolean }) {
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No ad requests.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showSeller && <TableHead>Seller</TableHead>}
          <TableHead>Product</TableHead>
          <TableHead>Package</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const wallet = row.paymentMethod === "wallet";
          return (
            <TableRow key={row.id} className="align-top">
              {showSeller && (
                <TableCell>
                  <Link href={`/sellers/${row.sellerId}`} className="hover:underline">
                    {row.sellerName ?? "Seller"}
                  </Link>
                </TableCell>
              )}
              <TableCell className="max-w-56 text-sm">
                <Link href={`/products/${row.productId}`} className="hover:underline">
                  {row.productName ?? "Product"}
                </Link>
              </TableCell>
              <TableCell className="text-sm">{row.packageKey}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(Number(row.amount))}</TableCell>
              <TableCell className="text-sm">
                {wallet ? "Store wallet" : "Vodafone Cash"}
                {!wallet && (
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {row.payerPhone}
                    {row.transferReference ? ` · ${row.transferReference}` : ""}
                  </div>
                )}
                {wallet && row.status === "rejected" && (
                  <div className={cn("text-xs", row.refunded ? "text-muted-foreground" : "text-destructive")}>
                    {row.refunded ? "Refunded" : "Not refunded"}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("font-normal", AD_STATUS_CLASSES[row.status])}>
                  {AD_STATUS_LABELS[row.status]}
                </Badge>
                {row.adminNotes && <p className="mt-1 max-w-56 text-xs text-muted-foreground">{row.adminNotes}</p>}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatAdminDate(row.createdAt)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  {AD_STATUS_TRANSITIONS[row.status].map((next) => (
                    <ReasonActionButton
                      key={next}
                      label={ACTION_LABELS[next]}
                      title={`${ACTION_LABELS[next]} this request?`}
                      description={
                        next === "rejected" && wallet
                          ? "The seller paid from the store wallet. Rejecting refunds the amount to it automatically."
                          : "The note is saved on the request and in the audit log."
                      }
                      confirmLabel={ACTION_LABELS[next]}
                      destructive={next === "rejected"}
                      variant={next === "rejected" ? "outline" : "default"}
                      payload={{ requestId: row.id, status: next }}
                      action={adStatusAction}
                    />
                  ))}
                  {wallet && row.status === "rejected" && !row.refunded && (
                    <ReasonActionButton
                      label="Retry refund"
                      title="Retry refund"
                      reasonRequired={false}
                      payload={{ requestId: row.id }}
                      action={retryAdRefundAction}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
