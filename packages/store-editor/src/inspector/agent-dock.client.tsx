"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { AtSign, Check, ChevronDown, SendHorizontal, Sparkles, Square, Undo2, X } from "lucide-react";
import { useStore } from "zustand";
import type { SiteLocale } from "@workspace/store-sections";
import { SECTION_OP_REJECT_CODES } from "@workspace/store-sections/agent";
import { cn } from "@workspace/ui/lib/utils";
import { useEditorAdapter, useEditorLinks } from "../adapter.client";
import { useCodePreview } from "../code/code-preview.client";
import { AGENT_MAX_MESSAGE, composerKeyAction, mentionOf, type AgentMention } from "../lib/editor-agent.lib";
import { agentChatOf, type AgentChat, type AgentChatMessage } from "../lib/editor-agent-chat.lib";
import { getInstance, refOf } from "../lib/editor-selection.lib";
import { nameOf } from "../panels/pages-panel.client";
import type { EditorStore } from "../state/editor.store";
import { useMediaQuery } from "../state/use-media-query.client";

const REJECT_CODES = new Set<string>(SECTION_OP_REJECT_CODES);
const ERROR_KEYS = new Set([
  "aiNoCredits",
  "aiDailyLimit",
  "rateLimited",
  "aiUnavailable",
  "aiFailed",
  "readOnly",
  "invalidInput",
  "invalidContent",
  "notFound",
  "stopped",
]);

/** The chat's error text key: the host's error codes, anything else is the generic message. */
export const agentErrorKey = (error: string) => (ERROR_KEYS.has(error) ? error : "generic");
/** The reject reason's text key (`rejects.*`). */
export const agentRejectKey = (code: string) => (REJECT_CODES.has(code) ? code : "other");

/**
 * The editor's AI assistant at the foot of the right sidebar (ROADMAP F-83c,
 * F-101g/j). The chip names the selected section (never one element), and the
 * turn targets it; with nothing selected it targets the page. Hidden when the
 * host has no agent, and for a read-only editor.
 */
export function AgentDock({ store, uiLocale, storeId, readOnly = false }: { store: EditorStore; uiLocale: string; storeId: string; readOnly?: boolean }) {
  const agent = useEditorAdapter().agent;
  if (!agent || readOnly) return null;
  return <AgentDockBody store={store} uiLocale={uiLocale} storeId={storeId} turn={agent.turn} />;
}

