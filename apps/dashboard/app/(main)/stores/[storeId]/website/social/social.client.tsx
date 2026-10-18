"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, LoaderCircle, Save, Share2 } from "lucide-react";
import { SocialIcon } from "@workspace/store-sections/social-icon";
import { getSocialPlatform, normalizeSocialLink } from "@workspace/store-sections/social";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { BUTTON_CLASS, FIELD_CLASS, FieldHint, SectionCard } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { saveStoreSocial } from "./social.server";
import { toSocialPayload, type SocialRow } from "./social.dto";

export function StoreSocialLinks({
  storeId,
  storeName,
  initial,
  suggestedWhatsapp,
  readOnly,
}: {
  storeId: string;
  storeName: string;
  initial: SocialRow[];
  suggestedWhatsapp: string;
  readOnly: boolean;
}) {
  const t = useTranslations("websiteSocial");
  const locale = useLocale() === "en" ? "en" : "ar";
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(toSocialPayload(initial)));
  const [isPending, startTransition] = useTransition();

  const checked = useMemo(
    () => rows.map((row) => ({ ...row, url: row.value.trim() ? normalizeSocialLink(row.platform, row.value) : null })),
    [rows],
  );
  const invalid = checked.some((row) => row.value.trim() && !row.url);
  const dirty = JSON.stringify(toSocialPayload(rows)) !== saved;
  const live = checked.filter((row) => row.enabled && row.url);
  const disabled = readOnly || isPending;

  const update = (index: number, patch: Partial<SocialRow>) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const move = (index: number, to: number) =>
    setRows((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [row] = next.splice(index, 1);
      next.splice(to, 0, row!);
      return next;
    });

  const onSave = () =>
    startTransition(async () => {
      const payload = toSocialPayload(rows);
      const result = await saveStoreSocial(storeId, payload);
      if (result.success) {
        setSaved(JSON.stringify(payload));
        toast.success(t("saved"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  return (
    <div className="space-y-5">
      {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

      <SectionCard id="links" icon={Share2} title={t("title")} description={t("description")}>
        <ul className="divide-y rounded-xl border">
          {checked.map((row, index) => {
            const platform = getSocialPlatform(row.platform)!;
            const hasValue = Boolean(row.value.trim());
            const error = hasValue && !row.url;
            return (
              <li key={row.platform} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-3">
                <div className="flex items-center gap-3 sm:w-40 sm:shrink-0 sm:pt-1.5">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full"
                    style={{ background: platform.color, color: platform.key === "snapchat" ? "#000" : "#fff" }}
                  >
                    <SocialIcon platform={platform.key} className="size-4" />
                  </span>
                  <span className="text-sm font-semibold">{platform.label[locale]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Input
                    className={cn(FIELD_CLASS, error && "border-destructive")}
                    dir="ltr"
                    inputMode={platform.input === "phone" ? "tel" : "url"}
                    placeholder={platform.placeholder}
                    value={row.value}
                    disabled={disabled}
                    aria-label={platform.label[locale]}
                    aria-invalid={error || undefined}
                    onChange={(e) => update(index, { value: e.target.value })}
                  />
                  {error ? (
                    <p className="mt-1 text-xs text-destructive">{t(`invalid.${platform.input}`, { platform: platform.label[locale] })}</p>
                  ) : row.url ? (
                    <p dir="ltr" className="mt-1 truncate text-start text-xs text-muted-foreground rtl:text-end">
                      {row.url}
                    </p>
                  ) : platform.key === "whatsapp" && suggestedWhatsapp ? (
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                      disabled={disabled}
                      onClick={() => update(index, { value: suggestedWhatsapp })}
                    >
                      {t("useStoreNumber")}
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 sm:pt-1.5">
                  <label className={cn("me-2 flex items-center gap-2 text-xs text-muted-foreground", !hasValue && "invisible")}>
                    <Switch
                      checked={row.enabled}
                      disabled={disabled || !hasValue}
                      onCheckedChange={(enabled) => update(index, { enabled })}
                    />
                    {t("show")}
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={disabled || index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={t("moveUp")}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={disabled || index === checked.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={t("moveDown")}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <FieldHint>{t("hint")}</FieldHint>
      </SectionCard>

      <SectionCard id="preview" icon={Eye} title={t("preview.title")} description={t("preview.description")}>
        <div className="rounded-xl bg-[#145163] px-5 py-6 text-white">
          <p className="text-lg font-bold">{storeName}</p>
          {live.length ? (
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {live.map((row) => (
                <li key={row.platform}>
                  <a
                    href={row.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={getSocialPlatform(row.platform)!.label[locale]}
                    className="grid size-11 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)] hover:shadow-[inset_0_0_0_1px_#fff]"
                  >
                    <SocialIcon platform={row.platform} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-white/70">{t("preview.empty")}</p>
          )}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button type="button" className={BUTTON_CLASS} disabled={disabled || invalid || !dirty} onClick={onSave}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
