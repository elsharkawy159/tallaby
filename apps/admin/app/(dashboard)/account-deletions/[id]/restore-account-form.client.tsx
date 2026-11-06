"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { ACCOUNT_DELETION_NOTE_MAX, type AccountDeletionStatus } from "@workspace/lib/account-deletion";
import { restoreAccountAction } from "../account-deletions.server";

export function RestoreAccountForm({ requestId, status }: { requestId: string; status: AccountDeletionStatus }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  if (status !== "scheduled") {
    return (
      <p className="text-sm text-muted-foreground">
        {status === "restored" ? "This account was restored." : "This account was deleted for good and can't be restored."}
      </p>
    );
  }

  const restore = () =>
    startTransition(async () => {
      if (!window.confirm("Restore this account? The seller can sign in again and their stores come back online.")) return;
      const result = await restoreAccountAction({ requestId, note: note.trim() || null });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">
        Only when the seller asks (from the account&apos;s email). Restoring brings back the account as it is now: seller
        status, stores, products, orders and wallet.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="restore-note">Note</Label>
        <Textarea
          id="restore-note"
          rows={3}
          dir="auto"
          maxLength={ACCOUNT_DELETION_NOTE_MAX}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Seller emailed on 12 Nov and asked to come back."
        />
      </div>
      <Button className="w-full" disabled={pending} onClick={restore}>
        {pending ? "Restoring…" : "Restore account"}
      </Button>
    </div>
  );
}
