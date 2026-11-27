"use client";

import Image from "next/image";
import { Check, FileSpreadsheet, Loader2, ShieldAlert, Undo2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SOCIAL_PLATFORMS } from "@workspace/store-sections/social";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SellerButton } from "@/components/seller-ui";
import { storeProductsHref } from "@/lib/products/product-routes.lib";
import { AssistantMessage as AssistantRow, SellerMessage } from "@/app/[locale]/(builder)/ai-builder/_components/chat-thread.client";
import type { EditWithAiCard, EditWithAiError } from "./server/edit-with-ai.dto";
import type { AssistantMessage, ChatMessage, ProposalView } from "./edit-with-ai-chat.lib";

/**
 * The "Edit with AI" conversation: the seller's bubbles, the AI's replies
 * with what they changed on the canvas (a checklist; Undo while that change
 * is still the editor's newest undo step), confirm cards for store changes,
 * the products-file card, skipped changes and credits. Replies are announced
 * (`role="log"`, `aria-live="polite"`).
 */

/** Every error code of the server, plus nothing else: unknown ones are the generic text. */
const ERROR_KEYS = new Set<string>([
  "notFound",
  "readOnly",
  "aiUnavailable",
  "rateLimited",
  "invalidInput",
  "attachmentInvalid",
  "aiDailyLimit",
  "aiNoCredits",
  "aiFailed",
  "draftChanged",
  "actionExpired",
  "actionRunning",
  "actionFailed",
  "uploadUnavailable",
  "generic",
]);
export const chatErrorKey = (error: string) => (ERROR_KEYS.has(error) ? error : "generic");

export const CREDITS_HREF = "/settings/plan";

export function ErrorText({ error }: { error: EditWithAiError }) {
  const t = useTranslations("editWithAi.errors");
  return (
    <>
      {t(chatErrorKey(error))}
      {error === "aiNoCredits" && (
        <>
          {" "}
          <Link href={CREDITS_HREF} className="font-semibold text-(--s-link) underline-offset-2 hover:underline">
            {t("getCredits")}
          </Link>
        </>
      )}
    </>
  );
}

type Handlers = {
  storeId: string;
  /** The turn's change is still the editor's newest undo step. */
  canUndo: (messageId: string) => boolean;
  onUndo: (messageId: string) => void;
  onConfirm: (messageId: string, actionId: string) => void;
  onCancel: (messageId: string, actionId: string) => void;
};

export function ChatMessages({ messages, pending, ...handlers }: { messages: readonly ChatMessage[]; pending: boolean } & Handlers) {
  const t = useTranslations("editWithAi.chat");
  return (
    <ol role="log" aria-live="polite" aria-relevant="additions" aria-label={t("log")} className="flex flex-col gap-5">
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <SellerMessage key={message.id}>
              <span className="sr-only">{t("you")}: </span>
              {message.attachments.length > 0 && <SentAttachments attachments={message.attachments} />}
              {message.text}
            </SellerMessage>
          );
        }
        if (message.role === "error") {
          return (
            <li key={message.id} role="alert" className="ms-10 rounded-2xl bg-destructive-soft px-3.5 py-2.5 text-[13px] leading-[1.8] text-destructive">
              <ErrorText error={message.error} />
            </li>
          );
        }
        if (message.role === "notice") {
          return (
            <li key={message.id} className="ms-10 text-[12.5px] text-(--s-subtle)">
              {t("stopped")}
            </li>
          );
        }
        return <AssistantTurn key={message.id} message={message} {...handlers} />;
      })}
      {pending && (
        <li className="flex items-center gap-3" aria-busy>
          <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-(--s-surface) ring-1 ring-(--s-line)">
            <Loader2 className="size-3.5 animate-spin text-(--s-primary)" aria-hidden />
          </span>
          <TypingDots />
          <span className="text-[13px] text-(--s-muted)">{t("thinking")}</span>
        </li>
      )}
    </ol>
  );
}

