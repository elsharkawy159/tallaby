"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EyeOff, X } from "lucide-react";
import { SocialIcon } from "@workspace/store-sections/social-icon";
import { SOCIAL_PLATFORMS, getSocialPlatform, normalizeSocialLink, type SocialPlatformKey } from "@workspace/store-sections/social";
import { Link } from "@/i18n/navigation";
import { IconButton, TextInput } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { saveStoreSocial } from "../website/social/social.server";
import { toSocialPayload, type SocialRow } from "../website/social/social.dto";

/**
 * Settings › General › Contact: the store's social links (owner, 2026-11-27).
 * The same `contact.social` list as Website › Social media, saved through the
 * same action: a platform is on when it has a link. Order and the "show"
 * switch stay as saved there; a newly added platform goes last and is shown.
 */

type Row = SocialRow & { active: boolean };

const toRows = (rows: SocialRow[]): Row[] => rows.map((row) => ({ ...row, active: Boolean(row.value.trim()) }));
/** Only active rows are saved; an icon switched off drops its link. */
const payload = (rows: Row[]) => toSocialPayload(rows.filter((row) => row.active));

export function useStoreSocialLinks(storeId: string, initial: SocialRow[]) {
  const t = useTranslations("websiteSocial");
  const [rows, setRows] = useState(() => toRows(initial));
  const [baseline, setBaseline] = useState(rows);
  const dirty = JSON.stringify(payload(rows)) !== JSON.stringify(payload(baseline));
  const invalid = rows.some((row) => row.active && row.value.trim() && !normalizeSocialLink(row.platform, row.value));

  return {
    rows,
    setRows,
    dirty,
    /** Error text when a link is not valid, else null. */
    validate: () => (invalid ? t("errors.invalidInput") : null),
    /** Saves when changed; returns an error message or null. */
    save: async () => {
      if (!dirty) return null;
      const result = await saveStoreSocial(storeId, payload(rows));
      if (!result.success) return t(`errors.${result.error}`);
      setBaseline(rows);
      return null;
    },
    reset: () => setRows(baseline),
  };
}

export function StoreSocialLinksField({
  storeId,
  social,
  disabled,
}: {
  storeId: string;
  social: ReturnType<typeof useStoreSocialLinks>;
  disabled: boolean;
}) {
  const t = useTranslations("storeSettings.contact");
  const ts = useTranslations("websiteSocial");
  const locale = useLocale() === "en" ? "en" : "ar";
  const inputs = useRef(new Map<SocialPlatformKey, HTMLInputElement>());
  const { rows, setRows } = social;

  const byPlatform = useMemo(() => new Map(rows.map((row) => [row.platform, row])), [rows]);
  const active = rows.filter((row) => row.active);

  const update = (platform: SocialPlatformKey, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.platform === platform ? { ...row, ...patch } : row)));

  const activate = (platform: SocialPlatformKey) => {
    const row = byPlatform.get(platform);
    if (row?.active) {
      inputs.current.get(platform)?.focus();
      return;
    }
    // A new link goes after the ones already on, shown on the store.
    setRows((prev) => {
      const current = prev.find((r) => r.platform === platform)!;
      const rest = prev.filter((r) => r.platform !== platform);
      const lastActive = rest.reduce((at, r, i) => (r.active ? i : at), -1);
      const next = [...rest];
      next.splice(lastActive + 1, 0, { ...current, active: true, enabled: current.value.trim() ? current.enabled : true });
      return next;
    });
    requestAnimationFrame(() => inputs.current.get(platform)?.focus());
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold text-(--s-text)">{t("social")}</span>
        <p className="text-pretty text-xs text-(--s-faint)">{t("socialHint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SOCIAL_PLATFORMS.map((platform) => {
          const on = Boolean(byPlatform.get(platform.key)?.active);
          return (
            <button
              key={platform.key}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              aria-label={platform.label[locale]}
              title={platform.label[locale]}
              onClick={() => activate(platform.key)}
              className={cn(
                "grid size-10 cursor-pointer place-items-center rounded-full border transition-[background-color,border-color,color,opacity] duration-150 disabled:cursor-not-allowed disabled:opacity-50",
                on ? "border-transparent" : "border-(--s-line) bg-(--s-surface-2) text-(--s-muted) hover:border-(--s-text) hover:text-(--s-text)",
              )}
              style={on ? { background: platform.color, color: platform.key === "snapchat" ? "#000" : "#fff" } : undefined}
            >
              <SocialIcon platform={platform.key} className="size-[18px]" />
            </button>
          );
        })}
      </div>

      {active.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {active.map((row) => {
            const platform = getSocialPlatform(row.platform)!;
            const hasValue = Boolean(row.value.trim());
            const error = hasValue && !normalizeSocialLink(row.platform, row.value);
            return (
              <li key={row.platform} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="grid size-[42px] shrink-0 place-items-center rounded-full"
                    style={{ background: platform.color, color: platform.key === "snapchat" ? "#000" : "#fff" }}
                  >
                    <SocialIcon platform={platform.key} className="size-4" />
                  </span>
                  <TextInput
                    ref={(el) => {
                      if (el) inputs.current.set(row.platform, el);
                      else inputs.current.delete(row.platform);
                    }}
                    className={cn("h-[42px] min-w-0 flex-1 font-montserrat rtl:text-end", error && "border-destructive")}
                    dir="ltr"
                    inputMode={platform.input === "phone" ? "text" : "url"}
                    placeholder={platform.placeholder}
                    value={row.value}
                    disabled={disabled}
                    aria-label={platform.label[locale]}
                    aria-invalid={error || undefined}
                    onChange={(e) => update(row.platform, { value: e.target.value })}
                  />
                  <IconButton
                    disabled={disabled}
                    aria-label={t("socialRemove", { platform: platform.label[locale] })}
                    onClick={() => update(row.platform, { active: false })}
                  >
                    <X aria-hidden />
                  </IconButton>
                </div>
                {error ? (
                  <p role="alert" className="text-xs font-semibold text-destructive">
                    {ts(`invalid.${platform.input}`, { platform: platform.label[locale] })}
                  </p>
                ) : hasValue && !row.enabled ? (
                  <p className="inline-flex items-center gap-1 text-xs text-(--s-subtle)">
                    <EyeOff aria-hidden className="size-3.5" />
                    {t("socialHidden")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={`/stores/${storeId}/website/social`}
        className="inline-flex min-h-6 items-center self-start text-xs font-semibold text-(--s-link) hover:underline max-[600px]:min-h-10"
      >
        {t("socialManage")}
      </Link>
    </div>
  );
}
