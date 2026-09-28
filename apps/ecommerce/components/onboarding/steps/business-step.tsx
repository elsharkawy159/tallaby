"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

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
import { SelectField, TextAreaField, TextField } from "../onboarding.chunks";

export type BusinessNameCheck = "idle" | "checking" | "available" | "taken";

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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Laid out like the store page header: cover banner, logo overlapping it. */}
      <div>
        <FormField
          control={form.control}
          name="bannerUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("storeBanner")}
                <span className="ms-1.5 font-normal text-muted-foreground">{t("optional")}</span>
              </FormLabel>
              <FormControl>
                <BannerUploader value={field.value} onChange={field.onChange} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem className="relative -mt-12 flex items-end gap-4 ps-4 md:-mt-16 md:ps-6">
              <FormControl>
                <LogoUploader
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  className="shrink-0 rounded-full ring-4 ring-background"
                />
              </FormControl>
              <div className="pb-2">
                <FormLabel>{t("businessLogo")}</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("businessName")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={t("enterBusinessName")}
                    className="ltr:pr-9 rtl:pl-9"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onNameEdited();
                      form.clearErrors("businessName");
                    }}
                  />
                  <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3">
                    {nameCheck === "checking" && (
                      <Spinner className="h-4 w-4 text-muted-foreground" />
                    )}
                    {nameCheck === "available" && <Check className="h-4 w-4 text-green-600" />}
                    {nameCheck === "taken" && <X className="h-4 w-4 text-destructive" />}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SelectField
          name="businessType"
          label={t("businessType")}
          placeholder={t("selectBusinessType")}
          options={BUSINESS_TYPE_OPTIONS.map((opt) => ({
            value: opt.value,
            label: t(`businessType_${opt.value}`),
          }))}
        />
      </div>

      <TextAreaField
        name="description"
        label={t("businessDescription")}
        placeholder={t("tellCustomersAboutBusiness")}
        rows={4}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          name="supportEmail"
          type="email"
          dir="ltr"
          label={t("supportEmail")}
          placeholder={t("enterBusinessEmail")}
        />
        <TextField
          name="supportPhone"
          type="tel"
          dir="ltr"
          label={t("supportPhone")}
          placeholder={t("enterSupportPhone")}
        />
      </div>
    </div>
  );
}
