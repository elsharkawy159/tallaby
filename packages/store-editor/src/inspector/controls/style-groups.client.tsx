"use client";

import { useTranslations } from "next-intl";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Italic, Underline } from "lucide-react";
import type { StyleKey, StyleValues } from "@workspace/store-sections/render";
import { ColorControl, ControlRow, LengthControl, NumberControl, Segmented, SpacingBox, ToggleButton } from "./style-controls.client";
import { useOverrideTitles } from "./style-override.client";

export type StylePatch = Partial<Record<StyleKey, unknown>>;
type GroupProps = { style: StyleValues; set: (patch: StylePatch) => void };

const PADDING_KEYS = ["paddingTop", "paddingEnd", "paddingBottom", "paddingStart"] as const satisfies readonly StyleKey[];

const SIZES = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const;
const WEIGHTS = [
  ["light", "L"],
  ["normal", "N"],
  ["medium", "M"],
  ["bold", "B"],
] as const;

/** Start/end icons follow the reading direction (logical alignment). */
function AlignStartIcon() {
  return (
    <>
      <AlignLeft className="size-3.5 rtl:hidden" aria-hidden />
      <AlignRight className="size-3.5 ltr:hidden" aria-hidden />
    </>
  );
}
function AlignEndIcon() {
  return (
    <>
      <AlignRight className="size-3.5 rtl:hidden" aria-hidden />
      <AlignLeft className="size-3.5 ltr:hidden" aria-hidden />
    </>
  );
}

export function TypographyControls({ style, set, compact = false }: GroupProps & { compact?: boolean }) {
  const t = useTranslations("storeEditor.style");
  return (
    <div className="space-y-2.5">
      <ControlRow label={t("size")} keys={["fontSize"]}>
        <Segmented
          label={t("size")}
          value={style.fontSize}
          onChange={(fontSize) => set({ fontSize })}
          options={(compact ? SIZES.slice(0, 6) : SIZES).map((v) => ({ value: v, label: v === "md" ? "M" : v.toUpperCase(), title: t(`sizes.${v}`) }))}
        />
      </ControlRow>
      <ControlRow label={t("weight")} keys={["fontWeight", "italic", "underline"]}>
        <div className="flex flex-wrap items-center gap-1">
          <Segmented
            label={t("weight")}
            value={style.fontWeight}
            onChange={(fontWeight) => set({ fontWeight })}
            options={WEIGHTS.map(([value, short]) => ({ value, label: short, title: t(`weights.${value}`) }))}
          />
          <ToggleButton label={t("italic")} pressed={style.italic === true} onChange={(on) => set({ italic: on || undefined })}>
            <Italic className="size-3.5" />
          </ToggleButton>
          <ToggleButton label={t("underline")} pressed={style.underline === true} onChange={(on) => set({ underline: on || undefined })}>
            <Underline className="size-3.5" />
          </ToggleButton>
        </div>
      </ControlRow>
      <ControlRow label={t("align")} keys={["textAlign"]}>
        <Segmented
          label={t("align")}
          value={style.textAlign}
          onChange={(textAlign) => set({ textAlign })}
          options={[
            { value: "start", label: <AlignStartIcon />, title: t("aligns.start") },
            { value: "center", label: <AlignCenter className="size-3.5" aria-hidden />, title: t("aligns.center") },
            { value: "end", label: <AlignEndIcon />, title: t("aligns.end") },
            { value: "justify", label: <AlignJustify className="size-3.5" aria-hidden />, title: t("aligns.justify") },
          ]}
        />
      </ControlRow>
      {!compact && (
        <ControlRow label={t("lineHeight")} keys={["lineHeight"]}>
          <Segmented
            label={t("lineHeight")}
            value={style.lineHeight}
            onChange={(lineHeight) => set({ lineHeight })}
            options={(["tight", "snug", "normal", "relaxed"] as const).map((v) => ({ value: v, label: t(`lineHeights.${v}`) }))}
          />
        </ControlRow>
      )}
      <ControlRow label={t("color")} className="items-start" keys={["color"]}>
        <ColorControl label={t("color")} value={style.color} onChange={(color) => set({ color })} tokenLabel={(token) => t(`tokens.${token}`)} />
      </ControlRow>
    </div>
  );
}

