"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
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

type ActionResult = { success: true; message: string } | { success: false; error: string };

/**
 * A button that opens a dialog asking for a reason, then calls a Server
 * Action with `{ ...payload, reason }`. Used by every audited Phase 9B admin
 * write (docs/admin-saas.md): the reason is stored in admin_audit_log.
 */
export function ReasonActionButton({
  label,
  title,
  description,
  confirmLabel = "Confirm",
  payload,
  action,
  variant = "outline",
  destructive = false,
  reasonRequired = true,
  size = "sm",
}: {
  label: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  payload: Record<string, unknown>;
  action: (input: unknown) => Promise<ActionResult>;
  variant?: "outline" | "default" | "ghost" | "secondary";
  destructive?: boolean;
  /** A re-check or similar read-only action needs no reason. */
  reasonRequired?: boolean;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const tooShort = reasonRequired && reason.trim().length < 3;

  const run = () =>
    startTransition(async () => {
      const result = await action({ ...payload, ...(reasonRequired || reason.trim() ? { reason: reason.trim() } : {}) });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  if (!reasonRequired) {
    return (
      <Button variant={variant} size={size} disabled={pending} onClick={run}>
        {label}
      </Button>
    );
  }

  return (
    <>
      <Button variant={destructive ? "destructive" : variant} size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="admin-reason">Reason (saved in the audit log)</Label>
            <Textarea
              id="admin-reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant={destructive ? "destructive" : "default"} onClick={run} disabled={pending || tooShort}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