function SentAttachments({ attachments }: { attachments: Extract<ChatMessage, { role: "user" }>["attachments"] }) {
  return (
    <span className="mb-1.5 flex flex-wrap gap-1.5">
      {attachments.map((a, i) =>
        a.kind === "image" && a.url ? (
          // Decorative: the photo's name is next to it for screen readers.
          // eslint-disable-next-line @next/next/no-img-element -- the store's own media URL, any host
          <img key={i} src={a.url} alt={a.name} className="size-14 rounded-lg object-cover ring-1 ring-(--s-line)" />
        ) : (
          <span key={i} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-(--s-surface) px-2 py-1 text-[12px] text-(--s-muted) ring-1 ring-(--s-line)">
            <FileSpreadsheet className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{a.name}</span>
          </span>
        ),
      )}
    </span>
  );
}

function AssistantTurn({ message, storeId, canUndo, onUndo, onConfirm, onCancel }: { message: AssistantMessage } & Handlers) {
  const t = useTranslations("editWithAi.chat");
  const changes = message.siteChanges;
  return (
    <AssistantRow>
      <span className="sr-only">{t("assistant")}: </span>
      <div className="flex flex-col gap-3">
        {message.text && <span className="whitespace-pre-line break-words">{message.text}</span>}
        {changes && changes.lines.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border border-(--s-line) bg-(--s-surface) px-3.5 py-3">
            <span className="text-[12.5px] font-bold text-(--s-ink)">{t("changesTitle")}</span>
            <ul className="flex flex-col gap-1">
              {changes.lines.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-(--s-muted)">
                  <Check className="mt-1 size-3.5 shrink-0 text-(--s-primary)" aria-hidden />
                  <span className="min-w-0 break-words">{line}</span>
                </li>
              ))}
            </ul>
            {canUndo(message.id) && (
              <span>
                <button
                  type="button"
                  onClick={() => onUndo(message.id)}
                  aria-label={t("undoLabel")}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold text-(--s-primary) hover:bg-(--s-hover)"
                >
                  <Undo2 className="size-3.5 rtl:-scale-x-100" aria-hidden />
                  {t("undo")}
                </button>
              </span>
            )}
          </div>
        )}
        {changes?.stale && <span className="text-[12.5px] text-(--s-subtle)">{t("stale")}</span>}
        {message.proposals.map((proposal) => (
          <ConfirmCard key={proposal.actionId} proposal={proposal} storeId={storeId} onConfirm={() => onConfirm(message.id, proposal.actionId)} onCancel={() => onCancel(message.id, proposal.actionId)} />
        ))}
        {message.cards.map((card) => (
          <ImportCard key={card.fileRef} card={card} />
        ))}
        {message.rejected > 0 && <span className="text-[12.5px] text-(--s-subtle)">{t("skipped", { count: message.rejected })}</span>}
        {message.creditsUsed > 0 && <span className="text-[11.5px] text-(--s-subtle)">{t("credits", { count: message.creditsUsed })}</span>}
      </div>
    </AssistantRow>
  );
}

/** Params of an `agent.card.*` line, with a social platform's key shown by its name. */
function cardParams(params: Record<string, string | number | undefined> | undefined, locale: "ar" | "en"): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined) continue;
    if (key === "platform") {
      const platform = SOCIAL_PLATFORMS.find((p) => p.key === value);
      out[key] = platform ? platform.label[locale] : value;
    } else out[key] = value;
  }
  return out;
}

