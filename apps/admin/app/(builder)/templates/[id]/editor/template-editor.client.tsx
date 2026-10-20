"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from "@workspace/lib/admin";
import type { SiteConfig } from "@workspace/store-sections";
import { StoreEditor, type EditorInitial } from "@workspace/store-editor/editor.client";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useTemplateAdapter } from "./template-adapter.client";

type Props = {
  initial: EditorInitial;
  config: SiteConfig;
  /** Every page's names in both languages (the draft's, else the published ones). */
  pageNames: Record<string, { ar: string; en: string }>;
  draftVersion: number;
  templateName: string;
  isDefault: boolean;
  isActive: boolean;
};

/**
 * Asks why the admin is editing this template before the editor mounts; the
 * reason stays in memory for the session and goes into the audit log with
 * Publish and Restore (draft saves are not audited).
 */
export function TemplateEditorGate(props: Props) {
  const [reason, setReason] = useState<string | null>(null);
  if (reason) return <TemplateEditor {...props} reason={reason} />;
  return <ReasonForm templateName={props.templateName} isDefault={props.isDefault} isActive={props.isActive} onSubmit={setReason} />;
}

function TemplateEditor({ initial, config, pageNames, draftVersion, reason }: Props & { reason: string }) {
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [changelog, setChangelog] = useState("");
  const resolver = useRef<((value: string | null) => void) | null>(null);

  const askChangelog = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        resolver.current = resolve;
        setChangelog("");
        setChangelogOpen(true);
      }),
    [],
  );

  const answer = (value: string | null) => {
    resolver.current?.(value);
    resolver.current = null;
    setChangelogOpen(false);
  };

  const adapter = useTemplateAdapter({
    templateId: initial.storeId,
    reason,
    config,
    pageNames,
    draftVersion,
    catalog: initial.catalog,
    askChangelog,
    onRestored: () => window.location.reload(),
  });

  return (
    <>
      <StoreEditor initial={initial} adapter={adapter} />
      <Dialog open={changelogOpen} onOpenChange={(open) => (open ? setChangelogOpen(true) : answer(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish a new template version</DialogTitle>
            <DialogDescription>
              Stores created from now on start from this version, and the seller gallery shows it. Stores that already use the
              template keep their site. Publishing does not change whether the template is shown to sellers (its Active switch).
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              answer(changelog.trim());
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="template-changelog">What changed (optional)</Label>
              <Textarea
                id="template-changelog"
                rows={3}
                maxLength={500}
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="New hero and tighter product grid"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Logged with your reason: “{reason}”.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => answer(null)}>
                Cancel
              </Button>
              <Button type="submit">Publish version</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReasonForm({
  templateName,
  isDefault,
  isActive,
  onSubmit,
}: {
  templateName: string;
  isDefault: boolean;
  isActive: boolean;
  onSubmit: (reason: string) => void;
}) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const valid = trimmed.length >= ADMIN_REASON_MIN && trimmed.length <= ADMIN_REASON_MAX;

  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-reason-title"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSubmit(trimmed);
        }}
        className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 shadow-lg"
      >
        <div className="space-y-1">
          <h1 id="template-reason-title" className="text-lg font-semibold">
            Edit the template “{templateName}”
          </h1>
          <p className="text-sm text-muted-foreground">
            Changes save as a draft that sellers do not see. Publishing adds a new version: stores created afterwards
            {isDefault ? " (this is the default template)" : ""} and the seller gallery use it; existing stores keep their site. Publish and
            restore are logged with this reason.
          </p>
          {!isActive && (
            <p className="text-sm text-amber-700 dark:text-amber-400">Inactive: turn on Active on the Templates page to show it to sellers.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="template-edit-reason">Reason</Label>
          <Textarea
            id="template-edit-reason"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={ADMIN_REASON_MAX}
            rows={3}
            placeholder="Refresh the hero for the new season"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {trimmed.length}/{ADMIN_REASON_MAX} · at least {ADMIN_REASON_MIN} characters
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline" type="button">
            <Link href="/templates">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!valid}>
            Open editor
          </Button>
        </div>
      </form>
    </div>
  );
}
