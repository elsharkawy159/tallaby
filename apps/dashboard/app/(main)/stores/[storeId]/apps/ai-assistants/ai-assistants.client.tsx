"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Clock, Copy, Info, MessageSquareText, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
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
    <div className="flex items-start gap-2 rounded-xl border bg-muted/50 p-2 ps-3">
      <code
        dir="ltr"
        className={cn(
          "min-w-0 flex-1 py-1.5 text-start font-mono text-[13px] select-all",
          multiline ? "whitespace-pre-wrap break-all" : "truncate",
        )}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-card px-2.5 text-xs font-semibold hover:bg-muted"
      >
        {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {copied ? t("copied") : t("copy")}
      </button>
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

  return (
    <div className="space-y-6">
      <AppPageHeader
        storeId={storeId}
        app="ai_assistants"
        backLabel={t("back")}
        title={t("title")}
        subtitle={t("subtitle", { store: storeName })}
      />

      {!live && (
        <div className="flex gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4 text-accent-ink">
          <Clock className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <b className="block text-sm">{t("soonTitle")}</b>
            <p className="mt-0.5 text-[13px] leading-relaxed">{t("soonBody")}</p>
          </div>
        </div>
      )}

      <section className="space-y-2 rounded-2xl border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-bold">{t("urlLabel")}</h2>
        <CopyBox value={mcpUrl} />
        <p className="text-xs text-muted-foreground">{t("urlHelp")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">{t("howTitle")}</h2>
        <Tabs defaultValue="claude" className="gap-4">
          <TabsList className="h-auto w-full justify-start gap-1 p-1 md:h-auto">
            {ASSISTANTS.map((assistant) => (
              <TabsTrigger key={assistant} value={assistant} className="h-10 flex-none gap-2 px-3 sm:flex-1">
                <AssistantLogo assistant={assistant} />
                {t(`tabs.${assistant}.name`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {ASSISTANTS.map((assistant) => (
            <TabsContent key={assistant} value={assistant} className="rounded-2xl border bg-card p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <AssistantLogo assistant={assistant} className="size-10 rounded-xl" />
                <h3 className="text-base font-bold">{t(`tabs.${assistant}.name`)}</h3>
              </div>
              <ol className="space-y-3.5">
                {Array.from({ length: ASSISTANT_STEP_COUNT[assistant] }, (_, i) => String(i + 1)).map((n) => (
                  <li key={n} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {n}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                      <p className="text-sm leading-relaxed text-pretty">{t(`tabs.${assistant}.steps.${n}`)}</p>
                      {n === "1" && assistant === "claude_code" && <CopyBox value={claudeCodeCommand(mcpUrl)} multiline />}
                      {n === "1" && assistant === "cursor" && <CopyBox value={cursorConfig(mcpUrl)} multiline />}
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 flex gap-2 rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                <Info className="size-4 shrink-0" aria-hidden />
                <span>
                  <b className="text-foreground">{t("noteLabel")}: </b>
                  {t(`tabs.${assistant}.note`)}
                </span>
              </p>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <MessageSquareText className="size-4 text-muted-foreground" aria-hidden />
            {t("examplesTitle")}
          </h2>
          <ul className="space-y-2">
            {EXAMPLES.map((n) => (
              <li key={n} className="rounded-xl bg-muted/50 px-3 py-2 text-[13px] leading-relaxed">
                “{t(`examples.${n}`)}”
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            {t("safetyTitle")}
          </h2>
          <ul className="space-y-2.5">
            {SAFETY.map((n) => (
              <li key={n} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {t(`safety.${n}`)}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
