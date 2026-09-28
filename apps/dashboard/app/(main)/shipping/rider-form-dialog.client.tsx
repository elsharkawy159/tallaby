"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("shipping.riderForm");
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
        toast.error(res.error ?? t("saveFailed"));
        return;
      }
      toast.success(res.message ?? t("saved"));
      onClose();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("addTitle")}</DialogTitle>
            <DialogDescription>
              {editing ? t("editDescription") : t("addDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rider-name">{t("fullName")}</Label>
            <Input
              id="rider-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rider-email">{t("email")}</Label>
            <Input
              id="rider-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={editing}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rider-phone">{t("phone")}</Label>
            <Input
              id="rider-phone"
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : editing ? t("saveChanges") : t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
