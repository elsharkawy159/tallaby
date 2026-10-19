"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Receipt, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
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

import { ReasonField, reasonIsValid } from "../sellers/[id]/seller-account.client";
import { sellerOverrideAction, walletAdjustmentAction } from "../sellers/[id]/seller-admin.server";
import { ReviewDialog } from "../store-top-ups/store-top-ups.client";
import type { StoreTopUpWithProof } from "./store-wallets.data";
import { egp } from "./store-wallets.lib";

/**
 * Store-wallet writes for admins. All go through the existing audited
 * actions: `walletAdjustmentAction` (postStoreWalletEntry, `adjustment`,
 * idempotent per form key), `sellerOverrideAction` (negative limit) and
 * `reviewStoreTopUpAction` (manual top-ups). Each re-checks the admin on the
 * server and writes admin_audit_log.
 */

const ACCOUNT_LEVEL = "account";

export function AdjustStoreWalletButton({
  sellerId,
  stores,
  size = "sm",
}: {
  sellerId: string;
  stores: { id: string; name: string }[];
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [storeId, setStoreId] = useState(ACCOUNT_LEVEL);
  const [reason, setReason] = useState("");
  // One key per adjustment: a double click or retry of the same form posts once.
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [pending, startTransition] = useTransition();

  const cleanAmount = amount.trim().replace(/^[-+]/, "");
  const signed = direction === "debit" ? `-${cleanAmount}` : cleanAmount;

  const openDialog = () => {
    setDirection("credit");
    setAmount("");
    setStoreId(ACCOUNT_LEVEL);
    setReason("");
    setIdempotencyKey(crypto.randomUUID());
    setOpen(true);
  };

  const submit = () =>
    startTransition(async () => {
      const result = await walletAdjustmentAction({
        sellerId,
        storeId: storeId === ACCOUNT_LEVEL ? null : storeId,
        amount: signed,
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

  return (
    <>
      <Button size={size} onClick={openDialog}>
        <SlidersHorizontal aria-hidden /> Adjust balance
      </Button>
      <Dialog open={open} onOpenChange={(next) => !next && !pending && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust the store wallet</DialogTitle>
            <DialogDescription>
              Posts one ledger <code>adjustment</code> entry. The balance may go negative. The amount, the reason and your
              name are saved in the audit log. Entries are never edited; to undo, post the opposite adjustment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Direction">
              {(["credit", "debit"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={direction === value}
                  variant={direction === value ? (value === "credit" ? "default" : "destructive") : "outline"}
                  onClick={() => setDirection(value)}
                >
                  {value === "credit" ? "Add money (credit)" : "Take money (debit)"}
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adjust-amount">Amount in EGP</Label>
              <Input
                id="adjust-amount"
                inputMode="decimal"
                placeholder="e.g. 100 or 50.25"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
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
            {cleanAmount !== "" && (
              <p className="text-sm text-muted-foreground">
                This will post <strong className={direction === "debit" ? "text-red-600" : "text-green-700"}>{egp(signed)}</strong>.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={direction === "debit" ? "destructive" : "default"}
              onClick={submit}
              disabled={pending || !reasonIsValid(reason) || cleanAmount === ""}
            >
              {pending ? "Posting…" : "Post adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** D21 overdraft for optional purchases (ads, themes). Fees ignore it. */
export function NegativeLimitButton({ sellerId, current }: { sellerId: string; current: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const openDialog = () => {
    setValue(current ?? "");
    setReason("");
    setOpen(true);
  };

  const submit = () =>
    startTransition(async () => {
      const result = await sellerOverrideAction({
        action: "set_negative_limit",
        sellerId,
        reason,
        negativeLimit: value.trim() === "" ? null : value.trim(),
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <>
      <Button size="sm" variant="outline" onClick={openDialog}>
        Change limit
      </Button>
      <Dialog open={open} onOpenChange={(next) => !next && !pending && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet negative limit</DialogTitle>
            <DialogDescription>
              How far below zero optional purchases (ads, themes) may take this wallet. Empty means none: no overdraft.
              Platform fees always post, whatever this limit. The balance does not change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="negative-limit">Limit in EGP (empty = none)</Label>
              <Input
                id="negative-limit"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
            <ReasonField value={reason} onChange={setReason} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending || !reasonIsValid(reason)}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Receipt link plus Approve / Reject for a manual top-up still waiting for review. */
export function TopUpReviewActions({ row }: { row: StoreTopUpWithProof }) {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {row.proofUrl && (
        <Button asChild size="sm" variant="ghost">
          <a href={row.proofUrl} target="_blank" rel="noopener noreferrer">
            <Receipt aria-hidden /> Receipt
          </a>
        </Button>
      )}
      {row.reviewable && (
        <>
          <Button size="sm" onClick={() => setDecision("approve")}>
            <Check aria-hidden /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDecision("reject")}>
            <X aria-hidden /> Reject
          </Button>
        </>
      )}
      {decision && (
        <ReviewDialog
          key={row.id + decision}
          row={{ ...row, method: row.provider }}
          decision={decision}
          onClose={() => setDecision(null)}
        />
      )}
    </div>
  );
}
