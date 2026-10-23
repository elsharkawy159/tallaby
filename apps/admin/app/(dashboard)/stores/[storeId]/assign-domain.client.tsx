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
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
import { assignDomainAction } from "../../domains/domains.server";

/**
 * "Assign custom domain" on the store page: a domain, sent to
 * assignDomainAction, which attaches it on Vercel and logs it.
 */
export function AssignDomainButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [pending, startTransition] = useTransition();
  const invalid = domain.trim().length < 3;

  const run = () =>
    startTransition(async () => {
      const result = await assignDomainAction({ storeId, domain: domain.trim(), reason: ADMIN_DEFAULT_REASON });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setDomain("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Assign custom domain
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a custom domain</DialogTitle>
            <DialogDescription>
              Attaches the domain and its www redirect to the storefront on Vercel. It goes live once its DNS
              points at Tallaby (the records show here and in the seller&apos;s dashboard).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="admin-domain">Domain</Label>
            <Input
              id="admin-domain"
              dir="ltr"
              placeholder="example.com"
              autoComplete="off"
              maxLength={300}
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={run} disabled={pending || invalid}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
