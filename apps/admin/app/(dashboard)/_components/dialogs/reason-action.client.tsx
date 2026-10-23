"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

type ActionResult = { success: true; message: string } | { success: false; error: string };

/**
 * A button that calls an audited Server Action with `{ ...payload, reason }`.
 * The admin is no longer asked for a reason (owner, 2026-10-24): the audit
 * log gets ADMIN_DEFAULT_REASON. A destructive action still asks for a plain
 * confirmation first.
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
  /** A re-check or similar read-only action sends no reason. */
  reasonRequired?: boolean;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const result = await action({ ...payload, ...(reasonRequired ? { reason: ADMIN_DEFAULT_REASON } : {}) });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  if (!destructive) {
    return (
      <Button variant={variant} size={size} disabled={pending} onClick={run}>
        {label}
      </Button>
    );
  }

  return (
    <>
      <Button variant="destructive" size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={run} disabled={pending}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
