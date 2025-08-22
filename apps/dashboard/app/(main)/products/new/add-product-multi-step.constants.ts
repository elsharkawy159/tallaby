import type { StepperStep } from "@workspace/ui/components/stepper";

export const FORM_STEPS: StepperStep[] = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Product name, description, and category",
  },
  {
    id: "images",
    title: "Product Images",
    description: "Upload product photos",
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Set base and listing prices",
  },
  {
    id: "inventory",
    title: "Inventory & Stock",
    description: "Manage stock levels and SKU",
  },
  {
    id: "settings",
    title: "Product Settings",
    description: "Condition, fulfillment, and status",
  },
  {
    id: "physical",
    title: "Physical Properties",
    description: "Weight, dimensions, and tax class",
  },
  {
    id: "seo",
    title: "SEO & Marketing",
    description: "Search engine optimization",
  },
];

export const STEP_VALIDATION_FIELDS: Record<string, string[]> = {
  basic: [
    "title",
    "slug",
    "description",
    "bulletPoints",
    "mainCategoryId",
    "brandId",
  ],
  images: ["images"],
  pricing: ["basePrice", "listPrice", "price", "salePrice"],
  inventory: ["sku", "stockQuantity", "maxOrderQuantity", "restockDate"],
  settings: [
    "condition",
    "fulfillmentType",
    "handlingTime",
    "isActive",
    "isAdult",
    "isPlatformChoice",
    "isBestSeller",
    "isFeatured",
  ],
  physical: ["weight", "dimensions", "taxClass", "notes"],
  seo: ["metaTitle", "metaDescription", "metaKeywords", "searchKeywords"],
};
