"use client";

import { Building2, Check, Handshake, Landmark, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Spinner } from "@workspace/ui/components/spinner";
import { BannerUploader } from "../banner-uploader";
import { LogoUploader } from "../logo-uploader";
import { BUSINESS_TYPE_OPTIONS } from "../become-seller.types";
import type { OnboardingFormValues } from "../become-seller.dto";
import {
  ChoiceField,
  FieldGrid,
  InlineError,
  TextAreaField,
  TextField,
} from "../onboarding.chunks";

export type BusinessNameCheck = "idle" | "checking" | "available" | "taken";

const BUSINESS_TYPE_ICONS = {
  individual: User,
  company: Building2,
  partnership: Handshake,
  corporation: Landmark,
} as const;

export function BusinessStep({
  nameCheck,
  onNameEdited,
  disabled,
}: {
  nameCheck: BusinessNameCheck;
  onNameEdited: () => void;
  disabled?: boolean;
}) {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const name = useWatch({ control: form.control, name: "businessName" });

  return (
    <>
      {/* Laid out like the store page header: cover banner, logo overlapping it. */}
      <div className="overflow-hidden rounded-[14px] border border-neutral-200 bg-card dark:border-input">
        <FormField
          control={form.control}
          name="bannerUrl"
          render={({ field }) => (
            <BannerUploader value={field.value} onChange={field.onChange} disabled={disabled} />
          )}
        />
        <div className="relative -mt-9 flex items-end gap-4 px-5 pb-4.5">
          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <LogoUploader value={field.value} onChange={field.onChange} disabled={disabled} />
            )}
          />
          <div className="min-w-0 pb-1">
            <p className="truncate text-lg font-bold text-neutral-900 dark:text-foreground">
              {name?.trim() || t("storeNamePlaceholder")}
            </p>
            <p className="text-[12.5px] text-muted-foreground">{t("brandHint")}</p>
          </div>
        </div>
        <div className="px-5 pb-3 empty:hidden">
          <InlineError name="bannerUrl" />
          <InlineError name="logoUrl" />
        </div>
      </div>

      <FieldGrid>
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel className="text-sm font-semibold text-neutral-900 data-[error=true]:text-neutral-900 dark:text-foreground">
                {t("businessName")}
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type="text"
                    placeholder={t("enterBusinessName")}
                    className="h-11.5 rounded-[10px] border-neutral-300 bg-card px-3.5 pe-10 text-[15px] md:text-[15px] dark:border-input"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onNameEdited();
                      form.clearErrors("businessName");
                    }}
                  />
                </FormControl>
                <span className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2">
                  {nameCheck === "checking" && <Spinner className="size-4 text-muted-foreground" />}
                  {nameCheck === "available" && <Check className="size-4 text-success" />}
                  {nameCheck === "taken" && <X className="size-4 text-destructive" />}
                </span>
              </div>
              <FormMessage className="text-[13px] font-medium" />
            </FormItem>
          )}
        />

        <ChoiceField
          name="businessType"
          label={t("businessType")}
          className="sm:col-span-2"
          columns={2}
          options={BUSINESS_TYPE_OPTIONS.map(({ value }) => {
            const Icon = BUSINESS_TYPE_ICONS[value];
            return {
              value,
              icon: <Icon />,
              label: t(`businessType_${value}`),
              description: t(`businessTypeHint_${value}`),
            };
          })}
        />

        <TextAreaField
          name="description"
          label={t("businessDescription")}
          placeholder={t("tellCustomersAboutBusiness")}
          className="sm:col-span-2"
          optional
          maxLength={1000}
        />

        <TextField
          name="supportEmail"
          type="email"
          dir="ltr"
          label={t("supportEmail")}
          placeholder="support@store.com"
          description={t("supportEmailHint")}
        />
        <TextField
          name="supportPhone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          label={t("supportPhone")}
          placeholder="01XXXXXXXXX"
          description={t("supportPhoneHint")}
        />
      </FieldGrid>
    </>
  );
}
