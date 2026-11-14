"use client";

import { useTranslations } from "next-intl";
import type { SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  LOGO_HEIGHT_RANGE,
  chromeOptionOn,
  logoHeightOf,
  readLogoHeights,
  setChromeOption,
  setLogoHeight,
  type ChromeOption,
  type ChromePart,
  type LogoDevice,
} from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { Slider } from "@workspace/ui/components/slider";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { useEditorLinks } from "../adapter.client";
import type { ChromeFocus, EditorPage } from "../state/editor.store";
import { BottomNavEditor, MobileMenuEditor } from "./phone-chrome.client";

/**
 * Header and footer options in Content (owner, 2026-10-24): the store logo,
 * the store name beside it, the language switcher (translated stores), the
 * light/dark toggle and sign-in, plus the header's phone bottom navigation. Stored on the header/footer instance and
 * drawn by `drawChrome` wherever the site renders.
 */
export function ChromeOptions({
  instance,
  part,
  onChange,
  storeId,
  readOnly,
  translated,
  hasLogo,
  pages = [],
  locale = "ar",
  focus = null,
}: {
  instance: SectionInstance;
  part: ChromePart;
  onChange: (update: (instance: SectionInstance) => SectionInstance, coalesceKey?: string) => void;
  storeId: string;
  readOnly: boolean;
  /** The store has more than one language. */
  translated: boolean;
  /** The store uploaded a logo (Website › Design). */
  hasLogo: boolean;
  /** The site's pages (the phone menu and bottom bar can link them). */
  pages?: readonly EditorPage[];
  /** The language being edited (names in the phone menu). */
  locale?: SiteLocale;
  /** A phone card the seller opened from the canvas. */
  focus?: ChromeFocus | null;
}) {
  const t = useTranslations("storeEditor.sidebar.chrome");
  const designHref = useEditorLinks(storeId).design;
  const on = (option: ChromeOption) => chromeOptionOn(instance, part, option);
  const options: { option: ChromeOption; hint: string; disabled?: boolean }[] = [
    { option: "logo", hint: hasLogo ? t("hints.logo") : t("hints.noLogo") },
    { option: "storeName", hint: t("hints.storeName"), disabled: !hasLogo || !on("logo") },
    ...(translated ? [{ option: "languageSwitcher" as const, hint: t("hints.languageSwitcher") }] : []),
    { option: "themeToggle", hint: t("hints.themeToggle") },
    { option: "account", hint: t("hints.account") },
    // Phones only, drawn after the footer; on by default (render/bottom-nav.tsx).
    ...(part === "header" ? [{ option: "bottomNav" as const, hint: t("hints.bottomNav") }] : []),
  ];

  return (
    <>
    <fieldset disabled={readOnly} className="mb-4 space-y-3 rounded-md border p-3">
      <legend className="px-1 text-xs font-medium text-muted-foreground">{t(part === "header" ? "header" : "footer")}</legend>
      {options.map(({ option, hint, disabled }) => {
        const id = `chrome-${part}-${option}`;
        return (
          <div key={option} className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor={id} className={disabled ? "text-muted-foreground" : undefined}>
                {t(`options.${option}`)}
              </Label>
              <Switch
                id={id}
                checked={on(option)}
                disabled={disabled}
                onCheckedChange={(checked) => onChange((current) => setChromeOption(current, part, option, checked))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {hint}
              {option === "logo" && designHref && (
                <>
                  {" "}
                  {/* A new tab: the editor and its unsaved work stay open; the logo shows here when the seller comes back. */}
                  <a href={designHref} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {t("openDesign")}
                  </a>
                </>
              )}
            </p>
            {option === "logo" && hasLogo && on("logo") && <LogoSize instance={instance} part={part} onChange={onChange} />}
          </div>
        );
      })}
    </fieldset>
    {part === "header" && (
      // The phone menu sheet and bottom bar (F-74); a click on either on the canvas opens its card.
      <fieldset disabled={readOnly} className="contents">
        <MobileMenuEditor instance={instance} onChange={onChange} pages={pages} locale={locale} focused={focus === "mobileMenu"} />
        <BottomNavEditor instance={instance} onChange={onChange} pages={pages} locale={locale} focused={focus === "bottomNav"} enabled={on("bottomNav")} />
      </fieldset>
    )}
    </>
  );
}

/**
 * The logo's height on computers and tablets, and on phones (seller feedback
 * 2026-11-14; config/logo-size.ts). Stored on the header or footer; the
 * canvas's resize handles write the same values.
 */
function LogoSize({
  instance,
  part,
  onChange,
}: {
  instance: SectionInstance;
  part: ChromePart;
  onChange: (update: (instance: SectionInstance) => SectionInstance, coalesceKey?: string) => void;
}) {
  const t = useTranslations("storeEditor.sidebar.chrome.logoSize");
  const own = readLogoHeights(instance);
  const set = (device: LogoDevice, value: number | null) => onChange((current) => setLogoHeight(current, part, device, value), `logo-size:${part}:${device}`);
  return (
    <div className="mt-2 space-y-3 rounded-md bg-muted/50 p-2.5">
      <p className="text-xs font-medium">{t("title")}</p>
      {(["desktop", "mobile"] as const).map((device) => {
        const value = logoHeightOf(instance, part, device);
        const range = LOGO_HEIGHT_RANGE[device];
        return (
          <div key={device} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {t(device)}
              </span>
              <span className="tabular-nums">{t("value", { value })}</span>
            </div>
            <Slider
              aria-label={`${t("title")}: ${t(device)}`}
              min={range.min}
              max={range.max}
              step={2}
              value={[value]}
              onValueChange={([next]) => {
                if (next !== undefined) set(device, next);
              }}
            />
          </div>
        );
      })}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">{t("hint")}</p>
        {(own.desktop !== undefined || own.mobile !== undefined) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 shrink-0 px-2 text-[11px]"
            onClick={() => onChange((current) => setLogoHeight(setLogoHeight(current, part, "desktop", null), part, "mobile", null))}
          >
            {t("reset")}
          </Button>
        )}
      </div>
    </div>
  );
}
