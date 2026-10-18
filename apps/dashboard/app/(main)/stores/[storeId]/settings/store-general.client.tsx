"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";
import { Banknote, Headphones, Languages, LoaderCircle, Palette, Save, Store } from "lucide-react";
import { CURRENCY_LABELS, formatPricePlain } from "@workspace/lib";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { Textarea } from "@workspace/ui/components/textarea";
import { BUTTON_CLASS, FIELD_CLASS, FieldHint, LabelNote, SectionCard, TEXTAREA_CLASS } from "@/components/form/form-ui";
import { BannerField, LogoField } from "@/components/stores/brand-image-fields.client";
import { cn } from "@/lib/utils";
import { saveStoreGeneral } from "./store-settings.server";
import { toGeneralPatch, type StoreGeneralFormValues } from "./store-settings.dto";

const DESCRIPTION_MAX = 2000;
const PHONE = /^[+()\d\s-]{7,24}$/;

export function StoreGeneralForm({
  storeId,
  initial,
  readOnly,
  brandInSettings,
}: {
  storeId: string;
  initial: StoreGeneralFormValues;
  readOnly: boolean;
  /** Logo + banner fields; false when Website › Design system owns them. */
  brandInSettings: boolean;
}) {
  const t = useTranslations("storeSettings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const schema = z
    .object({
      name: z.string().trim().min(2, t("errors.nameTooShort")).max(80, t("errors.nameTooLong")),
      description: z.string().max(DESCRIPTION_MAX),
      storeCategory: z.string().max(80),
      storeCategoryAr: z.string().max(80),
      logoUrl: z.string(),
      bannerUrl: z.string(),
      phone: z.string().refine((v) => !v.trim() || PHONE.test(v.trim()), t("errors.phoneInvalid")),
      whatsapp: z.string().refine((v) => !v.trim() || PHONE.test(v.trim()), t("errors.phoneInvalid")),
      email: z.string().refine((v) => !v.trim() || z.email().safeParse(v.trim()).success, t("errors.emailInvalid")),
      defaultLocale: z.enum(["ar", "en"]),
      supportedLocales: z.array(z.enum(["ar", "en"])).min(1, t("errors.localeRequired")),
      currencyLabel: z.enum(CURRENCY_LABELS),
    })
    .refine((v) => v.supportedLocales.includes(v.defaultLocale), {
      message: t("errors.defaultLocaleNotSupported"),
      path: ["defaultLocale"],
    });

  const form = useForm<StoreGeneralFormValues>({ resolver: zodResolver(schema), defaultValues: initial });
  const name = useWatch({ control: form.control, name: "name" });
  const description = useWatch({ control: form.control, name: "description" });
  const disabled = readOnly || isPending;

  const onSubmit = (values: StoreGeneralFormValues) =>
    startTransition(async () => {
      const result = await saveStoreGeneral(storeId, toGeneralPatch(values, { brand: brandInSettings }));
      if (result.success) {
        toast.success(t("saved"));
        form.reset(values);
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  const text = (field: keyof StoreGeneralFormValues, label: string, opts: { placeholder?: string; dir?: "ltr"; type?: string } = {}) => (
    <FormField
      control={form.control}
      name={field}
      render={({ field: f }) => (
        <FormItem className="gap-1.5">
          <FormLabel className="text-[13px] font-semibold">{label}</FormLabel>
          <FormControl>
            <Input
              className={FIELD_CLASS}
              disabled={disabled}
              placeholder={opts.placeholder}
              type={opts.type}
              dir={opts.dir}
              {...f}
              value={String(f.value ?? "")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

        <SectionCard id="identity" icon={Store} title={t("identity.title")} description={t("identity.description")}>
          {brandInSettings ? (
            <>
              <Controller
                control={form.control}
                name="logoUrl"
                render={({ field }) => <LogoField value={field.value} onChange={field.onChange} name={name} disabled={disabled} />}
              />
              <Separator className="my-1" />
            </>
          ) : (
            <p className="flex items-start gap-2.5 rounded-xl bg-primary-soft px-4 py-3 text-[13px] text-primary-ink">
              <Palette className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {t("identity.brandMoved")}{" "}
                <Link href={`/stores/${storeId}/website/design`} className="font-medium underline underline-offset-2">
                  {t("identity.brandMovedLink")}
                </Link>
              </span>
            </p>
          )}
          {text("name", t("fields.name"), { placeholder: t("fields.namePlaceholder") })}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className="justify-between text-[13px] font-semibold">
                  {t("fields.description")}
                  <LabelNote>
                    <span dir="ltr" className="tabular-nums">
                      {description.length}/{DESCRIPTION_MAX}
                    </span>
                  </LabelNote>
                </FormLabel>
                <FormControl>
                  <Textarea className={TEXTAREA_CLASS} maxLength={DESCRIPTION_MAX} disabled={disabled} placeholder={t("fields.descriptionPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {text("storeCategoryAr", t("fields.categoryAr"), { placeholder: t("fields.categoryArPlaceholder") })}
            {text("storeCategory", t("fields.categoryEn"), { placeholder: t("fields.categoryEnPlaceholder"), dir: "ltr" })}
          </div>
          {brandInSettings && (
            <Controller
              control={form.control}
              name="bannerUrl"
              render={({ field }) => <BannerField value={field.value} onChange={field.onChange} disabled={disabled} />}
            />
          )}
        </SectionCard>

        <SectionCard id="contact" icon={Headphones} title={t("contact.title")} description={t("contact.description")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {text("phone", t("fields.phone"), { placeholder: "01xxxxxxxxx", dir: "ltr", type: "tel" })}
            {text("whatsapp", t("fields.whatsapp"), { placeholder: "01xxxxxxxxx", dir: "ltr", type: "tel" })}
          </div>
          {text("email", t("fields.email"), { placeholder: "store@example.com", dir: "ltr", type: "email" })}
          <FieldHint>{t("contact.hint")}</FieldHint>
        </SectionCard>

        <SectionCard id="languages" icon={Languages} title={t("languages.title")} description={t("languages.description")}>
          <FormField
            control={form.control}
            name="supportedLocales"
            render={({ field }) => (
              <FormItem className="gap-2">
                <FormLabel className="text-[13px] font-semibold">{t("fields.supportedLocales")}</FormLabel>
                <div className="flex flex-wrap gap-4">
                  {(["ar", "en"] as const).map((locale) => (
                    <label key={locale} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value.includes(locale)}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? [...new Set([...field.value, locale])] : field.value.filter((l) => l !== locale))
                        }
                      />
                      {t(`locales.${locale}`)}
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultLocale"
            render={({ field }) => (
              <FormItem className="gap-2">
                <FormLabel className="text-[13px] font-semibold">{t("fields.defaultLocale")}</FormLabel>
                <div className="flex flex-wrap gap-4">
                  {(["ar", "en"] as const).map((locale) => (
                    <label key={locale} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        className="accent-primary"
                        checked={field.value === locale}
                        disabled={disabled}
                        onChange={() => field.onChange(locale)}
                      />
                      {t(`locales.${locale}`)}
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </SectionCard>

        <SectionCard id="currency" icon={Banknote} title={t("currency.title")} description={t("currency.description")}>
          <FormField
            control={form.control}
            name="currencyLabel"
            render={({ field }) => (
              <FormItem className="gap-2">
                <FormLabel className="text-[13px] font-semibold">{t("currency.label")}</FormLabel>
                <div role="radiogroup" aria-label={t("currency.label")} className="grid gap-2 sm:grid-cols-3">
                  {CURRENCY_LABELS.map((label) => (
                    <label
                      key={label}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                        field.value === label ? "border-primary bg-primary-soft" : "hover:bg-muted/50",
                        disabled && "pointer-events-none opacity-60",
                      )}
                    >
                      <input
                        type="radio"
                        className="accent-primary"
                        checked={field.value === label}
                        disabled={disabled}
                        onChange={() => field.onChange(label)}
                      />
                      <span className="font-medium">{label}</span>
                      <span className="ms-auto text-xs text-muted-foreground">{formatPricePlain(300, "ar", label)}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FieldHint>{t("currency.hint")}</FieldHint>
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
