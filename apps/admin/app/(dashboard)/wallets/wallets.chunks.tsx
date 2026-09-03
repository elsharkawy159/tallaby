"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Banknote, Lock, Wallet as WalletIcon } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { TableCell, TableRow } from "@workspace/ui/components/table";

import {
  approvePayoutRequest,
  completePayoutRequest,
  getWalletTransactions,
  markPayoutProcessing,
  rejectPayoutRequest,
} from "./wallets.server";
import {
  describeDestination,
  formatDateTime,
  money,
  payoutStatusVariant,
  walletStatusVariant,
} from "./wallets.lib";
import type {
  PayoutRequestRow,
  WalletRow,
  WalletStats,
  WalletTransactionRow,
} from "./wallets.types";

export function WalletStatsCards({ stats }: { stats: WalletStats }) {
  const tiles = [
    {
      label: "Wallets",
      value: stats.totalWallets.toLocaleString(),
      icon: WalletIcon,
    },
    { label: "Total balance", value: money(stats.totalBalance), icon: Banknote },
    { label: "Reserved", value: money(stats.totalReserved), icon: Lock },
    {
      label: "Open payouts",
      value: `${stats.pendingPayouts} · ${money(stats.pendingPayoutAmount)}`,
      icon: Banknote,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-primary/10 p-2">
              <tile.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{tile.label}</p>
              <p className="text-lg font-semibold">{tile.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Payout requests                                                            */
/* -------------------------------------------------------------------------- */

type PayoutAction = "approve" | "reject" | "complete";

export function PayoutRequestRowView({
  request,
  onChanged,
}: {
  request: PayoutRequestRow;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<PayoutAction | null>(null);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const run = (action: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }
      toast.success("Payout request updated");
      setDialog(null);
      setReason("");
      setReference("");
      setNotes("");
      onChanged();
    });
  };

  const canApprove = request.status === "pending";
  const canProcess = request.status === "approved";
  const canComplete =
    request.status === "approved" || request.status === "processing";
  const canReject = ["pending", "approved", "processing"].includes(
    request.status
  );

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="font-medium">{request.userName ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {request.userEmail ?? "—"} · {request.userRole ?? "—"}
          </div>
        </TableCell>
        <TableCell className="font-semibold">{money(request.amount)}</TableCell>
        <TableCell>
          <div className="text-sm">{request.method}</div>
          <div className="text-xs text-muted-foreground">
            {describeDestination(request.destination)}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">{money(request.walletBalance)}</div>
          <div className="text-xs text-muted-foreground">
            reserved {money(request.walletReservedBalance)}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={payoutStatusVariant(request.status)}>
            {request.status}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {formatDateTime(request.createdAt)}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-wrap justify-end gap-1">
            {canApprove && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => setDialog("approve")}
              >
                Approve
              </Button>
            )}
            {canProcess && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    markPayoutProcessing({ payoutRequestId: request.id })
                  )
                }
              >
                Processing
              </Button>
            )}
            {canComplete && (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => setDialog("complete")}
              >
                Complete
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => setDialog("reject")}
              >
                Reject
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      <Dialog
        open={dialog === "approve"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve payout</DialogTitle>
            <DialogDescription>
              Approving reserves nothing new — the amount is already held. The
              balance is only debited when you mark the payout completed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approve-notes">Notes (optional)</Label>
            <Textarea
              id="approve-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() =>
                run(() =>
                  approvePayoutRequest({
                    payoutRequestId: request.id,
                    adminNotes: notes || undefined,
                  })
                )
              }
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "complete"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete payout</DialogTitle>
            <DialogDescription>
              Only do this after the transfer has actually been sent. This
              debits {money(request.amount)} from the wallet and writes a
              permanent ledger entry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complete-reference">Transfer reference</Label>
              <Input
                id="complete-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Bank or InstaPay reference"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-notes">Notes (optional)</Label>
              <Textarea
                id="complete-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={isPending || reference.trim().length < 2}
              onClick={() =>
                run(() =>
                  completePayoutRequest({
                    payoutRequestId: request.id,
                    externalReference: reference,
                    adminNotes: notes || undefined,
                  })
                )
              }
            >
              Mark completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "reject"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject payout</DialogTitle>
            <DialogDescription>
              The held amount goes straight back to the user&apos;s available
              balance. The reason is shown to them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || reason.trim().length < 3}
              onClick={() =>
                run(() =>
                  rejectPayoutRequest({
                    payoutRequestId: request.id,
                    rejectionReason: reason,
                  })
                )
              }
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Wallets                                                                    */
/* -------------------------------------------------------------------------- */

export function WalletRowView({ wallet }: { wallet: WalletRow }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [transactions, setTransactions] = useState<WalletTransactionRow[]>([]);

  const openLedger = () => {
    setIsOpen(true);
    startTransition(async () => {
      const result = await getWalletTransactions(wallet.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setTransactions(result.data);
    });
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="font-medium">{wallet.userName ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {wallet.userEmail ?? "—"} · {wallet.userRole ?? "—"}
          </div>
        </TableCell>
        <TableCell className="font-semibold">
          {money(wallet.availableBalance)}
        </TableCell>
        <TableCell>{money(wallet.balance)}</TableCell>
        <TableCell>{money(wallet.reservedBalance)}</TableCell>
        <TableCell>
          <Badge variant={walletStatusVariant(wallet.status)}>
            {wallet.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button size="sm" variant="outline" onClick={openLedger}>
            Ledger
          </Button>
        </TableCell>
      </TableRow>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Ledger — {wallet.userName ?? wallet.userEmail ?? wallet.id}
            </DialogTitle>
            <DialogDescription>
              Append-only. Corrections are made by posting a compensating
              transaction, never by editing a row.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {isPending && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            )}
            {!isPending && transactions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transactions yet.
              </p>
            )}
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b py-2 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-medium">{transaction.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(transaction.createdAt)}
                    {transaction.referenceType
                      ? ` · ${transaction.referenceType}`
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={
                      Number(transaction.amount) < 0
                        ? "font-semibold text-destructive"
                        : "font-semibold text-emerald-600"
                    }
                  >
                    {money(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {money(transaction.balanceBefore)} →{" "}
                    {money(transaction.balanceAfter)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
