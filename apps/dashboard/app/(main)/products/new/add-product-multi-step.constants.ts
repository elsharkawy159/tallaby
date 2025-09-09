import type { StepperStep } from "@workspace/ui/components/stepper";

export const FORM_STEPS: StepperStep[] = [
  {
    id: "general",
    title: "General",
    description: "Basic info, category, brand, and images",
  },
  {
    id: "listing",
    title: "Listing",
    description: "Pricing, inventory, settings, and dimensions",
  },
  {
    id: "variants-seo",
    title: "Variants & SEO",
    description: "Product variants and SEO settings",
  },
];

export const STEP_VALIDATION_FIELDS: Record<string, string[]> = {
  general: [
    "title",
    "slug",
    "description",
    "bulletPoints",
    "categoryId",
    "brandId",
    "images",
  ],
  listing: [
    "sku",
    "quantity",
    "maxOrderQuantity",
    "condition",
    "fulfillmentType",
    "handlingTime",
    "taxClass",
    "price.base",
    "price.list",
    "price.sale",
    "dimensions.length",
    "dimensions.width",
    "dimensions.height",
    "dimensions.weight",
    "isActive",
    "isPlatformChoice",
    "isMostSelling",
    "isFeatured",
  ],
  "variants-seo": [
    "variants",
    "seo.metaTitle",
    "seo.metaDescription",
    "seo.metaKeywords",
    "seo.searchKeywords",
  ],
};
