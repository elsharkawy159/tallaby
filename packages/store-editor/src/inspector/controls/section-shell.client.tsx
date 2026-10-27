"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { SHELL_PADDINGS, SHELL_SCHEMES, SHELL_WIDTHS, ANCHOR_RE, shellAnimates, type SectionShellStyle } from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { MediaPicker } from "../../media/media-picker.client";
import { ControlRow, NumberControl, Segmented } from "./style-controls.client";

const SCHEME_SWATCH: Record<(typeof SHELL_SCHEMES)[number], string> = {
  default: "var(--sf-paper)",
  muted: "var(--sf-shelf)",
  primary: "var(--sf-brand)",
  dark: "var(--sf-ink)",
};

/**
 * The shared section frame (P4B-05, `instance.style.shell`): colour scheme
 * from the store theme, vertical spacing, width, a background image with an
 * overlay, an in-page anchor and an entrance. One frame for every device.
 */
export function SectionShellControls({
  value,
  onChange,
  readOnly,
  defaultWidth = "contained",
}: {
  value: SectionShellStyle;
  onChange: (patch: Partial<SectionShellStyle>) => void;
  readOnly: boolean;
  /** The width with nothing chosen: full for a section with a carousel, else contained. */
  defaultWidth?: (typeof SHELL_WIDTHS)[number];
}) {
  const t = useTranslations("storeEditor.style.shell");
  const anchor = value.anchor ?? "";
  return (
    <div className="space-y-3">
      <ControlRow label={t("scheme")}>
        <div role="radiogroup" aria-label={t("scheme")} className="flex flex-wrap gap-1.5">
          {SHELL_SCHEMES.map((scheme) => {
            const active = (value.scheme ?? "default") === scheme;
            return (
              <button
                key={scheme}
                type="button"
                role="radio"
                aria-checked={active}
                title={t(`schemes.${scheme}`)}
                onClick={() => onChange({ scheme: scheme === "default" ? undefined : scheme })}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-foreground text-foreground" : "text-muted-foreground hover:border-foreground/40",
                )}
              >
                <span aria-hidden className="size-3.5 rounded-sm border" style={{ background: SCHEME_SWATCH[scheme] }} />
                {t(`schemes.${scheme}`)}
              </button>
            );
          })}
        </div>
      </ControlRow>
      <ControlRow label={t("spacing")}>
        <Segmented
          label={t("spacing")}
          value={value.paddingY}
          onChange={(paddingY) => onChange({ paddingY })}
          options={SHELL_PADDINGS.map((p) => ({ value: p, label: t(`paddings.${p}`), title: t(`paddings.${p}`) }))}
        />
      </ControlRow>
      <ControlRow label={t("width")}>
        <Segmented
          label={t("width")}
          value={value.width ?? defaultWidth}
          onChange={(width) => onChange({ width: width === defaultWidth ? undefined : width })}
          options={SHELL_WIDTHS.map((w) => ({ value: w, label: t(`widths.${w}`), title: t(`widths.${w}`) }))}
        />
      </ControlRow>

      <div className="space-y-2 rounded-md border p-2.5">
        <p className="text-xs font-medium">{t("background")}</p>
        {value.bgImage ? (
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" dir="ltr">
              {value.bgImage}
            </span>
            <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => onChange({ bgImage: undefined, overlay: undefined })} aria-label={t("removeImage")}>
              <X className="size-3.5" aria-hidden />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("noImage")}</p>
        )}
        <MediaPicker readOnly={readOnly} onPick={(asset) => onChange({ bgImage: asset.url })} />
        {value.bgImage && (
          <ControlRow label={t("overlay")}>
            <NumberControl value={value.overlay ?? 40} onChange={(overlay) => onChange({ overlay })} min={0} max={80} unit="%" label={t("overlay")} />
          </ControlRow>
        )}
        <p className="text-xs text-muted-foreground">{t("backgroundHint")}</p>
      </div>

      {/* Motion is on by default (docs/section-rules.md §6.6); off stores "none". */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="shell-animate" className="text-xs font-medium">
            {t("animate")}
          </Label>
          <Switch
            id="shell-animate"
            checked={shellAnimates(value)}
            disabled={readOnly}
            onCheckedChange={(on) => onChange({ animation: on ? undefined : "none" })}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("animateHint")}</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="shell-anchor" className="text-xs font-medium">
          {t("anchor")}
        </label>
        <Input
          id="shell-anchor"
          dir="ltr"
          placeholder="about"
          defaultValue={anchor}
          key={anchor}
          maxLength={40}
          onBlur={(e) => {
            const next = e.target.value.trim().toLowerCase();
            onChange({ anchor: next && ANCHOR_RE.test(next) ? next : undefined });
          }}
        />
        <p className="text-xs text-muted-foreground">{anchor ? t("anchorLink", { anchor }) : t("anchorHint")}</p>
      </div>
    </div>
  );
}
