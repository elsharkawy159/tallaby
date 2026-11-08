"use client";

import { Check, ChevronDown, Loader2, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { BuilderMessage, BuilderView } from "@/app/(main)/ai-builder/builder.dto";
import { revealSteps } from "./workspace.lib";
import { useReducedMotion } from "./use-reduced-motion.client";

/**
 * The conversation (spec §10), Claude/ChatGPT style: the assistant's words as
 * plain text beside the طلبي mark (no bubble), the seller's in a soft bubble,
 * and activity rows ("I read your file: 42 products") with a tick and
 * collapsible details. Every assistant text is an i18n key from the server.
 */

export function TallabyMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-7 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-(--s-surface) ring-1 ring-(--s-line)", className)}>
      <Image src="/logo/logo.png" alt="" width={20} height={20} className="size-5 object-contain" />
    </span>
  );
}

/** Assistant text revealed word by word when it is new; at once with reduced motion. */
function RevealText({ text, animate }: { text: string; animate: boolean }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(animate ? 0 : Number.POSITIVE_INFINITY);
  const steps = revealSteps(text);
  const done = reduced || step >= steps.length - 1;
  useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(() => setStep((current) => current + 1), 28);
    return () => window.clearTimeout(timer);
  }, [done, step]);
  return <>{done ? text : steps[Math.max(0, step)]}</>;
}

export function AssistantMessage({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <TallabyMark className="mt-0.5" />
      <div className="min-w-0 flex-1 whitespace-pre-line pt-1 text-[14.5px] leading-[1.85] text-(--s-text) motion-safe:animate-[ai-fade-up_.3s_ease-out]">{children}</div>
    </li>
  );
}

export function SellerMessage({ children }: { children: ReactNode }) {
  return (
    <li className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[18px] rounded-se-md bg-(--s-fill) px-4 py-2.5 text-[14px] leading-[1.75] text-(--s-ink)">{children}</div>
    </li>
  );
}

export function ActivityRow({ state, children, details }: { state: "done" | "running" | "warning"; children: ReactNode; details?: ReactNode }) {
  const t = useTranslations("aiBuilder.ws.chat");
  const [open, setOpen] = useState(false);
  const icon =
    state === "running" ? (
      <Loader2 className="size-3.5 animate-spin text-(--s-primary)" aria-hidden />
    ) : state === "warning" ? (
      <TriangleAlert className="size-3.5 text-accent-ink" aria-hidden />
    ) : (
      <Check className="size-3.5 text-(--s-primary)" aria-hidden />
    );
  return (
    <li className="ms-10">
      <div className="flex min-h-8 items-center gap-2 text-[13px] text-(--s-muted)">
        <span className="grid size-5 place-items-center rounded-full bg-(--s-tint) ring-1 ring-(--s-line)">{icon}</span>
        <span className="min-w-0 flex-1">{children}</span>
        {details && (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)"
          >
            {open ? t("hideDetails") : t("showDetails")}
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        )}
      </div>
      {details && open && <div className="mt-1 ms-7 rounded-xl border border-(--s-line) bg-(--s-surface) px-3 py-2 text-[12.5px] leading-[1.8] text-(--s-muted)">{details}</div>}
    </li>
  );
}

export function ChatThread({
  view,
  revealFrom,
  sellerLabel,
  extra,
}: {
  view: BuilderView;
  /** Messages at or after this index arrived while the page was open: they reveal. */
  revealFrom: number;
  /** The text of a seller bubble saved as `card:…` or `chip:…`. */
  sellerLabel: (text: string) => string;
  /** Rows after the messages (reading the file, the card, the progress). */
  extra?: ReactNode;
}) {
  const t = useTranslations("aiBuilder");
  const text = (message: Extract<BuilderMessage, { role: "assistant" }>) => {
    const params = (message.params ?? {}) as never;
    if (t.has(message.key as never)) return t(message.key as never, params);
    if (t.has(`q.${message.key}` as never)) return t(`q.${message.key}` as never);
    return "";
  };
  const summary = view.state.fileSummary;

  return (
    <ol className="flex flex-col gap-5" aria-label={t("ws.chat.log")}>
      {view.state.messages.map((message, index) => {
        if (message.role === "seller") {
          const label = message.text.startsWith("card:") || message.text.startsWith("chip:") ? sellerLabel(message.text) : message.text;
          return <SellerMessage key={index}>{label}</SellerMessage>;
        }
        const body = text(message);
        if (!body) return null;
        if (message.key.startsWith("v2.activity.")) {
          const failed = message.key === "v2.activity.fileUnreadable";
          return (
            <ActivityRow
              key={index}
              state={failed ? "warning" : "done"}
              details={
                message.key === "v2.activity.readFile" && summary ? (
                  <ul>
                    <li>{t("ws.chat.fileFound", { count: summary.found })}</li>
                    <li>{t("ws.chat.fileKept", { count: summary.kept })}</li>
                    {summary.dropped > 0 && <li>{t("ws.chat.fileDropped", { count: summary.dropped })}</li>}
                    {summary.truncated > 0 && <li>{t("ws.chat.fileTruncated", { count: summary.truncated })}</li>}
                    <li>{t(`ws.chat.mapping.${summary.mapping}`)}</li>
                  </ul>
                ) : undefined
              }
            >
              {body}
            </ActivityRow>
          );
        }
        return (
          <MessageWithActivity key={index} view={view} messageKey={message.key}>
            <AssistantMessage>
              <RevealText text={body} animate={index >= revealFrom} />
            </AssistantMessage>
          </MessageWithActivity>
        );
      })}
      {extra}
    </ol>
  );
}

/** "I picked 3 designs that suit your store" before the design card's words. */
function MessageWithActivity({ view, messageKey, children }: { view: BuilderView; messageKey: string; children: ReactNode }) {
  const t = useTranslations("aiBuilder.ws.chat");
  if (messageKey !== "v2.cards.design" || !view.templates.length) return <>{children}</>;
  return (
    <>
      <ActivityRow state="done">{t("pickedTemplates", { count: view.templates.length })}</ActivityRow>
      {children}
    </>
  );
}
