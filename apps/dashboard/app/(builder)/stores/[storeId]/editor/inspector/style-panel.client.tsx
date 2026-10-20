"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Eye, EyeOff, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { SectionInstance } from "@workspace/store-sections";
import type { SectionShellStyle } from "@workspace/store-sections/render";
import { SectionShellControls } from "./controls/section-shell.client";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import {
  BoxControls,
  ContainerControls,
  ImageControls,
  SizeControls,
  SpacingControls,
  TypographyControls,
  type StylePatch,
} from "./controls/style-groups.client";
import { StyleOverrideProvider, type StyleOverrides } from "./controls/style-override.client";
import { DEVICE_TONE } from "../lib/editor-devices.lib";
import {
  hasDeviceOverrides,
  hasOwnStyle,
  overrideState,
  readEffectiveStyle,
  readOwnStyle,
  type StyleKind,
  type StyleTarget,
} from "../lib/editor-style.lib";
import type { Device } from "../state/editor.store";

const DEVICE_ICON = { desktop: Monitor, tablet: Tablet, mobile: Smartphone } as const;

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b py-3 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
        {title}
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

/**
 * Style tab (P4B-09): every whitelisted style for the selection, written to
 * the device being edited. Desktop is the base; tablet and phone override it.
 */
export function StylePanel({
  instance,
  target,
  kind,
  nodeType,
  device,
  onPatch,
  onReset,
  onResetDevice,
  shell,
}: {
  instance: SectionInstance;
  target: StyleTarget;
  kind: StyleKind;
  nodeType?: string;
  device: Device;
  onPatch: (patch: StylePatch) => void;
  onReset: () => void;
  /** Drops this tablet/phone's overrides in the whole section (its parts and elements too). */
  onResetDevice?: () => void;
  /** The shared section frame (page sections only; one value for every device). */
  shell?: { value: SectionShellStyle; onChange: (patch: Partial<SectionShellStyle>) => void; storeId: string; readOnly: boolean };
}) {
  const t = useTranslations("storeEditor.style");
  const style = readEffectiveStyle(instance, target, device);
  const hidden = readOwnStyle(instance, target, device).hidden === true;
  const DeviceIcon = DEVICE_ICON[device];
  const textual = kind === "text" || kind === "button";
  const overrides: StyleOverrides = {
    device,
    state: (keys) => overrideState(instance, target, device, keys),
    reset: (keys) => onPatch(Object.fromEntries(keys.map((key) => [key, undefined]))),
  };
  const sectionReset = kind === "section" && onResetDevice && hasDeviceOverrides(instance, device);

  return (
    <StyleOverrideProvider value={overrides}>
      <div className={cn("mb-1 rounded-md px-2.5 py-2 text-xs", DEVICE_TONE[device].strip)}>
        <div className="flex items-center gap-2">
          <DeviceIcon className="size-4 shrink-0 opacity-70" aria-hidden />
          <span className="flex-1">{t(`editing.${device}`)}</span>
          {hasOwnStyle(instance, target, device) && (
            <Button type="button" variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={onReset}>
              <RotateCcw className="size-3" aria-hidden />
              {t(device === "desktop" ? "resetAll" : "resetDevice")}
            </Button>
          )}
        </div>
        {sectionReset && (
          <Button type="button" variant="link" size="sm" className="mt-1 h-auto p-0 text-xs text-inherit" onClick={onResetDevice}>
            {t("resetSectionDevice", { device: t(`devices.${device}`) })}
          </Button>
        )}
      </div>

      {shell && (
        <Group title={t("groups.section")}>
          <SectionShellControls value={shell.value} onChange={shell.onChange} storeId={shell.storeId} readOnly={shell.readOnly} />
          {device !== "desktop" && <p className="mt-2 text-xs text-muted-foreground">{t("shell.allDevices")}</p>}
        </Group>
      )}
      {textual && (
        <Group title={t("groups.typography")}>
          <TypographyControls style={style} set={onPatch} />
        </Group>
      )}
      {kind === "icon" && (
        <Group title={t("groups.typography")}>
          <TypographyControls style={style} set={onPatch} compact />
        </Group>
      )}
      {kind === "container" && (
        <Group title={t("groups.layout")}>
          <ContainerControls style={style} set={onPatch} nodeType={nodeType} />
        </Group>
      )}
      {kind === "image" && (
        <Group title={t("groups.image")}>
          <ImageControls style={style} set={onPatch} fit={nodeType !== "video"} />
        </Group>
      )}
      <Group title={t("groups.spacing")} defaultOpen={kind === "section" || kind === "container"}>
        <SpacingControls style={style} set={onPatch} />
      </Group>
      {kind !== "section" && (
        <Group title={t("groups.size")} defaultOpen={false}>
          <SizeControls style={style} set={onPatch} />
        </Group>
      )}
      <Group title={t("groups.box")} defaultOpen={kind === "section"}>
        <BoxControls style={style} set={onPatch} />
      </Group>
      <Group title={t("groups.visibility")}>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            {hidden ? <EyeOff className="size-4 text-muted-foreground" aria-hidden /> : <Eye className="size-4 text-muted-foreground" aria-hidden />}
            {t("hideOn", { device: t(`devices.${device}`) })}
          </span>
          <Switch checked={hidden} onCheckedChange={(checked) => onPatch({ hidden: checked || undefined })} />
        </label>
        <p className="mt-1.5 text-xs text-muted-foreground">{t("hideHint")}</p>
      </Group>
    </StyleOverrideProvider>
  );
}
