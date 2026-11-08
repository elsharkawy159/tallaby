"use client";

import * as React from "react";
import { ArrowUp, FileSpreadsheet, Loader2, Palette, Paperclip, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import {
  INTAKE_LIMITS,
  isIntakeFileType,
  isIntakeLogoType,
  intakeTypeFromName,
  STORE_BUILD_INTAKE_BUCKET,
  type IntakeFileType,
  type IntakeLogoType,
} from "@workspace/lib/store-builds";
import { useSignup } from "@/components/marketing/signup/signup-dialog.client";
import type { SignupIntakeRef } from "@/components/marketing/signup/signup.dto";
import { createClient } from "@/supabase/client";
import { normalizeHex, suggestSubdomain, type SheetReading } from "./hero-composer.lib";
import { readLogoColors, readProductFile } from "./hero-composer-read.client";
import { useReducedMotion } from "./use-demo.client";

/**
 * The tallaby.com hero composer (ROADMAP.md F-82d, design §3, decision D9):
 * the visitor describes the store, may attach a product file and a logo and
 * pick a colour, then "Build my store" saves an intake (no model call) and
 * opens the signup dialog with it. A visitor already signed in as a seller
 * goes straight to the dashboard builder.
 */

type ErrorKey =
  | "empty"
  | "fileType"
  | "svg"
  | "fileSize"
  | "logoSize"
  | "fileRows"
  | "fileColumns"
  | "fileRead"
  | "hex"
  | "rateLimited"
  | "invalidFile"
  | "failed";

type AttachedFile = { file: File; type: IntakeFileType; reading: SheetReading | null; status: "reading" | "ready" };
type AttachedLogo = { file: File; type: IntakeLogoType; previewUrl: string; colors: string[] };
type Phase = "idle" | "saving" | "uploading";

const PRESETS = ["#0f766e", "#145163", "#1d4ed8", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#111827"];
const ACCEPT = ".csv,.xlsx,.xls,image/png,image/jpeg,image/webp";
const MAX_TEXTAREA_PX = 220;
const ROTATE_MS = 7000;
const SHOWN_EXAMPLES = 3;

const iconButton =
  "grid size-11 flex-none place-items-center rounded-full text-[#33464b] transition-colors outline-none hover:bg-teal-50 hover:text-teal-900 focus-visible:ring-[3px] focus-visible:ring-teal-700/30 disabled:opacity-50";

type IntakeResponse =
  | { ok: true; intakeId: string; token: string; uploads: { kind: "file" | "logo"; path: string; token: string; contentType: string }[] }
  | { ok: false; error: string };
type CompleteResponse = { ok: true; intakeId: string; continueUrl?: string } | { ok: false; error: string };

async function postJson<T>(url: string, body: unknown): Promise<T | { ok: false; error: string }> {
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return (await response.json()) as T;
  } catch {
    return { ok: false, error: "failed" };
  }
}

const errorKeyOf = (code: string): ErrorKey => (code === "rate_limited" ? "rateLimited" : code === "invalid_file" ? "invalidFile" : "failed");

export function HeroComposer({ className }: { className?: string }) {
  const t = useTranslations("home.hero.composer");
  const locale = useLocale();
  const { openSignup } = useSignup();
  const reduced = useReducedMotion();
  const examples = t.raw("examples") as string[];

  const [prompt, setPrompt] = React.useState("");
  const [file, setFile] = React.useState<AttachedFile | null>(null);
  const [logo, setLogo] = React.useState<AttachedLogo | null>(null);
  const [color, setColor] = React.useState<string | null>(null);
  const [hexDraft, setHexDraft] = React.useState("");
  const [colorOpen, setColorOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [error, setError] = React.useState<ErrorKey | null>(null);
  const [exampleStart, setExampleStart] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  // The intake saved for exactly these inputs: reopening the dialog reuses it.
  const saved = React.useRef<{ key: string; ref: SignupIntakeRef } | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const ids = React.useId();

  const busy = phase !== "idle";
  const reading = file?.status === "reading";

  // Rotating example prompts, paused on hover or focus and off with reduced motion.
  React.useEffect(() => {
    if (reduced || paused || examples.length <= SHOWN_EXAMPLES) return;
    const timer = window.setInterval(() => setExampleStart((n) => (n + SHOWN_EXAMPLES) % examples.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [reduced, paused, examples.length]);
  const shownExamples = Array.from({ length: Math.min(SHOWN_EXAMPLES, examples.length) }, (_, i) => examples[(exampleStart + i) % examples.length]!);

  const previewUrl = logo?.previewUrl;
  React.useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const grow = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, []);
  React.useLayoutEffect(grow, [prompt, grow]);

  const attach = async (picked: File) => {
    setError(null);
    if (/\.svg$/i.test(picked.name) || picked.type === "image/svg+xml") return setError("svg");
    const type = intakeTypeFromName(picked.name);
    if (isIntakeLogoType(type)) {
      if (picked.size > INTAKE_LIMITS.logoBytes) return setError("logoSize");
      const next: AttachedLogo = { file: picked, type, previewUrl: URL.createObjectURL(picked), colors: [] };
      setLogo(next);
      const colors = await readLogoColors(picked);
      setLogo((current) => (current?.file === picked ? { ...current, colors } : current));
      return;
    }
    if (!isIntakeFileType(type)) return setError("fileType");
    if (picked.size > INTAKE_LIMITS.fileBytes) return setError("fileSize");
    setFile({ file: picked, type, reading: null, status: "reading" });
    try {
      const result = await readProductFile(picked);
      if (result.tooManyRows || result.tooManyColumns) {
        setFile((current) => (current?.file === picked ? null : current));
        return setError(result.tooManyRows ? "fileRows" : "fileColumns");
      }
      setFile((current) => (current?.file === picked ? { ...current, reading: result, status: "ready" } : current));
    } catch {
      setFile((current) => (current?.file === picked ? null : current));
      setError("fileRead");
    }
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    picked.slice(0, 2).forEach((f) => void attach(f));
  };

  const applyHex = () => {
    const hex = normalizeHex(hexDraft);
    if (!hex) return setError("hex");
    setError(null);
    setColor(hex);
    setColorOpen(false);
  };

  const submit = async () => {
    if (busy || reading) return;
    setError(null);
    const text = prompt.trim();
    if (!text && !file && !logo) {
      setError("empty");
      textareaRef.current?.focus();
      return;
    }
    const key = JSON.stringify([text, color, locale, file?.file.name, file?.file.size, logo?.file.name, logo?.file.size]);
    const suggestion = suggestSubdomain(text) ?? undefined;
    if (saved.current?.key === key) {
      openSignup(suggestion, saved.current.ref);
      return;
    }

    setPhase("saving");
    const created = await postJson<IntakeResponse>("/api/store-build/intake", {
      prompt: text,
      primaryColor: color,
      locale,
      file: file ? { type: file.type, size: file.file.size } : null,
      logo: logo ? { type: logo.type, size: logo.file.size } : null,
      fileSummary: file?.reading
        ? { rows: file.reading.rows, valid: file.reading.valid, missingPrice: file.reading.missingPrice, headers: file.reading.headers }
        : null,
    });
    if (!created.ok) {
      setPhase("idle");
      return setError(errorKeyOf(created.error));
    }

    if (created.uploads.length) {
      setPhase("uploading");
      const storage = createClient().storage.from(STORE_BUILD_INTAKE_BUCKET);
      const results = await Promise.all(
        created.uploads.map(async (upload) => {
          const body = upload.kind === "file" ? file?.file : logo?.file;
          if (!body) return true;
          const { error: uploadError } = await storage.uploadToSignedUrl(upload.path, upload.token, body, { contentType: upload.contentType });
          return !uploadError;
        }),
      );
      if (results.some((ok) => !ok)) {
        setPhase("idle");
        return setError("failed");
      }
    }

    const done = await postJson<CompleteResponse>("/api/store-build/intake/complete", { intakeId: created.intakeId, token: created.token });
    if (!done.ok) {
      setPhase("idle");
      return setError(errorKeyOf(done.error));
    }
    if (done.continueUrl) {
      window.location.assign(done.continueUrl);
      return;
    }
    const ref = { intakeId: created.intakeId, token: created.token };
    saved.current = { key, ref };
    setPhase("idle");
    openSignup(suggestion, ref);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };

  const fileText = file?.reading
    ? `${t("fileFound", { count: file.reading.valid })}${file.reading.missingPrice ? t("fileMissing", { count: file.reading.missingPrice }) : ""}`
    : t("reading");
  const hasChips = Boolean(file || logo || color);

  return (
    <div className={cn("w-full text-start", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        aria-busy={busy || undefined}
        className="rounded-[24px] border-[1.5px] border-line-strong bg-white p-2 shadow-[0_10px_30px_rgba(20,81,99,0.08)] transition-[border-color,box-shadow] focus-within:border-teal-700 focus-within:shadow-[0_10px_30px_rgba(20,81,99,0.14)] sm:p-2.5"
      >
        <label htmlFor={`${ids}-prompt`} className="sr-only">
          {t("label")}
        </label>
        <textarea
          ref={textareaRef}
          id={`${ids}-prompt`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, INTAKE_LIMITS.promptChars))}
          onKeyDown={onKeyDown}
          rows={2}
          maxLength={INTAKE_LIMITS.promptChars}
          placeholder={t("placeholder")}
          aria-describedby={`${ids}-help ${ids}-count`}
          aria-invalid={error === "empty" || undefined}
          disabled={busy}
          className="block max-h-[220px] min-h-[64px] w-full resize-none bg-transparent px-3 pt-2.5 text-base leading-relaxed text-teal-900 outline-none placeholder:text-[#7a8b90] disabled:opacity-70 sm:text-[17px]"
        />
        <p id={`${ids}-help`} className="sr-only">
          {t("keyboardHelp")}
        </p>

        {hasChips ? (
          <ul className="m-0 flex list-none flex-wrap gap-2 px-2 pt-1.5 pb-1" aria-label={t("attachments")}>
            {file ? (
              <AttachmentChip
                icon={reading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileSpreadsheet className="size-4 text-teal-700" aria-hidden />}
                title={file.file.name}
                detail={fileText}
                removeLabel={t("remove", { name: file.file.name })}
                onRemove={() => setFile(null)}
                disabled={busy}
              />
            ) : null}
            {logo ? (
              <AttachmentChip
                // eslint-disable-next-line @next/next/no-img-element -- a local object URL preview
                icon={<img src={logo.previewUrl} alt="" className="size-6 rounded-md border border-line object-contain" />}
                title={t("logoChip")}
                detail={logo.file.name}
                removeLabel={t("remove", { name: logo.file.name })}
                onRemove={() => setLogo(null)}
                disabled={busy}
              />
            ) : null}
            {color ? (
              <AttachmentChip
                icon={<span aria-hidden className="size-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />}
                title={t("colorChip")}
                detail={<span dir="ltr" className="font-latin">{color}</span>}
                removeLabel={t("removeColor")}
                onRemove={() => setColor(null)}
                disabled={busy}
              />
            ) : null}
          </ul>
        ) : null}

        {logo && logo.colors.length ? (
          <div className="flex flex-wrap items-center gap-2 px-2 pt-1.5 text-[13px] text-[#56696e]">
            <span>{t("logoColors")}</span>
            {logo.colors.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColor(hex)}
                aria-label={t("useColor", { hex })}
                aria-pressed={color === hex}
                className={cn(
                  "grid size-11 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-teal-700/30",
                  color === hex && "ring-2 ring-teal-700",
                )}
              >
                <span aria-hidden className="size-7 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-1 pt-1">
          <input ref={fileInputRef} type="file" accept={ACCEPT} multiple onChange={onPick} className="sr-only" tabIndex={-1} aria-hidden />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            aria-label={t("attach")}
            title={t("attachHint")}
            className={iconButton}
          >
            <Paperclip className="size-5" aria-hidden />
          </button>

          <Popover open={colorOpen} onOpenChange={setColorOpen}>
            <PopoverTrigger asChild>
              <button type="button" disabled={busy} aria-label={t("color")} className={iconButton}>
                {color ? (
                  <span aria-hidden className="size-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                ) : (
                  <Palette className="size-5" aria-hidden />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(288px,calc(100vw-32px))] rounded-2xl p-4">
              <p className="mb-2.5 text-sm font-semibold text-teal-900">{t("colorTitle")}</p>
              <div className="grid grid-cols-5 gap-1">
                {PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      setColor(hex);
                      setColorOpen(false);
                    }}
                    aria-label={t("useColor", { hex })}
                    aria-pressed={color === hex}
                    className={cn(
                      "grid size-11 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-teal-700/30",
                      color === hex && "ring-2 ring-teal-700",
                    )}
                  >
                    <span aria-hidden className="size-8 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                  </button>
                ))}
              </div>
              <label htmlFor={`${ids}-hex`} className="mt-3 mb-1.5 block text-[13px] font-semibold text-[#33464b]">
                {t("colorHex")}
              </label>
              <div className="flex gap-2" dir="ltr">
                <input
                  id={`${ids}-hex`}
                  value={hexDraft}
                  onChange={(e) => setHexDraft(e.target.value.slice(0, 7))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyHex();
                    }
                  }}
                  placeholder="#0f766e"
                  spellCheck={false}
                  autoComplete="off"
                  className="h-11 min-w-0 flex-1 rounded-[10px] border border-neutral-200 px-3 font-latin text-base outline-none focus:border-teal-700 focus:ring-[3px] focus:ring-teal-700/12"
                />
                <button
                  type="button"
                  onClick={applyHex}
                  className="h-11 rounded-[10px] bg-teal-900 px-4 text-sm font-bold text-white outline-none hover:bg-[#0b3542] focus-visible:ring-[3px] focus-visible:ring-teal-700/30"
                >
                  {t("colorApply")}
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <span id={`${ids}-count`} className="ms-auto px-2 font-latin text-xs text-[#7a8b90] tabular-nums" aria-live="off">
            {t("counter", { count: prompt.length, max: INTAKE_LIMITS.promptChars })}
          </span>
          <button
            type="submit"
            disabled={busy || reading}
            className="inline-flex h-11 flex-none items-center gap-2 rounded-full bg-amber-600 ps-4 pe-3 text-[15px] font-bold whitespace-nowrap text-teal-900 shadow-cta outline-none transition-[background-color,transform] hover:bg-amber-700 focus-visible:ring-[3px] focus-visible:ring-teal-700/30 active:scale-[.98] disabled:opacity-70 sm:ps-5"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            <span>{phase === "uploading" ? t("uploading") : phase === "saving" ? t("saving") : t("send")}</span>
            {busy ? null : <ArrowUp className="size-4" aria-hidden />}
          </button>
        </div>
      </form>

      <p role="alert" className={cn("min-h-5 px-2 pt-2 text-sm text-destructive", !error && "sr-only")}>
        {error ? t(`errors.${error}`) : null}
      </p>

      <div
        className="flex flex-wrap items-center justify-center gap-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <span className="sr-only">{t("examplesLabel")}</span>
        {shownExamples.map((example) => (
          <button
            key={example}
            type="button"
            disabled={busy}
            onClick={() => {
              setPrompt(example.slice(0, INTAKE_LIMITS.promptChars));
              setError(null);
              textareaRef.current?.focus();
            }}
            className="inline-flex min-h-11 max-w-full items-center rounded-full border border-line bg-white/75 px-4 py-2 text-[13.5px] text-[#33464b] outline-none transition-colors hover:border-teal-700 hover:text-teal-900 focus-visible:ring-[3px] focus-visible:ring-teal-700/30"
          >
            <span className="truncate">{example}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-center text-sm text-[#56696e]">
        <button
          type="button"
          onClick={() => openSignup()}
          className="min-h-11 px-2 font-semibold text-teal-700 underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-teal-700/30 rounded-md"
        >
          {t("manual")}
        </button>
      </p>
    </div>
  );
}

function AttachmentChip({
  icon,
  title,
  detail,
  removeLabel,
  onRemove,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  detail: React.ReactNode;
  removeLabel: string;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <li className="flex max-w-full min-w-0 items-center gap-2 rounded-2xl border border-line bg-[#f6f9f9] py-1 ps-2.5 pe-1">
      {icon}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[13px] font-semibold text-teal-900">{title}</span>
        <span className="truncate text-xs text-[#56696e]" aria-live="polite">
          {detail}
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={removeLabel}
        className="grid size-11 flex-none place-items-center rounded-full text-[#56696e] outline-none hover:bg-white hover:text-teal-900 focus-visible:ring-[3px] focus-visible:ring-teal-700/30"
      >
        <X className="size-4" aria-hidden />
      </button>
    </li>
  );
}
