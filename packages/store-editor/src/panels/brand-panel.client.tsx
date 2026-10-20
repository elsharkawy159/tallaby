"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, RotateCcw } from "lucide-react";
import { useStore } from "zustand";
import type { DesignSystem } from "@workspace/store-sections";
import { FONT_PAIRINGS, STORE_FONTS, storeFontFamily } from "@workspace/store-sections/fonts";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import {
  COLOR_FIELDS,
  PALETTE_PRESETS,
  RADIUS_OPTIONS,
  SPACING_OPTIONS,
  THEME_PRESETS,
  WIDTH_OPTIONS,
  applyPairing,
  applyPreset,
  applyThemePreset,
  isHexColor,
  matchPreset,
  matchThemePreset,
  setToken,
  type ColorKey,
} from "../lib/design.lib";
import type { EditorStore } from "../state/editor.store";
import { useEditorLinks } from "../adapter.client";

const CLASSIC = { primary: "#145163", secondary: "#f2f5f4", accent: "#fdad28", background: "#ffffff", foreground: "#10242b" };
const EMPTY: DesignSystem = { colors: {}, typography: {}, spacing: {} };
/** The font select's "not set" value (Radix Select has no empty value). */
const CLASSIC_FONT = "__classic__";
/** Plain group headers (no background), like the Sections list. */
const TRIGGER = "rounded-none border-b bg-transparent px-1 py-3! text-sm font-medium hover:bg-transparent";

/**
 * Brand tab (P4B-14, like the reference `design-system/brand-panel.tsx`).
 * It edits the store's design-system draft through the editor store, so a
 * change shows on the canvas at once, is one undo step, and autosaves with
 * `saveDesignSystem`, the same draft as Website › Design system. Only tokens
 * the storefront renders are offered (no custom CSS; fonts the storefront loads).
 */
