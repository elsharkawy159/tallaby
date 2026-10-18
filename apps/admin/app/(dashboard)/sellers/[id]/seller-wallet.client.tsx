"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { SellerAdminPanel } from "./seller-admin.data";
import { formatCurrency, formatDateTime } from "../sellers.lib";
import { WALLET_ENTRY_LABELS } from "./seller-admin.lib";
import { walletAdjustmentAction } from "./seller-admin.server";
import { ReasonField, reasonIsValid } from "./seller-account.client";

const ACCOUNT_LEVEL = "account";

const amountClass = (amount: string | number | null) => (Number(amount ?? 0) < 0 ? "text-red-600" : "text-green-700");

/** Store wallet: signed balance, ledger check, entries, top-ups and an audited adjustment (P9-01). */
export function SellerWalletPanel({
  sellerId,
  wallet,
  entries,
  topUps,
  stores,
}: {
  sellerId: string;
  wallet: SellerAdminPanel["account"]["wallet"];
  entries: SellerAdminPanel["walletEntries"];
  topUps: SellerAdminPanel["topUps"];
  stores: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [storeId, setStoreId] = useState(ACCOUNT_LEVEL);
  const [reason, setReason] = useState("");
  // One key per adjustment: a double click or retry of the same form posts once.
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [pending, startTransition] = useTransition();

  const balance = wallet?.balance ?? "0";
  const ledgerMismatch = wallet ? Number(wallet.balance) !== Number(wallet.ledgerTotal) : false;

  const openDialog = () => {
    setAmount("");
    setStoreId(ACCOUNT_LEVEL);
    setReason("");
    setIdempotencyKey(crypto.randomUUID());
    setOpen(true);
  };

  const submit = () => {
    startTransition(async () => {
      const result = await walletAdjustmentAction({
        sellerId,
        storeId: storeId === ACCOUNT_LEVEL ? null : storeId,
        amount: amount.trim(),
        reason,
        idempotencyKey,
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card id="wallet">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Store wallet</CardTitle>
        <Button size="sm" variant="outline" onClick={openDialog}>
          Adjust balance
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className={`text-3xl font-semibold ${amountClass(balance)}`}>{formatCurrency(balance)}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            Status: <Badge variant="outline">{wallet?.status ?? "no wallet yet"}</Badge>
          </div>
          {wallet && (
            <div className={`text-sm ${ledgerMismatch ? "font-medium text-red-600" : "text-muted-foreground"}`}>
              Ledger total {formatCurrency(wallet.ledgerTotal)}
              {ledgerMismatch ? " · does not match the balance, investigate" : " · matches"}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="mb-2 text-sm font-medium">Latest entries</div>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Store</th>
                  <th className="py-2 pr-3 font-medium">Reference</th>
                  <th className="py-2 pr-3 text-right font-medium">Amount</th>
                  <th className="py-2 text-right font-medium">Balance after</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{entry.createdAt ? formatDateTime(entry.createdAt) : "—"}</td>
                    <td className="py-2 pr-3">
                      {WALLET_ENTRY_LABELS[entry.type] ?? entry.type}
                      {entry.reason && <div className="text-xs text-muted-foreground">{entry.reason}</div>}
                    </td>
                    <td className="py-2 pr-3">{entry.storeName ?? "Account"}</td>
                    <td className="py-2 pr-3 text-xs">
                      {entry.orderId ? (
                        <Link href={`/orders/${entry.orderId}`} className="hover:underline">
                          order {entry.orderId.slice(0, 8)}
                        </Link>
                      ) : entry.referenceType ? (
                        `${entry.referenceType}:${(entry.referenceId ?? "").slice(0, 8)}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`py-2 pr-3 text-right font-medium ${amountClass(entry.amount)}`}>{formatCurrency(entry.amount)}</td>
                    <td className="py-2 text-right">{entry.balanceAfter !== null ? formatCurrency(entry.balanceAfter) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="mb-2 text-sm font-medium">Top-ups</div>
          {topUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No top-ups.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Provider</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {topUps.map((topUp) => (
                  <tr key={topUp.id} className="border-b align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(topUp.createdAt)}</td>
                    <td className="py-2 pr-3">
                      {topUp.provider}
                      {topUp.providerReference && <div className="text-xs text-muted-foreground">{topUp.providerReference}</div>}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline">{topUp.status}</Badge>
                      {topUp.failureReason && <div className="text-xs text-red-600">{topUp.failureReason}</div>}
                    </td>
                    <td className="py-2 text-right">{formatCurrency(topUp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={(next) => !next && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust the store wallet</DialogTitle>
            <DialogDescription>
              Posts one ledger `adjustment` entry. Use a minus sign for a debit (the balance may go negative). Saved with
              the reason in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="adjust-amount">Amount in EGP (e.g. 100 or -50.25)</Label>
              <Input id="adjust-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Store (for per-store reports)</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ACCOUNT_LEVEL}>Account level (no store)</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ReasonField value={reason} onChange={setReason} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending || !reasonIsValid(reason) || amount.trim() === ""}>
              {pending ? "Posting…" : "Post adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
