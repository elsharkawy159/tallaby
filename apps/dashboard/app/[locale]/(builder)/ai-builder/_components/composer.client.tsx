"use client";

import { ArrowUp, FileSpreadsheet, ImagePlus, Images, Loader2, Palette, Paperclip } from "lucide-react";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@/lib/utils";
import { BRAND_SWATCHES } from "./question-card.client";
import { normalizeHex } from "./workspace.lib";

/**
 * The composer pinned under the chat (spec §10): an auto-growing box with a
 * counter, 📎 (a product file, a logo or photos, as the step allows), 🎨 a
 * brand colour, and Send. Enter sends, Shift+Enter is a new line. Free text
 * goes through the chat's edit reading on the server.
 */

const MAX_HEIGHT = 200;

export type Attachments = {
  file?: (file: File) => void;
  logo?: (file: File) => void;
  /** Add products by photos (opens the product form). */
  photos?: () => void;
};

export function Composer({
  value,
  onChange,
  onSend,
  busy,
  disabled,
  max,
  placeholder,
  attach,
  onColor,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  busy: boolean;
  /** No free text now (the build is running, or nothing is open). */
  disabled: boolean;
  max: number;
  placeholder: string;
  attach: Attachments;
  onColor?: (hex: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const t = useTranslations("aiBuilder.ws.composer");
  const fileInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const [hex, setHex] = useState("");
  const [colorOpen, setColorOpen] = useState(false);
  const canSend = !busy && !disabled && value.trim().length > 0 && value.length <= max;

  // Grows with the text up to MAX_HEIGHT, then scrolls.
  useLayoutEffect(() => {
    const box = inputRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(MAX_HEIGHT, box.scrollHeight)}px`;
  }, [value, inputRef]);

  const hasAttach = Boolean(attach.file || attach.logo || attach.photos);
  const pickColor = (color: string) => {
    onColor?.(color);
    setColorOpen(false);
    setHex("");
  };

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
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        maxLength={max}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={t("label")}
        className="max-h-[200px] min-h-11 w-full resize-none bg-transparent px-2.5 py-2 text-[14.5px] leading-[1.7] text-(--s-ink) outline-none placeholder:text-(--s-placeholder) focus-visible:outline-none disabled:cursor-not-allowed"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (canSend) onSend();
          }
        }}
      />
      <div className="flex items-center gap-1">
        {hasAttach && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" disabled={busy || disabled} aria-label={t("attach")} className={toolClass}>
                <Paperclip aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="min-w-56">
              {attach.file && (
                <DropdownMenuItem className="min-h-11" onSelect={() => fileInput.current?.click()}>
                  <FileSpreadsheet aria-hidden />
                  {t("attachFile")}
                </DropdownMenuItem>
              )}
              {attach.logo && (
                <DropdownMenuItem className="min-h-11" onSelect={() => logoInput.current?.click()}>
                  <ImagePlus aria-hidden />
                  {t("attachLogo")}
                </DropdownMenuItem>
              )}
              {attach.photos && (
                <DropdownMenuItem className="min-h-11" onSelect={() => attach.photos?.()}>
                  <Images aria-hidden />
                  {t("attachPhotos")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <input
          ref={fileInput}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) attach.file?.(file);
          }}
        />
        <input
          ref={logoInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) attach.logo?.(file);
          }}
        />
        {onColor && (
          <Popover open={colorOpen} onOpenChange={setColorOpen}>
            <PopoverTrigger asChild>
              <button type="button" disabled={busy || disabled} aria-label={t("color")} className={toolClass}>
                <Palette aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-3">
              <p className="mb-2 text-[12.5px] font-bold text-(--s-ink)">{t("color")}</p>
              <div className="grid grid-cols-5 gap-1.5">
                {BRAND_SWATCHES.map((color) => (
                  <button key={color} type="button" aria-label={color} onClick={() => pickColor(color)} className="grid size-11 cursor-pointer place-items-center rounded-full">
                    <span className="size-8 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color }} />
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  dir="ltr"
                  value={hex}
                  maxLength={7}
                  placeholder="#1e5bb8"
                  aria-label={t("hex")}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-(--s-field) bg-(--s-surface) px-3 font-montserrat text-[13px] outline-none focus:border-(--tallaby-teal-300)"
                  onChange={(event) => setHex(event.target.value)}
                  onKeyDown={(event) => {
                    const color = normalizeHex(hex);
                    if (event.key === "Enter" && color) {
                      event.preventDefault();
                      pickColor(color);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!normalizeHex(hex)}
                  onClick={() => pickColor(normalizeHex(hex)!)}
                  className="h-11 cursor-pointer rounded-xl bg-(--s-solid) px-3 text-[12.5px] font-bold text-(--s-solid-fg) disabled:opacity-40"
                >
                  {t("useColor")}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        )}
        <span className="ms-auto font-montserrat text-[11.5px] text-(--s-faint) tabular-nums" aria-hidden={value.length < max * 0.8}>
          {value.length > 0 ? t("counter", { count: value.length, max }) : ""}
        </span>
        <button
          type="submit"
          disabled={!canSend}
          aria-label={t("send")}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-(--s-solid) text-(--s-solid-fg) transition-[opacity,transform] hover:bg-(--s-solid-hover) active:scale-95 disabled:cursor-default disabled:opacity-30"
        >
          {busy ? <Loader2 className="size-[18px] animate-spin" aria-hidden /> : <ArrowUp className="size-[18px]" aria-hidden />}
        </button>
      </div>
    </form>
  );
}

const toolClass =
  "grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-(--s-subtle) transition-colors hover:bg-(--s-hover) hover:text-(--s-ink) disabled:cursor-default disabled:opacity-40 [&_svg]:size-[19px]";
