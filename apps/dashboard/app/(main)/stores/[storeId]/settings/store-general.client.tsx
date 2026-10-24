"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";
import { Banknote, Headphones, Languages, LoaderCircle, Palette, Save, Store } from "lucide-react";
import {
  CURRENCY_LABELS,
  REGIONAL_CURRENCY_CODES,
  STORE_CURRENCIES,
  STORE_CURRENCY_CODES,
  formatPricePlain,
  isCurrencyLabelFor,
  isStoreCurrency,
  type StoreCurrency,
} from "@workspace/lib";
import { formatPhone } from "@workspace/store-sections/social";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { Textarea } from "@workspace/ui/components/textarea";
import { BUTTON_CLASS, FIELD_CLASS, FieldHint, LabelNote, SectionCard, TEXTAREA_CLASS } from "@/components/form/form-ui";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { BannerField, LogoField } from "@/components/stores/brand-image-fields.client";
import { STORE_INDUSTRIES, findIndustry } from "@/lib/stores/industries.lib";
import { cn } from "@/lib/utils";
import { StoreCatalogSections, useStoreCatalog, type StoreCatalogProps } from "./catalog.client";
import { saveStoreGeneral } from "./store-settings.server";
import { toGeneralPatch, type StoreGeneralFormValues } from "./store-settings.dto";

const DESCRIPTION_MAX = 2000;
const INTERNATIONAL_CURRENCY_CODES = STORE_CURRENCY_CODES.filter((c) => !REGIONAL_CURRENCY_CODES.includes(c));

