"use client";

import { useEffect, useCallback, useRef } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import {
  calculateDiscountFromFinalPrice,
  calculateProductFinalPrice,
  getFinalPriceHelpText,
  roundPriceToNearestNine,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib";
import { ImageUpload } from "@/components/inputs/image-upload";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import {
  TextInput,
  SelectInput,
  CurrencyInput,
  Toggle,
  SwitchInput,
} from "@workspace/ui/components";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { FormControl, FormLabel } from "@workspace/ui/components/form";
import type {
  AddProductFormData,
  SupportedLocale,
} from "../add-product.schema";
import { fulfillmentOptions } from "../add-product.schema";
import {
  buildVariantLocalizedFromCombo,
  createEmptyVariantType,
  getVariantValueIndexes,
  reconstructVariantTypesFromVariants,
  type VariantTypeFormValue,
} from "@/lib/utils/variant-types.lib";
import { VariantPricingFields } from "./variant-pricing-fields";
import { Badge } from "@workspace/ui/components/badge";

interface PriceStockStepProps {
  sellerPricing: SellerPricingSettings;
  activeLocale: SupportedLocale;
}

export function PriceStockStep({
  sellerPricing,
  activeLocale,
}: PriceStockStepProps) {
  const form = useFormContext<AddProductFormData>();

  const applyNearestNineRounding = useCallback(
    (field: "price.list" | "price.final", value: number) => {
      if (value <= 0) {
        return;
      }

      const rounded = roundPriceToNearestNine(value);

      if (rounded !== value) {
        form.setValue(field, rounded, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [form]
  );

  const listPrice = form.watch("price.list");
  const discountValue = form.watch("price.discountValue");
  const discountType = form.watch("price.discountType");
  const finalPrice = form.watch("price.final");

  const prevPricingRef = useRef({
    listPrice,
    discountValue,
    discountType,
    finalPrice,
  });

  useEffect(() => {
    const numericList = typeof listPrice === "number" ? listPrice : 0;
    const prev = prevPricingRef.current;

    const listChanged = listPrice !== prev.listPrice;
    const discountChanged =
      discountValue !== prev.discountValue ||
      discountType !== prev.discountType;
    const finalChanged = finalPrice !== prev.finalPrice;

    prevPricingRef.current = {
      listPrice,
      discountValue,
      discountType,
      finalPrice,
    };

    if (numericList <= 0) {
      return;
    }

    form.setValue("price.base", numericList, {
      shouldDirty: true,
      shouldValidate: false,
    });

    if (listChanged || discountChanged) {
      const calculatedFinal = calculateProductFinalPrice(
        numericList,
        discountValue,
        discountType,
        sellerPricing
      );

      form.setValue("price.final", calculatedFinal, {
        shouldDirty: true,
        shouldValidate: true,
      });
      prevPricingRef.current.finalPrice = calculatedFinal;
      return;
    }

    if (finalChanged) {
      const calculatedDiscount = calculateDiscountFromFinalPrice(
        numericList,
        finalPrice,
        discountType,
        sellerPricing
      );

      form.setValue("price.discountValue", calculatedDiscount, {
        shouldDirty: true,
        shouldValidate: true,
      });
      prevPricingRef.current.discountValue = calculatedDiscount;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPrice, discountValue, discountType, finalPrice, sellerPricing]);

  return (
    <div className="space-y-6">
      {/* Pricing Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold">Price</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <CurrencyInput
              name="price.list"
              label="Product price"
              placeholder="0.00"
              className="text-sm"
              required
              onBlurValue={(value) => applyNearestNineRounding("price.list", value)}
            />
          </div>

          <CurrencyInput
            name="price.discountValue"
            label="Discount"
            placeholder="0.00"
            // helpText="Discount amount or percentage"
            className="text-sm"
          />
          <div className="flex flex-col gap-2">
            <FormLabel className="text-sm">Discount Type</FormLabel>
            <Controller
              name="price.discountType"
              control={form.control}
              defaultValue="amount"
              render={({ field }) => {
                const currentValue = field.value || "amount";
                const isAmount = currentValue === "amount";
                const isPercent = currentValue === "percent";
                return (
                  <div className="flex items-center">
                    <Toggle
                      pressed={isAmount}
                      onPressedChange={() => {
                        field.onChange("amount");
                      }}
                      variant="outline"
                      className="flex-1 text-xs rounded-r-none h-10 px-3 min-w-20"
                      aria-label="Amount discount type"
                    >
                      Amount
                    </Toggle>
                    <Toggle
                      pressed={isPercent}
                      onPressedChange={() => {
                        field.onChange("percent");
                      }}
                      variant="outline"
                      className="flex-1 text-xs rounded-l-none border-l-0 h-10 min-w-20"
                      aria-label="Percent discount type"
                    >
                      Percent %
                    </Toggle>
                  </div>
                );
              }}
            />
          </div>
          <CurrencyInput
            name="price.final"
            label="Final Price"
            placeholder="0.00"
            helpText={getFinalPriceHelpText(sellerPricing)}
            className="text-sm"
            onBlurValue={(value) => applyNearestNineRounding("price.final", value)}
          />
        </div>
      </div>

      {/* Inventory Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold">Inventory</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextInput
            form={form}
            name="sku"
            label="SKU"
            placeholder="PROD-12345"
            className="text-sm"
          />
          <TextInput
            form={form}
            name="quantity"
            label="Quantity"
            type="number"
            placeholder="0"
            required
            className="text-sm"
          />
          {/* <TextInput
            form={form}
            name="maxOrderQuantity"
            label="Low Stock Alert"
            type="number"
            placeholder="0"
            className="text-sm"
          /> */}
        </div>
      </div>

      {/* Variants Section */}
      <VariantsSection sellerPricing={sellerPricing} activeLocale={activeLocale} />

      {/* Shipping Options - Collapsible */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="shipping" className="border-0">
            <AccordionTrigger className="px-6 py-3 text-sm font-semibold hover:no-underline">
              Shipping Options
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectInput
                  name="fulfillmentType"
                  label="Fulfillment Method"
                  placeholder="Select fulfillment"
                  options={fulfillmentOptions}
                  required
                  className="text-sm"
                />
                <TextInput
                  form={form}
                  name="handlingTime"
                  label="Handling Time (days)"
                  type="number"
                  placeholder="1"
                  required
                  className="text-sm"
                />
              </div>

              <SwitchInput
                name="freeDelivery"
                label="Free delivery on this product"
                labelPosition="right"
                className="rounded-lg border border-gray-200 p-4"
              />

              {/* Dimensions */}
              <div className="space-y-2">
                <FormLabel className="text-sm">Product Weight</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <TextInput
                    form={form}
                    name="dimensions.weight"
                    label="Weight"
                    type="number"
                    placeholder="0.0"
                    className="text-sm"
                  />
                  <SelectInput
                    name="dimensions.weightUnit"
                    label="Unit"
                    placeholder="Select unit"
                    options={[
                      { value: "kg", label: "kg" },
                      { value: "g", label: "g" },
                      { value: "lb", label: "lb" },
                    ]}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <FormLabel className="text-sm">Dimensions</FormLabel>
                <div className="grid grid-cols-4 gap-4">
                  <TextInput
                    form={form}
                    name="dimensions.length"
                    label="Length"
                    type="number"
                    placeholder="0"
                    className="text-sm"
                  />
                  <TextInput
                    form={form}
                    name="dimensions.width"
                    label="Width"
                    type="number"
                    placeholder="0"
                    className="text-sm"
                  />
                  <TextInput
                    form={form}
                    name="dimensions.height"
                    label="Height"
                    type="number"
                    placeholder="0"
                    className="text-sm"
                  />
                  <SelectInput
                    name="dimensions.unit"
                    label="Unit"
                    placeholder="Select unit"
                    options={[
                      { value: "cm", label: "cm" },
                      { value: "in", label: "in" },
                    ]}
                    className="text-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

function VariantsSection({
  sellerPricing,
  activeLocale,
}: {
  sellerPricing: SellerPricingSettings;
  activeLocale: SupportedLocale;
}) {
  const form = useFormContext<AddProductFormData>();
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const variantTypes = (form.watch("variantTypes") ?? []) as VariantTypeFormValue[];

  const setVariantTypes = (next: VariantTypeFormValue[]) => {
    form.setValue("variantTypes", next, { shouldDirty: true });
  };

  useEffect(() => {
    const currentTypes = form.getValues("variantTypes") ?? [];
    const currentVariants = form.getValues("variants") ?? [];

    if (currentTypes.length === 0 && currentVariants.length > 0) {
      form.setValue(
        "variantTypes",
        reconstructVariantTypesFromVariants(currentVariants),
        { shouldDirty: false }
      );
    }
  }, [form]);

  const mainListPrice = form.watch("price.list");
  const mainDiscountValue = form.watch("price.discountValue");
  const mainDiscountType = form.watch("price.discountType");
  const mainQuantity = form.watch("quantity");

  useEffect(() => {
    const variants = form.getValues("variants") || [];
    const defaultIndex = variants.findIndex((variant) => variant.isDefault);

    if (defaultIndex === -1) {
      return;
    }

    const numericList = typeof mainListPrice === "number" ? mainListPrice : 0;

    if (numericList <= 0) {
      return;
    }

    const syncedFinal = calculateProductFinalPrice(
      numericList,
      mainDiscountValue,
      mainDiscountType,
      sellerPricing
    );
    const numericQuantity =
      typeof mainQuantity === "number" ? mainQuantity : 0;

    form.setValue(`variants.${defaultIndex}.listPrice`, numericList, {
      shouldDirty: true,
      shouldValidate: false,
    });
    form.setValue(
      `variants.${defaultIndex}.discountValue`,
      mainDiscountValue ?? 0,
      { shouldDirty: true, shouldValidate: false }
    );
    form.setValue(
      `variants.${defaultIndex}.discountType`,
      mainDiscountType ?? "percent",
      { shouldDirty: true, shouldValidate: false }
    );
    form.setValue(`variants.${defaultIndex}.price`, syncedFinal, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue(`variants.${defaultIndex}.stock`, numericQuantity, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [
    form,
    mainDiscountType,
    mainDiscountValue,
    mainListPrice,
    mainQuantity,
    sellerPricing,
  ]);

  const handleSetDefaultVariant = (index: number) => {
    const variants = form.getValues("variants") || [];

    variants.forEach((_, variantIndex) => {
      form.setValue(`variants.${variantIndex}.isDefault`, variantIndex === index, {
        shouldDirty: true,
      });
    });
  };

  const generateValueIndexCombinations = (
    types: VariantTypeFormValue[]
  ): number[][] => {
    if (types.length === 0) {
      return [];
    }

    const valueCounts = types.map((type) =>
      Math.max(type.localized.en.values.length, type.localized.ar.values.length, 0)
    );

    if (valueCounts.some((count) => count === 0)) {
      return [];
    }

    if (types.length === 1) {
      return Array.from({ length: valueCounts[0]! }, (_, index) => [index]);
    }

    const combinations: number[][] = [];

    function cartesianProduct(
      arrays: number[][],
      index = 0,
      current: number[] = []
    ): void {
      if (index === arrays.length) {
        combinations.push([...current]);
        return;
      }

      for (const valueIndex of arrays[index]!) {
        current.push(valueIndex);
        cartesianProduct(arrays, index + 1, current);
        current.pop();
      }
    }

    cartesianProduct(valueCounts.map((count) => Array.from({ length: count }, (_, i) => i)));

    return combinations;
  };

  const isValidVariantType = (type: VariantTypeFormValue) => {
    const englishReady =
      type.localized.en.name.trim().length > 0 &&
      type.localized.en.values.some((value) => value.trim());
    const arabicReady =
      type.localized.ar.name.trim().length > 0 &&
      type.localized.ar.values.some((value) => value.trim());

    return englishReady || arabicReady;
  };

  // Sync combinations to form variants
  useEffect(() => {
    if (variantTypes.length === 0) {
      replace([]);
      return;
    }

    const validTypes = variantTypes.filter(isValidVariantType);

    if (validTypes.length === 0) {
      replace([]);
      return;
    }

    const combinations = generateValueIndexCombinations(validTypes);
    const baseSku = form.getValues("sku") || "PROD";
    const numericMainList =
      typeof form.getValues("price.list") === "number"
        ? form.getValues("price.list")
        : 0;
    const mainDiscount = form.getValues("price.discountValue");
    const mainDiscountTypeValue = form.getValues("price.discountType") ?? "percent";
    const baseFinal =
      numericMainList > 0
        ? calculateProductFinalPrice(
            numericMainList,
            mainDiscount,
            mainDiscountTypeValue,
            sellerPricing
          )
        : 0;
    const hasExistingDefault = fields.some(
      (variant) => (variant as { isDefault?: boolean }).isDefault
    );

    const variants = combinations.map((valueIndexes, index) => {
      const localized = buildVariantLocalizedFromCombo(validTypes, valueIndexes);
      const englishTitle = localized.en.title;
      const comboSlug = valueIndexes
        .map((valueIndex, typeIndex) => {
          const englishValue =
            validTypes[typeIndex]?.localized.en.values[valueIndex] ?? "value";
          return englishValue.toLowerCase().replace(/\s+/g, "-");
        })
        .join("-");
      const sku = `${baseSku}-${comboSlug}`.toUpperCase();

      const existingVariant = fields.find((variant) => {
        const existingIndexes = getVariantValueIndexes(
          validTypes,
          variant as {
            option1?: string;
            option2?: string;
            option3?: string;
            localized?: unknown;
            optionValueIndexes?: number[];
          }
        );

        return existingIndexes.every(
          (valueIndex, typeIndex) => valueIndex === valueIndexes[typeIndex]
        );
      });

      const existingImages = (existingVariant as { images?: string[] })?.images;
      const existingImageUrl = (existingVariant as { imageUrl?: string })?.imageUrl;
      const images =
        existingImages && existingImages.length > 0
          ? existingImages
          : existingImageUrl
            ? [existingImageUrl]
            : [];
      const wasDefault = (existingVariant as { isDefault?: boolean })?.isDefault;
      const isDefault = wasDefault ?? (!hasExistingDefault && index === 0);

      return {
        title: englishTitle,
        sku: (existingVariant as { sku?: string })?.sku || sku,
        listPrice:
          (existingVariant as { listPrice?: number })?.listPrice ?? numericMainList,
        discountValue:
          (existingVariant as { discountValue?: number })?.discountValue ??
          mainDiscount ??
          0,
        discountType:
          (existingVariant as { discountType?: "amount" | "percent" })?.discountType ??
          mainDiscountTypeValue,
        price:
          (existingVariant as { price?: number })?.price ||
          baseFinal ||
          numericMainList,
        stock: (existingVariant as { stock?: number })?.stock || 0,
        isDefault,
        images,
        imageUrl: images[0] ?? undefined,
        localized,
        optionValueIndexes: valueIndexes,
        option1: localized.en.option1,
        option2: localized.en.option2,
        option3: localized.en.option3,
        barCode: (existingVariant as { barCode?: string })?.barCode || "",
        position: index + 1,
      };
    });

    replace(variants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantTypes, replace, activeLocale]);

  const handleAddVariantType = () => {
    setVariantTypes([...variantTypes, createEmptyVariantType()]);
  };

  const handleRemoveVariantType = (id: string) => {
    setVariantTypes(variantTypes.filter((type) => type.id !== id));
  };

  const handleUpdateVariantTypeName = (id: string, name: string) => {
    setVariantTypes(
      variantTypes.map((type) =>
        type.id === id
          ? {
              ...type,
              localized: {
                ...type.localized,
                [activeLocale]: {
                  ...type.localized[activeLocale],
                  name,
                },
              },
            }
          : type
      )
    );
  };

  const handleAddValue = (typeId: string) => {
    setVariantTypes(
      variantTypes.map((type) => {
        if (type.id !== typeId) {
          return type;
        }

        return {
          ...type,
          localized: {
            en: {
              ...type.localized.en,
              values: [...type.localized.en.values, ""],
            },
            ar: {
              ...type.localized.ar,
              values: [...type.localized.ar.values, ""],
            },
          },
        };
      })
    );
  };

  const handleRemoveValue = (typeId: string, valueIndex: number) => {
    setVariantTypes(
      variantTypes.map((type) => {
        if (type.id !== typeId) {
          return type;
        }

        return {
          ...type,
          localized: {
            en: {
              ...type.localized.en,
              values: type.localized.en.values.filter(
                (_, index) => index !== valueIndex
              ),
            },
            ar: {
              ...type.localized.ar,
              values: type.localized.ar.values.filter(
                (_, index) => index !== valueIndex
              ),
            },
          },
        };
      })
    );
  };

  const handleUpdateValue = (
    typeId: string,
    valueIndex: number,
    value: string
  ) => {
    setVariantTypes(
      variantTypes.map((type) => {
        if (type.id !== typeId) {
          return type;
        }

        return {
          ...type,
          localized: {
            ...type.localized,
            [activeLocale]: {
              ...type.localized[activeLocale],
              values: type.localized[activeLocale].values.map((entry, index) =>
                index === valueIndex ? value : entry
              ),
            },
          },
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Variant Types Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold">
              Product Types and Sub-options
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Add characteristics such as colors and sizes. Use the content
              language tabs above to enter English and Arabic labels.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddVariantType}
            className="text-xs"
          >
            + Add Sub-type
          </Button>
        </div>

        {variantTypes.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            No variant types added. Use the button above to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {variantTypes.map((type: VariantTypeFormValue) => (
              <div
                key={type.id}
                className="rounded-md border border-gray-200 p-4 space-y-4 bg-gray-50"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-700 block mb-2">
                        Sub-option Type ({activeLocale === "en" ? "English" : "العربية"})
                      </label>
                      <Input
                        value={type.localized[activeLocale].name}
                        onChange={(e) =>
                          handleUpdateVariantTypeName(type.id, e.target.value)
                        }
                        placeholder={
                          activeLocale === "en"
                            ? "e.g., Color, Size, Weight"
                            : "مثال: اللون، الحجم، الوزن"
                        }
                        className="text-sm h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariantType(type.id)}
                      className="text-xs text-destructive hover:text-destructive mt-6"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700 block">
                      Value or Property
                    </label>
                    <div className="space-y-2">
                      {type.localized[activeLocale].values.map(
                        (value: string, valueIndex: number) => (
                        <div key={valueIndex} className="flex gap-2">
                          <Input
                            value={value}
                            onChange={(e) =>
                              handleUpdateValue(
                                type.id,
                                valueIndex,
                                e.target.value
                              )
                            }
                            placeholder={
                              activeLocale === "en" ? "e.g., Red" : "مثال: أحمر"
                            }
                            className="text-sm h-9 flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveValue(type.id, valueIndex)
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddValue(type.id)}
                        className="text-xs w-full"
                      >
                        + Add another value
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variant Combinations Table */}
      {fields.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold">Product Combinations</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-700">
                    Combination
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-700 min-w-[220px]">
                    Images
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-700 min-w-[300px]">
                    Pricing
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-700">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-700">
                    Barcode
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index: number) => {
                  const variant = field as {
                    id: string;
                    title: string;
                    option1?: string;
                    option2?: string;
                    option3?: string;
                  };
                  const isDefaultVariant =
                    form.watch(`variants.${index}.isDefault`) === true;
                  const localizedDisplay = form.watch(`variants.${index}.localized`);
                  const displayTitle =
                    localizedDisplay?.[activeLocale]?.title ?? variant.title;
                  const displayOptions = [
                    localizedDisplay?.[activeLocale]?.option1 ?? variant.option1,
                    localizedDisplay?.[activeLocale]?.option2 ?? variant.option2,
                    localizedDisplay?.[activeLocale]?.option3 ?? variant.option3,
                  ].filter(Boolean);

                  return (
                    <tr key={variant.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={isDefaultVariant}
                              onChange={() => handleSetDefaultVariant(index)}
                              className="h-4 w-4"
                              aria-label={`Set ${displayTitle} as default variant`}
                            />
                            {isDefaultVariant && (
                              <Badge variant="secondary" className="text-[10px]">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {displayTitle}
                          </p>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {displayOptions.map((option) => (
                              <p key={option}>{option}</p>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 min-w-[220px]">
                        <Controller
                          name={`variants.${index}.images`}
                          control={form.control}
                          render={({ field }) => (
                            <FormControl>
                              <ImageUpload
                                bucket="products"
                                value={field.value || []}
                                onChange={(images) => {
                                  field.onChange(images);
                                  form.setValue(
                                    `variants.${index}.imageUrl`,
                                    images[0] ?? undefined,
                                    { shouldValidate: true }
                                  );
                                }}
                                form={form}
                                maxImages={5}
                              />
                            </FormControl>
                          )}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <VariantPricingFields
                          index={index}
                          sellerPricing={sellerPricing}
                          isDefault={isDefaultVariant}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <TextInput
                          form={form}
                          name={`variants.${index}.stock`}
                          type="number"
                          placeholder="0"
                          className="text-sm w-full"
                          disabled={isDefaultVariant}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <TextInput
                          form={form}
                          name={`variants.${index}.barCode`}
                          placeholder="Barcode"
                          className="text-sm w-full"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
