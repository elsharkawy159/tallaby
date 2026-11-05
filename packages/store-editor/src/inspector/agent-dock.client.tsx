"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AtSign, ChevronDown, SendHorizontal, Sparkles, X } from "lucide-react";
import { useStore } from "zustand";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { mentionOf } from "../lib/editor-agent.lib";
import { getInstance, refOf } from "../lib/editor-selection.lib";
import type { EditorStore } from "../state/editor.store";

/**
 * AI assistant input at the foot of the right sidebar (UI only, "soon"). The
 * selected section or element is attached as a mention, so the agent can
 * later edit exactly that element. Nothing is sent anywhere yet.
 */
export function AgentDock({ store, uiLocale }: { store: EditorStore; uiLocale: string }) {
  const t = useTranslations("storeEditor.agent");
  const selection = useStore(store, (s) => s.selection);
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const [draft, setDraft] = useState("");
  // Folded to one line (Claude Design): the panel keeps its height for the real controls.
  const [open, setOpen] = useState(false);
  // The mention the seller removed; a new selection brings one back.
  const [dismissed, setDismissed] = useState<string | null>(null);

  const page = pages.find((p) => p.id === activePageId) ?? pages[0];
  const instance = selection && page ? getInstance({ content: page.content, header, footer }, refOf(selection)) : null;
  const mention = mentionOf(selection, instance, uiLocale);
  const shown = mention && mention.key !== dismissed ? mention : null;

  return (
    <div className="shrink-0 border-t border-(--s-line-soft) p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:pb-2.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center gap-2 rounded-[14px] border-[1.5px] border-(--s-field) px-2.5 text-start text-[12.5px] text-(--s-muted)"
      >
        <Sparkles className="size-[17px] text-(--tallaby-amber-700)" aria-hidden />
        <span className="flex-1 truncate">{t("title")}</span>
        <span className="rounded-full bg-accent-soft px-2 py-px text-[10.5px] font-bold text-accent-ink">{t("soon")}</span>
        <ChevronDown className={cn("size-3.5 text-(--s-subtle) transition-transform", !open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="pt-2">
          <div className="rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) focus-within:border-(--tallaby-amber-600)">
            {shown && (
              <div className="flex px-2 pt-2">
                <span
                  className="inline-flex max-w-full items-center gap-1 rounded-md bg-primary/10 py-0.5 ps-1.5 pe-0.5 text-xs text-primary"
                  title={t("mentionTitle", { name: shown.label, context: shown.context })}
                >
                  <AtSign className="size-3 shrink-0" aria-hidden />
                  <span className="truncate font-medium">{shown.label}</span>
                  {shown.context !== shown.label && <span className="truncate opacity-70">· {shown.context}</span>}
                  <button
                    type="button"
                    aria-label={t("removeMention")}
                    onClick={() => setDismissed(shown.key)}
                    className="grid size-4 shrink-0 place-items-center rounded hover:bg-primary/15"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              </div>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={2000}
              aria-label={t("inputLabel")}
              placeholder={shown ? t("placeholderMention", { name: shown.label }) : t("placeholder")}
              className="block w-full resize-none bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between gap-2 px-2 pb-2">
              <p className="truncate text-[11px] text-muted-foreground">{t("hint")}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* A disabled button gets no hover, so the tooltip sits on this wrapper. */}
                  <span tabIndex={0} className="inline-flex rounded-md">
                    <button
                      type="button"
                      disabled
                      aria-label={t("send")}
                      className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
                    >
                      <SendHorizontal className="size-3.5 rtl:-scale-x-100" aria-hidden />
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t("comingSoon")}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
