import type { UseFormReturn } from "react-hook-form";
import slugify from "slugify";
import {
  calculateDiscountFromFinalPrice,
  calculateProductFinalPrice,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib";
import {
  createEmptyVariantType,
  type VariantTypeFormValue,
} from "@/lib/utils/variant-types.lib";
import { searchBrands } from "@/actions/brands";
import {
  flattenCategories,
  searchCategoriesByProductName,
} from "./add-product.lib";
import type {
  AddProductFormData,
  CategoryOption,
  SupportedLocale,
} from "./add-product.schema";
import type { ParsedProductImport } from "./parse-product-import.types";

export interface ApplyProductImportContext {
  sellerPricing: SellerPricingSettings;
  categories: CategoryOption[];
}

export interface ApplyProductImportResult {
  imagesImported: number;
  brandMatched: boolean;
  categoryMatched: boolean;
}

const LOCALES: SupportedLocale[] = ["en", "ar"];

export async function applyProductImportToForm(
  form: UseFormReturn<AddProductFormData>,
  data: ParsedProductImport,
  ctx: ApplyProductImportContext
): Promise<ApplyProductImportResult> {
  const result: ApplyProductImportResult = {
    imagesImported: 0,
    brandMatched: false,
    categoryMatched: false,
  };

  for (const locale of LOCALES) {
    const fields = data.localized?.[locale];
    if (!fields) continue;

    if (fields.title) {
      form.setValue(`localized.${locale}.title`, fields.title, {
        shouldDirty: true,
      });
      form.setValue(
        `localized.${locale}.slug`,
        slugify(fields.title, { lower: true, strict: true }),
        { shouldDirty: true, shouldValidate: locale === "en" }
      );
    }

    if (fields.description) {
      form.setValue(`localized.${locale}.description`, fields.description, {
        shouldDirty: true,
      });
    }

    if (fields.content) {
      form.setValue(`localized.${locale}.content`, fields.content, {
        shouldDirty: true,
      });
    }

    if (fields.bulletPoints && fields.bulletPoints.length > 0) {
      form.setValue(
        `localized.${locale}.bulletPoints`,
        fields.bulletPoints.slice(0, 10),
        { shouldDirty: true, shouldValidate: true }
      );
    }

    const currentMetaTitle = form.getValues(`localized.${locale}.metaTitle`);
    const currentMetaDesc = form.getValues(
      `localized.${locale}.metaDescription`
    );

    if (fields.metaTitle) {
      form.setValue(
        `localized.${locale}.metaTitle`,
        fields.metaTitle.slice(0, 60),
        { shouldDirty: true }
      );
    } else if (!currentMetaTitle && fields.title) {
      form.setValue(
        `localized.${locale}.metaTitle`,
        fields.title.slice(0, 60),
        { shouldDirty: true }
      );
    }

    if (fields.metaDescription) {
      form.setValue(
        `localized.${locale}.metaDescription`,
        fields.metaDescription.slice(0, 160),
        { shouldDirty: true }
      );
    } else if (!currentMetaDesc && fields.description) {
      form.setValue(
        `localized.${locale}.metaDescription`,
        fields.description.slice(0, 160),
        { shouldDirty: true }
      );
    }
  }

  if (data.price?.list) {
    const listPrice = data.price.list;
    form.setValue("price.list", listPrice, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("price.base", listPrice, { shouldDirty: true });

    const discountType = data.price.discountType ?? "amount";

    if (data.price.final) {
      form.setValue("price.final", data.price.final, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (data.price.discountValue !== undefined) {
        form.setValue("price.discountValue", data.price.discountValue, {
          shouldDirty: true,
        });
        form.setValue("price.discountType", discountType, { shouldDirty: true });
      } else {
        const derivedDiscount = calculateDiscountFromFinalPrice(
          listPrice,
          data.price.final,
          discountType,
          ctx.sellerPricing
        );
        form.setValue("price.discountValue", derivedDiscount, {
          shouldDirty: true,
        });
        form.setValue("price.discountType", discountType, { shouldDirty: true });
      }
    } else if (data.price.discountValue !== undefined) {
      form.setValue("price.discountValue", data.price.discountValue, {
        shouldDirty: true,
      });
      form.setValue("price.discountType", discountType, { shouldDirty: true });
      const calculatedFinal = calculateProductFinalPrice(
        listPrice,
        data.price.discountValue,
        discountType,
        ctx.sellerPricing
      );
      form.setValue("price.final", calculatedFinal, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      const fallbackFinal = calculateProductFinalPrice(
        listPrice,
        undefined,
        discountType,
        ctx.sellerPricing
      );
      form.setValue("price.final", fallbackFinal, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  } else if (data.price?.final) {
    form.setValue("price.final", data.price.final, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  if (data.sku) {
    form.setValue("sku", data.sku, { shouldDirty: true });
  }

  if (data.quantity !== undefined) {
    form.setValue("quantity", data.quantity, {
      shouldDirty: true,
      shouldValidate: true,
    });
  } else {
    const currentQty = form.getValues("quantity");
    if (
      typeof currentQty !== "number" ||
      !Number.isFinite(currentQty) ||
      currentQty <= 0
    ) {
      form.setValue("quantity", 25, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  if (data.variantTypes && data.variantTypes.length > 0) {
    const variantTypes: VariantTypeFormValue[] = data.variantTypes.map(
      (vt, index) => {
        const base = createEmptyVariantType(`import-type-${index}`);
        return {
          ...base,
          localized: {
            en: {
              name: vt.localized.en.name,
              values: vt.localized.en.values,
            },
            ar: {
              name: vt.localized.ar.name,
              values: vt.localized.ar.values,
            },
          },
        };
      }
    );
    form.setValue(
      "variantTypes",
      variantTypes as AddProductFormData["variantTypes"],
      { shouldDirty: true }
    );
  }

  if (data.dimensions) {
    const dims = data.dimensions;
    if (dims.length !== undefined) {
      form.setValue("dimensions.length", dims.length, { shouldDirty: true });
    }
    if (dims.width !== undefined) {
      form.setValue("dimensions.width", dims.width, { shouldDirty: true });
    }
    if (dims.height !== undefined) {
      form.setValue("dimensions.height", dims.height, { shouldDirty: true });
    }
    if (dims.weight !== undefined) {
      form.setValue("dimensions.weight", dims.weight, { shouldDirty: true });
    }
    if (dims.unit) {
      form.setValue("dimensions.unit", dims.unit, { shouldDirty: true });
    }
    if (dims.weightUnit) {
      form.setValue("dimensions.weightUnit", dims.weightUnit, {
        shouldDirty: true,
      });
    }
  }

  if (data.fulfillmentType) {
    form.setValue("fulfillmentType", data.fulfillmentType, {
      shouldDirty: true,
    });
  }

  if (data.freeDelivery !== undefined) {
    form.setValue("freeDelivery", data.freeDelivery, { shouldDirty: true });
  }

  if (data.handlingTime !== undefined) {
    form.setValue("handlingTime", data.handlingTime, { shouldDirty: true });
  }

  if (data.condition) {
    form.setValue("condition", data.condition, { shouldDirty: true });
  }

  if (data.isTrending !== undefined) {
    form.setValue("isTrending", data.isTrending, { shouldDirty: true });
  }

  if (data.isSeasonal !== undefined) {
    form.setValue("isSeasonal", data.isSeasonal, { shouldDirty: true });
  }

  if (data.isFeatured !== undefined) {
    form.setValue("isFeatured", data.isFeatured, { shouldDirty: true });
  }

  if (data.notes) {
    form.setValue("notes", data.notes, { shouldDirty: true });
  }

  if (data.brand) {
    result.brandMatched = await matchBrandByName(form, data.brand);
  }

  if (data.category) {
    result.categoryMatched = matchCategoryByName(
      form,
      ctx.categories,
      data.category
    );
  } else {
    const title = data.localized?.en?.title;
    if (title) {
      const suggestions = searchCategoriesByProductName(
        ctx.categories,
        title,
        1
      );
      if (suggestions.length > 0) {
        form.setValue("categoryId", suggestions[0]!.id, {
          shouldDirty: true,
          shouldValidate: true,
        });
        result.categoryMatched = true;
      }
    }
  }

  if (data.images && data.images.length > 0) {
    result.imagesImported = await importProductImages(form, data.images);
  }

  return result;
}

async function matchBrandByName(
  form: UseFormReturn<AddProductFormData>,
  brandName: string
): Promise<boolean> {
  try {
    const res = await searchBrands(brandName.trim());
    if (!res.success || !res.data?.length) return false;

    const normalized = brandName.trim().toLowerCase();
    const exact = res.data.find(
      (b) => b.name.toLowerCase() === normalized
    );
    const match = exact ?? res.data[0];

    if (match) {
      form.setValue("brandId", match.id, { shouldDirty: true });
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function matchCategoryByName(
  form: UseFormReturn<AddProductFormData>,
  categories: CategoryOption[],
  categoryName: string
): boolean {
  const normalized = categoryName.trim().toLowerCase();
  const flat = flattenCategories(categories);

  const exact = flat.find(
    (c) =>
      c.name.toLowerCase() === normalized ||
      (c.nameAr && c.nameAr.toLowerCase() === normalized)
  );

  if (exact) {
    form.setValue("categoryId", exact.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    return true;
  }

  const partial = flat.find(
    (c) =>
      c.name.toLowerCase().includes(normalized) ||
      normalized.includes(c.name.toLowerCase()) ||
      (c.nameAr &&
        (c.nameAr.toLowerCase().includes(normalized) ||
          normalized.includes(c.nameAr.toLowerCase())))
  );

  if (partial) {
    form.setValue("categoryId", partial.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    return true;
  }

  const suggestions = searchCategoriesByProductName(categories, categoryName, 1);
  if (suggestions.length > 0) {
    form.setValue("categoryId", suggestions[0]!.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    return true;
  }

  return false;
}

async function importProductImages(
  form: UseFormReturn<AddProductFormData>,
  imageUrls: string[]
): Promise<number> {
  const currentImages = form.getValues("images") || [];
  if (Array.isArray(currentImages) && currentImages.length > 0) {
    return 0;
  }

  const urlsToImport = imageUrls.slice(0, 5);
  let totalImported = 0;

  for (let i = 0; i < urlsToImport.length; i += 5) {
    const batch = urlsToImport.slice(i, i + 5);
    const importRes = await fetch("/api/import-product-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: batch }),
    });

    const importData = await importRes.json();
    if (!importRes.ok) continue;

    const importedPaths = Array.isArray(importData?.paths)
      ? importData.paths.filter((p: unknown) => typeof p === "string")
      : [];

    if (importedPaths.length > 0) {
      const existing = form.getValues("images") || [];
      const merged = [...existing, ...importedPaths].slice(0, 8);
      form.setValue("images", merged, {
        shouldDirty: true,
        shouldValidate: true,
      });
      totalImported += importedPaths.length;
    }
  }

  if (totalImported > 0) {
    await form.trigger("images");
  }

  return totalImported;
}
