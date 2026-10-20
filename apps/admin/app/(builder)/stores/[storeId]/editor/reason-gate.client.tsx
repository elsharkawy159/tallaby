"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from "@workspace/lib/admin";
import { StoreEditor, type EditorInitial } from "@workspace/store-editor/editor.client";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { openStoreEditor } from "./admin-store-editor.server";
import { useAdminStoreAdapter } from "./admin-store-adapter.client";

/**
 * Asks why the admin is editing this store before the editor mounts. Opening
 * is audited (open_store_editor) and the reason stays in memory for the
 * session: every audited write (publish, restore, page changes…) carries it.
 */
export function ReasonGate({ initial, storeName }: { initial: EditorInitial; storeName: string }) {
  const [reason, setReason] = useState<string | null>(null);
  if (reason) return <AdminStoreEditor initial={initial} reason={reason} />;
  return <ReasonForm storeId={initial.storeId} storeName={storeName} onOpened={setReason} />;
}

function AdminStoreEditor({ initial, reason }: { initial: EditorInitial; reason: string }) {
  const adapter = useAdminStoreAdapter(initial.storeId, reason);
  return <StoreEditor initial={initial} adapter={adapter} />;
}

function ReasonForm({ storeId, storeName, onOpened }: { storeId: string; storeName: string; onOpened: (reason: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const trimmed = value.trim();
  const valid = trimmed.length >= ADMIN_REASON_MIN && trimmed.length <= ADMIN_REASON_MAX;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setError(null);
    startTransition(async () => {
      const result = await openStoreEditor(storeId, trimmed);
      if (result.success) onOpened(trimmed);
      else setError(result.error === "invalidInput" ? `Enter ${ADMIN_REASON_MIN}–${ADMIN_REASON_MAX} characters.` : "Could not open the editor. Try again.");
    });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-title"
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 shadow-lg"
      >
        <div className="space-y-1">
          <h1 id="reason-title" className="text-lg font-semibold">
            Edit {storeName}&apos;s website
          </h1>
          <p className="text-sm text-muted-foreground">
            You will edit the seller&apos;s drafts, as the seller would. Publishing puts them live. Opening the editor and every publish, restore and page change
            are logged with this reason.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-edit-reason">Reason</Label>
          <Textarea
            id="admin-edit-reason"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={ADMIN_REASON_MAX}
            rows={3}
            placeholder="Seller asked on WhatsApp to change the hero"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {trimmed.length}/{ADMIN_REASON_MAX} · at least {ADMIN_REASON_MIN} characters
          </p>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline" type="button">
            <Link href={`/stores/${storeId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={!valid || pending}>
            {pending ? "Opening…" : "Open editor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