function AgentDockBody({
  store,
  uiLocale,
  storeId,
  turn,
}: {
  store: EditorStore;
  uiLocale: string;
  storeId: string;
  turn: NonNullable<ReturnType<typeof useEditorAdapter>["agent"]>["turn"];
}) {
  const t = useTranslations("storeEditor.agent");
  const tLayers = useTranslations("storeEditor.layers");
  const chat = agentChatOf(store);
  const { messages, pending, open, draft, dismissed } = useStore(chat.store);
  const selection = useStore(store, (s) => s.selection);
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const contentLocale = useStore(store, (s) => s.locale);
  // Re-renders when the newest undo step changes, so a reply's Undo shows only while it is still the latest.
  useStore(store, (s) => s.past.at(-1));
  const preview = useCodePreview();
  const creditsHref = useEditorLinks(storeId).aiCredits;
  const touch = useMediaQuery("(pointer: coarse)");
  const input = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const page = pages.find((p) => p.id === activePageId) ?? pages[0];
  const instance = selection && page ? getInstance({ content: page.content, header, footer }, refOf(selection)) : null;
  const contexts = { page: page ? nameOf(page.name, uiLocale) || page.slug : "", header: tLayers("header"), footer: tLayers("footer") };
  const mention = mentionOf(selection, instance, uiLocale, contexts);
  const shown = mention && mention.key !== dismissed ? mention : null;
  const ui: SiteLocale = uiLocale === "en" ? "en" : "ar";

  // A new section brings its mention back.
  useEffect(() => {
    if (dismissed && mention && mention.key !== dismissed) chat.dismiss(null);
  }, [chat, dismissed, mention?.key]);

  // Newest message in view.
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, pending]);

  const send = (text = draft) => {
    if (pending || !text.trim()) return;
    void chat.send({ message: text, turn, uiLocale: ui, mention: shown, preview: preview ? { runner: preview.runner, target: preview.target } : null });
    input.current?.focus();
  };
  const stop = () => {
    chat.stop();
    input.current?.focus();
  };

  return (
    <div
      className="shrink-0 border-t border-(--s-line-soft) p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:pb-2.5"
      onKeyDown={(e) => {
        if (e.key === "Escape" && pending) {
          e.stopPropagation();
          stop();
        }
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          chat.setOpen(!open);
          if (!open) requestAnimationFrame(() => input.current?.focus());
        }}
        className="flex h-10 w-full items-center gap-2 rounded-[14px] border-[1.5px] border-(--s-field) px-2.5 text-start text-[12.5px] text-(--s-muted)"
      >
        <Sparkles className="size-[17px] text-(--tallaby-amber-700)" aria-hidden />
        <span className="flex-1 truncate">{t("title")}</span>
        {pending && !open && <TypingDots />}
        <ChevronDown className={cn("size-3.5 text-(--s-subtle) transition-transform", !open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="flex flex-col gap-2 pt-2">
          {messages.length > 0 || pending ? (
            <div ref={list} className="max-h-[min(40dvh,320px)] overflow-y-auto overscroll-contain rounded-[14px] bg-(--s-tint) p-2">
              <AgentMessages chat={chat} messages={messages} pending={Boolean(pending)} creditsHref={creditsHref} />
            </div>
          ) : (
            <AgentSuggestions mention={shown} contentLocale={contentLocale} onPick={(text) => {
              chat.setDraft(text);
              input.current?.focus();
            }} />
          )}

          <div className="rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) focus-within:border-(--tallaby-amber-600)">
            {shown && <MentionChip mention={shown} onRemove={() => chat.dismiss(shown.key)} />}
            <textarea
              ref={input}
              value={draft}
              onChange={(e) => chat.setDraft(e.target.value)}
              onKeyDown={(e) => {
                const action = composerKeyAction(
                  { key: e.key, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, isComposing: e.nativeEvent.isComposing },
                  { touch, pending: Boolean(pending) },
                );
                if (action === "send") {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              maxLength={AGENT_MAX_MESSAGE}
              // Read-only (not disabled) while waiting, so the box keeps focus and Escape still stops the turn.
              readOnly={Boolean(pending)}
              aria-disabled={Boolean(pending) || undefined}
              aria-label={t("inputLabel")}
              placeholder={shown ? t("placeholderMention", { name: shown.label }) : t("placeholder")}
              className={cn(
                "block max-h-40 w-full resize-none bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground max-lg:text-base",
                pending && "opacity-60",
              )}
            />
            <div className="flex items-center justify-between gap-2 px-2 pb-2">
              <p className="truncate text-[11px] text-muted-foreground">{shown && !touch ? t("hintKeys") : shown ? "" : t("hint")}</p>
              {pending ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label={t("stop")}
                  title={t("stop")}
                  className="grid size-7 shrink-0 place-items-center rounded-md bg-(--s-fill) text-(--s-ink) max-lg:size-9"
                >
                  <Square className="size-3 fill-current" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={!draft.trim()}
                  aria-label={t("send")}
                  title={t("send")}
                  className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40 max-lg:size-9"
                >
                  <SendHorizontal className="size-3.5 rtl:-scale-x-100" aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MentionChip({ mention, onRemove }: { mention: AgentMention; onRemove: () => void }) {
  const t = useTranslations("storeEditor.agent");
  return (
    <div className="flex px-2 pt-2">
      <span
        className="inline-flex max-w-full items-center gap-1 rounded-md bg-primary/10 py-0.5 ps-1.5 pe-0.5 text-xs text-primary"
        title={t("mentionTitle", { name: mention.label, context: mention.context })}
      >
        <AtSign className="size-3 shrink-0" aria-hidden />
        <span className="truncate font-medium">{mention.label}</span>
        {mention.context && mention.context !== mention.label && <span className="truncate opacity-70">· {mention.context}</span>}
        <button
          type="button"
          aria-label={t("removeMention")}
          onClick={onRemove}
          className="grid size-4 shrink-0 place-items-center rounded hover:bg-primary/15 max-lg:size-6"
        >
          <X className="size-3" aria-hidden />
        </button>
      </span>
    </div>
  );
}

/** Starting points for an empty chat: about the selected section, or new sections for the page. */
export function AgentSuggestions({ mention, contentLocale, onPick }: { mention: AgentMention | null; contentLocale: SiteLocale; onPick: (text: string) => void }) {
  const t = useTranslations("storeEditor.agent");
  const keys = mention
    ? (["bigger", mention.kind === "code" ? "addButton" : "toCode", contentLocale === "en" ? "translateAr" : "translateEn"] as const)
    : (["faq", "sizeGuide", "comparison"] as const);
  return (
    <div className="px-0.5">
      <p className="mb-1.5 text-[12.5px] font-semibold text-(--s-ink)">{t("emptyTitle")}</p>
      <ul aria-label={t("suggestionsLabel")} className="flex flex-wrap gap-1.5">
        {keys.map((key) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onPick(t(`suggestions.${key}`))}
              className="rounded-full border border-(--s-line) bg-(--s-surface) px-2.5 py-1 text-xs text-(--s-muted) transition-colors hover:border-(--s-primary) hover:text-(--s-ink) max-lg:py-1.5"
            >
              {t(`suggestions.${key}`)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The chat's messages; replies are announced to screen readers. */
export function AgentMessages({
  chat,
  messages,
  pending,
  creditsHref,
}: {
  chat: Pick<AgentChat, "canUndo" | "undo">;
  messages: readonly AgentChatMessage[];
  pending: boolean;
  creditsHref: string | null;
}) {
  const t = useTranslations("storeEditor.agent");
  return (
    <div role="log" aria-live="polite" aria-label={t("messagesLabel")} className="flex flex-col gap-2">
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <div key={message.id} className="max-w-[88%] self-end rounded-2xl rounded-ee-md bg-primary px-3 py-1.5 text-sm whitespace-pre-wrap break-words text-primary-foreground">
              <span className="sr-only">{t("you")}: </span>
              {message.text}
            </div>
          );
        }
        if (message.role === "error") {
          return (
            <div key={message.id} role={message.error === "stopped" ? undefined : "alert"} className="max-w-[92%] self-start rounded-2xl rounded-es-md bg-(--s-surface) px-3 py-1.5 text-sm text-(--s-muted)">
              {t(`errors.${agentErrorKey(message.error)}`)}
              {message.error === "aiNoCredits" && creditsHref && (
                <>
                  {" "}
                  <a href={creditsHref} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {t("getCredits")}
                  </a>
                </>
              )}
            </div>
          );
        }
        const nothing = message.applied.length === 0;
        return (
          <div key={message.id} className="max-w-[92%] self-start rounded-2xl rounded-es-md bg-(--s-surface) px-3 py-2 text-sm text-(--s-ink)">
            <span className="sr-only">{t("assistant")}: </span>
            {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
            {message.applied.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {message.applied.map((line, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-(--s-muted)">
                    <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" aria-hidden />
                    <span className="min-w-0 break-words">{line}</span>
                  </li>
                ))}
              </ul>
            )}
            {message.rejected.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {[...new Set(message.rejected.map(agentRejectKey))].map((key) => (
                  <li key={key} className="text-xs text-(--s-subtle)">
                    {t("skipped", { reason: t(`rejects.${key}`) })}
                  </li>
                ))}
              </ul>
            )}
            {message.stale && <p className="mt-1 text-xs text-(--s-subtle)">{t("stale")}</p>}
            {!message.stale && nothing && message.rejected.length > 0 && <p className="mt-1 text-xs text-(--s-subtle)">{t("nothingApplied")}</p>}
            {(message.creditsUsed > 0 || chat.canUndo(message)) && (
              <div className="mt-1.5 flex items-center justify-between gap-2">
                {message.creditsUsed > 0 ? <span className="text-[11px] text-(--s-subtle)">{t("credits", { count: message.creditsUsed })}</span> : <span />}
                {chat.canUndo(message) && (
                  <button
                    type="button"
                    onClick={() => chat.undo(message)}
                    aria-label={t("undoLabel")}
                    className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-(--s-primary) hover:bg-(--s-hover) max-lg:h-8"
                  >
                    <Undo2 className="size-3 rtl:-scale-x-100" aria-hidden />
                    {t("undo")}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {pending && (
        <div className="self-start rounded-2xl rounded-es-md bg-(--s-surface) px-3 py-2" aria-busy>
          <TypingDots />
          <span className="sr-only">{t("thinking")}</span>
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span key={delay} className="size-1.5 animate-bounce rounded-full bg-(--s-subtle) motion-reduce:animate-none" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </span>
  );
}
