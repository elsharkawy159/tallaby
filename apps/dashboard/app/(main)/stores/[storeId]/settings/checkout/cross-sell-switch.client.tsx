"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@workspace/ui/components/switch";
import { saveStoreCrossSell } from "./cross-sell-switch.server";

export function StoreCrossSellSwitch({ storeId, initial, readOnly }: { storeId: string; initial: boolean; readOnly: boolean }) {
  const t = useTranslations("crossSell.store");
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  const change = (next: boolean) =>
    startTransition(async () => {
      setEnabled(next);
      const result = await saveStoreCrossSell(storeId, next);
      if (!result.success) {
        setEnabled(!next);
        toast.error(t("failed"));
      }
    });

  return (
    <section className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="min-w-0">
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Switch aria-label={t("title")} checked={enabled} disabled={readOnly || pending} onCheckedChange={change} />
    </section>
  );
}
