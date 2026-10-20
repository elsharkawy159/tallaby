"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Smartphone, Tablet } from "lucide-react";
import type { StyleKey } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import { DEVICE_TONE } from "@workspace/store-editor/lib/editor-devices.lib";
import type { Device } from "@workspace/store-editor/state/editor.store";

/**
 * Which style values the edited device sets itself (P4B responsive). The
 * Style tab and the element popover provide it; controls outside a provider
 * show no marks.
 */
export type StyleOverrides = {
  device: Device;
  state: (keys: readonly StyleKey[]) => { own: boolean; below: Device[] };
  /** Drops this device's value, so the inherited one applies again. */
  reset: (keys: readonly StyleKey[]) => void;
};

const OverrideContext = createContext<StyleOverrides | null>(null);

export function StyleOverrideProvider({ value, children }: { value: StyleOverrides; children: ReactNode }) {
  return <OverrideContext.Provider value={value}>{children}</OverrideContext.Provider>;
}

export function useStyleOverrides(): StyleOverrides | null {
  return useContext(OverrideContext);
}

/** Border classes for a single field (the spacing box cells). */
export function overrideFieldClass(overrides: StyleOverrides | null, key: StyleKey): string {
  if (!overrides) return "";
  const { own, below } = overrides.state([key]);
  if (own) return DEVICE_TONE[overrides.device].field;
  return below[0] ? DEVICE_TONE[below[0]].fieldBelow : "";
}

/** A field's tooltip: set for this device only, or kept by a smaller device. */
export function useOverrideTitles(): (keys: readonly StyleKey[]) => string | undefined {
  const t = useTranslations("storeEditor.responsive.override");
  const overrides = useStyleOverrides();
  return (keys) => {
    if (!overrides) return undefined;
    const { own, below } = overrides.state(keys);
    if (own) return t("own", { device: t(`devices.${overrides.device}`) });
    if (below.length) return t("below", { devices: below.map((d) => t(`devices.${d}`)).join(t("and")) });
    return undefined;
  };
}

/**
 * Next to a control's label: a coloured dot when the edited device sets the
 * value itself (click to drop it), or the icon of a smaller device that
 * keeps its own value, so an edit here will not reach it.
 */
export function OverrideMark({ keys }: { keys: readonly StyleKey[] }) {
  const t = useTranslations("storeEditor.responsive.override");
  const overrides = useStyleOverrides();
  const title = useOverrideTitles()(keys);
  if (!overrides || !title) return null;
  const { own, below } = overrides.state(keys);

  if (own) {
    return (
      <button
        type="button"
        title={`${title} ${t("resetHint")}`}
        aria-label={t("reset", { device: t(`devices.${overrides.device}`) })}
        onClick={() => overrides.reset(keys)}
        className="grid size-3.5 shrink-0 place-items-center rounded-full hover:ring-2 hover:ring-ring/40"
      >
        <span className={cn("size-2 rounded-full", DEVICE_TONE[overrides.device].dot)} aria-hidden />
      </button>
    );
  }
  const Icon = below[0] === "tablet" ? Tablet : Smartphone;
  return (
    <span title={title} className={cn("inline-flex shrink-0", DEVICE_TONE[below[0]!].text)}>
      <Icon className="size-3" aria-hidden />
      <span className="sr-only">{title}</span>
    </span>
  );
}
