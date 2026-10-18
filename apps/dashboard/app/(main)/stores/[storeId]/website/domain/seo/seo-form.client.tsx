"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { BadgeCheck, LoaderCircle, Save, Search, Share2 } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { TITLE_TEMPLATE_TOKEN } from "@workspace/lib/stores";
import {
  BUTTON_CLASS,
  FIELD_CLASS,
  FieldHint,
  LabelNote,
  SectionCard,
  TEXTAREA_CLASS,
  ToggleRow,
} from "@/components/form/form-ui";
import { BannerField } from "@/components/stores/brand-image-fields.client";
import { saveStoreSeo } from "../domain-seo.server";
import {
  extractVerificationToken,
  isVerificationToken,
  toSeoPatch,
  type StoreSeoFormValues,
} from "../domain-seo.dto";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 320;

/**
 * Website › Domain & SEO › SEO (P4-14). Saved explicitly and live at once on
 * the storefront (no publish step); builder page SEO still overrides the
 * title and description of its own page.
 */
export function StoreSeoForm({
  storeId,
  storeName,
  storeHost,
  initial,
  readOnly,
}: {
  storeId: string;
  storeName: string;
  storeHost: string;
  initial: StoreSeoFormValues;
  readOnly: boolean;
}) {
  const t = useTranslations("domainSeo.seo");
  const tErrors = useTranslations("domainSeo.errors");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
  });

  const form = useForm<StoreSeoFormValues>({ resolver: zodResolver(schema), defaultValues: initial });
  const values = useWatch({ control: form.control });
  const disabled = readOnly || isPending;

  const template = values.titleTemplate?.trim() || `${TITLE_TEMPLATE_TOKEN} | ${storeName}`;
  const previewTitle = template.replace(TITLE_TEMPLATE_TOKEN, t("preview.pageTitle"));

  const onSubmit = (v: StoreSeoFormValues) =>
    startTransition(async () => {
      const result = await saveStoreSeo(storeId, toSeoPatch(v));
      if (result.success) {
        toast.success(t("saved"));
        const next = { ...v, googleSiteVerification: extractVerificationToken(v.googleSiteVerification) };
        form.reset(next);
        router.refresh();
      } else {
        toast.error(tErrors(result.error));
      }
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

        <SectionCard id="search" icon={Search} title={t("search.title")} description={t("search.description")}>
          <FormField
            control={form.control}
            name="titleTemplate"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className="justify-between text-[13px] font-semibold">
                  {t("titleTemplate.label")}
                  <LabelNote>{t("optional")}</LabelNote>
                </FormLabel>
                <FormControl>
                  <Input
                    className={FIELD_CLASS}
                    maxLength={TITLE_MAX}
                    disabled={disabled}
                    placeholder={`${TITLE_TEMPLATE_TOKEN} | ${storeName}`}
                    {...field}
                  />
                </FormControl>
                <FieldHint>{t("titleTemplate.hint", { token: TITLE_TEMPLATE_TOKEN })}</FieldHint>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className="justify-between text-[13px] font-semibold">
                  {t("description.label")}
                  <LabelNote>
                    <span dir="ltr" className="tabular-nums">
                      {(values.description ?? "").length}/{DESCRIPTION_MAX}
                    </span>
                  </LabelNote>
                </FormLabel>
                <FormControl>
                  <Textarea
                    className={TEXTAREA_CLASS}
                    rows={3}
                    maxLength={DESCRIPTION_MAX}
                    disabled={disabled}
                    placeholder={t("description.placeholder")}
                    {...field}
                  />
                </FormControl>
                <FieldHint>{t("description.hint")}</FieldHint>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-xl border bg-muted/40 p-4" aria-label={t("preview.label")}>
            <p className="mb-1.5 text-xs text-muted-foreground">{t("preview.label")}</p>
            <p dir="ltr" className="truncate text-start text-xs text-muted-foreground rtl:text-end">
              {storeHost}
            </p>
            <p className="truncate text-base font-medium text-[#1a0dab] dark:text-[#8ab4f8]">{previewTitle}</p>
            <p className="line-clamp-2 text-[13px] text-muted-foreground">
              {values.description?.trim() || t("preview.noDescription")}
            </p>
          </div>

          <Controller
            control={form.control}
            name="indexing"
            render={({ field }) => (
              <ToggleRow
                id="seo-indexing"
                boxed
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                title={t("indexing.title")}
                description={field.value ? t("indexing.on") : t("indexing.off")}
              />
            )}
          />
        </SectionCard>

        <SectionCard id="share" icon={Share2} title={t("share.title")} description={t("share.description")}>
          <Controller
            control={form.control}
            name="shareImageUrl"
            render={({ field }) => (
              <BannerField
                value={field.value}
                onChange={field.onChange}
                disabled={disabled}
                label={t("share.imageLabel")}
                sizeNote={t("share.imageSize")}
              />
            )}
          />
          <FieldHint>{t("share.hint")}</FieldHint>
        </SectionCard>

        <SectionCard
          id="verification"
          icon={BadgeCheck}
          title={t("verification.title")}
          description={t("verification.description")}
        >
          <FormField
            control={form.control}
            name="googleSiteVerification"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className="justify-between text-[13px] font-semibold">
                  {t("verification.label")}
                  <LabelNote>{t("optional")}</LabelNote>
                </FormLabel>
                <FormControl>
                  <Input
                    dir="ltr"
                    className={`${FIELD_CLASS} font-mono text-[13px]`}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={disabled}
                    placeholder="abc123XYZ_-…"
                    {...field}
                    onBlur={(e) => {
                      // A pasted <meta …> tag keeps only its content value.
                      field.onChange(extractVerificationToken(e.target.value));
                      field.onBlur();
                    }}
                  />
                </FormControl>
                <FieldHint>{t("verification.hint")}</FieldHint>
                <FormMessage />
              </FormItem>
            )}
          />
        </SectionCard>

        <div className="sticky bottom-0 flex justify-end border-t bg-background/95 py-3 backdrop-blur">
          <Button type="submit" className={BUTTON_CLASS} disabled={disabled || !form.formState.isDirty}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
