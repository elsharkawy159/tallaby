"use client";

import { useState } from "react";
import Link from "next/link";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from "@workspace/lib/admin";
import { StoreEditor, type EditorInitial } from "@workspace/store-editor/editor.client";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useSectionAdapter } from "./section-adapter.client";

/**
 * Asks why the admin is editing this library section before the editor
 * mounts; the reason stays in memory for the session and goes into the audit
 * log with Publish (draft saves are not audited).
 */
export function SectionEditorGate({ initial, sectionName }: { initial: EditorInitial; sectionName: string }) {
  const [reason, setReason] = useState<string | null>(null);
  if (reason) return <SectionEditor initial={initial} reason={reason} />;
  return <ReasonForm sectionName={sectionName} onSubmit={setReason} />;
}

function SectionEditor({ initial, reason }: { initial: EditorInitial; reason: string }) {
  const adapter = useSectionAdapter(initial.storeId, reason, initial.catalog);
  return <StoreEditor initial={initial} adapter={adapter} />;
}

function ReasonForm({ sectionName, onSubmit }: { sectionName: string; onSubmit: (reason: string) => void }) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const valid = trimmed.length >= ADMIN_REASON_MIN && trimmed.length <= ADMIN_REASON_MAX;

  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-reason-title"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSubmit(trimmed);
        }}
        className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 shadow-lg"
      >
        <div className="space-y-1">
          <h1 id="section-reason-title" className="text-lg font-semibold">
            Edit the section “{sectionName}”
          </h1>
          <p className="text-sm text-muted-foreground">
            Changes save as a draft that sellers do not see. Publishing replaces the section in every seller&apos;s Add › Sections
            (stores that already use it keep their copy) and is logged with this reason.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="section-edit-reason">Reason</Label>
          <Textarea
            id="section-edit-reason"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={ADMIN_REASON_MAX}
            rows={3}
            placeholder="Tighter spacing on mobile"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {trimmed.length}/{ADMIN_REASON_MAX} · at least {ADMIN_REASON_MIN} characters
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline" type="button">
            <Link href="/sections">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!valid}>
            Open editor
          </Button>
        </div>
      </form>
    </div>
  );
}
