"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Globe2 } from "lucide-react";
import { Note, SectionCard, Toggle } from "@/components/seller-ui";
import { saveStoreOrderCountries } from "./order-countries.server";

/**
 * "Orders from my country only" (ROADMAP.md F-115 A5). The switch saves at
 * once. The countries are the ones the store delivers to (its delivery zones,
 * or Egypt), shown so the seller knows what "my country" means.
 */
export function StoreOrderCountriesSettings({
  storeId,
  initial,
  countries,
  readOnly,
}: {
  storeId: string;
  initial: boolean;
  countries: string[];
  readOnly: boolean;
}) {
  const t = useTranslations("orderCountries");
  const locale = useLocale();
  const [enabled, setEnabled] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const names = (() => {
    try {
      const display = new Intl.DisplayNames([locale], { type: "region" });
      return countries.map((code) => display.of(code) ?? code);
    } catch {
      return countries;
    }
  })();

  const change = (next: boolean) => {
    setEnabled(next);
    startTransition(async () => {
      const result = await saveStoreOrderCountries(storeId, next);
      if (!result.success) {
        setEnabled(!next);
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t(next ? "turnedOn" : "turnedOff"));
    });
  };

  return (
    <SectionCard
      icon={Globe2}
      title={t("title")}
      description={t("description")}
      action={<Toggle checked={enabled} disabled={readOnly || isPending} onCheckedChange={change} aria-label={t("title")} />}
    >
      <p className="text-[13.5px] leading-[1.7] text-(--s-body)">
        {t("countries", { countries: names.join(locale.startsWith("ar") ? "، " : ", ") })}
      </p>
      <Note>{t("note")}</Note>
    </SectionCard>
  );
}
