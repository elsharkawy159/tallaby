"use client";

import { useEffect, useState, useCallback } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { ImageIcon, X, LoaderCircle } from "lucide-react";
import { createClient } from "@/supabase/client";
import { generateImageName, getPublicUrl, validateImage } from "@/lib/utils";
import { toast } from "sonner";
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
} from "@workspace/ui/components";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { FormLabel } from "@workspace/ui/components/form";
import type { AddProductFormData } from "../add-product.schema";
import { fulfillmentOptions } from "../add-product.schema";

export function PriceStockStep() {
  const form = useFormContext<AddProductFormData>();

  // Auto-calculate final price when list price changes (10% commission)
  const listPrice = form.watch("price.list");
  const discountValue = form.watch("price.discountValue");
  const discountType = form.watch("price.discountType");

  useEffect(
    () => {
      const commissionRate = 0.1;
      const numericList = typeof listPrice === "number" ? listPrice : 0;

      // Only calculate if list price is valid
      if (numericList <= 0) {
        return;
      }

      // Set base price equal to list price
      form.setValue("price.base", numericList, {
        shouldDirty: true,
        shouldValidate: false,
      });

      // Apply discount if present
      let discountedPrice = numericList;
      if (discountValue && Number(discountValue) > 0) {
        if (discountType === "percent") {
          discountedPrice =
            numericList - (numericList * Number(discountValue)) / 100;
        } else if (discountType === "amount") {
          discountedPrice = numericList - Number(discountValue);
        }
        // Prevent negative price
        if (discountedPrice < 0) discountedPrice = 0;
      }

      // Add commission
      const finalPrice = parseFloat(
        (discountedPrice * (1 + commissionRate)).toFixed(2)
      );

      form.setValue("price.final", finalPrice, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listPrice, discountValue, discountType]
  );

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
              currency="EGP"
              className="text-sm"
              required
            />
          </div>

          <CurrencyInput
            name="price.discountValue"
            label="Discount"
            placeholder="0.00"
            currency="EGP"
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
            currency="EGP"
            helpText="Product Display price (List Price + 10% commission)"
            disabled
            className="text-sm"
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
      <VariantsSection />

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

interface VariantType {
  id: string;
  name: string;
  values: string[];
}

function VariantImageUpload({
  form,
  name,
}: {
  form: ReturnType<typeof useFormContext<AddProductFormData>>;
  name: `variants.${number}.imageUrl`;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const supabase = createClient();

  const currentValue = form.watch(name);

  useEffect(() => {
    if (currentValue) {
      setPreviewUrl(getPublicUrl(currentValue, "products"));
    } else {
      setPreviewUrl(null);
    }
  }, [currentValue]);

  const handleFileUpload = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        await validateImage(file);
        const imageName = generateImageName(file);

        const { data, error } = await supabase.storage
          .from("products")
          .upload(imageName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload image");
          return null;
        }

        return data.path;
      } catch (error) {
        console.error("File upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload image"
        );
        return null;
      }
    },
    [supabase]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      const file = acceptedFiles[0];
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      try {
        const filePath = await handleFileUpload(file);
        if (filePath) {
          // Clean up preview blob URL
          URL.revokeObjectURL(preview);
          form.setValue(name, filePath, { shouldValidate: true });
          toast.success("Image uploaded successfully");
        } else {
          // Clean up preview blob URL on error
          URL.revokeObjectURL(preview);
          setPreviewUrl(
            currentValue ? getPublicUrl(currentValue, "products") : null
          );
        }
      } catch {
        // Clean up preview blob URL on error
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
        setPreviewUrl(
          currentValue ? getPublicUrl(currentValue, "products") : null
        );
      } finally {
        setIsUploading(false);
      }
    },
    [handleFileUpload, form, name, currentValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop,
    disabled: isUploading,
    maxFiles: 1,
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Clean up blob URL if it's a preview
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    form.setValue(name, undefined, { shouldValidate: true });
    setPreviewUrl(null);
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div
      {...getRootProps()}
      className={`relative w-16 h-16 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-gray-300 hover:border-gray-400"
      } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        <>
          <Image
            src={previewUrl}
            alt="Variant image"
            fill
            className="object-cover rounded-md"
            sizes="64px"
          />
          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {isUploading ? (
            <LoaderCircle className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      )}
    </div>
  );
}

function VariantsSection() {
  const form = useFormContext<AddProductFormData>();
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // Reconstruct variantTypes from existing form variants on mount
  const reconstructVariantTypes = useCallback(
    (
      variants: Array<{ option1?: string; option2?: string; option3?: string }>
    ): VariantType[] => {
      if (!variants || variants.length === 0) return [];

      const typeMap = new Map<string, Set<string>>();

      variants.forEach((variant) => {
        // Parse option1, option2, option3 to extract type name and value
        [variant.option1, variant.option2, variant.option3]
          .filter(Boolean)
          .forEach((option) => {
            if (option) {
              const match = option.match(/^(.+?):\s*(.+)$/);
              if (match) {
                const [, typeName, value] = match;
                if (!typeMap.has(typeName)) {
                  typeMap.set(typeName, new Set());
                }
                typeMap.get(typeName)!.add(value);
              }
            }
          });
      });

      return Array.from(typeMap.entries()).map(([name, valuesSet], index) => ({
        id: `type-${index}`,
        name,
        values: Array.from(valuesSet),
      }));
    },
    []
  );

  const [variantTypes, setVariantTypes] = useState<VariantType[]>(() => {
    const currentVariants = form.getValues("variants") || [];
    return reconstructVariantTypes(currentVariants);
  });

  // Generate combinations from variant types
  const generateCombinations = (types: VariantType[]): string[][] => {
    if (types.length === 0) return [];
    if (types.length === 1) {
      return types[0]!.values.map((v) => [v]);
    }

    const combinations: string[][] = [];

    function cartesianProduct(
      arrays: string[][],
      index = 0,
      current: string[] = []
    ): void {
      if (index === arrays.length) {
        combinations.push([...current]);
        return;
      }

      for (const value of arrays[index]!) {
        current.push(value);
        cartesianProduct(arrays, index + 1, current);
        current.pop();
      }
    }

    cartesianProduct(types.map((type) => type.values));
    return combinations;
  };

  // Sync combinations to form variants
  useEffect(() => {
    if (variantTypes.length === 0) {
      replace([]);
      return;
    }

    // Filter out variant types with no name or no values
    const validTypes = variantTypes.filter(
      (type: VariantType) =>
        type.name.trim() !== "" &&
        type.values.some((v: string) => v.trim() !== "")
    );

    if (validTypes.length === 0) {
      replace([]);
      return;
    }

    const combinations = generateCombinations(validTypes);
    const baseSku = form.getValues("sku") || "PROD";
    const basePrice = form.getValues("price.list") || 0;

    const variants = combinations.map((combo, index) => {
      const title = combo.join(" / ");
      const option1 = validTypes[0]
        ? `${validTypes[0].name}: ${combo[0]}`
        : undefined;
      const option2 =
        validTypes[1] && combo[1]
          ? `${validTypes[1].name}: ${combo[1]}`
          : undefined;
      const option3 =
        validTypes[2] && combo[2]
          ? `${validTypes[2].name}: ${combo[2]}`
          : undefined;
      const comboSlug = combo
        .map((v) => v.toLowerCase().replace(/\s+/g, "-"))
        .join("-");
      const sku = `${baseSku}-${comboSlug}`.toUpperCase();

      // Try to preserve existing data if combination matches
      const existingVariant = fields.find(
        (v: { option1?: string; option2?: string; option3?: string }) =>
          v.option1 === option1 &&
          v.option2 === option2 &&
          v.option3 === option3
      );

      return {
        title,
        sku: (existingVariant as { sku?: string })?.sku || sku,
        price: (existingVariant as { price?: number })?.price || basePrice,
        stock: (existingVariant as { stock?: number })?.stock || 0,
        imageUrl:
          (existingVariant as { imageUrl?: string })?.imageUrl || undefined,
        option1,
        option2,
        option3,
        barCode: (existingVariant as { barCode?: string })?.barCode || "",
        position: index + 1,
      };
    });

    replace(variants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantTypes, replace]);

  const handleAddVariantType = () => {
    setVariantTypes([
      ...variantTypes,
      {
        id: `type-${Date.now()}`,
        name: "",
        values: [],
      },
    ]);
  };

  const handleRemoveVariantType = (id: string) => {
    setVariantTypes(variantTypes.filter((type) => type.id !== id));
  };

  const handleUpdateVariantTypeName = (id: string, name: string) => {
    setVariantTypes(
      variantTypes.map((type: VariantType) =>
        type.id === id ? { ...type, name } : type
      )
    );
  };

  const handleAddValue = (typeId: string) => {
    setVariantTypes(
      variantTypes.map((type: VariantType) =>
        type.id === typeId ? { ...type, values: [...type.values, ""] } : type
      )
    );
  };

  const handleRemoveValue = (typeId: string, valueIndex: number) => {
    setVariantTypes(
      variantTypes.map((type: VariantType) =>
        type.id === typeId
          ? {
              ...type,
              values: type.values.filter(
                (_: string, idx: number) => idx !== valueIndex
              ),
            }
          : type
      )
    );
  };

  const handleUpdateValue = (
    typeId: string,
    valueIndex: number,
    value: string
  ) => {
    setVariantTypes(
      variantTypes.map((type: VariantType) =>
        type.id === typeId
          ? {
              ...type,
              values: type.values.map((v: string, idx: number) =>
                idx === valueIndex ? value : v
              ),
            }
          : type
      )
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
              Add different product characteristics such as colors, sizes,
              weights, etc.
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
            {variantTypes.map((type: VariantType) => (
              <div
                key={type.id}
                className="rounded-md border border-gray-200 p-4 space-y-4 bg-gray-50"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-700 block mb-2">
                        Sub-option Type
                      </label>
                      <Input
                        value={type.name}
                        onChange={(e) =>
                          handleUpdateVariantTypeName(type.id, e.target.value)
                        }
                        placeholder="e.g., Color, Size, Weight"
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
                      {type.values.map((value: string, valueIndex: number) => (
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
                            placeholder="e.g., Red"
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
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-700">
                    Image
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-700">
                    Price
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
                  return (
                    <tr key={variant.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {variant.title}
                          </p>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {variant.option1 && <p>{variant.option1}</p>}
                            {variant.option2 && <p>{variant.option2}</p>}
                            {variant.option3 && <p>{variant.option3}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <VariantImageUpload
                          form={form}
                          name={`variants.${index}.imageUrl`}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <CurrencyInput
                          name={`variants.${index}.price`}
                          placeholder="0.00"
                          currency="EGP"
                          className="text-sm w-full"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <TextInput
                          form={form}
                          name={`variants.${index}.stock`}
                          type="number"
                          placeholder="0"
                          className="text-sm w-full"
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