export function BrandPanel({ store, storeId, readOnly }: { store: EditorStore; storeId: string; readOnly: boolean }) {
  const t = useTranslations("storeEditor.brand");
  const td = useTranslations("websiteDesign");
  const designHref = useEditorLinks(storeId).design;
  const ds = useStore(store, (s) => s.designSystem);
  const [resetOpen, setResetOpen] = useState(false);

  const edit = (update: (prev: DesignSystem) => DesignSystem, key?: string) => store.getState().editDesign(update, key && `brand:${key}`);
  const theme = matchThemePreset(ds);
  const palette = matchPreset(ds.colors);
  const isEmpty = !Object.keys(ds.colors).length && !Object.keys(ds.typography).length && !Object.keys(ds.spacing).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("title")}</p>
          <p className="truncate text-xs text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          disabled={readOnly || isEmpty}
          onClick={() => setResetOpen(true)}
          aria-label={t("reset")}
          title={t("reset")}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={["themes", "colors"]} className="w-full px-3 pb-4">
          <AccordionItem value="themes">
            <AccordionTrigger className={TRIGGER}>{t("themes")}</AccordionTrigger>
            <AccordionContent>
              <fieldset disabled={readOnly} className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("themes")}>
                {THEME_PRESETS.map((preset) => {
                  const colors = { ...CLASSIC, ...PALETTE_PRESETS.find((p) => p.id === preset.id)?.colors };
                  const fonts = FONT_PAIRINGS.find((p) => p.id === preset.pairing);
                  return (
                    <Choice key={preset.id} selected={theme === preset.id} onClick={() => edit((prev) => applyThemePreset(prev, preset.id))}>
                      <span className="flex h-9 w-full items-center gap-1 overflow-hidden px-1.5" style={{ background: colors.background, borderRadius: preset.radius ?? 12 }}>
                        <span className="size-4 shrink-0 rounded-full" style={{ background: colors.primary }} />
                        <span className="size-3 shrink-0 rounded-full" style={{ background: colors.accent }} />
                        <span
                          className="ms-auto text-sm font-bold"
                          style={{ color: colors.foreground, fontFamily: storeFontFamily(fonts?.heading) ?? undefined }}
                        >
                          {t("sample")}
                        </span>
                      </span>
                      <span className="truncate text-[11px] font-medium">{td(`colors.preset.${preset.id}` as never)}</span>
                    </Choice>
                  );
                })}
              </fieldset>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="colors">
            <AccordionTrigger className={TRIGGER}>{td("tabs.colors")}</AccordionTrigger>
            <AccordionContent>
              <fieldset disabled={readOnly} className="flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={td("colors.presets")}>
                  {PALETTE_PRESETS.map((p) => {
                    const swatch = { ...CLASSIC, ...p.colors };
                    const name = td(`colors.preset.${p.id}` as never);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={palette === p.id}
                        title={name}
                        aria-label={name}
                        onClick={() => edit((prev) => ({ ...prev, colors: applyPreset(prev.colors, p.id) }))}
                        className={cn(
                          "flex h-7 overflow-hidden rounded-md border transition-shadow disabled:opacity-50",
                          palette === p.id ? "ring-2 ring-primary ring-offset-1" : "hover:ring-1 hover:ring-primary/40",
                        )}
                      >
                        <span className="flex-[2]" style={{ background: swatch.primary }} />
                        <span className="flex-1" style={{ background: swatch.secondary }} />
                        <span className="flex-1" style={{ background: swatch.accent }} />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">{td("colors.customHint")}</p>
                {COLOR_FIELDS.map(({ key, classic }) => (
                  <ColorField
                    key={key}
                    label={td(`colors.fields.${key}` as never)}
                    value={ds.colors[key] ?? ""}
                    classic={classic}
                    resetLabel={td("reset")}
                    onChange={(value) => edit((prev) => setToken(prev, "colors", key as ColorKey, value), `color:${key}`)}
                  />
                ))}
              </fieldset>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="typography">
            <AccordionTrigger className={TRIGGER}>{td("tabs.typography")}</AccordionTrigger>
            <AccordionContent>
              <fieldset disabled={readOnly} className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">{td("typography.hint")}</p>
                <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={td("tabs.typography")}>
                  {FONT_PAIRINGS.map((p) => (
                    <Choice
                      key={p.id}
                      selected={
                        p.id === "classic"
                          ? !ds.typography.headingFont && !ds.typography.bodyFont
                          : ds.typography.headingFont === p.heading && ds.typography.bodyFont === p.body
                      }
                      onClick={() => edit((prev) => ({ ...prev, typography: applyPairing(prev.typography, p) }))}
                      className="gap-0.5 px-2.5 py-2"
                    >
                      <span className="text-sm font-bold leading-tight" style={{ fontFamily: storeFontFamily(p.heading) ?? undefined }}>
                        {td("typography.sampleHeading")}
                      </span>
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: storeFontFamily(p.body) ?? undefined }}>
                        {td("typography.sampleBody")}
                      </span>
                      <span dir="ltr" className="text-start text-[10px] text-muted-foreground rtl:text-end">
                        {p.heading === p.body ? p.heading : `${p.heading} · ${p.body}`}
                        {p.id === "classic" ? ` — ${td("typography.classic")}` : ""}
                      </span>
                    </Choice>
                  ))}
                </div>
                <FontSelect
                  label={t("headingFont")}
                  classicLabel={t("classicFont")}
                  value={ds.typography.headingFont}
                  disabled={readOnly}
                  onChange={(value) => edit((prev) => setToken(prev, "typography", "headingFont", value))}
                />
                <FontSelect
                  label={t("bodyFont")}
                  classicLabel={t("classicFont")}
                  value={ds.typography.bodyFont}
                  disabled={readOnly}
                  onChange={(value) => edit((prev) => setToken(prev, "typography", "bodyFont", value))}
                />
              </fieldset>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="layout">
            <AccordionTrigger className={TRIGGER}>{td("tabs.buttons")}</AccordionTrigger>
            <AccordionContent>
              <fieldset disabled={readOnly} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold">{td("buttons.radius")}</p>
                  <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={td("buttons.radius")}>
                    {[undefined, ...RADIUS_OPTIONS].map((radius) => (
                      <button
                        key={radius ?? "classic"}
                        type="button"
                        role="radio"
                        aria-checked={ds.spacing.borderRadius === radius}
                        onClick={() => edit((prev) => setToken(prev, "spacing", "borderRadius", radius))}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-md border p-1.5 text-[10px] transition-colors disabled:opacity-50",
                          ds.spacing.borderRadius === radius ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/40",
                        )}
                      >
                        <span className="h-4 w-8 border-2 border-current" style={{ borderRadius: Math.min(radius ?? 12, 10) }} />
                        {radius === undefined ? td("buttons.classic") : radius}
                      </button>
                    ))}
                  </div>
                  <BoundedNumber
                    label={td("buttons.radius")}
                    value={ds.spacing.borderRadius}
                    min={0}
                    max={64}
                    placeholder="12"
                    onChange={(value) => edit((prev) => setToken(prev, "spacing", "borderRadius", value), "radius")}
                  />
                </div>
                <PresetNumber
                  label={td("buttons.width")}
                  options={WIDTH_OPTIONS.map((o) => ({ id: o.id, value: o.value, label: td(`buttons.widths.${o.id}` as never) }))}
                  value={ds.spacing.containerMaxWidth}
                  min={320}
                  max={2560}
                  placeholder="1200"
                  onChange={(value, typing) => edit((prev) => setToken(prev, "spacing", "containerMaxWidth", value), typing ? "width" : undefined)}
                />
                <PresetNumber
                  label={td("buttons.spacing")}
                  options={SPACING_OPTIONS.map((o) => ({ id: o.id, value: o.value, label: td(`buttons.spacings.${o.id}` as never) }))}
                  value={ds.spacing.sectionPaddingY}
                  min={0}
                  max={400}
                  placeholder="64"
                  onChange={(value, typing) => edit((prev) => setToken(prev, "spacing", "sectionPaddingY", value), typing ? "spacing" : undefined)}
                />
              </fieldset>
            </AccordionContent>
          </AccordionItem>

          {designHref && (
            <AccordionItem value="identity">
              <AccordionTrigger className={TRIGGER}>{td("tabs.brand")}</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{t("identityHint")}</p>
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                  <Link href={designHref} target="_blank">
                    <ExternalLink className="size-3.5" />
                    {t("openDesign")}
                  </Link>
                </Button>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      <p className="shrink-0 border-t px-3 py-2.5 text-[11px] text-muted-foreground">{t("draftNote")}</p>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resetDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => edit(() => EMPTY)}>{t("resetAction")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** A selectable card with the reference's check badge. */
function Choice({ selected, onClick, className, children }: { selected: boolean; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-1.5 rounded-lg border p-1.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        selected ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/50",
        className,
      )}
    >
      {children}
      {selected && (
        <span className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/** Swatch + hex input; empty = the Tallaby Classic color. Invalid hex is shown but never saved. */
function ColorField({
  label,
  value,
  classic,
  resetLabel,
  onChange,
}: {
  label: string;
  value: string;
  classic: string;
  resetLabel: string;
  onChange: (value: string | undefined) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const shown = value && isHexColor(value) ? value : classic;
  const full = shown.length === 4 ? `#${[...shown.slice(1)].map((c) => c + c).join("")}` : shown;
  return (
    <div className="flex items-center gap-2">
      <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border" style={{ background: shown }}>
        <input type="color" className="absolute inset-0 size-full cursor-pointer opacity-0" value={full} aria-label={label} onChange={(e) => onChange(e.target.value)} />
      </label>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{label}</p>
        <input
          dir="ltr"
          value={draft}
          placeholder={classic}
          aria-label={label}
          onChange={(e) => {
            const next = e.target.value.trim();
            setDraft(next);
            if (!next) onChange(undefined);
            else if (isHexColor(next)) onChange(next);
          }}
          className={cn("h-7 w-full rounded-md border bg-background px-2 font-mono text-xs", draft && !isHexColor(draft) && "border-destructive")}
        />
      </div>
      {value && (
        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => onChange(undefined)} aria-label={resetLabel} title={resetLabel}>
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

/** A store font (only fonts the storefront loads); the first option clears it back to Classic. */
function FontSelect({
  label,
  classicLabel,
  value,
  disabled,
  onChange,
}: {
  label: string;
  classicLabel: string;
  value: string | undefined;
  disabled: boolean;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium">{label}</p>
      <Select value={value ?? CLASSIC_FONT} disabled={disabled} onValueChange={(next) => onChange(next === CLASSIC_FONT ? undefined : next)}>
        <SelectTrigger size="sm" className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLASSIC_FONT}>{classicLabel}</SelectItem>
          {STORE_FONTS.map((font) => (
            <SelectItem key={font.name} value={font.name}>
              <span style={{ fontFamily: storeFontFamily(font.name) ?? undefined }}>{font.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Number in px within the schema bounds; out-of-range typing stays local until it is valid. */
function BoundedNumber({
  label,
  value,
  min,
  max,
  placeholder,
  onChange,
}: {
  label: string;
  value: number | undefined;
  min: number;
  max: number;
  placeholder: string;
  onChange: (value: number | undefined) => void;
}) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));
  useEffect(() => setDraft(value === undefined ? "" : String(value)), [value]);
  const parsed = Number(draft);
  const valid = draft === "" || (Number.isInteger(parsed) && parsed >= min && parsed <= max);
  return (
    <label className={cn("flex h-7 items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring", !valid && "border-destructive")}>
      <span className="sr-only">{label}</span>
      <input
        type="number"
        dir="ltr"
        min={min}
        max={max}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          const n = Number(next);
          if (next === "") onChange(undefined);
          else if (Number.isInteger(n) && n >= min && n <= max) onChange(n);
        }}
        onBlur={() => setDraft(value === undefined ? "" : String(value))}
        className="h-full w-full min-w-0 bg-transparent px-2 text-xs tabular-nums outline-none"
      />
      <span className="pe-2 text-[10px] text-muted-foreground">px</span>
    </label>
  );
}

/** Named choices (Narrow / Standard / Wide) plus an exact px value. `typing` = from the number input (one undo step). */
function PresetNumber({
  label,
  options,
  value,
  min,
  max,
  placeholder,
  onChange,
}: {
  label: string;
  options: { id: string; value: number | undefined; label: string }[];
  value: number | undefined;
  min: number;
  max: number;
  placeholder: string;
  onChange: (value: number | undefined, typing?: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold">{label}</p>
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md border px-2 py-1.5 text-xs transition-colors disabled:opacity-50",
              value === option.value ? "border-primary bg-primary/5 font-medium text-primary" : "hover:border-primary/40",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <BoundedNumber label={label} value={value} min={min} max={max} placeholder={placeholder} onChange={(next) => onChange(next, true)} />
    </div>
  );
}