export function ConfirmCard({ proposal, storeId, onConfirm, onCancel }: { proposal: ProposalView; storeId: string; onConfirm: () => void; onCancel: () => void }) {
  const t = useTranslations("editWithAi.card");
  const tRoot = useTranslations();
  const locale = useLocale() === "en" ? "en" : "ar";
  const text = (key: string, params?: Record<string, string | number | undefined>) =>
    tRoot.has(key as never) ? tRoot(key as never, cardParams(params, locale) as never) : "";
  const high = proposal.card.risk === "high";
  const busy = proposal.status === "confirming" || proposal.status === "cancelling";
  const title = text(proposal.card.title, proposal.card.params) || t("fallbackTitle");

  return (
    <div
      role="group"
      aria-label={title}
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border bg-(--s-surface) px-3.5 py-3 shadow-[0_1px_3px_rgb(13_55_67/0.06)]",
        high ? "border-destructive/50" : "border-(--s-line)",
        (proposal.status === "cancelled" || proposal.status === "failed") && "opacity-70",
      )}
    >
      <span className="text-[13.5px] font-bold text-(--s-ink)">{title}</span>
      {high && (
        <span className="flex items-start gap-1.5 text-[12.5px] font-semibold text-destructive">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("highRisk")}
        </span>
      )}
      {proposal.card.lines.length > 0 && (
        <ul className="flex flex-col gap-1">
          {proposal.card.lines.map((line, i) => {
            const body = text(line.key, line.params);
            return body ? (
              <li key={i} className="text-[13px] leading-[1.75] break-words text-(--s-muted)">
                {body}
              </li>
            ) : null;
          })}
        </ul>
      )}

      {proposal.status === "done" ? (
        <span className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-success">
          <Check className="size-4" aria-hidden />
          {proposal.product ? (proposal.product.live ? t("productLive") : t("productDraft")) : t("done")}
          {proposal.product && (
            <Link href={storeProductsHref(storeId, `/${encodeURIComponent(proposal.product.id)}`)} className="font-semibold text-(--s-link) underline-offset-2 hover:underline">
              {t("openProduct")}
            </Link>
          )}
          {proposal.creditsUsed ? <span className="text-[11.5px] font-normal text-(--s-subtle)">{t("credits", { count: proposal.creditsUsed })}</span> : null}
        </span>
      ) : proposal.status === "cancelled" ? (
        <span className="text-[12.5px] text-(--s-subtle)">{t("cancelled")}</span>
      ) : proposal.status === "failed" ? (
        <span role="alert" className="text-[12.5px] text-destructive">
          <ErrorText error={proposal.error ?? "generic"} />
        </span>
      ) : (
        <>
          {proposal.error && (
            <span role="alert" className="text-[12.5px] text-destructive">
              <ErrorText error={proposal.error} />
            </span>
          )}
          <span className="flex flex-wrap items-center gap-2">
            <SellerButton type="button" size="sm" variant={high ? "solid" : "amber"} disabled={busy} onClick={onConfirm}>
              {proposal.status === "confirming" && <Loader2 className="animate-spin" aria-hidden />}
              {proposal.status === "confirming" ? t("confirming") : t("confirm")}
            </SellerButton>
            <SellerButton type="button" size="sm" variant="mini" disabled={busy} onClick={onCancel}>
              {t("cancel")}
            </SellerButton>
            {proposal.credits > 0 && <span className="text-[11.5px] text-(--s-subtle)">{t("costs", { count: proposal.credits })}</span>}
          </span>
        </>
      )}
    </div>
  );
}

/** A products file: the from-file import opens in this tab with it; the chat is kept for the way back. */
export function ImportCard({ card }: { card: EditWithAiCard }) {
  const t = useTranslations("editWithAi.importCard");
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-(--s-line) bg-(--s-surface) px-3.5 py-3">
      <Image src="/illustrations/features/add-file.png" alt="" aria-hidden width={44} height={44} className="size-11 shrink-0 select-none" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-[13.5px] font-bold text-(--s-ink)">{t("title")}</span>
        <span className="truncate text-[12.5px] text-(--s-muted)" dir="auto">
          {card.fileName}
        </span>
        <span className="text-[12px] text-(--s-subtle)">{t("kept")}</span>
        <span>
          <SellerButton asChild size="sm" variant="solid">
            <Link href={card.href}>{t("open")}</Link>
          </SellerButton>
        </span>
      </div>
    </div>
  );
}

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span key={delay} className="size-1.5 animate-bounce rounded-full bg-(--s-subtle) motion-reduce:animate-none" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </span>
  );
}
