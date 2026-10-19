"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { COLOR_TOKEN_VARS, type ColorToken, type StyleKey } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import { OverrideMark, overrideFieldClass, useStyleOverrides } from "./style-override.client";

/**
 * Small style controls shared by the element popover and the Style tab
 * (P4B-05/09), modelled on the reference `controls/` and popover `shared/`.
 * They only emit whitelisted values; the store normalizes them again.
 */

/** `keys` are the style values the row edits; with them it marks per-device overrides. */
export function ControlRow({ label, children, className, keys }: { label: string; children: ReactNode; className?: string; keys?: readonly StyleKey[] }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex w-14 shrink-0 items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="min-w-0 truncate">{label}</span>
        {keys && <OverrideMark keys={keys} />}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export type SegmentOption<T extends string> = { value: T; label: ReactNode; title?: string };

/** Button group like the reference size/weight/align toggles. Clicking the active option clears it. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T | undefined;
  options: SegmentOption<T>[];
  onChange: (value: T | undefined) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-md border bg-background p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.title}
            aria-label={option.title}
            onClick={() => onChange(active ? undefined : option.value)}
            className={cn(
              "inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs font-medium transition-colors",
              active ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleButton({ pressed, onChange, label, children }: { pressed: boolean; onChange: (pressed: boolean) => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={() => onChange(!pressed)}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        pressed && "bg-primary/10 text-primary",
      )}
    >
      {children}
    </button>
  );
}

const COLOR_RE = /^(?:#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|(?:rgba?|hsla?|oklch|oklab)\([0-9.,%\s/+-]+\))$/i;
const SWATCHES: ColorToken[] = ["foreground", "muted", "primary", "accent", "background", "secondary", "border", "white", "black"];

/** Theme token swatches plus a custom color (plain color syntax only). */
export function ColorControl({
  value,
  onChange,
  label,
  tokenLabel,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  label: string;
  tokenLabel: (token: ColorToken) => string;
}) {
  const isToken = value !== undefined && value in COLOR_TOKEN_VARS;
  const [draft, setDraft] = useState(isToken ? "" : (value ?? ""));
  useEffect(() => setDraft(isToken ? "" : (value ?? "")), [value, isToken]);
  const hex = /^#[0-9a-f]{6}$/i.test(draft) ? draft : "#000000";
  return (
    <div className="space-y-1.5">
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
        {SWATCHES.map((token) => (
          <button
            key={token}
            type="button"
            role="radio"
            aria-checked={value === token}
            title={tokenLabel(token)}
            aria-label={tokenLabel(token)}
            onClick={() => onChange(value === token ? undefined : token)}
            className="grid size-6 place-items-center rounded-full border shadow-xs"
            style={{ background: COLOR_TOKEN_VARS[token] }}
          >
            {value === token && <Check className="size-3 text-white mix-blend-difference" aria-hidden />}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          aria-label={label}
          value={hex}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          className="h-7 w-8 shrink-0 cursor-pointer rounded border bg-background p-0.5"
        />
        <input
          dir="ltr"
          value={draft}
          placeholder="#000000"
          aria-label={label}
          onChange={(e) => {
            setDraft(e.target.value);
            const next = e.target.value.trim();
            if (!next) onChange(undefined);
            else if (COLOR_RE.test(next)) onChange(next);
          }}
          className={cn(
            "h-7 min-w-0 flex-1 rounded-md border bg-background px-2 font-mono text-xs",
            draft && !COLOR_RE.test(draft.trim()) && "border-destructive",
          )}
        />
      </div>
    </div>
  );
}

/** Integer input; empty means "not set". */
export function NumberControl({
  value,
  onChange,
  label,
  min,
  max,
  unit = "px",
  placeholder,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  label: string;
  min?: number;
  max?: number;
  unit?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex h-7 items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        dir="ltr"
        min={min}
        max={max}
        value={value ?? ""}
        placeholder={placeholder ?? "–"}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="h-full w-full min-w-0 bg-transparent px-2 text-xs tabular-nums outline-none"
      />
      {unit && <span className="pe-2 text-[10px] text-muted-foreground">{unit}</span>}
    </label>
  );
}

const LENGTH_RE = /^(?:auto|\d{1,4}(?:\.\d{1,2})?(?:px|%|rem))$/;

/** auto, 50%, 640px or 20rem. */
export function LengthControl({ value, onChange, label }: { value: string | undefined; onChange: (value: string | undefined) => void; label: string }) {
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);
  return (
    <input
      dir="ltr"
      aria-label={label}
      value={draft}
      placeholder="auto · 100% · 640px"
      onChange={(e) => {
        setDraft(e.target.value);
        const next = e.target.value.trim();
        if (!next) onChange(undefined);
        else if (LENGTH_RE.test(next)) onChange(next);
      }}
      className={cn("h-7 w-full rounded-md border bg-background px-2 text-xs", draft && !LENGTH_RE.test(draft.trim()) && "border-destructive")}
    />
  );
}

type Side = "Top" | "End" | "Bottom" | "Start";

/** Padding and margin per side (logical sides, so RTL mirrors), like the reference spacing box model. */
export function SpacingBox({
  values,
  onChange,
  labels,
}: {
  values: Partial<Record<`padding${Side}` | `margin${Side}`, number>>;
  onChange: (key: `padding${Side}` | `margin${Side}`, value: number | undefined) => void;
  labels: { margin: string; padding: string; side: (side: Side) => string; override?: (key: StyleKey) => string | undefined };
}) {
  // Cells the edited device sets itself are tinted; dashed ones keep a value on a smaller device.
  const overrides = useStyleOverrides();
  const cell = (kind: "padding" | "margin", side: Side) => {
    const key = `${kind}${side}` as const;
    return (
      <input
        type="number"
        dir="ltr"
        title={labels.override?.(key)}
        aria-label={`${labels[kind]} ${labels.side(side)}`}
        min={kind === "margin" ? -200 : 0}
        max={400}
        value={values[key] ?? ""}
        placeholder="0"
        onChange={(e) => onChange(key, e.target.value === "" ? undefined : Number(e.target.value))}
        className={cn("h-6 w-10 rounded border bg-background text-center text-[11px] tabular-nums", overrideFieldClass(overrides, key))}
      />
    );
  };
  return (
    <div className="rounded-lg border border-dashed p-2 text-[10px] text-muted-foreground">
      <span className="uppercase">{labels.margin}</span>
      <div className="flex justify-center">{cell("margin", "Top")}</div>
      <div className="flex items-center justify-between gap-1">
        {cell("margin", "Start")}
        <div className="flex-1 rounded-md border bg-muted/40 p-1.5">
          <span className="uppercase">{labels.padding}</span>
          <div className="flex justify-center">{cell("padding", "Top")}</div>
          <div className="flex items-center justify-between">
            {cell("padding", "Start")}
            <span className="h-5 flex-1 mx-1 rounded bg-background" />
            {cell("padding", "End")}
          </div>
          <div className="flex justify-center">{cell("padding", "Bottom")}</div>
        </div>
        {cell("margin", "End")}
      </div>
      <div className="flex justify-center">{cell("margin", "Bottom")}</div>
    </div>
  );
}
