"use client";

import { useEffect, useState, useTransition } from "react";
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
import { createSellerRider, updateSellerRider } from "@/actions/shipping";
import type { SellerRider } from "@/lib/shipping/shipping.types";

interface Props {
  open: boolean;
  /** Rider being edited; null to create a new one. */
  rider: SellerRider | null;
  onClose: () => void;
}

export function RiderFormDialog({ open, rider, onClose }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const editing = rider !== null;

  useEffect(() => {
    if (!open) return;
    setFullName(rider?.fullName ?? "");
    setEmail(rider?.email ?? "");
    setPhone(rider?.phone ?? "");
  }, [open, rider]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = editing
        ? await updateSellerRider({ riderId: rider.id, fullName, phone })
        : await createSellerRider({ fullName, email, phone });

      if (!res.success) {
        toast.error(res.error ?? "Could not save the rider");
        return;
      }
      toast.success(res.message ?? "Saved");
      onClose();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit rider" : "Add a rider"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this rider's contact details."
                : "Riders sign in to the Tallaby shipping app with this email to see and update the deliveries you assign to them."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rider-name">Full name</Label>
            <Input
              id="rider-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rider-email">Email</Label>
            <Input
              id="rider-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={editing}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rider-phone">Phone</Label>
            <Input
              id="rider-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editing ? "Save changes" : "Add rider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
