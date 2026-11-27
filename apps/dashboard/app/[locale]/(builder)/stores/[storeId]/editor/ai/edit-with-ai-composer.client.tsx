"use client";

import { ArrowUp, AtSign, FileSpreadsheet, Loader2, Paperclip, Square, TriangleAlert, X } from "lucide-react";
import { useLayoutEffect, type ReactNode, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { EDIT_WITH_AI_LIMITS } from "./server/edit-with-ai.dto";
import type { PendingAttachment } from "./edit-with-ai-chat.lib";

/** What the file picker offers; the chat checks each file again (`classifyFile`) and the server checks the bytes. */
export const ATTACH_ACCEPT = "image/jpeg,image/png,image/webp,.csv,.xls,.xlsx,.pdf";

const MAX_HEIGHT = 200;

/**
 * Enter sends on a keyboard (Shift+Enter is a new line), Ctrl/⌘+Enter always
 * sends, and on a touch screen Enter is a new line. Never while composing
 * (Arabic and other input methods).
 */
export function composerKey(event: { key: string; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; isComposing: boolean }, touch: boolean): "send" | null {
  if (event.key !== "Enter" || event.isComposing) return null;
  if (event.ctrlKey || event.metaKey) return "send";
  if (event.shiftKey || touch) return null;
  return "send";
}

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  onPickFiles,
  onRemove,
  attachments,
  pending,
  waitingUploads,
  disabled,
  touch,
  inputRef,
  fileRef,
  mention,
  onRemoveMention,
  footer,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onPickFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  attachments: readonly PendingAttachment[];
  pending: boolean;
  waitingUploads: boolean;
  disabled: boolean;
  touch: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  fileRef: RefObject<HTMLInputElement | null>;
  /** The section selected on the canvas: a site edit then changes it. */
  mention?: { label: string; context: string } | null;
  onRemoveMention?: () => void;
  /** Beside the send button (the AI credits chip). */
  footer?: ReactNode;
}) {
  const t = useTranslations("editWithAi.composer");
  const tAgent = useTranslations("storeEditor.agent");
  const max = EDIT_WITH_AI_LIMITS.message;
  const canSend = !pending && !disabled && !waitingUploads && value.trim().length > 0;

  useLayoutEffect(() => {
    const box = inputRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(MAX_HEIGHT, box.scrollHeight)}px`;
  }, [value, inputRef]);

  return (
    <form
      className={cn(
        "flex flex-col gap-1 rounded-[22px] border border-(--s-field) bg-(--s-surface) p-2 shadow-[0_8px_30px_rgb(13_55_67/0.06)] transition-colors focus-within:border-(--tallaby-teal-300)",
        disabled && "opacity-70",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSend();
      }}
    >
      {mention && (
        <div className="flex px-1 pt-1">
          <span
            className="inline-flex max-w-full items-center gap-1 rounded-lg bg-(--s-tint) py-1 ps-2 pe-1 text-[12.5px] text-(--s-ink)"
            title={tAgent("mentionTitle", { name: mention.label, context: mention.context })}
          >
            <AtSign className="size-3.5 shrink-0 text-(--s-subtle)" aria-hidden />
            <span className="truncate font-semibold">{mention.label}</span>
            {mention.context && mention.context !== mention.label && <span className="truncate text-(--s-subtle)">· {mention.context}</span>}
            <button
              type="button"
              aria-label={tAgent("removeMention")}
              onClick={onRemoveMention}
              className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink) max-lg:size-8"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        </div>
      )}
      {attachments.length > 0 && (
        <ul aria-label={t("attachments")} className="flex flex-wrap gap-1.5 px-1 pt-1">
          {attachments.map((a) => (
            <AttachmentChip key={a.id} attachment={a} onRemove={() => onRemove(a.id)} />
          ))}
        </ul>
      )}
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        maxLength={max}
        disabled={disabled}
        // Read-only (not disabled) while waiting, so focus stays and Escape still stops.
        readOnly={pending}
        aria-disabled={pending || undefined}
        placeholder={mention ? tAgent("placeholderMention", { name: mention.label }) : t("placeholder")}
        aria-label={t("label")}
        className={cn(
          "max-h-[200px] min-h-11 w-full resize-none bg-transparent px-2.5 py-2 text-[14.5px] leading-[1.7] text-(--s-ink) outline-none placeholder:text-(--s-placeholder) focus-visible:outline-none disabled:cursor-not-allowed max-lg:text-base",
          pending && "opacity-60",
        )}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          const action = composerKey(
            { key: event.key, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, isComposing: event.nativeEvent.isComposing },
            touch,
          );
          if (action === "send") {
            event.preventDefault();
            if (canSend) onSend();
          }
        }}
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending || disabled}
          aria-label={t("attach")}
          title={t("attach")}
          onClick={() => fileRef.current?.click()}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-(--s-subtle) transition-colors hover:bg-(--s-hover) hover:text-(--s-ink) disabled:cursor-default disabled:opacity-40 [&_svg]:size-[19px]"
        >
          <Paperclip aria-hidden />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ATTACH_ACCEPT}
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) onPickFiles(files);
          }}
        />
        <span className="min-w-0 flex-1 truncate px-1 text-[11.5px] text-(--s-faint)" aria-live="polite">
          {waitingUploads ? t("waitingUploads") : value.length > max * 0.8 ? t("counter", { count: value.length, max }) : ""}
        </span>
        {footer}
        {pending ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={t("stop")}
            title={t("stop")}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-(--s-fill) text-(--s-ink) transition-transform active:scale-95"
          >
            <Square className="size-3.5 fill-current" aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t("send")}
            title={t("send")}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-(--s-solid) text-(--s-solid-fg) transition-[opacity,transform] hover:bg-(--s-solid-hover) active:scale-95 disabled:cursor-default disabled:opacity-30"
          >
            {waitingUploads ? <Loader2 className="size-[18px] animate-spin" aria-hidden /> : <ArrowUp className="size-[18px]" aria-hidden />}
          </button>
        )}
      </div>
    </form>
  );
}

function AttachmentChip({ attachment: a, onRemove }: { attachment: PendingAttachment; onRemove: () => void }) {
  const t = useTranslations("editWithAi.composer");
  const tErr = useTranslations("editWithAi.attachError");
  const status = a.status === "error" ? tErr(a.error ?? "upload") : a.status === "uploading" ? t("uploading") : t("ready");
  return (
    <li
      className={cn(
        "flex max-w-[240px] items-center gap-2 rounded-xl border bg-(--s-surface-2) py-1 ps-1 pe-1.5",
        a.status === "error" ? "border-destructive/50" : "border-(--s-line)",
      )}
    >
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-(--s-fill) text-(--s-subtle)">
        {a.kind === "image" && (a.previewUrl || a.url) ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL or the store's media URL
          <img src={a.previewUrl ?? a.url} alt="" className="size-full object-cover" />
        ) : a.status === "error" ? (
          <TriangleAlert className="size-4 text-destructive" aria-hidden />
        ) : (
          <FileSpreadsheet className="size-4" aria-hidden />
        )}
        {a.status === "uploading" && (
          <span className="absolute inset-0 grid place-items-center bg-black/35">
            <Loader2 className="size-4 animate-spin text-white" aria-hidden />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[12px] font-semibold text-(--s-ink)" dir="auto">
          {a.name}
        </span>
        <span role={a.status === "error" ? "alert" : undefined} className={cn("truncate text-[11px]", a.status === "error" ? "text-destructive" : "text-(--s-subtle)")}>
          {status}
        </span>
        {a.status === "uploading" && (
          <span className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-(--s-fill)" role="progressbar" aria-label={t("uploadingName", { name: a.name })}>
            <span className="block h-full w-full animate-pulse rounded-full bg-(--s-primary)/60 motion-reduce:animate-none" />
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("remove", { name: a.name })}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}
