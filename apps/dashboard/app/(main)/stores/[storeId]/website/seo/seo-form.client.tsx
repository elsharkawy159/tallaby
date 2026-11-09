"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { BadgeCheck, LoaderCircle, Search, Share2, Tags, Trash2 } from "lucide-react";
import {
  SEO_DESCRIPTION_RANGE,
  SEO_KEYWORDS_MAX,
  SEO_TITLE_RANGE,
  TITLE_TEMPLATE_TOKEN,
  applyTitleTemplate,
  effectiveTitleTemplate,
  seoChecklist,
} from "@workspace/lib/stores";
import { DropZone, Field, Note, SaveBar, SectionCard, SellerButton, TextArea, TextInput, Toggle } from "@/components/seller-ui";
import { useSellerUpload } from "@/components/inputs/use-seller-upload";
import { RemoteImage } from "@/components/media/remote-image";
import { storeLogoSrc } from "@/components/stores/store-logo.client";
import { saveStoreSeo } from "./seo.server";
import { extractVerificationToken, isVerificationToken, toSeoPatch, type StoreSeoFormValues } from "./seo.dto";
import type { StoreSeoDefaultsView } from "./seo.data";
import { writeSeoWithAi } from "./ai/ai-seo.server";
import { AiWriteButton, DefaultHint, KeywordsInput, LengthMeter, SearchPreview, SeoChecklist, aiSeoErrorKey } from "./seo-fields.client";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 320;

/**
 * Website › SEO › Store SEO (P4-14; own page and keywords 2026-11-09). Saved
 * explicitly and live at once on the storefront (no publish step); page SEO
 * still overrides the title, description and keywords of its own page. Every
 * empty field shows the default the storefront uses instead (seo-defaults.lib).
 */
