"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, LoaderCircle, Save } from "lucide-react";
import type { DesignSystem } from "@workspace/store-sections";
import { Link, useRouter } from "@/i18n/navigation";
import { Field, Note, OptionCard, OptionCards, SellerButton } from "@/components/seller-ui";
import { FaviconField, LogoField } from "@/components/stores/brand-image-fields.client";
import { cn } from "@/lib/utils";
import { saveDesignSystem } from "@/app/[locale]/(builder)/stores/[storeId]/editor/server/editor.server";
import { requestSetupPromptCheck } from "../../../_components/setup-prompts.lib";
import { saveStoreGeneral } from "../settings/store-settings.server";
import { PALETTE_PRESETS, applyPreset, isHexColor, matchPreset, setToken } from "../website/design/design.lib";
import { withDefaultLocale } from "./welcome.lib";
import type { WelcomeData } from "./welcome.types";

/** Tallaby Classic's main colour (the "classic" palette sets none). */
const CLASSIC_PRIMARY = "#145163";

/** `<input type="color">` only takes #rrggbb. */
const fullHex = (value: string) => (value.length === 4 ? `#${[...value.slice(1)].map((c) => c + c).join("")}` : value);

/**
 * Step 1c: logo, favicon, main colour and the website's default language.
 * Logo, favicon and language are store fields (`saveStoreGeneral`, live at
 * once). The colour is the design-system DRAFT (`saveDesignSystem`, live on
 * the next Publish, like Website › Design): putting only the colour live
 * would need a new publish path, so that waits for the owner. The colour is
 * locked until a theme is applied, since a theme brings its own colours.
 */
export function WelcomeBrandStep({
  storeId,
  storeName,
  brand,
  themeApplied,
  disabled,
}: {
  storeId: string;
  storeName: string;
  brand: WelcomeData["brand"];
  themeApplied: boolean;
  disabled: boolean;
}) {
  const t = useTranslations("storeWelcome.steps.brand");
  const tSettings = useTranslations("storeSettings");
  const tDesign = useTranslations("websiteDesign");
  const router = useRouter();
  const [saving, startSaving] = useTransition();

  const [logoUrl, setLogoUrl] = useState(brand.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(brand.faviconUrl);
  const [locale, setLocale] = useState(brand.defaultLocale);
  const [saved, setSaved] = useState({ logoUrl: brand.logoUrl, faviconUrl: brand.faviconUrl, locale: brand.defaultLocale });
  const [ds, setDs] = useState<DesignSystem | null>(brand.designSystem?.value ?? null);
  const [savedColors, setSavedColors] = useState(JSON.stringify(brand.designSystem?.value.colors ?? {}));
  const [version, setVersion] = useState(brand.designSystem?.version ?? 0);

  const generalDirty = logoUrl !== saved.logoUrl || faviconUrl !== saved.faviconUrl || locale !== saved.locale;
  const colorDirty = ds !== null && JSON.stringify(ds.colors) !== savedColors;
  const primary = ds?.colors.primary ?? "";
  const colorInvalid = Boolean(primary) && !isHexColor(primary);
  const colorLocked = disabled || saving || !themeApplied;
  const preset = ds ? matchPreset(ds.colors) : null;

  const onSave = () =>
    startSaving(async () => {
      const localeChanged = locale !== saved.locale;
      if (generalDirty) {
        const result = await saveStoreGeneral(storeId, {
          logoUrl: logoUrl || null,
          faviconUrl: faviconUrl || null,
          ...(localeChanged && { defaultLocale: locale, supportedLocales: withDefaultLocale(brand.supportedLocales, locale) }),
        });
        if (!result.success) {
          toast.error(tSettings(`errors.${result.error}`));
          return;
        }
        setSaved({ logoUrl, faviconUrl, locale });
      }
      if (colorDirty && ds) {
        const result = await saveDesignSystem(storeId, ds, version);
        if (!result.success) {
          toast.error(tDesign(`errors.${result.error}` as never));
          return;
        }
        setVersion(result.data.version);
        setSavedColors(JSON.stringify(ds.colors));
      }
      // A new default language moves the website drafts to it: say what to do next (Store settings' message).
      if (localeChanged) toast.success(tSettings("savedLocaleChanged"), { duration: 12_000 });
      else toast.success(t("saved"));
      router.refresh();
      requestSetupPromptCheck();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-(--s-line) bg-(--s-surface) p-3.5">
        <LogoField value={logoUrl} onChange={setLogoUrl} name={storeName} disabled={disabled || saving} />
      </div>
      <FaviconField value={faviconUrl} onChange={setFaviconUrl} disabled={disabled || saving} />

      {ds && (
        <Field label={t("color")} note={t("colorHint")}>
          <div className="flex flex-wrap items-center gap-2.5" role="radiogroup" aria-label={t("color")}>
            {PALETTE_PRESETS.map((p) => {
              const swatch = p.colors.primary ?? CLASSIC_PRIMARY;
              const on = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={tDesign(`colors.preset.${p.id}` as never)}
                  title={tDesign(`colors.preset.${p.id}` as never)}
                  disabled={colorLocked}
                  onClick={() => setDs((prev) => prev && { ...prev, colors: applyPreset(prev.colors, p.id) })}
                  className={cn(
                    "grid size-10 cursor-pointer place-items-center rounded-full border-2 border-(--s-surface) shadow-[0_0_0_1.5px_var(--s-field)] transition-shadow disabled:cursor-not-allowed disabled:opacity-45",
                    on && "shadow-[0_0_0_2.5px_var(--s-primary)]",
                  )}
                  style={{ background: swatch }}
                >
                  {on && <Check className="size-4 text-white" strokeWidth={3} aria-hidden />}
                </button>
              );
            })}
            <label
              className={cn(
                "relative grid size-10 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-(--s-surface) shadow-[0_0_0_1.5px_var(--s-field)] has-disabled:cursor-not-allowed has-disabled:opacity-45",
                preset === null && "shadow-[0_0_0_2.5px_var(--s-primary)]",
              )}
              style={{ background: "conic-gradient(#e11d48, #f59e0b, #16a34a, #0891b2, #4f46e5, #c026d3, #e11d48)" }}
              title={t("colorCustom")}
            >
              <input
                type="color"
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                value={fullHex(primary && !colorInvalid ? primary : CLASSIC_PRIMARY)}
                disabled={colorLocked}
                aria-label={t("colorCustom")}
                onChange={(e) => setDs((prev) => prev && setToken(prev, "colors", "primary", e.target.value))}
              />
            </label>
          </div>
          {themeApplied ? (
            <Note>
              {t.rich("colorDraft", {
                link: (chunks) => <Link href={`/stores/${storeId}/website/design#colors`}>{chunks}</Link>,
              })}
            </Note>
          ) : (
            <Note tone="amber">{t("colorLocked")}</Note>
          )}
        </Field>
      )}

      <Field label={t("language")} note={t("languageHint")}>
        <OptionCards className="grid-cols-2">
          {(["ar", "en"] as const).map((option) => (
            <OptionCard
              key={option}
              name="welcome-default-locale"
              title={tSettings(`locales.${option}`)}
              checked={locale === option}
              disabled={disabled || saving}
              onChange={() => setLocale(option)}
            />
          ))}
        </OptionCards>
      </Field>

      <div className="flex justify-end max-[600px]:[&>*]:flex-1">
        <SellerButton variant="solid" disabled={disabled || saving || colorInvalid || (!generalDirty && !colorDirty)} onClick={onSave}>
          {saving ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {t("save")}
        </SellerButton>
      </div>
    </div>
  );
}
