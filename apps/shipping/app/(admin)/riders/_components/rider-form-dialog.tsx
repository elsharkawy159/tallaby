"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

import { createRider, updateRider } from "../riders.server";

interface RiderFormDialogProps {
  rider?: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
  };
}

export function RiderFormDialog({ rider }: RiderFormDialogProps) {
  const t = useTranslations("riders");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(rider?.fullName ?? "");
  const [email, setEmail] = useState(rider?.email ?? "");
  const [phone, setPhone] = useState(rider?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(rider?.avatarUrl ?? "");

  const submit = () => {
    startTransition(async () => {
      const result = rider
        ? await updateRider({ riderId: rider.id, fullName, phone, avatarUrl })
        : await createRider({ fullName, email, phone, avatarUrl });

      if (result.success) {
        toast.success(result.message ?? tCommon("saved"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? tCommon("somethingWrong"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {rider ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("editAria", {
              name: rider.fullName ?? tCommon("unnamedRider"),
            })}
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            {t("addRider")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rider ? t("editRider") : t("addRider")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rider-name">{t("fullName")}</Label>
            <Input id="rider-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rider-email">{t("email")}</Label>
            <Input
              id="rider-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!rider}
            />
            {rider && (
              <p className="text-xs text-muted-foreground">{t("emailLocked")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rider-phone">{t("phone")}</Label>
            <Input id="rider-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rider-avatar">{t("avatarUrl")}</Label>
            <Input
              id="rider-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={submit} disabled={isPending || !fullName || !phone || (!rider && !email)}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {rider ? t("saveChanges") : t("createRider")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
