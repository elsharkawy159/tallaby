"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";
import { Banknote, Headphones, Languages, Palette, Store, TriangleAlert } from "lucide-react";
import {
  CURRENCY_LABELS,
  REGIONAL_CURRENCY_CODES,
  STORE_CURRENCIES,
  STORE_CURRENCY_CODES,
  currencyLabelHtml,
  formatPrice,
  isCurrencyLabelFor,
  isStoreCurrency,
  type StoreCurrency,
} from "@workspace/lib";
import { formatPhone } from "@workspace/store-sections/social";

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
import {
  CheckRow,
  Chip,
  Chips,
  Field,
  FieldRow,
  Note,
  OptionCard,
  OptionCards,
  SaveBar,
  SectionCard,
  TextArea,
  TextInput,
  TwoColumns,
  fieldClass,
} from "@/components/seller-ui";
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
  usdLive,
}: {
  /** The USD switch (0136): the wallet is no longer in EGP. */
  usdLive: boolean;
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
  const tSetup = useTranslations("storeSetup");
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
  const { errors } = form.formState;
  const name = useWatch({ control: form.control, name: "name" });
  const description = useWatch({ control: form.control, name: "description" });
  const [categoryEn, categoryAr] = useWatch({ control: form.control, name: ["storeCategory", "storeCategoryAr"] });
  const phone = useWatch({ control: form.control, name: "phone" });
  const industry = findIndustry({ en: categoryEn, ar: categoryAr });
  const currency = useWatch({ control: form.control, name: "currency" });
  const catalog = useStoreCatalog(storeId, catalogProps);
  const disabled = readOnly || isPending;
  const dirty = form.formState.isDirty || catalog.dirty;
  useUnsavedChangesGuard(dirty && !readOnly, tCommon("unsavedChanges"));

  // "Same as the phone": the WhatsApp number follows the phone while it is on.
  const [whatsappSame, setWhatsappSame] = useState(Boolean(initial.phone) && initial.phone === initial.whatsapp);
  useEffect(() => {
    if (whatsappSame && form.getValues("whatsapp") !== phone) {
      form.setValue("whatsapp", phone, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    }
  }, [whatsappSame, phone, form]);

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

  const discard = () => {
    form.reset();
    catalog.reset();
    setWhatsappSame(Boolean(initial.phone) && initial.phone === initial.whatsapp);
  };

  const text = (
    field: "name" | "storeCategoryAr" | "storeCategory" | "phone" | "whatsapp" | "email",
    label: string,
    opts: { placeholder?: string; dir?: "ltr"; type?: string; locked?: boolean } = {},
  ) => (
    <Field label={label} htmlFor={`store-${field}`} error={errors[field]?.message}>
      <TextInput
        id={`store-${field}`}
        disabled={disabled}
        readOnly={opts.locked}
        placeholder={opts.placeholder}
        type={opts.type}
        dir={opts.dir}
        aria-invalid={errors[field] ? true : undefined}
        className={cn(opts.dir === "ltr" && "font-montserrat rtl:text-end", opts.locked && "bg-(--s-surface-2) text-(--s-muted)")}
        {...form.register(field)}
      />
    </Field>
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      <SectionCard id="identity" icon={Store} title={t("identity.title")} description={t("identity.description")}>
        {/* Builder sellers manage the logo in Website › Design (it shows in every header and footer). */}
        {brandInSettings ? (
          <Controller
            control={form.control}
            name="logoUrl"
            render={({ field }) => <LogoField value={field.value} onChange={field.onChange} name={name} disabled={disabled} />}
          />
        ) : (
          <Note icon={Palette}>
            <Link href={`/stores/${storeId}/website/design#brand`} className="inline-flex min-h-6 items-center text-(--s-link) max-[600px]:min-h-10">
              {t("identity.designLink")}
            </Link>
          </Note>
        )}
        {text("name", t("fields.name"), { placeholder: t("fields.namePlaceholder") })}
        <Field
          label={t("fields.description")}
          htmlFor="store-description"
          hint={
            <bdi dir="ltr" className="font-montserrat tabular-nums">
              {description.length}/{DESCRIPTION_MAX}
            </bdi>
          }
          error={errors.description?.message}
        >
          <TextArea
            id="store-description"
            maxLength={DESCRIPTION_MAX}
            disabled={disabled}
            placeholder={t("fields.descriptionPlaceholder")}
            {...form.register("description")}
          />
        </Field>
        <Field label={t("fields.industry")} note={t("fields.industryHint")}>
          <Chips role="group" aria-label={t("fields.industry")}>
            {STORE_INDUSTRIES.map((option) => (
              <Chip
                key={option.id}
                pressed={industry?.id === option.id}
                disabled={disabled}
                className="disabled:opacity-50"
                onClick={() => {
                  form.setValue("storeCategory", option.en, { shouldDirty: true });
                  form.setValue("storeCategoryAr", option.ar, { shouldDirty: true });
                }}
              >
                {uiLocale === "en" ? option.en : option.ar}
              </Chip>
            ))}
          </Chips>
        </Field>
        <FieldRow>
          {text("storeCategoryAr", t("fields.categoryAr"), { placeholder: t("fields.categoryArPlaceholder") })}
          {text("storeCategory", t("fields.categoryEn"), { placeholder: t("fields.categoryEnPlaceholder"), dir: "ltr" })}
        </FieldRow>
        {brandInSettings && (
          <Controller
            control={form.control}
            name="bannerUrl"
            render={({ field }) => <BannerField value={field.value} onChange={field.onChange} disabled={disabled} />}
          />
        )}
      </SectionCard>

      <TwoColumns>
        <SectionCard id="contact" icon={Headphones} title={t("contact.title")} description={t("contact.description")}>
          {text("phone", t("fields.phone"), { placeholder: "01xxxxxxxxx", dir: "ltr", type: "tel" })}
          <div className="flex flex-col gap-2">
            {text("whatsapp", t("fields.whatsapp"), { placeholder: "01xxxxxxxxx", dir: "ltr", type: "tel", locked: whatsappSame })}
            <CheckRow
              label={tSetup("whatsappSame")}
              checked={whatsappSame}
              disabled={disabled}
              className="max-[600px]:min-h-10 max-[600px]:items-center"
              onChange={(event) => setWhatsappSame(event.target.checked)}
            />
          </div>
          {text("email", t("fields.email"), { placeholder: "store@example.com", dir: "ltr", type: "email" })}
          <p className="text-pretty text-xs text-(--s-faint)">{t("contact.hint")}</p>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard id="languages" icon={Languages} title={t("languages.title")} description={t("languages.description")}>
            <Controller
              control={form.control}
              name="supportedLocales"
              render={({ field }) => (
                <Field label={t("fields.supportedLocales")} error={errors.supportedLocales?.message}>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {(["ar", "en"] as const).map((locale) => (
                      <CheckRow
                        key={locale}
                        label={t(`locales.${locale}`)}
                        checked={field.value.includes(locale)}
                        disabled={disabled}
                        className="max-[600px]:min-h-10 max-[600px]:items-center"
                        onChange={(event) =>
                          field.onChange(event.target.checked ? [...new Set([...field.value, locale])] : field.value.filter((l) => l !== locale))
                        }
                      />
                    ))}
                  </div>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="defaultLocale"
              render={({ field }) => (
                <Field label={t("fields.defaultLocale")} error={errors.defaultLocale?.message}>
                  <OptionCards className="grid-cols-2">
                    {(["ar", "en"] as const).map((locale) => (
                      <OptionCard
                        key={locale}
                        name="default-locale"
                        title={t(`locales.${locale}`)}
                        checked={field.value === locale}
                        disabled={disabled}
                        onChange={() => field.onChange(locale)}
                      />
                    ))}
                  </OptionCards>
                </Field>
              )}
            />
          </SectionCard>

          <SectionCard id="currency" icon={Banknote} title={t("currency.title")} description={t("currency.description")}>
            <Controller
              control={form.control}
              name="currency"
              render={({ field }) => (
                <Field label={t("currency.currency")} htmlFor="store-currency" error={errors.currency?.message}>
                  <Select
                    value={field.value}
                    disabled={disabled}
                    onValueChange={(value) => {
                      if (!isStoreCurrency(value)) return;
                      field.onChange(value);
                      // A new currency starts on its first symbol; the seller can pick another.
                      form.setValue("currencyLabel", STORE_CURRENCIES[value][0], { shouldDirty: true });
                    }}
                  >
                    <SelectTrigger id="store-currency" className={cn(fieldClass, "!h-[46px]")}>
                      <SelectValue />
                    </SelectTrigger>
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
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="currencyLabel"
              render={({ field }) => (
                <Field label={t("currency.symbol")} error={errors.currencyLabel?.message}>
                  <OptionCards className="grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))]">
                    {STORE_CURRENCIES[currency].map((label) => (
                      <OptionCard
                        key={label}
                        name="currency-label"
                        checked={field.value === label}
                        disabled={disabled}
                        onChange={() => field.onChange(label)}
                        // Fixed list, never free text; one label is an icon.
                        title={<span dangerouslySetInnerHTML={{ __html: currencyLabelHtml(label, uiLocale) }} />}
                        description={<span dangerouslySetInnerHTML={{ __html: formatPrice(300, uiLocale, "sm", label) }} />}
                      />
                    ))}
                  </OptionCards>
                </Field>
              )}
            />
            {currency !== initial.currency && (
              // Said where the change happens: the numbers stay, only their meaning changes.
              <Note tone="amber" icon={TriangleAlert}>
                <span role="alert">{t("currency.changeWarning", { from: initial.currency, to: currency })}</span>
              </Note>
            )}
            <p className="text-pretty text-xs text-(--s-faint)">{t(usdLive ? "currency.hintUsd" : "currency.hint")}</p>
          </SectionCard>
        </div>
      </TwoColumns>

      <StoreCatalogSections money={{ currency: initial.currency }} catalog={catalog} products={catalogProps.products} maxProducts={catalogProps.maxProducts} disabled={disabled} />

      {!readOnly && <SaveBar dirty={dirty} saving={isPending} onDiscard={discard} />}
    </form>
  );
}
