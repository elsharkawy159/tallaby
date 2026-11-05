"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, Share2, Zap } from "lucide-react";
import { SocialIcon } from "@workspace/store-sections/social-icon";
import { getSocialPlatform, normalizeSocialLink } from "@workspace/store-sections/social";
import { IconButton, Note, PageHeader, Rows, SaveBar, SectionCard, StatusBadge, TextInput, Toggle } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { saveStoreSocial } from "./social.server";
import { toSocialPayload, type SocialRow } from "./social.dto";

export function StoreSocialLinks({
  storeId,
  storeName,
  initial,
  suggestedWhatsapp,
  readOnly,
  children,
}: {
  storeId: string;
  storeName: string;
  initial: SocialRow[];
  suggestedWhatsapp: string;
  readOnly: boolean;
  /** Rendered between the page title and the content (the offline note). */
  children?: React.ReactNode;
}) {
  const t = useTranslations("websiteSocial");
  const tw = useTranslations("sellerWebsite.social");
  const locale = useLocale() === "en" ? "en" : "ar";
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const saved = JSON.stringify(toSocialPayload(baseline));
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
        setBaseline(rows);
        toast.success(t("saved"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  return (
    <>
      <PageHeader className="sui-rise" title={t("title")} description={t("description")} />
      {children}
      {readOnly && <Note>{t("readOnly")}</Note>}

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4 max-[1020px]:grid-cols-1">
        <SectionCard
          id="links"
          className="sui-rise"
          icon={Share2}
          title={
            <>
              {tw("accounts")}
              <StatusBadge tone={live.length ? "success" : "muted"}>{tw("visibleCount", { count: live.length })}</StatusBadge>
            </>
          }
          description={t("hint")}
        >
          <Rows>
            {checked.map((row, index) => {
              const platform = getSocialPlatform(row.platform)!;
              const hasValue = Boolean(row.value.trim());
              const error = hasValue && !row.url;
              return (
                <div key={row.platform} className="flex flex-wrap items-start gap-x-3.5 gap-y-2 px-3.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)">
                  <div className="flex h-[42px] w-[148px] shrink-0 items-center gap-2.5 max-[600px]:w-auto max-[600px]:min-w-0 max-[600px]:flex-1">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-full"
                      style={{ background: platform.color, color: platform.key === "snapchat" ? "#000" : "#fff" }}
                    >
                      <SocialIcon platform={platform.key} className="size-[18px]" />
                    </span>
                    <span className="min-w-0 text-sm font-bold text-(--s-text)">{platform.label[locale]}</span>
                    {row.url && row.enabled && <i aria-hidden className="size-[7px] shrink-0 rounded-full bg-success" />}
                  </div>
                  <div className="flex h-[42px] shrink-0 items-center gap-0.5 min-[601px]:order-last">
                    <Toggle
                      className={cn("me-1.5 text-xs", !hasValue && "invisible")}
                      label={<span className="max-[600px]:hidden">{t("show")}</span>}
                      aria-label={t("show")}
                      checked={row.enabled}
                      disabled={disabled || !hasValue}
                      onCheckedChange={(enabled) => update(index, { enabled })}
                    />
                    <IconButton disabled={disabled || index === 0} onClick={() => move(index, index - 1)} aria-label={t("moveUp")}>
                      <ArrowUp aria-hidden />
                    </IconButton>
                    <IconButton disabled={disabled || index === checked.length - 1} onClick={() => move(index, index + 1)} aria-label={t("moveDown")}>
                      <ArrowDown aria-hidden />
                    </IconButton>
                  </div>
                  <div className="min-w-[160px] flex-1 max-[600px]:basis-full">
                    <TextInput
                      className={cn("h-[42px]", error && "border-destructive")}
                      dir="ltr"
                      inputMode={platform.input === "phone" ? "text" : "url"}
                      placeholder={platform.placeholder}
                      value={row.value}
                      disabled={disabled}
                      aria-label={platform.label[locale]}
                      aria-invalid={error || undefined}
                      onChange={(e) => update(index, { value: e.target.value })}
                    />
                    {error ? (
                      <p role="alert" className="mt-1 text-xs font-semibold text-destructive">
                        {t(`invalid.${platform.input}`, { platform: platform.label[locale] })}
                      </p>
                    ) : row.url ? (
                      <p dir="ltr" className="mt-1 truncate text-start text-xs text-(--s-subtle) rtl:text-end">
                        {row.url}
                      </p>
                    ) : platform.key === "whatsapp" && suggestedWhatsapp ? (
                      <button
                        type="button"
                        className="mt-1.5 inline-flex cursor-pointer items-center text-xs font-semibold text-(--s-link) hover:underline disabled:opacity-50 max-[600px]:mt-0.5 max-[600px]:min-h-10"
                        disabled={disabled}
                        onClick={() => update(index, { value: suggestedWhatsapp })}
                      >
                        {t("useStoreNumber")}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </Rows>
        </SectionCard>

        <aside className="sui-rise flex flex-col gap-3 [animation-delay:.06s] min-[1021px]:sticky min-[1021px]:top-[88px]">
          <SectionCard id="preview" icon={Eye} title={t("preview.title")} description={t("preview.description")}>
            {/* An always-dark sample of the store's footer. */}
            <div className="flex flex-col gap-3 rounded-[20px] bg-(--tallaby-teal-900) px-[22px] py-5 text-white">
              <b className="text-lg font-extrabold">{storeName}</b>
              {live.length ? (
                <ul className="flex flex-wrap gap-2">
                  {live.map((row) => (
                    <li key={row.platform}>
                      <a
                        href={row.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={getSocialPlatform(row.platform)!.label[locale]}
                        className="grid size-10 place-items-center rounded-full border border-white/20 text-white transition-colors duration-150 hover:border-white"
                      >
                        <SocialIcon platform={row.platform} className="size-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-white/70">{t("preview.empty")}</p>
              )}
            </div>
          </SectionCard>
          <Note icon={Zap}>{tw("liveNote")}</Note>
        </aside>
      </div>

      <SaveBar
        dirty={dirty}
        saving={isPending}
        saveDisabled={disabled || invalid}
        onSave={onSave}
        onDiscard={() => setRows(baseline)}
        saveLabel={t("save")}
      />
    </>
  );
}
