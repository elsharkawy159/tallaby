"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  ACCOUNT_DELETION_NOTE_MAX,
  ADMIN_ACCOUNT_DELETION_STATUSES,
  type AccountDeletionStatus,
} from "@workspace/lib/account-deletion";
import { STATUS_LABELS } from "../account-deletions.lib";
import { updateAccountDeletionAction } from "../account-deletions.server";

const STATUS_HELP: Record<(typeof ADMIN_ACCOUNT_DELETION_STATUSES)[number], string> = {
  pending: "Waiting. The seller sees \"Requested\" in Settings and can cancel.",
  completed: "Only after you deleted the user in Supabase. Can't be undone.",
  declined: "We can't delete yet (open orders, wallet). The note is shown to the seller in Settings.",
};

export function AccountDeletionForm({ requestId, status, note }: { requestId: string; status: AccountDeletionStatus; note: string | null }) {
  const router = useRouter();
  const locked = status === "cancelled" || status === "completed";
  const [next, setNext] = useState<AccountDeletionStatus>(status);
  const [text, setText] = useState(note ?? "");
  const [pending, startTransition] = useTransition();
  const changed = next !== status || text.trim() !== (note ?? "");

  if (locked) {
    return (
      <p className="text-sm text-muted-foreground">
        {status === "cancelled" ? "The seller cancelled this request." : "Completed. The account was deleted."}
        {note ? <span className="mt-2 block whitespace-pre-line text-foreground" dir="auto">{note}</span> : null}
      </p>
    );
  }

  const save = () =>
    startTransition(async () => {
      if (next === "completed" && !window.confirm("Did you already delete this user in Supabase? Completed can't be undone.")) return;
      const result = await updateAccountDeletionAction({ requestId, status: next, note: text.trim() || null });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Status</legend>
        {ADMIN_ACCOUNT_DELETION_STATUSES.map((value) => (
          <label key={value} className="flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm has-checked:border-primary">
            <input type="radio" name="status" value={value} checked={next === value} onChange={() => setNext(value)} className="mt-0.5" />
            <span>
              <span className="font-medium">{STATUS_LABELS[value]}</span>
              <span className="block text-xs text-muted-foreground">{STATUS_HELP[value]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="account-deletion-note">Note</Label>
        <Textarea
          id="account-deletion-note"
          rows={4}
          dir="auto"
          maxLength={ACCOUNT_DELETION_NOTE_MAX}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Required to decline: the seller sees it in Settings."
        />
        <p className="text-xs text-muted-foreground">
          {text.length}/{ACCOUNT_DELETION_NOTE_MAX}
        </p>
      </div>
      <Button className="w-full" disabled={pending || !changed} onClick={save}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
