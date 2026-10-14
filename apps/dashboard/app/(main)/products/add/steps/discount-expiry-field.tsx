"use client";

import { useLocale, useTranslations } from "next-intl";
import { ar as arLocale } from "date-fns/locale";

import { useId, useState } from "react";
import { useFormContext } from "react-hook-form";
import { DateTimeInput } from "@workspace/ui/components";
import { ToggleRow } from "@/components/form/form-ui";
import type { AddProductFormData } from "../add-product.schema";

interface DiscountExpiryFieldProps {
  name: string;
  /** Defaults to the short "Discount expiry" label. */
  title?: string;
  description?: string;
}

function defaultExpiry(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  date.setHours(23, 59, 0, 0);
  return date;
}

export function DiscountExpiryField({ name, title, description }: DiscountExpiryFieldProps) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.discountExpiry");
  const locale = useLocale();
  const id = useId();
  const value = form.watch(name as any) as Date | null | undefined;
  const [enabled, setEnabled] = useState<boolean>(!!value);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      form.setValue(name as any, null, { shouldDirty: true, shouldValidate: true });
    } else if (!value) {
      form.setValue(name as any, defaultExpiry(), { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <ToggleRow
        id={`${id}-discount-expiry`}
        checked={enabled || !!value}
        onCheckedChange={handleToggle}
        title={title ?? t("label")}
        description={description}
      />

      {(enabled || !!value) && (
        <div className="max-w-sm">
          <DateTimeInput
            name={name}
            placeholder={t("placeholder")}
            minDate={new Date()}
            showClearButton={false}
            locale={locale === "ar" ? arLocale : undefined}
          />
        </div>
      )}
    </div>
  );
}
