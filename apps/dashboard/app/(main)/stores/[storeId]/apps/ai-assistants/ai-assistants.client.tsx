"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Clock, Copy, Link2, MessageSquareText, ShieldCheck } from "lucide-react";
import { Note, PageTabs, SectionCard, SellerButton, TwoColumns } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { AppPageHeader } from "../app-page-header";
import {
  ASSISTANT_BRANDS,
  ASSISTANT_STEP_COUNT,
  ASSISTANTS,
  type AssistantKey,
  claudeCodeCommand,
  cursorConfig,
} from "./assistant-logos.lib";

const EXAMPLES = ["1", "2", "3", "4"] as const;
const SAFETY = ["1", "2", "3"] as const;

function AssistantLogo({ assistant, className }: { assistant: AssistantKey; className?: string }) {
  const brand = ASSISTANT_BRANDS[assistant];
  return (
    <span
      className={cn("grid size-6 shrink-0 place-items-center rounded-md", className)}
      style={{ background: brand.bg }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" style={{ fill: brand.fg }}>
        <path d={brand.path} />
      </svg>
    </span>
  );
}

function CopyBox({ value, multiline }: { value: string; multiline?: boolean }) {
  const t = useTranslations("storeApps.aiAssistants");
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (http, old browser): the text stays selectable.
    }
  };
  return (
    <div className="flex items-start gap-2 rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface-2) p-1.5 ps-3">
      <code
        dir="ltr"
        className={cn(
          "min-w-0 flex-1 py-1.5 text-start font-mono text-[12.5px] text-(--s-body) select-all",
          multiline ? "whitespace-pre-wrap break-all" : "truncate",
        )}
      >
        {value}
      </code>
      <SellerButton variant="mini" size="xs" onClick={copy}>
        {copied ? <Check className="text-success" aria-hidden /> : <Copy aria-hidden />}
        {copied ? t("copied") : t("copy")}
      </SellerButton>
    </div>
  );
}

/** Store › Apps › AI assistants (ROADMAP.md F-29): one tab of steps per assistant. */
export function AiAssistantsApp({
  storeId,
  storeName,
  mcpUrl,
  live,
}: {
  storeId: string;
  storeName: string;
  mcpUrl: string;
  live: boolean;
}) {
  const t = useTranslations("storeApps.aiAssistants");
  const [assistant, setAssistant] = useState<AssistantKey>("claude");

  return (
    <>
      <AppPageHeader
        storeId={storeId}
        app="ai_assistants"
        backLabel={t("back")}
        title={t("title")}
        subtitle={t("subtitle", { store: storeName })}
      />

      {!live && (
        <Note tone="amber" icon={Clock}>
          <b className="block font-bold">{t("soonTitle")}</b>
          {t("soonBody")}
        </Note>
      )}

      <SectionCard icon={Link2} title={t("urlLabel")} description={t("urlHelp")}>
        <CopyBox value={mcpUrl} />
      </SectionCard>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-(--s-ink)">{t("howTitle")}</h2>
        <PageTabs
          sticky={false}
          value={assistant}
          onChange={(key) => setAssistant(key as AssistantKey)}
          tabs={ASSISTANTS.map((key) => ({
            key,
            label: (
              <>
                <AssistantLogo assistant={key} />
                {t(`tabs.${key}.name`)}
              </>
            ),
          }))}
        />
        <SectionCard
          icon={MessageSquareText}
          title={t(`tabs.${assistant}.name`)}
        >
          <ol className="flex flex-col gap-3.5">
            {Array.from({ length: ASSISTANT_STEP_COUNT[assistant] }, (_, i) => String(i + 1)).map((n) => (
              <li key={n} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft font-montserrat text-[11.5px] font-bold text-primary-ink">{n}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
                  <p className="text-pretty text-[13.5px] leading-relaxed text-(--s-body)">{t(`tabs.${assistant}.steps.${n}`)}</p>
                  {n === "1" && assistant === "claude_code" && <CopyBox value={claudeCodeCommand(mcpUrl)} multiline />}
                  {n === "1" && assistant === "cursor" && <CopyBox value={cursorConfig(mcpUrl)} multiline />}
                </div>
              </li>
            ))}
          </ol>
          <Note>
            <b className="font-bold text-(--s-text)">{t("noteLabel")}: </b>
            {t(`tabs.${assistant}.note`)}
          </Note>
        </SectionCard>
      </section>

      <TwoColumns>
        <SectionCard icon={MessageSquareText} title={t("examplesTitle")}>
          <ul className="flex flex-col gap-2">
            {EXAMPLES.map((n) => (
              <li key={n} className="rounded-[14px] bg-(--s-tint) px-3 py-2 text-[13px] leading-relaxed text-(--s-body)">
                “{t(`examples.${n}`)}”
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard icon={ShieldCheck} tone="success" title={t("safetyTitle")}>
          <ul className="flex flex-col gap-2.5">
            {SAFETY.map((n) => (
              <li key={n} className="flex gap-2 text-[13px] leading-relaxed text-(--s-muted)">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {t(`safety.${n}`)}
              </li>
            ))}
          </ul>
        </SectionCard>
      </TwoColumns>
    </>
  );
}
