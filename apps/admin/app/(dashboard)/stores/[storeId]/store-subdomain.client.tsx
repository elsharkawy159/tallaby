"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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
import { reasonOrDefault } from "@workspace/lib/admin";
import { SUBDOMAIN_MAX_LENGTH } from "@workspace/lib/storefront";
import { cn } from "@workspace/ui/lib/utils";
import { ReasonField } from "../../sellers/[id]/seller-account.client";
import { changeStoreSubdomainAction } from "./store-subdomain.server";
import { storeSubdomainError, subdomainHint } from "./store-subdomain.lib";

/**
 * "Edit subdomain" beside the store's subdomain (owner request 2026-11-12).
 * The hint checks the format as the admin types; whether another store has
 * the name is checked on save. The old address keeps redirecting.
 */
export function EditSubdomainButton({ storeId, current, customDomain }: { storeId: string; current: string; customDomain: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const hint = subdomainHint(value, current);
  const blocked = hint.problem !== null;

  const reset = () => {
    setValue(current);
    setReason("");
  };

  const save = () =>
    startTransition(async () => {
      const result = await changeStoreSubdomainAction({ storeId, subdomain: hint.subdomain, reason: reasonOrDefault(reason) });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="ms-1 h-7 px-2 text-xs"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <Pencil className="me-1 size-3" aria-hidden />
        Edit subdomain
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit the store&apos;s subdomain</DialogTitle>
            <DialogDescription>
              The store moves to the new address. {current}.tallaby.com keeps redirecting to it, so links already shared still
              work, and no other store can take it.
              {customDomain ? ` The custom domain ${customDomain} is not affected.` : ""}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!blocked && !pending) save();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="admin-subdomain">Subdomain</Label>
              <div
                dir="ltr"
                className={cn(
                  "flex h-9 items-center overflow-hidden rounded-md border bg-background text-sm shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50",
                  hint.problem && hint.problem !== "same" ? "border-destructive" : "focus-within:border-ring",
                )}
              >
                <input
                  id="admin-subdomain"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  maxLength={SUBDOMAIN_MAX_LENGTH + 8}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-describedby="admin-subdomain-hint"
                  aria-invalid={hint.problem !== null && hint.problem !== "same"}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 font-medium outline-none"
                />
                <span className="flex h-full items-center border-s bg-muted px-3 text-muted-foreground">.tallaby.com</span>
              </div>
              <p
                id="admin-subdomain-hint"
                aria-live="polite"
                className={cn("text-xs", hint.problem && hint.problem !== "same" ? "text-destructive" : "text-muted-foreground")}
              >
                {hint.problem === null
                  ? `New address: ${hint.subdomain}.tallaby.com`
                  : hint.problem === "same"
                    ? "This is the current subdomain. Type a new one."
                    : storeSubdomainError(hint.problem)}
              </p>
            </div>
            <ReasonField value={reason} onChange={setReason} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || blocked}>
                {pending ? "Saving…" : "Change subdomain"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