export function ContainerControls({ style, set, nodeType }: GroupProps & { nodeType?: string }) {
  const t = useTranslations("storeEditor.style");
  const flex = nodeType === "vFlex" || nodeType === "hFlex";
  return (
    <div className="space-y-2.5">
      {flex && (
        <ControlRow label={t("direction")} keys={["direction"]}>
          <Segmented
            label={t("direction")}
            value={style.direction}
            onChange={(direction) => set({ direction })}
            options={[
              { value: "column", label: t("directions.column") },
              { value: "row", label: t("directions.row") },
            ]}
          />
        </ControlRow>
      )}
      {nodeType === "grid" && (
        <ControlRow label={t("columns")} keys={["columns"]}>
          <Segmented
            label={t("columns")}
            value={style.columns === undefined ? undefined : String(style.columns)}
            onChange={(v) => set({ columns: v === undefined ? undefined : Number(v) })}
            options={["1", "2", "3", "4", "5", "6"].map((v) => ({ value: v, label: v }))}
          />
        </ControlRow>
      )}
      {(flex || nodeType === "grid" || nodeType === "videoPlaylist") && (
        <>
          <ControlRow label={t("gap")} keys={["gap"]}>
            <NumberControl label={t("gap")} value={style.gap} min={0} max={200} onChange={(gap) => set({ gap })} />
          </ControlRow>
          <ControlRow label={t("alignItems")} keys={["alignItems"]}>
            <Segmented
              label={t("alignItems")}
              value={style.alignItems}
              onChange={(alignItems) => set({ alignItems })}
              options={(["start", "center", "end", "stretch"] as const).map((v) => ({ value: v, label: t(`alignItemsOptions.${v}`) }))}
            />
          </ControlRow>
        </>
      )}
      {flex && (
        <ControlRow label={t("justify")} keys={["justifyContent"]}>
          <Segmented
            label={t("justify")}
            value={style.justifyContent}
            onChange={(justifyContent) => set({ justifyContent })}
            options={(["start", "center", "end", "between"] as const).map((v) => ({ value: v, label: t(`justifyOptions.${v}`) }))}
          />
        </ControlRow>
      )}
      <ControlRow label={t("padding")} keys={PADDING_KEYS}>
        <NumberControl
          label={t("padding")}
          placeholder={t("mixed")}
          value={
            style.paddingTop !== undefined && [style.paddingEnd, style.paddingBottom, style.paddingStart].every((v) => v === style.paddingTop)
              ? style.paddingTop
              : undefined
          }
          min={0}
          max={400}
          onChange={(v) => set({ paddingTop: v, paddingEnd: v, paddingBottom: v, paddingStart: v })}
        />
      </ControlRow>
      <ControlRow label={t("background")} className="items-start" keys={["background"]}>
        <ColorControl label={t("background")} value={style.background} onChange={(background) => set({ background })} tokenLabel={(token) => t(`tokens.${token}`)} />
      </ControlRow>
    </div>
  );
}

