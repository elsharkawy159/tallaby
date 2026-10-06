"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ChevronLeft, ChevronRight, Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { FormMessage, FormItem, FormField } from "@workspace/ui/components/form";
import { cn } from "@workspace/ui/lib/utils";

import { ImageUploadCell } from "@/components/image-upload-cell";
import {
  NumberField,
  Section,
  SelectField,
  SwitchRow,
  TextField,
  TextareaField,
} from "./fields";
import { FULFILLMENT_OPTIONS, slugify, type ProductFormValues } from "./types";

const DIRTY = { shouldDirty: true, shouldValidate: true } as const;

export function BasicsSection({ storefrontBaseUrl }: { storefrontBaseUrl: string }) {
  const { control, setValue, getValues } = useFormContext<ProductFormValues>();
  const bulletPoints = useWatch({ control, name: "bulletPoints" }) ?? [];
  const rows = bulletPoints.length ? bulletPoints : [""];

  const setBullets = (next: string[]) => setValue("bulletPoints", next, DIRTY);

  const updateBullet = (index: number, value: string) => {
    const next = [...rows];
    next[index] = value;
    setBullets(next);
  };

  const insertBulletAfter = (index: number) => {
    const next = [...rows];
    next.splice(index + 1, 0, "");
    setBullets(next);
    // Focus the new row once it renders.
    requestAnimationFrame(() =>
      document.getElementById(`bullet-${index + 1}`)?.focus()
    );
  };

  const removeBullet = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    setBullets(next);
  };

  return (
    <Section id="basics" title="Basics" description="What shoppers see first.">
      <TextField
        name="title"
        label="Title"
        placeholder="e.g. Samsung Galaxy S24, 256GB, Onyx Black"
        maxLength={255}
      />
      <TextField
        name="slug"
        label="URL slug"
        prefix={`${storefrontBaseUrl.replace(/^https?:\/\//, "")}/products/`}
        placeholder="samsung-galaxy-s24-256gb"
        description={
          <span className="flex flex-wrap items-center gap-x-2">
            Changing the slug breaks existing links to this product.
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => setValue("slug", slugify(getValues("title") ?? ""), DIRTY)}
            >
              <Wand2 className="h-3 w-3" />
              Generate from title
            </button>
          </span>
        }
      />
      <TextareaField
        name="description"
        label="Description"
        rows={7}
        placeholder="Materials, sizing, what's in the box…"
      />

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">Key features</span>
          <span className="text-xs text-muted-foreground">
            Press Enter to add another
          </span>
        </div>
        <ul className="space-y-2">
          {rows.map((point, index) => (
            <li key={index} className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60"
              />
              <Input
                id={`bullet-${index}`}
                value={point}
                aria-label={`Feature ${index + 1}`}
                placeholder={index === 0 ? "e.g. 120Hz AMOLED display" : "Another feature"}
                onChange={(event) => updateBullet(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    insertBulletAfter(index);
                  } else if (
                    event.key === "Backspace" &&
                    point === "" &&
                    rows.length > 1
                  ) {
                    event.preventDefault();
                    removeBullet(index);
                    requestAnimationFrame(() =>
                      document.getElementById(`bullet-${Math.max(0, index - 1)}`)?.focus()
                    );
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground"
                onClick={() => removeBullet(index)}
                disabled={rows.length === 1 && point === ""}
                aria-label={`Remove feature ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => insertBulletAfter(rows.length - 1)}
        >
          <Plus className="h-4 w-4" />
          Add feature
        </Button>
      </div>
    </Section>
  );
}

export function MediaSection() {
  const { control, setValue } = useFormContext<ProductFormValues>();
  const images = useWatch({ control, name: "images" }) ?? [];

  const setImages = (next: string[]) => setValue("images", next, DIRTY);

  const move = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setImages(next);
  };

  return (
    <Section
      id="media"
      title="Images"
      description="Drop a file on a tile to replace it. The first image is the cover. JPEG, PNG or WebP up to 2MB."
    >
      <FormField
        control={control}
        name="images"
        render={() => (
          <FormItem>
            <ul className="flex flex-wrap gap-3">
              {images.map((image, index) => (
                <li key={`${index}-${image}`} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <ImageUploadCell
                      value={image || null}
                      bucket="products"
                      size="lg"
                      alt={`Product image ${index + 1}`}
                      onSave={async (path) => {
                        const next = [...images];
                        if (path === null) next.splice(index, 1);
                        else next[index] = path;
                        setImages(next.filter(Boolean));
                        return { success: true };
                      }}
                      className={cn(index === 0 && "ring-2 ring-primary ring-offset-2 ring-offset-card")}
                    />
                    {index === 0 && (
                      <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Cover
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      aria-label={`Move image ${index + 1} left`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === images.length - 1}
                      onClick={() => move(index, index + 1)}
                      aria-label={`Move image ${index + 1} right`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
              <li>
                <ImageUploadCell
                  key={images.length}
                  value={null}
                  bucket="products"
                  size="lg"
                  alt="Add image"
                  onSave={async (path) => {
                    if (path) setImages([...images, path]);
                    return { success: true };
                  }}
                />
              </li>
            </ul>
            <FormMessage />
          </FormItem>
        )}
      />
    </Section>
  );
}

export function PricingSection() {
  const { control } = useFormContext<ProductFormValues>();
  const [listPrice, finalPrice] = useWatch({
    control,
    name: ["listPrice", "finalPrice"],
  });

  const discount =
    listPrice && finalPrice && listPrice > finalPrice
      ? Math.round(((listPrice - finalPrice) / listPrice) * 100)
      : 0;
  const finalAboveList = Boolean(listPrice && finalPrice && finalPrice > listPrice);

  return (
    <Section id="pricing" title="Pricing" description="All prices in EGP.">
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          name="finalPrice"
          label="Selling price"
          suffix="EGP"
          placeholder="0.00"
          description="What shoppers pay."
        />
        <NumberField
          name="listPrice"
          label="Compare-at price"
          suffix="EGP"
          placeholder="Optional"
          description="Shown struck through (MSRP)."
        />
        <NumberField
          name="basePrice"
          label="Base price"
          suffix="EGP"
          placeholder="0.00"
          description="Seller's price before fees."
        />
      </div>
      {discount > 0 && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Shoppers see {discount}% off.
        </p>
      )}
      {finalAboveList && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          The selling price is higher than the compare-at price, so no discount is shown.
        </p>
      )}
    </Section>
  );
}

export function InventorySection() {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const variants = useWatch({ control, name: "variants" }) ?? [];
  const variantStock = variants.reduce((sum, v) => sum + (Number(v?.stock) || 0), 0);

  return (
    <Section
      id="inventory"
      title="Inventory"
      description={
        fields.length
          ? `${fields.length} variant${fields.length === 1 ? "" : "s"}, ${variantStock} in stock in total.`
          : "Add variants when the product comes in sizes, colors or capacities."
      }
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              title: "",
              sku: "",
              price: undefined as unknown as number,
              stock: 0,
              position: fields.length + 1,
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add variant
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="sku" label="SKU" placeholder="Optional" />
        <NumberField
          name="quantity"
          label="Quantity"
          step={1}
          placeholder="0"
          description={fields.length ? "Variant stock is tracked separately below." : undefined}
        />
      </div>

      {fields.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Variant</th>
                <th className="px-3 py-2 font-medium">Option</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="w-32 px-3 py-2 font-medium">Price (EGP)</th>
                <th className="w-24 px-3 py-2 font-medium">Stock</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-t align-top">
                  <VariantCell name={`variants.${index}.title`} placeholder="Black / 128GB" />
                  <VariantCell name={`variants.${index}.option1`} placeholder="Color" />
                  <VariantCell name={`variants.${index}.sku`} placeholder="SKU" />
                  <VariantCell name={`variants.${index}.price`} placeholder="0.00" numeric />
                  <VariantCell name={`variants.${index}.stock`} placeholder="0" numeric />
                  <td className="px-1 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                      aria-label={`Remove variant ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function VariantCell({
  name,
  placeholder,
  numeric,
}: {
  name:
    | `variants.${number}.title`
    | `variants.${number}.option1`
    | `variants.${number}.sku`
    | `variants.${number}.price`
    | `variants.${number}.stock`;
  placeholder: string;
  numeric?: boolean;
}) {
  const { control } = useFormContext<ProductFormValues>();
  return (
    <td className="px-2 py-2">
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <FormItem className="space-y-1">
            <Input
              ref={field.ref}
              name={field.name}
              onBlur={field.onBlur}
              type={numeric ? "number" : "text"}
              step={numeric ? "any" : undefined}
              aria-invalid={Boolean(fieldState.error)}
              aria-label={placeholder}
              placeholder={placeholder}
              className={cn("h-8", numeric && "tabular-nums")}
              value={(field.value as string | number | undefined) ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                field.onChange(numeric ? (raw === "" ? undefined : Number(raw)) : raw);
              }}
            />
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </td>
  );
}

export function ShippingSection() {
  return (
    <Section id="shipping" title="Shipping" description="How the order gets to the customer.">
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField name="fulfillmentType" label="Fulfilled by" options={FULFILLMENT_OPTIONS} />
        <NumberField name="handlingTime" label="Handling time" suffix="days" step={1} />
        <NumberField name="maxOrderQuantity" label="Max per order" step={1} placeholder="No limit" />
      </div>
      <SwitchRow
        name="freeDelivery"
        label="Free delivery"
        hint="The customer pays no shipping for this product."
      />
      <div className="space-y-2 border-t pt-4">
        <p className="text-sm font-medium">Package size and weight</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumberField name="dimensions.length" label="Length" suffix="cm" />
          <NumberField name="dimensions.width" label="Width" suffix="cm" />
          <NumberField name="dimensions.height" label="Height" suffix="cm" />
          <NumberField name="dimensions.weight" label="Weight" suffix="kg" />
        </div>
      </div>
    </Section>
  );
}

export function SeoSection({ storefrontBaseUrl }: { storefrontBaseUrl: string }) {
  const { control } = useFormContext<ProductFormValues>();
  const [title, slug, description, metaTitle, metaDescription] = useWatch({
    control,
    name: ["title", "slug", "description", "metaTitle", "metaDescription"],
  });

  const previewTitle = metaTitle || title || "Product title";
  const previewDescription =
    metaDescription || description || "Add a description to control how this product appears in search results.";

  return (
    <Section
      id="seo"
      title="Search engine listing"
      description="Leave blank to use the product title and description."
    >
      <div className="rounded-lg border bg-background p-4" aria-label="Search result preview">
        <p className="truncate text-xs text-muted-foreground">
          {storefrontBaseUrl.replace(/^https?:\/\//, "")} › products › {slug || "…"}
        </p>
        <p className="mt-1 line-clamp-1 text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
          {previewTitle}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{previewDescription}</p>
      </div>
      <TextField name="metaTitle" label="Page title" maxLength={60} placeholder={title} />
      <TextareaField
        name="metaDescription"
        label="Meta description"
        maxLength={160}
        rows={3}
      />
    </Section>
  );
}
