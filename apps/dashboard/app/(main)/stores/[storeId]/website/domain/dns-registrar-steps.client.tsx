"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ListOrdered } from "lucide-react";
import { Chip, Chips } from "@/components/seller-ui";
import { REGISTRAR_GUIDES, type RegistrarGuideId } from "./domain-dns.lib";

/**
 * Short steps for the registrar the seller bought the domain from (owner,
 * 2026-11-10). `names` are the record names to clean up, e.g. "@ / www".
 */
export function DnsRegistrarSteps({ names }: { names: string }) {
  const t = useTranslations("settings.customDomain.guide");
  const [id, setId] = useState<RegistrarGuideId>(REGISTRAR_GUIDES[0]!.id);
  const guide = REGISTRAR_GUIDES.find((g) => g.id === id) ?? REGISTRAR_GUIDES[0]!;
  const latin = (text: React.ReactNode) => (
    <bdi dir="ltr" className="font-montserrat font-semibold text-(--s-text)">
      {text}
    </bdi>
  );

  return (
    <section aria-labelledby="dns-guide-title" className="flex flex-col gap-2.5 rounded-2xl bg-(--s-tint) p-3.5">
      <h3 id="dns-guide-title" className="flex items-center gap-2 text-sm font-bold text-(--s-ink)">
        <ListOrdered className="size-4 text-(--s-primary)" aria-hidden />
        {t("title")}
      </h3>
      <Chips role="group" aria-label={t("label")}>
        {REGISTRAR_GUIDES.map((g) => (
          <Chip key={g.id} pressed={g.id === id} onClick={() => setId(g.id)}>
            {g.id === "other" ? t("other") : <bdi dir="ltr">{g.label}</bdi>}
          </Chip>
        ))}
      </Chips>
      <ol className="flex flex-col gap-2" aria-live="polite">
        {guide.steps.map((step, i) => (
          <li key={step} className="flex items-start gap-2.5 text-[12.5px] leading-[1.7] text-(--s-muted)">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-(--s-field) bg-(--s-surface) font-montserrat text-xs font-bold text-(--s-ink)">
              {i + 1}
            </span>
            <span className="min-w-0 text-pretty">
              {t.rich(`steps.${step}`, {
                l: (chunks) => latin(chunks),
                registrar: guide.label,
                menu: guide.menu ?? "",
                names: names,
                nameField: guide.fields.name,
                valueField: guide.fields.value,
              })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
