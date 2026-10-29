"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { formatCurrency } from "@workspace/lib";
import type { AdminPayoutRow } from "@workspace/lib/admin/server";
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
import {
  markReferralPayoutPaidAction,
  rejectReferralPayoutAction,
  relockReferrerAction,
  reverseReferralCommissionsAction,
} from "./referrals.server";

const when = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso))
    : "—";

type ActionResult = { success: true; message: string } | { success: false; error: string };

/** A dialog with one text field that runs an action and refreshes the page. */
function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  multiline,
  confirm,
  destructive,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  label: string;
  multiline?: boolean;
  confirm: string;
  destructive?: boolean;
  run: (value: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const result = await run(value);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setValue("");
      onOpenChange(false);
      router.refresh();
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div>{description}</div>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="referral-action-value">{label}</Label>
          {multiline ? (
            <Textarea id="referral-action-value" value={value} onChange={(e) => setValue(e.target.value)} rows={3} />
          ) : (
            <Input id="referral-action-value" value={value} onChange={(e) => setValue(e.target.value)} />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={submit} disabled={pending || value.trim().length < 2}>
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Destination({ row }: { row: AdminPayoutRow }) {
  const d = row.destination;
  if (!d) return <span className="text-destructive">Unreadable destination</span>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Method</dt>
      <dd>{d.method === "bank" ? "Bank transfer" : "Vodafone Cash"}</dd>
      <dt className="text-muted-foreground">Holder</dt>
      <dd>{d.holderName}</dd>
      {d.method === "bank" ? (
        <>
          <dt className="text-muted-foreground">Bank</dt>
          <dd>{d.bankName}</dd>
          <dt className="text-muted-foreground">Account</dt>
          <dd className="break-all font-mono">{d.accountNumber}</dd>
        </>
      ) : (
        <>
          <dt className="text-muted-foreground">Number</dt>
          <dd className="font-mono">{d.phone}</dd>
        </>
      )}
      <dt className="text-muted-foreground">Seller phone</dt>
      <dd className="font-mono">{row.sellerPhone ?? "—"}</dd>
    </dl>
  );
}

export function PayoutList({ rows, open }: { rows: AdminPayoutRow[]; open: boolean }) {
  const [active, setActive] = useState<{ row: AdminPayoutRow; decision: "pay" | "reject" } | null>(null);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {open ? "No withdrawal requests are waiting." : "No paid or rejected requests yet."}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a href={`/referrals/${row.sellerId}`} className="block truncate font-semibold hover:underline">
                    {row.sellerName}
                  </a>
                  <p className="text-xs text-muted-foreground">Requested {when(row.createdAt)}</p>
                </div>
                <p className="text-xl font-bold tabular-nums">{formatCurrency(Number(row.amount))}</p>
              </div>
              <Destination row={row} />
              {open ? (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setActive({ row, decision: "pay" })}>
                    Mark paid
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setActive({ row, decision: "reject" })}>
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  {row.status === "paid" ? <Badge>Paid</Badge> : <Badge variant="destructive">Rejected</Badge>}
                  <p className="text-xs text-muted-foreground">{when(row.reviewedAt)}</p>
                  {row.reference && <p className="text-xs">Reference: {row.reference}</p>}
                  {row.rejectionReason && <p className="text-xs">Reason: {row.rejectionReason}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {active && (
        <ActionDialog
          open
          onOpenChange={(o) => !o && setActive(null)}
          title={active.decision === "pay" ? "Mark withdrawal paid" : "Reject withdrawal"}
          description={
            active.decision === "pay"
              ? `Only after you sent ${formatCurrency(Number(active.row.amount))} to ${active.row.sellerName}. The seller is notified.`
              : `${formatCurrency(Number(active.row.amount))} goes back to ${active.row.sellerName}'s balance. The seller sees the reason.`
          }
          label={active.decision === "pay" ? "Transfer reference" : "Reason"}
          multiline={active.decision === "reject"}
          confirm={active.decision === "pay" ? "Mark paid" : "Reject"}
          destructive={active.decision === "reject"}
          run={(value) =>
            active.decision === "pay"
              ? markReferralPayoutPaidAction({ payoutId: active.row.id, reference: value })
              : rejectReferralPayoutAction({ payoutId: active.row.id, reason: value })
          }
        />
      )}
    </>
  );
}

/** "Reverse" on a referred seller: fake account, its commissions are cancelled. */
export function ReverseButton({ referredSellerId, name }: { referredSellerId: string; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Reverse
      </Button>
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={`Reverse ${name}`}
        description="Cancels every commission this seller earned their referrer and stops them counting toward the 10 + 10 unlock. Use it for fake or duplicate accounts."
        label="Reason"
        multiline
        confirm="Reverse commissions"
        destructive
        run={(reason) => reverseReferralCommissionsAction({ referredSellerId, reason })}
      />
    </>
  );
}

/** Clears a referrer's unlock (after reversing fake accounts). */
export function RelockButton({ sellerId }: { sellerId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Lock withdrawals again
      </Button>
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title="Lock withdrawals again"
        description="The referrer can withdraw again only once their honest counts reach 10 referrals and 10 stores."
        label="Reason"
        multiline
        confirm="Lock"
        destructive
        run={(reason) => relockReferrerAction({ sellerId, reason })}
      />
    </>
  );
}
