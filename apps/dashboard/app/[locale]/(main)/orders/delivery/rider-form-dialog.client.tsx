"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Field, Modal, SellerButton, TextInput } from "@/components/seller-ui";
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
    <Modal
      open={open}
      onOpenChange={(o) => !o && !isPending && onClose()}
      title={editing ? t("editTitle") : t("addTitle")}
      description={editing ? t("editDescription") : t("addDescription")}
      footer={
        <>
          <SellerButton variant="outline" onClick={onClose} disabled={isPending}>
            {t("cancel")}
          </SellerButton>
          <SellerButton type="submit" form="rider-form" variant="solid" disabled={isPending}>
            {isPending ? t("saving") : editing ? t("saveChanges") : t("add")}
          </SellerButton>
        </>
      }
    >
      <form id="rider-form" onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label={t("fullName")} htmlFor="rider-name">
          <TextInput id="rider-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="off" />
        </Field>
        <Field label={t("email")} htmlFor="rider-email">
          <TextInput
            id="rider-email"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={editing}
            autoComplete="off"
          />
        </Field>
        <Field label={t("phone")} htmlFor="rider-phone">
          <TextInput id="rider-phone" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="off" />
        </Field>
      </form>
    </Modal>
  );
}
