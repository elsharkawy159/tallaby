"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
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
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { ActionButton } from "../tallaby-pay.client";
import {
  adjustTallabyPayWalletAction,
  freezeTallabyPayWalletAction,
  unfreezeTallabyPayWalletAction,
} from "../tallaby-pay.server";

export function FreezeAction({ walletId, frozen, storeName }: { walletId: string; frozen: boolean; storeName: string }) {
  return frozen ? (
    <ActionButton
      label="Unfreeze"
      title={`Unfreeze ${storeName}?`}
      description={<p>The seller can ask for withdrawals again, and you can mark open ones paid.</p>}
      fields={[{ name: "reason", label: "Reason", multiline: true, placeholder: "For example: the chargeback was settled" }]}
      confirm="Unfreeze"
      run={(v) => unfreezeTallabyPayWalletAction({ walletId, reason: v.reason ?? "" })}
    />
  ) : (
    <ActionButton
      label="Freeze"
      title={`Freeze ${storeName}'s earnings?`}
      description={
        <p>
          No new withdrawal request and no Mark paid until you unfreeze. Sales, delivery and refunds still post. The seller&apos;s
          Earnings page shows that withdrawals are on hold.
        </p>
      }
      fields={[{ name: "reason", label: "Reason", multiline: true, placeholder: "For example: an open chargeback" }]}
      confirm="Freeze"
      destructive
      run={(v) => freezeTallabyPayWalletAction({ walletId, reason: v.reason ?? "" })}
    />
  );
}

/**
 * Adds to or takes from a store's available earnings with a reason (for
 * example a chargeback fee, owner Q8). A fresh key per opening makes a double
 * click post one entry.
 */
export function AdjustAction({ walletId, storeName, available }: { walletId: string; storeName: string; available: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [direction, setDirection] = useState<"debit" | "credit">("debit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const ready = /^\d{1,8}(\.\d{1,2})?$/.test(amount.trim()) && Number(amount) > 0 && reason.trim().length >= 3;

  const openDialog = () => {
    setKey(crypto.randomUUID());
    setDirection("debit");
    setAmount("");
    setReason("");
    setOpen(true);
  };

  const submit = () =>
    startTransition(async () => {
      const result = await adjustTallabyPayWalletAction({ walletId, key, direction, amount: amount.trim(), reason: reason.trim() });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        Adjust
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust {storeName}&apos;s earnings</DialogTitle>
            <DialogDescription>
              Changes available earnings (now {available}). It may go below zero; new sales cover it. The entry keeps your reason, and
              the change is logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Direction">
              {(["debit", "credit"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={direction === d}
                  onClick={() => setDirection(d)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm",
                    direction === d ? "border-primary bg-primary/10 font-medium" : "text-muted-foreground",
                  )}
                >
                  {d === "debit" ? "Take from the store" : "Add to the store"}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tp-adjust-amount">Amount (EGP)</Label>
              <Input
                id="tp-adjust-amount"
                inputMode="decimal"
                value={amount}
                maxLength={12}
                placeholder="50.00"
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tp-adjust-reason">Reason</Label>
              <Textarea
                id="tp-adjust-reason"
                rows={3}
                maxLength={500}
                value={reason}
                placeholder="For example: EasyKash chargeback fee for order #1042"
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant={direction === "debit" ? "destructive" : "default"} onClick={submit} disabled={pending || !ready}>
              {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              {direction === "debit" ? `Take EGP ${amount || "0"}` : `Add EGP ${amount || "0"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
