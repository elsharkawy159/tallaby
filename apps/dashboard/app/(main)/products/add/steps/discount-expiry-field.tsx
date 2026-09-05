"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Switch } from "@workspace/ui/components/switch";
import { DateTimeInput } from "@workspace/ui/components";
import type { AddProductFormData } from "../add-product.schema";

interface DiscountExpiryFieldProps {
  name: string;
  label?: string;
}

function defaultExpiry(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  date.setHours(23, 59, 0, 0);
  return date;
}

export function DiscountExpiryField({
  name,
  label = "Discount expiry",
}: DiscountExpiryFieldProps) {
  const form = useFormContext<AddProductFormData>();
  const value = form.watch(name as any) as Date | null | undefined;
  const [enabled, setEnabled] = useState<boolean>(!!value);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      form.setValue(name as any, null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else if (!value) {
      form.setValue(name as any, defaultExpiry(), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Switch
          id={`${name}-toggle`}
          checked={enabled}
          onCheckedChange={handleToggle}
        />
        <label
          htmlFor={`${name}-toggle`}
          className="text-sm font-medium cursor-pointer"
        >
          {label}
        </label>
      </div>

      {enabled && (
        <DateTimeInput
          name={name}
          placeholder="Select expiry date & time"
          minDate={new Date()}
          showClearButton={false}
        />
      )}
    </div>
  );
}
