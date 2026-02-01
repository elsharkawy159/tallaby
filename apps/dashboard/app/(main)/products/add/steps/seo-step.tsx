"use client"

import { useFormContext } from "react-hook-form"
import { TextInput, TextareaInput } from "@workspace/ui/components"
import { cn } from "@/lib/utils"
import type { AddProductFormData, SupportedLocale } from "../add-product.schema"

interface SeoStepProps {
  activeLocale: SupportedLocale
}

export function SeoStep({ activeLocale }: SeoStepProps) {
  const form = useFormContext<AddProductFormData>()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Search Engine Listing</h3>
          <p className="text-xs text-gray-500 mt-1">
            Add a title and description to see how this product might appear in
            a search engine listing
          </p>
        </div>

        {(["en", "ar"] as const).map((loc) => (
          <div key={loc} className={cn("space-y-4", activeLocale !== loc && "hidden")}>
            <TextInput
              form={form}
              name={`localized.${loc}.metaTitle`}
              label="Meta Title"
              placeholder="SEO-friendly title for search engines"
              description="Recommended: 50-60 characters"
              className="text-sm"
            />

            <TextareaInput
              form={form}
              name={`localized.${loc}.metaDescription`}
              label="Meta Description"
              placeholder="Brief SEO description"
              rows={3}
              description="Recommended: 150-160 characters"
              className="text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
