"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader } from "lucide-react";

import { cleanTopLoaderColor, type StoreTopLoaderSettings as Settings } from "@workspace/lib/stores/top-loader";
import { Field, Note, OptionCard, OptionCards, SaveBar, SectionCard, TextInput, Toggle } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { saveStoreTopLoader } from "./top-loader.server";

type ColorMode = "brand" | "custom";

/**
 * Store › Apps › Top loader (owner, 2026-11-27). The thin bar at the top of the
 * store website while the next page loads: on/off (saves at once), and its
 * colour, the store's brand colour or a custom one (save bar).
 */
export function TopLoaderApp({
  storeId,
  brandColor,
  initial,
  readOnly,
}: {
  storeId: string;
  brandColor: string;
  initial: Settings;
  readOnly: boolean;
}) {
  const t = useTranslations("topLoaderApp");
  const [saved, setSaved] = useState(initial);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [mode, setMode] = useState<ColorMode>(initial.color ? "custom" : "brand");
  // The custom colour the seller is editing; kept while they switch to the brand colour and back.
  const [custom, setCustom] = useState(initial.color ?? brandColor);
  const [isPending, startTransition] = useTransition();

  const customColor = cleanTopLoaderColor(custom);
  const color = mode === "custom" ? customColor : null;
  const shown = (mode === "custom" ? customColor : null) ?? brandColor;

  const apply = (next: Settings) => {
    setSaved(next);
    setEnabled(next.enabled);
    setMode(next.color ? "custom" : "brand");
    if (next.color) setCustom(next.color);
  };

  const save = (next: Settings) =>
    startTransition(async () => {
      const result = await saveStoreTopLoader(storeId, next);
      if (!result.success) {
        setEnabled(saved.enabled);
        toast.error(t(`errors.${result.error}`));
        return;
      }
      apply(result.settings);
      toast.success(t("saved"));
    });

  const toggle = (next: boolean) => {
    setEnabled(next);
    // The switch saves at once with the colour already saved, not an unsaved edit.
    save({ enabled: next, color: saved.color });
  };

  const saveColor = () => {
    if (mode === "custom" && !customColor) {
      toast.error(t("invalidColor"));
      return;
    }
    save({ enabled, color });
  };

  const dirty = color !== saved.color || (mode === "custom" && !customColor);
  const disabled = readOnly || isPending;

  return (
    <SectionCard
      icon={Loader}
      title={t("title")}
      description={t("description")}
      action={<Toggle className="max-[600px]:min-h-10" id="top-loader-enabled" checked={enabled} disabled={disabled} onCheckedChange={toggle} aria-label={t("title")} />}
    >
      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}
      {!enabled && <Note>{t("offNote")}</Note>}

      <div className="grid grid-cols-2 items-start gap-4 max-[860px]:grid-cols-1">
        <div className="flex flex-col gap-4">
          <Field label={t("colorLabel")}>
            <OptionCards className="grid-cols-1">
              <OptionCard
                name="top-loader-color"
                value="brand"
                checked={mode === "brand"}
                disabled={disabled}
                onChange={() => setMode("brand")}
                title={
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="size-4 rounded-full border border-(--s-line)" style={{ background: brandColor }} />
                    {t("brand")}
                  </span>
                }
                description={t("brandHint")}
              />
              <OptionCard
                name="top-loader-color"
                value="custom"
                checked={mode === "custom"}
                disabled={disabled}
                onChange={() => setMode("custom")}
                title={t("custom")}
                description={t("customHint")}
              />
            </OptionCards>
          </Field>

          {mode === "custom" && (
            <Field label={t("customLabel")} htmlFor="top-loader-hex" note={customColor ? undefined : t("invalidColor")}>
              <div className="flex items-center gap-2.5" dir="ltr">
                <input
                  type="color"
                  aria-label={t("customLabel")}
                  value={customColor ?? brandColor}
                  disabled={disabled}
                  onChange={(e) => setCustom(e.target.value)}
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) p-1 disabled:cursor-not-allowed"
                />
                <TextInput
                  id="top-loader-hex"
                  value={custom}
                  maxLength={7}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="#145163"
                  disabled={disabled}
                  aria-invalid={!customColor}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    setCustom(value && !value.startsWith("#") ? `#${value}` : value);
                  }}
                  className="max-w-[140px] font-montserrat"
                />
              </div>
            </Field>
          )}
        </div>

        {/* A mini page with the bar along its top, in the chosen colour. */}
        <div className="flex flex-col gap-2">
          <span className="text-[13.5px] font-bold text-(--s-text)">{t("previewTitle")}</span>
          <div aria-hidden className="relative min-h-[180px] overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-tint)">
            <div
              className={cn("absolute start-0 top-0 h-[3px] w-[62%] transition-[opacity,background-color] duration-300", !enabled && "opacity-0")}
              style={{ background: shown, boxShadow: `0 0 10px ${shown}, 0 0 5px ${shown}` }}
            />
            <div className="flex h-[38px] items-center gap-1.5 border-b border-(--s-line-soft) bg-(--s-surface) px-3">
              <i className="size-2 rounded-full bg-(--s-field-strong)" />
              <i className="size-2 rounded-full bg-(--s-field-strong)" />
              <i className="size-2 rounded-full bg-(--s-field-strong)" />
            </div>
            <div className="flex flex-col gap-2.5 p-4">
              <i className="h-3 w-2/5 rounded-full bg-(--s-field-strong)" />
              <i className="h-2.5 w-4/5 rounded-full bg-(--s-field)" />
              <i className="h-2.5 w-3/5 rounded-full bg-(--s-field)" />
              <div className="mt-1 grid grid-cols-3 gap-2">
                <i className="aspect-square rounded-xl bg-(--s-surface)" />
                <i className="aspect-square rounded-xl bg-(--s-surface)" />
                <i className="aspect-square rounded-xl bg-(--s-surface)" />
              </div>
            </div>
          </div>
          <p className="text-pretty text-xs text-(--s-faint)">{enabled ? t("previewHint") : t("previewOff")}</p>
        </div>
      </div>

      {!readOnly && (
        <SaveBar
          dirty={dirty}
          saving={isPending}
          onSave={saveColor}
          onDiscard={() => {
            setMode(saved.color ? "custom" : "brand");
            setCustom(saved.color ?? brandColor);
          }}
        />
      )}
    </SectionCard>
  );
}
