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
import { Textarea } from "@workspace/ui/components/textarea";

import { createProvider, updateProvider } from "../providers.server";
import type { ProviderRow } from "../providers.server";

interface ProviderFormDialogProps {
  provider?: ProviderRow;
}

const EMPTY = {
  name: "",
  code: "",
  logoUrl: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  website: "",
  notes: "",
};

export function ProviderFormDialog({ provider }: ProviderFormDialogProps) {
  const t = useTranslations("providers");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(() =>
    provider
      ? {
          name: provider.name,
          code: provider.code,
          logoUrl: provider.logoUrl ?? "",
          contactName: provider.contactName ?? "",
          contactPhone: provider.contactPhone ?? "",
          contactEmail: provider.contactEmail ?? "",
          website: provider.website ?? "",
          notes: provider.notes ?? "",
        }
      : EMPTY
  );

  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = () => {
    startTransition(async () => {
      const result = provider
        ? await updateProvider({ providerId: provider.id, ...values })
        : await createProvider(values);

      if (result.success) {
        toast.success(result.message ?? tCommon("saved"));
        setOpen(false);
        if (!provider) setValues(EMPTY);
        router.refresh();
      } else {
        toast.error(result.error ?? tCommon("somethingWrong"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {provider ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("editAria", { name: provider.name })}
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            {t("addProvider")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {provider ? t("editProvider") : t("addProvider")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider-name">{t("name")}</Label>
              <Input id="provider-name" value={values.name} onChange={set("name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider-code">{t("code")}</Label>
              <Input
                id="provider-code"
                value={values.code}
                onChange={set("code")}
                placeholder={t("codePlaceholder")}
                disabled={!!provider}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider-logo">{t("logoUrl")}</Label>
            <Input id="provider-logo" value={values.logoUrl} onChange={set("logoUrl")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider-contact-name">{t("contactPerson")}</Label>
              <Input
                id="provider-contact-name"
                value={values.contactName}
                onChange={set("contactName")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider-contact-phone">{t("contactPhone")}</Label>
              <Input
                id="provider-contact-phone"
                value={values.contactPhone}
                onChange={set("contactPhone")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider-contact-email">{t("contactEmail")}</Label>
              <Input
                id="provider-contact-email"
                type="email"
                value={values.contactEmail}
                onChange={set("contactEmail")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider-website">{t("website")}</Label>
              <Input id="provider-website" value={values.website} onChange={set("website")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider-notes">{t("notes")}</Label>
            <Textarea id="provider-notes" rows={3} value={values.notes} onChange={set("notes")} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={submit} disabled={isPending || !values.name || !values.code}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {provider ? t("saveChanges") : t("createProvider")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