export function StoreGeneralForm({
  storeId,
  initial,
  readOnly,
  brandInSettings,
  catalog: catalogProps,
}: {
  storeId: string;
  initial: StoreGeneralFormValues;
  readOnly: boolean;
  /** Banner field here; false when Website › Design system owns it (the logo is always here). */
  brandInSettings: boolean;
  /** Which of the seller's products this store shows (D24); saved with the same button. */
  catalog: StoreCatalogProps;
}) {
  const t = useTranslations("storeSettings");
  const tCommon = useTranslations("common");
  const uiLocale = useLocale();
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
      phone: z.string().refine((v) => !v.trim() || formatPhone(v) !== null, t("errors.phoneInvalid")),
      whatsapp: z.string().refine((v) => !v.trim() || formatPhone(v) !== null, t("errors.phoneInvalid")),
      email: z.string().refine((v) => !v.trim() || z.email().safeParse(v.trim()).success, t("errors.emailInvalid")),
      defaultLocale: z.enum(["ar", "en"]),
      supportedLocales: z.array(z.enum(["ar", "en"])).min(1, t("errors.localeRequired")),
      currency: z.enum(STORE_CURRENCY_CODES),
      currencyLabel: z.enum(CURRENCY_LABELS),
    })
    .refine((v) => v.supportedLocales.includes(v.defaultLocale), {
      message: t("errors.defaultLocaleNotSupported"),
      path: ["defaultLocale"],
    })
    .refine((v) => isCurrencyLabelFor(v.currency, v.currencyLabel), { message: t("errors.invalidInput"), path: ["currencyLabel"] });

  const form = useForm<StoreGeneralFormValues>({ resolver: zodResolver(schema), defaultValues: initial });
  const name = useWatch({ control: form.control, name: "name" });
  const description = useWatch({ control: form.control, name: "description" });
  const [categoryEn, categoryAr] = useWatch({ control: form.control, name: ["storeCategory", "storeCategoryAr"] });
  const industry = findIndustry({ en: categoryEn, ar: categoryAr });
  const currency = useWatch({ control: form.control, name: "currency" });
  const catalog = useStoreCatalog(storeId, catalogProps);
  const disabled = readOnly || isPending;
  const dirty = form.formState.isDirty || catalog.dirty;
  useUnsavedChangesGuard(dirty && !readOnly, tCommon("unsavedChanges"));

  const onSubmit = (values: StoreGeneralFormValues) =>
    startTransition(async () => {
      const catalogInvalid = catalog.validate();
      if (catalogInvalid) {
        toast.error(catalogInvalid);
        return;
      }
      if (form.formState.isDirty) {
        const result = await saveStoreGeneral(storeId, toGeneralPatch(values, { brand: brandInSettings }));
        if (!result.success) {
          toast.error(t(`errors.${result.error}`));
          return;
        }
        form.reset(values);
      }
      const catalogError = await catalog.save();
      if (catalogError) toast.error(catalogError);
      else toast.success(t("saved"));
      router.refresh();
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
        <PageActionBar>
          <Button type="submit" className={BUTTON_CLASS} disabled={disabled || !dirty}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
            {t("save")}
          </Button>
        </PageActionBar>
        {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

        {/* Two columns on desktop: the store's identity, then contact, languages and currency. */}
        <div className="grid items-start gap-5 lg:grid-cols-2">
        <SectionCard id="identity" icon={Store} title={t("identity.title")} description={t("identity.description")}>
          {/* Builder sellers manage the logo in Website › Design (it shows in every header and footer). */}
          {brandInSettings ? (
            <Controller
              control={form.control}
              name="logoUrl"
              render={({ field }) => <LogoField value={field.value} onChange={field.onChange} name={name} disabled={disabled} />}
            />
          ) : (
            <Link
              href={`/stores/${storeId}/website/design#brand`}
              className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <Palette className="size-4 shrink-0" aria-hidden />
              {t("identity.designLink")}
            </Link>
          )}
          <Separator className="my-1" />
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
          <div className="space-y-2">
            <p className="text-[13px] font-semibold">{t("fields.industry")}</p>
            <FieldHint>{t("fields.industryHint")}</FieldHint>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("fields.industry")}>
              {STORE_INDUSTRIES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={industry?.id === option.id}
                  disabled={disabled}
                  onClick={() => {
                    form.setValue("storeCategory", option.en, { shouldDirty: true });
                    form.setValue("storeCategoryAr", option.ar, { shouldDirty: true });
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50",
                    industry?.id === option.id ? "border-primary bg-primary/5 font-medium text-primary" : "hover:border-primary/40",
                  )}
                >
                  {uiLocale === "en" ? option.en : option.ar}
                </button>
              ))}
            </div>
          </div>
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

        <div className="space-y-5">
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
            name="currency"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className="text-[13px] font-semibold">{t("currency.currency")}</FormLabel>
                <Select
                  value={field.value}
                  disabled={disabled}
                  onValueChange={(value) => {
                    if (!isStoreCurrency(value)) return;
                    field.onChange(value);
                    // A new currency starts on its code; the seller then picks the symbol.
                    form.setValue("currencyLabel", STORE_CURRENCIES[value][0], { shouldDirty: true });
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="!h-11 w-full rounded-[10px] bg-card px-3.5 shadow-none dark:bg-card">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(
                      [
                        ["regional", REGIONAL_CURRENCY_CODES],
                        ["international", INTERNATIONAL_CURRENCY_CODES],
                      ] as const
                    ).map(([group, codes], index) => (
                      <SelectGroup key={group}>
                        {index > 0 && <SelectSeparator />}
                        <SelectLabel>{t(`currency.groups.${group}`)}</SelectLabel>
                        {codes.map((code: StoreCurrency) => (
                          <SelectItem key={code} value={code}>
                            <span dir="ltr" className="w-9 font-mono text-xs text-muted-foreground">
                              {code}
                            </span>
                            {t(`currency.names.${code}`)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currencyLabel"
            render={({ field }) => (
              <FormItem className="gap-2">
                <FormLabel className="text-[13px] font-semibold">{t("currency.symbol")}</FormLabel>
                <div role="radiogroup" aria-label={t("currency.symbol")} className="grid gap-2 sm:grid-cols-3">
                  {STORE_CURRENCIES[currency].map((label) => (
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
                      <span className="ms-auto text-xs text-muted-foreground">{formatPricePlain(300, uiLocale, label)}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FieldHint>{t("currency.hint")}</FieldHint>
        </SectionCard>
        </div>
        </div>

        <StoreCatalogSections catalog={catalog} products={catalogProps.products} maxProducts={catalogProps.maxProducts} disabled={disabled} />

      </form>
    </Form>
  );
}
