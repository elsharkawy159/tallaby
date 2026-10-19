"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ExternalLink, ImageOff, LoaderCircle, X } from "lucide-react";
import { formatCurrency } from "@workspace/lib";
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
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import type { TopUpWithProof } from "./store-top-ups.data";
import { reviewStoreTopUpAction } from "./store-top-ups.server";

const METHOD: Record<string, string> = { vodafone_cash: "Vodafone Cash", instapay: "InstaPay" };

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso));

export function StoreTopUpsList({ rows, view }: { rows: TopUpWithProof[]; view: "pending" | "reviewed" }) {
  const [active, setActive] = useState<{ row: TopUpWithProof; decision: "approve" | "reject" } | null>(null);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {view === "pending" ? "No top-ups are waiting for review." : "No reviewed top-ups yet."}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Card key={row.id} className="gap-0 overflow-hidden py-0">
            {row.proofUrl ? (
              <a href={row.proofUrl} target="_blank" rel="noopener noreferrer" className="group relative block bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed URL to a private receipt */}
                <img src={row.proofUrl} alt={`Receipt from ${row.sellerName ?? "the seller"}`} className="h-56 w-full object-contain" />
                <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ExternalLink className="size-3" aria-hidden /> Open full size
                </span>
              </a>
            ) : (
              <div className="flex h-56 items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
                <ImageOff className="size-4" aria-hidden /> Receipt not found
              </div>
            )}
            <CardContent className="space-y-3 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a href={`/sellers/${row.sellerId}`} className="block truncate font-semibold hover:underline">
                    {row.sellerName ?? row.sellerId}
                  </a>
                  <p className="text-xs text-muted-foreground">{when(row.createdAt)}</p>
                </div>
                <p className="text-xl font-bold tabular-nums">{formatCurrency(Number(row.amount))}</p>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Method</dt>
                <dd>{METHOD[row.method] ?? row.method}</dd>
                <dt className="text-muted-foreground">Sent from</dt>
                <dd className="font-mono">{row.senderPhone ?? "—"}</dd>
                {view === "reviewed" && (
                  <>
                    <dt className="text-muted-foreground">Result</dt>
                    <dd>
                      {row.status === "succeeded" ? (
                        <Badge className="bg-success-soft text-success">Approved</Badge>
                      ) : (
                        <span>
                          <Badge variant="destructive">Rejected</Badge> {row.failureReason}
                        </span>
                      )}
                    </dd>
                  </>
                )}
              </dl>
              {view === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1" onClick={() => setActive({ row, decision: "approve" })}>
                    <Check aria-hidden /> Approve
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setActive({ row, decision: "reject" })}>
                    <X aria-hidden /> Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {active && <ReviewDialog key={active.row.id + active.decision} {...active} onClose={() => setActive(null)} />}
    </>
  );
}

/** Approve (credits the store wallet) or reject one manual top-up. Also used on /wallets. */
export function ReviewDialog({
  row,
  decision,
  onClose,
}: {
  row: TopUpWithProof;
  decision: "approve" | "reject";
  onClose: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const amount = formatCurrency(Number(row.amount));
  const approve = decision === "approve";
  const method = METHOD[row.method] ?? row.method;

  const confirm = () =>
    startTransition(async () => {
      const result = await reviewStoreTopUpAction({ topUpId: row.id, decision, reason: reason.trim() || undefined });
      if (result.success) {
        toast.success(result.message);
        onClose();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{approve ? `Add ${amount} to this wallet?` : `Reject this ${amount} top-up?`}</DialogTitle>
          <DialogDescription>
            {approve
              ? `Approve only after ${amount} has arrived in the ${method} account. This credits the seller's store wallet and is logged.`
              : "Nothing is credited. The seller sees your reason on their wallet page."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="review-reason">{approve ? "Note (optional)" : "Reason"}</Label>
          <Textarea
            id="review-reason"
            value={reason}
            maxLength={500}
            placeholder={approve ? "Transfer verified" : "For example: no transfer received for this amount"}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={approve ? "default" : "destructive"}
            onClick={confirm}
            disabled={isPending || (!approve && reason.trim().length < 3)}
          >
            {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {approve ? "Approve and credit" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
