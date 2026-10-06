"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { cn } from "@workspace/ui/lib/utils";

import { productSchema } from "../../_lib/validations/product-schema";
import { updateProduct } from "@/actions/products";
import type {
  ProductFormBrandOption,
  ProductFormCategoryOption,
} from "@/actions/products-list";
import {
  BasicsSection,
  InventorySection,
  MediaSection,
  PricingSection,
  SeoSection,
  ShippingSection,
} from "./product-form/main-sections";
import {
  MerchandisingPanel,
  OrganizationPanel,
  StatusPanel,
} from "./product-form/sidebar-panels";
import { STATUS_OPTIONS, type ProductFormValues } from "./product-form/types";

interface ProductFormProps {
  productId: string;
  initialData: Partial<ProductFormValues>;
  brands: ProductFormBrandOption[];
  categories: ProductFormCategoryOption[];
  storefrontBaseUrl: string;
}

const DEFAULT_VALUES: ProductFormValues = {
  title: "",
  slug: "",
  description: "",
  bulletPoints: [],
  brandId: "",
  categoryId: "",
  sku: "",
  basePrice: 0,
  listPrice: undefined,
  finalPrice: 0,
  quantity: 0,
  images: [],
  status: "pending",
  isPlatformChoice: false,
  isBestSeller: false,
  isFeatured: false,
  isTrending: false,
  isSeasonal: false,
  sponsored: false,
  freeDelivery: false,
  condition: "new",
  conditionDescription: "",
  fulfillmentType: "seller_fulfilled",
  handlingTime: 1,
  maxOrderQuantity: undefined,
  taxClass: "standard",
  dimensions: undefined,
  variants: [],
  metaTitle: "",
  metaDescription: "",
  locale: "en",
};

/** Count leaf errors, so "Fix 3 fields" matches what the admin sees. */
function countErrors(errors: FieldErrors): number {
  return Object.values(errors).reduce<number>((total, error) => {
    if (!error) return total;
    if ("message" in error && typeof error.message === "string") return total + 1;
    return total + countErrors(error as FieldErrors);
  }, 0);
}

export function ProductForm({
  productId,
  initialData,
  brands,
  categories,
  storefrontBaseUrl,
}: ProductFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as unknown as Resolver<ProductFormValues>,
    defaultValues: { ...DEFAULT_VALUES, ...initialData },
  });
  const { isDirty, isSubmitting } = form.formState;

  const title = useWatch({ control: form.control, name: "title" });
  const savedStatus = form.formState.defaultValues?.status ?? "pending";
  const savedSlug = form.formState.defaultValues?.slug;
  const savedStatusLabel =
    STATUS_OPTIONS.find((option) => option.value === savedStatus)?.label ?? savedStatus;

  const onValid = async (data: ProductFormValues) => {
    const bulletPoints = (data.bulletPoints ?? [])
      .map((point) => point.trim())
      .filter(Boolean);
    const images = (data.images ?? []).filter(Boolean);

    const result = await updateProduct(productId, {
      title: data.title,
      slug: data.slug,
      description: data.description,
      bulletPoints,
      // "" clears the brand (the action stores it as null).
      brandId: data.brandId ?? "",
      categoryId: data.categoryId,
      sku: data.sku,
      basePrice: data.basePrice,
      listPrice: data.listPrice,
      finalPrice: data.finalPrice,
      quantity: data.quantity,
      images,
      status: data.status,
      isPlatformChoice: data.isPlatformChoice,
      isMostSelling: data.isBestSeller,
      isFeatured: data.isFeatured,
      isTrending: data.isTrending,
      isSeasonal: data.isSeasonal,
      sponsored: data.sponsored,
      freeDelivery: data.freeDelivery,
      condition: data.condition,
      conditionDescription: data.conditionDescription,
      fulfillmentType: data.fulfillmentType,
      handlingTime: data.handlingTime,
      maxOrderQuantity: data.maxOrderQuantity,
      taxClass: data.taxClass,
      dimensions: data.dimensions,
      variants: data.variants,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
    });

    if (!result.success) {
      toast.error(result.error || "Couldn't save the product. Try again.");
      return;
    }

    form.reset({ ...data, bulletPoints, images, brandId: data.brandId ?? "" });
    toast.success("Changes saved", {
      action: {
        label: "View product",
        onClick: () => router.push(`/products/${productId}`),
      },
    });
    router.refresh();
  };

  const onInvalid = (errors: FieldErrors<ProductFormValues>) => {
    const count = countErrors(errors);
    toast.error(
      count === 1 ? "Fix the highlighted field to save" : `Fix the ${count} highlighted fields to save`
    );
    requestAnimationFrame(() => {
      const target = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    });
  };

  const save = useCallback(
    () => form.handleSubmit(onValid, onInvalid)(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, productId]
  );

  // ⌘S / Ctrl+S saves without leaving the keyboard.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!form.formState.isSubmitting) void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [form, save]);

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const storefrontUrl = savedSlug ? `${storefrontBaseUrl}/products/${savedSlug}` : null;

  return (
    <Form {...form}>
      <form
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <header
          className={cn(
            "sticky top-0 z-20 -mx-3 -mt-3 mb-4 border-b bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 sm:-mt-4 sm:px-4 md:-mx-6 md:-mt-6 md:mb-6 md:px-6",
            isDirty && "border-b-amber-500/60"
          )}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="shrink-0">
              <Link href={`/products/${productId}`} aria-label="Back to product">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold sm:text-lg">
                {title || "Untitled product"}
              </p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {isDirty ? (
                  <span className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Unsaved changes
                  </span>
                ) : (
                  <span>Saved as {savedStatusLabel.toLowerCase()}</span>
                )}
                {storefrontUrl && savedStatus === "active" && (
                  <a
                    href={storefrontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    View in store
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!isDirty || isSubmitting}
                onClick={() => form.reset()}
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isSubmitting}
                title="Save (Ctrl+S)"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4 md:space-y-6">
            <BasicsSection storefrontBaseUrl={storefrontBaseUrl} />
            <MediaSection />
            <PricingSection />
            <InventorySection />
            <ShippingSection />
            <SeoSection storefrontBaseUrl={storefrontBaseUrl} />
          </div>
          {/* Status and category are the most-edited fields, so on narrow
              screens the sidebar moves above the long main column. */}
          <aside className="order-first space-y-4 md:space-y-6 lg:order-none">
            <StatusPanel />
            <OrganizationPanel categories={categories} brands={brands} />
            <MerchandisingPanel />
          </aside>
        </div>
      </form>
    </Form>
  );
}