export function StoreSeoForm({
  storeId,
  storeName,
  storeHost,
  hasCustomDomain,
  initial,
  defaults,
  readOnly,
}: {
  storeId: string;
  storeName: string;
  storeHost: string;
  /** A live custom domain is verified in Search Console through its DNS, so the meta-tag field is hidden. */
  hasCustomDomain: boolean;
  initial: StoreSeoFormValues;
  /** What the storefront uses for an empty field, and the keyword suggestion. */
  defaults: StoreSeoDefaultsView;
  readOnly: boolean;
}) {
  const t = useTranslations("domainSeo.seo");
  const tErrors = useTranslations("domainSeo.errors");
  const tw = useTranslations("sellerWebsite.seo");
  const tf = useTranslations("domainSeo.fields");
  const tai = useTranslations("domainSeo.ai");
  const [aiPending, startAi] = useTransition();
  const [aiUsed, setAiUsed] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { upload, isUploading } = useSellerUpload({ folder: "banners" });

  const schema = z.object({
    titleTemplate: z
      .string()
      .max(TITLE_MAX, t("titleTemplate.tooLong"))
      .refine((v) => !v.trim() || v.split(TITLE_TEMPLATE_TOKEN).length === 2, t("titleTemplate.invalid")),
    description: z.string().max(DESCRIPTION_MAX, t("description.tooLong")),
    shareImageUrl: z.string(),
    indexing: z.boolean(),
    googleSiteVerification: z
      .string()
      .refine((v) => !v.trim() || isVerificationToken(extractVerificationToken(v)), t("verification.invalid")),
    keywords: z.array(z.string()),
  });

  const form = useForm<StoreSeoFormValues>({ resolver: zodResolver(schema), defaultValues: initial });
  const values = useWatch({ control: form.control });
  const errors = form.formState.errors;
  const disabled = readOnly || isPending;

  const ownTemplate = values.titleTemplate?.trim() ?? "";
  const template = effectiveTitleTemplate(ownTemplate, storeName);
  // The home page as the storefront titles it: the store name once a template is written (store-seo.lib).
  const homeTitle = ownTemplate ? storeName : defaults.homeTitle;
  const exampleTitle = applyTitleTemplate(template, t("preview.examplePage"));
  const description = values.description?.trim() ?? "";
  const keywords = (values.keywords ?? []).filter((k): k is string => typeof k === "string");
  const shareImage = values.shareImageUrl ? storeLogoSrc(values.shareImageUrl) : null;
  const checks = seoChecklist({
    title: exampleTitle,
    description: description || defaults.description,
    ownTitle: Boolean(ownTemplate),
    ownDescription: Boolean(description),
    keywords,
    hasImage: Boolean(values.shareImageUrl),
    indexing: values.indexing ?? true,
  });
  const set = <K extends keyof StoreSeoFormValues>(key: K, value: StoreSeoFormValues[K]) =>
    form.setValue(key, value as never, { shouldDirty: true, shouldValidate: true });

  const writeWithAi = () =>
    startAi(async () => {
      const result = await writeSeoWithAi(storeId, { kind: "store" }).catch(() => null);
      if (!result?.ok) {
        toast.error(tai(aiSeoErrorKey(result?.error ?? "failed")));
        return;
      }
      if (result.title) set("titleTemplate", `${TITLE_TEMPLATE_TOKEN} | ${result.title}`);
      if (result.description) set("description", result.description);
      if (result.keywords.length) set("keywords", result.keywords);
      setAiUsed(true);
      toast.success(result.creditsRemaining === undefined ? tai("done") : tai("doneCredits", { count: result.creditsRemaining }));
    });

  const onSubmit = (v: StoreSeoFormValues) =>
    startTransition(async () => {
      const result = await saveStoreSeo(storeId, toSeoPatch(v));
      if (result.success) {
        toast.success(t("saved"));
        form.reset({ ...v, googleSiteVerification: extractVerificationToken(v.googleSiteVerification) });
        router.refresh();
      } else {
        toast.error(tErrors(result.error));
      }
    });

  const onShareFile = async ([file]: File[]) => {
    if (!file) return;
    const url = await upload(file);
    if (url) form.setValue("shareImageUrl", url, { shouldDirty: true });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5" noValidate>
      {readOnly && <Note>{t("readOnly")}</Note>}

      <SeoChecklist checks={checks} />

      <SectionCard
        id="search"
        icon={Search}
        title={t("search.title")}
        description={t("search.description")}
        action={!readOnly && <AiWriteButton onClick={writeWithAi} pending={aiPending} disabled={disabled} />}
      >
        {aiUsed && <Note>{tai("review")}</Note>}
        <Field
          label={t("titleTemplate.label")}
          hint={t("optional")}
          htmlFor="seo-title-template"
          note={
            <span className="flex flex-col gap-1">
              <span>{t("titleTemplate.hint", { token: TITLE_TEMPLATE_TOKEN })}</span>
              <span>
                {tf("example")} <bdi className="text-(--s-muted)">{exampleTitle}</bdi> · <LengthMeter text={exampleTitle} range={SEO_TITLE_RANGE} />
              </span>
            </span>
          }
          error={errors.titleTemplate?.message}
        >
          <TextInput
            id="seo-title-template"
            dir="auto"
            maxLength={TITLE_MAX}
            disabled={disabled}
            placeholder={`${TITLE_TEMPLATE_TOKEN} | ${storeName}`}
            aria-invalid={Boolean(errors.titleTemplate) || undefined}
            {...form.register("titleTemplate")}
          />
        </Field>
        <Field
          label={t("description.label")}
          hint={<LengthMeter text={values.description ?? ""} range={SEO_DESCRIPTION_RANGE} />}
          htmlFor="seo-description"
          note={
            description ? (
              t("description.hint")
            ) : (
              <DefaultHint value={defaults.description} disabled={disabled} onUse={() => set("description", defaults.description.slice(0, DESCRIPTION_MAX))} />
            )
          }
          error={errors.description?.message}
        >
          <TextArea
            id="seo-description"
            rows={3}
            maxLength={DESCRIPTION_MAX}
            disabled={disabled}
            placeholder={defaults.description || t("description.placeholder")}
            aria-invalid={Boolean(errors.description) || undefined}
            {...form.register("description")}
          />
        </Field>

        <Controller
          control={form.control}
          name="keywords"
          render={({ field }) => {
            const missing = defaults.suggestedKeywords.filter((k) => !field.value.includes(k));
            return (
              <Field
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Tags className="size-4 text-(--s-subtle)" aria-hidden />
                    {tf("keywords")}
                  </span>
                }
                hint={
                  <bdi dir="ltr" className="font-montserrat tabular-nums">
                    {field.value.length}/{SEO_KEYWORDS_MAX}
                  </bdi>
                }
                htmlFor="seo-keywords"
                note={field.value.length ? tf("keywordsHint") : <DefaultHint value={defaults.keywords.join("، ")} />}
              >
                <KeywordsInput id="seo-keywords" value={field.value} onChange={(next) => set("keywords", next)} disabled={disabled} placeholder={tf("keywordsPlaceholder")} />
                {missing.length > 0 && field.value.length < SEO_KEYWORDS_MAX && (
                  <SellerButton
                    variant="mini"
                    size="xs"
                    className="self-start"
                    disabled={disabled}
                    onClick={() => set("keywords", [...field.value, ...missing].slice(0, SEO_KEYWORDS_MAX))}
                  >
                    {tf("addSuggested", { count: Math.min(missing.length, SEO_KEYWORDS_MAX - field.value.length) })}
                  </SellerButton>
                )}
              </Field>
            );
          }}
        />

        <Field label={t("preview.label")} note={description ? undefined : t("preview.noDescription")}>
          <SearchPreview url={`https://${storeHost}`} title={homeTitle} description={description || defaults.description} />
        </Field>

        <Controller
          control={form.control}
          name="indexing"
          render={({ field }) => (
            <div className="flex items-center gap-3.5 rounded-[18px] border border-(--s-line) bg-(--s-tint) px-4 py-3.5">
              <Toggle checked={field.value} onCheckedChange={field.onChange} disabled={disabled} aria-labelledby="seo-indexing-title" />
              <div className="min-w-0 flex-1">
                <b id="seo-indexing-title" className="block text-sm font-bold text-(--s-text)">
                  {t("indexing.title")}
                </b>
                <small className="block text-pretty text-[12.5px] text-(--s-subtle)">{field.value ? t("indexing.on") : t("indexing.off")}</small>
              </div>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard id="share" icon={Share2} title={t("share.title")} description={t("share.description")}>
        <div className="grid grid-cols-[minmax(0,1fr)_280px] items-start gap-4 max-[860px]:grid-cols-1">
          <DropZone
            title={isUploading ? <LoaderCircle className="mx-auto size-5 animate-spin" aria-label={tw("uploading")} /> : tw("dropTitle")}
            hint={
              <span>
                {tw("dropTypes")} · {t("share.imageSize")}
              </span>
            }
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled || isUploading}
            onFiles={onShareFile}
          />
          <div className="overflow-hidden rounded-2xl border border-(--s-line) bg-(--s-surface)">
            <div className="relative grid aspect-[1200/630] place-items-center bg-(--s-primary) font-montserrat text-[28px] font-extrabold text-(--s-solid-fg)">
              {shareImage ? <RemoteImage src={shareImage} alt="" fill sizes="280px" className="object-cover" /> : storeName.slice(0, 1).toUpperCase()}
            </div>
            <div className="bg-(--s-fill) px-3 py-2.5">
              <small dir="ltr" className="block truncate text-start font-montserrat text-[11px] font-medium uppercase text-(--s-subtle) rtl:text-end">
                {storeHost}
              </small>
              <b className="block truncate text-[13.5px] font-bold text-(--s-text)">{storeName}</b>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-pretty text-xs text-(--s-faint)">{t("share.hint")}</p>
          {values.shareImageUrl && (
            <SellerButton
              variant="mini"
              size="xs"
              className="text-destructive [&_svg]:text-destructive"
              disabled={disabled}
              onClick={() => form.setValue("shareImageUrl", "", { shouldDirty: true })}
            >
              <Trash2 aria-hidden />
              {tw("removeImage")}
            </SellerButton>
          )}
        </div>
      </SectionCard>

      {!hasCustomDomain && (
        <SectionCard id="verification" icon={BadgeCheck} title={<bdi dir="ltr">{t("verification.title")}</bdi>} description={t("verification.description")}>
          <Controller
            control={form.control}
            name="googleSiteVerification"
            render={({ field }) => (
              <Field label={t("verification.label")} hint={t("optional")} htmlFor="seo-verification" note={t("verification.hint")} error={errors.googleSiteVerification?.message}>
                <TextInput
                  id="seo-verification"
                  dir="ltr"
                  className="font-montserrat text-[13px]"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={disabled}
                  placeholder="abc123XYZ_-…"
                  aria-invalid={Boolean(errors.googleSiteVerification) || undefined}
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={(e) => {
                    // A pasted <meta …> tag keeps only its content value.
                    field.onChange(extractVerificationToken(e.target.value));
                    field.onBlur();
                  }}
                />
              </Field>
            )}
          />
        </SectionCard>
      )}

      <SaveBar dirty={form.formState.isDirty} saving={isPending} onDiscard={() => form.reset()} saveDisabled={disabled} saveLabel={t("save")} />
    </form>
  );
}
