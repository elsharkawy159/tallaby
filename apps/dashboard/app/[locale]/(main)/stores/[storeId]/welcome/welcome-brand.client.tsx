"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import type { DesignSystem } from "@workspace/store-sections";
import { Link, useRouter } from "@/i18n/navigation";
import { Field, Note, OptionCard, OptionCards } from "@/components/seller-ui";
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

/** Quiet time before a change saves, so dragging the colour picker saves once. */
const AUTOSAVE_MS = 600;

type Values = { logoUrl: string; faviconUrl: string; locale: WelcomeData["brand"]["defaultLocale"]; ds: DesignSystem | null };
type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Step 1c: logo, favicon, main colour and the website's default language.
 * Logo, favicon and language are store fields (`saveStoreGeneral`, live at
 * once). The colour is the design-system DRAFT (`saveDesignSystem`, live on
 * the next Publish, like Website › Design): putting only the colour live
 * would need a new publish path, so that waits for the owner. The colour is
 * locked until a theme is applied, since a theme brings its own colours.
 *
 * Saves on its own (owner, 2026-11-16: no Save button): each change saves after
 * a short pause, one save at a time; a change made during a save follows it.
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
  const tAutosave = useTranslations("settings.autosave");
  const tErrors = useTranslations("errorPages");
  const router = useRouter();

  const [logoUrl, setLogoUrl] = useState(brand.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(brand.faviconUrl);
  const [locale, setLocale] = useState(brand.defaultLocale);
  const [ds, setDs] = useState<DesignSystem | null>(brand.designSystem?.value ?? null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  /** What the server holds now. */
  const saved = useRef({
    logoUrl: brand.logoUrl,
    faviconUrl: brand.faviconUrl,
    locale: brand.defaultLocale,
    colors: JSON.stringify(brand.designSystem?.value.colors ?? {}),
  });
  const version = useRef(brand.designSystem?.version ?? 0);
  /** The newest values waiting to save, the running flag, and "save again after this one". */
  const pending = useRef<Values | null>(null);
  const running = useRef(false);
  const again = useRef(false);

  const primary = ds?.colors.primary ?? "";
  const colorInvalid = Boolean(primary) && !isHexColor(primary);
  const colorLocked = disabled || !themeApplied;
  const preset = ds ? matchPreset(ds.colors) : null;

  const flush = useCallback(async function flushNow(): Promise<void> {
    if (running.current) {
      again.current = true;
      return;
    }
    const next = pending.current;
    if (!next) return;
    running.current = true;
    setStatus("saving");
    let ok = true;
    let wrote = false;
    let localeChanged = false;
    try {
      const was = saved.current;
      localeChanged = next.locale !== was.locale;
      if (next.logoUrl !== was.logoUrl || next.faviconUrl !== was.faviconUrl || localeChanged) {
        const result = await saveStoreGeneral(storeId, {
          logoUrl: next.logoUrl || null,
          faviconUrl: next.faviconUrl || null,
          ...(localeChanged && { defaultLocale: next.locale, supportedLocales: withDefaultLocale(brand.supportedLocales, next.locale) }),
        });
        if (result.success) {
          saved.current = { ...saved.current, logoUrl: next.logoUrl, faviconUrl: next.faviconUrl, locale: next.locale };
          wrote = true;
        } else {
          ok = false;
          toast.error(tSettings(`errors.${result.error}`));
        }
      }
      const colors = next.ds ? JSON.stringify(next.ds.colors) : null;
      const nextPrimary = next.ds?.colors.primary ?? "";
      if (ok && next.ds && colors !== null && colors !== saved.current.colors && (!nextPrimary || isHexColor(nextPrimary))) {
        const result = await saveDesignSystem(storeId, next.ds, version.current);
        if (result.success) {
          version.current = result.data.version;
          saved.current = { ...saved.current, colors };
          wrote = true;
        } else {
          ok = false;
          toast.error(tDesign(`errors.${result.error}` as never));
        }
      }
    } catch (error) {
      console.error("Welcome brand autosave failed", error);
      ok = false;
    } finally {
      running.current = false;
    }
    setStatus(ok ? "saved" : "error");
    // A new default language moves the website drafts to it: say what to do next (Store settings' message).
    if (ok && localeChanged) toast.success(tSettings("savedLocaleChanged"), { duration: 12_000 });
    if (wrote) {
      router.refresh();
      requestSetupPromptCheck();
    }
    if (again.current) {
      again.current = false;
      await flushNow();
    }
  }, [storeId, brand.supportedLocales, router, tSettings, tDesign]);

  // Each change saves after a short pause; nothing saves while the step is locked.
  useEffect(() => {
    if (disabled) return;
    const was = saved.current;
    const colorsChanged = ds !== null && JSON.stringify(ds.colors) !== was.colors;
    if (logoUrl === was.logoUrl && faviconUrl === was.faviconUrl && locale === was.locale && !colorsChanged) return;
    pending.current = { logoUrl, faviconUrl, locale, ds };
    const timer = setTimeout(() => void flush(), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [logoUrl, faviconUrl, locale, ds, disabled, flush]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-(--s-line) bg-(--s-surface) p-3.5">
        <LogoField value={logoUrl} onChange={setLogoUrl} name={storeName} disabled={disabled} />
      </div>
      <FaviconField value={faviconUrl} onChange={setFaviconUrl} disabled={disabled} />

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
              disabled={disabled}
              onChange={() => setLocale(option)}
            />
          ))}
        </OptionCards>
      </Field>

      {status !== "idle" && (
        <p className="flex min-h-6 items-center gap-1.5 text-[12.5px] text-(--s-muted)" aria-live="polite">
          {status === "saving" ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : status === "saved" ? (
            <Check className="size-3.5 text-success" strokeWidth={3} aria-hidden />
          ) : (
            <CircleAlert className="size-3.5 text-destructive" aria-hidden />
          )}
          <span className={cn(status === "error" && "text-destructive")}>{tAutosave(status)}</span>
          {status === "error" && (
            <button type="button" onClick={() => void flush()} className="cursor-pointer font-bold text-(--s-link) underline-offset-4 hover:underline">
              {tErrors("retry")}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
