"use client";

import Image from "next/image";
import { Eye, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type DragEvent, type RefObject } from "react";
import { useTranslations } from "next-intl";
import type { EditorAssistantApi } from "@workspace/store-editor/editor.client";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/app/[locale]/(builder)/ai-builder/_components/use-reduced-motion.client";
import type { ChatState, EditWithAiChat } from "./edit-with-ai-chat.lib";
import { CREDITS_HREF, ChatMessages } from "./edit-with-ai-messages.client";
import { Composer } from "./edit-with-ai-composer.client";
import { creditsTone, turnContextOf } from "./edit-with-ai-page.lib";

/**
 * The "Edit with AI" chat (owner request 2026-11-26), the assistant panel of
 * the website editor's AI layout: the conversation, the composer with photos
 * and files, and the AI credits left. The top bar and the canvas are the
 * editor's; a turn edits the page active there, or the section selected on
 * the canvas (shown as a chip). Every change goes through the server
 * actions, which check the store again.
 */

const EMPTY: ChatState = { messages: [], draft: "", attachments: [], pending: false, waitingUploads: false };

export const SUGGESTIONS = ["hero", "faq", "product", "announcement", "import"] as const;
/** Suggestions that need a photo or a file: they open the file picker too. */
const ATTACH_SUGGESTIONS = new Set<(typeof SUGGESTIONS)[number]>(["hero", "product", "import"]);

export function EditWithAiPanel({
  api,
  apiRef,
  chat,
  storeId,
  credits,
}: {
  api: EditorAssistantApi;
  /** The chat's actions read the editor through this (the chat outlives a re-mount of the panel). */
  apiRef: RefObject<EditorAssistantApi | null>;
  chat: EditWithAiChat;
  storeId: string;
  /** AI credits left; null hides the chip (credits don't apply before the USD switch). */
  credits: number | null;
}) {
  const t = useTranslations("editWithAi");
  const state = useSyncExternalStore(chat.subscribe, chat.getState, () => EMPTY);
  const touch = useMediaQuery("(pointer: coarse)");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { readOnly } = api;

  useEffect(() => {
    apiRef.current = api;
  });

  // Newest message in view.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.messages.length, state.pending]);

  const send = () => void chat.send(turnContextOf(api));

  const pick = (kind: (typeof SUGGESTIONS)[number]) => {
    chat.setDraft(t(`suggestions.text.${kind}`));
    if (ATTACH_SUGGESTIONS.has(kind)) fileInput.current?.click();
    requestAnimationFrame(() => input.current?.focus());
  };

  const stop = () => {
    chat.stop();
    input.current?.focus();
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (readOnly || state.pending) return;
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length) chat.addFiles(files);
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col bg-(--s-surface)"
      onDragOver={(event) => {
        if (readOnly || !event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
      onKeyDown={(event) => {
        if (event.key === "Escape" && state.pending) {
          event.stopPropagation();
          stop();
        }
      }}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-[22px] border-2 border-dashed border-(--s-primary) bg-(--s-surface)/90 text-[14px] font-bold text-(--s-ink)">
          {t("composer.dropHere")}
        </div>
      )}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-6 pb-6 max-[600px]:px-4">
        <div className="mx-auto flex max-w-[680px] flex-col gap-5">
          {readOnly && (
            <p role="status" className="rounded-2xl bg-(--s-tint) px-3.5 py-2.5 text-[13px] text-(--s-muted)">
              {t("readOnly")}
            </p>
          )}
          {state.messages.length === 0 && !state.pending ? (
            <EmptyIntro onPick={pick} disabled={readOnly} />
          ) : (
            <>
              <ChatMessages
                messages={state.messages}
                pending={state.pending}
                storeId={storeId}
                canUndo={(id) => api.canUndo(chat.undoMarkerOf(id))}
                onUndo={(id) => api.undo(chat.undoMarkerOf(id))}
                onConfirm={(id, actionId) => void chat.confirm(id, actionId)}
                onCancel={(id, actionId) => void chat.cancel(id, actionId)}
              />
              {!state.pending && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => chat.clear()}
                    className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {t("chat.clear")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 px-4 pt-1 pb-4 max-[1023px]:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-[680px]">
          {api.compact && (
            <div className="mb-2 flex justify-center">
              <button
                type="button"
                onClick={api.showCanvas}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-(--s-solid) px-5 text-[13.5px] font-bold text-(--s-solid-fg) shadow-(--s-shadow-bar)"
              >
                <Eye className="size-4" aria-hidden />
                {t("preview.open")}
              </button>
            </div>
          )}
          <Composer
            value={state.draft}
            onChange={(value) => chat.setDraft(value)}
            onSend={send}
            onStop={stop}
            onPickFiles={(files) => chat.addFiles(files)}
            onRemove={(id) => chat.removeAttachment(id)}
            attachments={state.attachments}
            pending={state.pending}
            waitingUploads={state.waitingUploads}
            disabled={readOnly}
            touch={touch}
            inputRef={input}
            fileRef={fileInput}
            mention={api.mention}
            onRemoveMention={api.clearMention}
            footer={credits === null ? null : <CreditsChip credits={credits} />}
          />
          <p className="mt-1.5 text-center text-[11px] text-(--s-faint) max-[600px]:hidden">{t("composer.hint")}</p>
        </div>
      </div>
    </div>
  );
}

/** AI credits left, linking to the plan and credits page (a new tab, so the editor stays open). */
export function CreditsChip({ credits }: { credits: number }) {
  const t = useTranslations("editWithAi.credits");
  const tone = creditsTone(credits);
  const label = t("left", { count: credits });
  return (
    <Link
      href={CREDITS_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={tone === "empty" ? t("get") : label}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-[12px] font-semibold tabular-nums transition-colors hover:bg-(--s-hover)",
        tone === "ok" && "text-(--s-subtle)",
        tone === "low" && "bg-accent-soft text-accent-ink",
        tone === "empty" && "bg-destructive-soft text-destructive",
      )}
    >
      <Sparkles className="size-3.5" aria-hidden />
      <span aria-hidden>{credits}</span>
      {tone === "empty" && <span className="max-[420px]:sr-only">{t("get")}</span>}
    </Link>
  );
}

function EmptyIntro({ onPick, disabled }: { onPick: (kind: (typeof SUGGESTIONS)[number]) => void; disabled: boolean }) {
  const t = useTranslations("editWithAi");
  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      {/* Decorative (docs/dashboard-photos.md §4): the title carries the meaning. */}
      <Image src="/illustrations/features/add-ai.png" alt="" aria-hidden width={72} height={72} className="size-[72px] select-none" />
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[19px] leading-snug font-bold text-(--s-ink)">{t("empty.title")}</h2>
        <p className="text-[13.5px] leading-[1.8] text-pretty text-(--s-muted)">{t("empty.body")}</p>
      </div>
      <ul aria-label={t("suggestions.label")} className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((kind) => (
          <li key={kind}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(kind)}
              className="min-h-10 cursor-pointer rounded-full border border-(--s-line) bg-(--s-surface) px-3.5 text-[13px] text-(--s-muted) transition-colors hover:border-(--s-primary) hover:text-(--s-ink) disabled:cursor-default disabled:opacity-50"
            >
              {t(`suggestions.chip.${kind}`)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
