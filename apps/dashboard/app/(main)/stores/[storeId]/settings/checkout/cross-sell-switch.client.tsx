"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { SectionCard, Toggle } from "@/components/seller-ui";
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
    <SectionCard
      icon={ShoppingBag}
      title={t("title")}
      description={t("description")}
      action={<Toggle className="max-[600px]:min-h-10" aria-label={t("title")} checked={enabled} disabled={readOnly || pending} onCheckedChange={change} />}
    />
  );
}
