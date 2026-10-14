"use client";

import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ImageIcon, Info } from "lucide-react";
import { ImageUpload } from "@/components/inputs/image-upload";
import { FieldError, SectionCard } from "@/components/form/form-ui";
import { useFieldError } from "./fields";
import type { AddProductFormData } from "../add-product.schema";

export const MAX_PRODUCT_IMAGES = 8;

export function MediaSection({ id = "sec-media" }: { id?: string }) {
  const t = useTranslations("productForm.sections.media");
  const form = useFormContext<AddProductFormData>();
  const error = useFieldError("images");

  return (
    <SectionCard
      id={id}
      icon={ImageIcon}
      title={
        <>
          <span className="me-1 font-bold text-destructive">*</span>
          {t("title")}
        </>
      }
      description={t("description")}
      divided={false}
      invalid={Boolean(error)}
    >
      <Controller
        control={form.control}
        name="images"
        render={({ field }) => (
          <ImageUpload
            bucket="products"
            value={field.value || []}
            onChange={(images) => {
              field.onChange(images);
              field.onBlur();
            }}
            form={form}
            maxImages={MAX_PRODUCT_IMAGES}
            footer={
              <span className="inline-flex items-center gap-1.5">
                <Info className="size-3.5 shrink-0" aria-hidden />
                {t("hint")}
              </span>
            }
          />
        )}
      />
      <FieldError>{error}</FieldError>
    </SectionCard>
  );
}