/** `fit` is off for a video (the player always fills its box). */
export function ImageControls({ style, set, fit = true }: GroupProps & { fit?: boolean }) {
  const t = useTranslations("storeEditor.style");
  return (
    <div className="space-y-2.5">
      <ControlRow label={t("ratio")} keys={["aspectRatio"]}>
        <Segmented
          label={t("ratio")}
          value={style.aspectRatio}
          onChange={(aspectRatio) => set({ aspectRatio })}
          options={(["square", "landscape", "wide", "banner", "portrait", "story"] as const).map((v) => ({ value: v, label: t(`ratios.${v}`) }))}
        />
      </ControlRow>
      {fit && (
        <ControlRow label={t("fit")} keys={["objectFit"]}>
          <Segmented
            label={t("fit")}
            value={style.objectFit}
            onChange={(objectFit) => set({ objectFit })}
            options={[
              { value: "cover", label: t("fits.cover") },
              { value: "contain", label: t("fits.contain") },
            ]}
          />
        </ControlRow>
      )}
      <ControlRow label={t("radius")} keys={["radius"]}>
        <NumberControl label={t("radius")} value={style.radius} min={0} max={999} onChange={(radius) => set({ radius })} />
      </ControlRow>
    </div>
  );
}

export function BoxControls({ style, set }: GroupProps) {
  const t = useTranslations("storeEditor.style");
  return (
    <div className="space-y-2.5">
      <ControlRow label={t("background")} className="items-start" keys={["background"]}>
        <ColorControl label={t("background")} value={style.background} onChange={(background) => set({ background })} tokenLabel={(token) => t(`tokens.${token}`)} />
      </ControlRow>
      <ControlRow label={t("border")} keys={["borderWidth"]}>
        <NumberControl label={t("border")} value={style.borderWidth} min={0} max={20} onChange={(borderWidth) => set({ borderWidth })} />
      </ControlRow>
      {style.borderWidth !== undefined && style.borderWidth > 0 && (
        <ControlRow label={t("borderColor")} className="items-start" keys={["borderColor"]}>
          <ColorControl label={t("borderColor")} value={style.borderColor} onChange={(borderColor) => set({ borderColor })} tokenLabel={(token) => t(`tokens.${token}`)} />
        </ControlRow>
      )}
      <ControlRow label={t("radius")} keys={["radius"]}>
        <NumberControl label={t("radius")} value={style.radius} min={0} max={999} onChange={(radius) => set({ radius })} />
      </ControlRow>
      <ControlRow label={t("shadow")} keys={["shadow"]}>
        <Segmented
          label={t("shadow")}
          value={style.shadow}
          onChange={(shadow) => set({ shadow })}
          options={(["none", "sm", "md", "lg"] as const).map((v) => ({ value: v, label: t(`shadows.${v}`) }))}
        />
      </ControlRow>
      <ControlRow label={t("opacity")} keys={["opacity"]}>
        <NumberControl label={t("opacity")} value={style.opacity} min={0} max={100} unit="%" onChange={(opacity) => set({ opacity })} />
      </ControlRow>
    </div>
  );
}

export function SizeControls({ style, set }: GroupProps) {
  const t = useTranslations("storeEditor.style");
  return (
    <div className="space-y-2.5">
      <ControlRow label={t("width")} keys={["width"]}>
        <LengthControl label={t("width")} value={style.width} onChange={(width) => set({ width })} />
      </ControlRow>
      <ControlRow label={t("maxWidth")} keys={["maxWidth"]}>
        <LengthControl label={t("maxWidth")} value={style.maxWidth} onChange={(maxWidth) => set({ maxWidth })} />
      </ControlRow>
      <ControlRow label={t("minHeight")} keys={["minHeight"]}>
        <NumberControl label={t("minHeight")} value={style.minHeight} min={0} max={2000} onChange={(minHeight) => set({ minHeight })} />
      </ControlRow>
    </div>
  );
}

export function SpacingControls({ style, set }: GroupProps) {
  const t = useTranslations("storeEditor.style");
  const overrideTitle = useOverrideTitles();
  return (
    <SpacingBox
      values={style}
      onChange={(key, value) => set({ [key]: value })}
      labels={{
        margin: t("margin"),
        padding: t("padding"),
        side: (side) => t(`sides.${side.toLowerCase() as "top"}`),
        override: (key) => overrideTitle([key]),
      }}
    />
  );
}
