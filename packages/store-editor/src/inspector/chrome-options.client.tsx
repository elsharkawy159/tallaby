"use client";

import { useTranslations } from "next-intl";
import type { SectionInstance } from "@workspace/store-sections";
import { chromeOptionOn, setChromeOption, type ChromeOption, type ChromePart } from "@workspace/store-sections/render";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { useEditorLinks } from "../adapter.client";

/**
 * Header and footer options in Content (owner, 2026-10-24): the store logo,
 * the store name beside it, the language switcher (translated stores), the
 * light/dark toggle and sign-in. Stored on the header/footer instance and
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
}: {
  instance: SectionInstance;
  part: ChromePart;
  onChange: (update: (instance: SectionInstance) => SectionInstance) => void;
  storeId: string;
  readOnly: boolean;
  /** The store has more than one language. */
  translated: boolean;
  /** The store uploaded a logo (Website › Design). */
  hasLogo: boolean;
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
  ];

  return (
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
                  <a href={designHref} className="font-medium text-primary hover:underline">
                    {t("openDesign")}
                  </a>
                </>
              )}
            </p>
          </div>
        );
      })}
    </fieldset>
  );
}
