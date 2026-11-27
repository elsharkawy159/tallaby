"use client";

import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { LoaderCircle, Search, Share2, Tags, Trash2 } from "lucide-react";
import { SEO_DESCRIPTION_RANGE, SEO_KEYWORDS_MAX, SEO_TITLE_RANGE, TITLE_TEMPLATE_TOKEN, applyTitleTemplate, effectiveTitleTemplate } from "@workspace/lib/stores";
import { DropZone, Field, Note, SaveBar, SectionCard, SellerButton, TextArea, TextInput, Toggle } from "@/components/seller-ui";
import { useSellerUpload } from "@/components/inputs/use-seller-upload";
import { RemoteImage } from "@/components/media/remote-image";
import { storeLogoSrc } from "@/components/stores/store-logo.client";
import { saveStoreSeo } from "./seo.server";
import { toSeoPatch, type StoreSeoFormValues } from "./seo.dto";
import type { NoindexReason, StoreSeoDefaultsView } from "./seo.data";
import { writeSeoWithAi } from "./ai/ai-seo.server";
import { AiWriteButton, DefaultHint, KeywordsInput, LengthMeter, SearchPreview, aiSeoErrorKey } from "./seo-fields.client";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 320;

/** Where the seller fixes a reason the store is kept out of search. */
function reasonHref(storeId: string, reason: NoindexReason): string {
  return reason === "noProducts" ? `/stores/${storeId}/settings#catalog-mode` : "/stores";
}

/**
 * Website › SEO › Store SEO (P4-14; simplified 2026-11-27). Saved explicitly
 * and live at once on the storefront (no publish step); page SEO still
 * overrides the title, description and keywords of its own page. Every empty
 * field shows the default the storefront uses instead (seo-defaults.lib). The
 * Search Console code moved to Apps › Google Search Console.
 */
export function StoreSeoForm({
  storeId,
  storeName,
  storeHost,
  initial,
  defaults,
  blockedBy,
  readOnly,
}: {
  storeId: string;
  storeName: string;
  storeHost: string;
  initial: StoreSeoFormValues;
  /** What the storefront uses for an empty field, and the keyword suggestion. */
  defaults: StoreSeoDefaultsView;
  /** Why search engines are asked to skip the store, other than the switch (loadNoindexReasons). */
  blockedBy: NoindexReason[];
  readOnly: boolean;
}) {
  const t = useTranslations("domainSeo.seo");
  const tErrors = useTranslations("domainSeo.errors");
  const tw = useTranslations("sellerWebsite.seo");
  const tf = useTranslations("domainSeo.fields");
  const tai = useTranslations("domainSeo.ai");
  const ts = useTranslations("domainSeo.sitemap");
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
  const shareImage = values.shareImageUrl ? storeLogoSrc(values.shareImageUrl) : null;
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
        form.reset(v);
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

      <SectionCard
        id="search"
        icon={Search}
        title={t("search.title")}
        description={t("search.description")}
        action={!readOnly && <AiWriteButton onClick={writeWithAi} pending={aiPending} disabled={disabled} />}
      >
        {aiUsed && <Note>{tai("review")}</Note>}

        <Field label={t("preview.label")}>
          <SearchPreview url={`https://${storeHost}`} title={homeTitle} description={description || defaults.description} />
        </Field>

        <Field
          label={t("titleTemplate.label")}
          hint={<LengthMeter text={exampleTitle} range={SEO_TITLE_RANGE} />}
          htmlFor="seo-title-template"
          note={
            <span>
              {t("titleTemplate.hint", { token: TITLE_TEMPLATE_TOKEN })} {tf("example")} <bdi className="text-(--s-muted)">{exampleTitle}</bdi>
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

        <Controller
          control={form.control}
          name="indexing"
          render={({ field }) => (
            <div id="indexing" className="flex flex-col gap-2 rounded-[18px] border border-(--s-line) bg-(--s-tint) px-4 py-3.5">
              <div className="flex items-center gap-3.5">
                <Toggle checked={field.value} onCheckedChange={field.onChange} disabled={disabled} aria-labelledby="seo-indexing-title" />
                <div className="min-w-0 flex-1">
                  <b id="seo-indexing-title" className="block text-sm font-bold text-(--s-text)">
                    {t("indexing.title")}
                  </b>
                  <small className="block text-pretty text-[12.5px] text-(--s-subtle)">{field.value ? t("indexing.on") : t("indexing.off")}</small>
                </div>
              </div>
              {field.value &&
                blockedBy.map((reason) => (
                  <p key={reason} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-accent-ink">
                    <span>{ts(`reasons.${reason}`)}</span>
                    <Link href={reasonHref(storeId, reason)} className="font-semibold text-(--s-link) hover:underline">
                      {ts(`fix.${reason}`)}
                    </Link>
                  </p>
                ))}
            </div>
          )}
        />
      </SectionCard>

      <SectionCard id="share" icon={Share2} title={t("share.title")} description={t("share.description")}>
        <div className="grid grid-cols-[minmax(0,1fr)_240px] items-start gap-4 max-[860px]:grid-cols-1">
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
              {shareImage ? <RemoteImage src={shareImage} alt="" fill sizes="240px" className="object-cover" /> : storeName.slice(0, 1).toUpperCase()}
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

      <SaveBar dirty={form.formState.isDirty} saving={isPending} onDiscard={() => form.reset()} saveDisabled={disabled} saveLabel={t("save")} />
    </form>
  );
}
