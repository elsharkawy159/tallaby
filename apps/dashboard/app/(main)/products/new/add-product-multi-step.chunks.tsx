import React from "react";
import type { CategoryOption, BrandOption } from "./add-product.schema";
import {
  BasicInformationStep,
  ProductImagesStep,
  PricingStep,
  InventoryStep,
  ProductSettingsStep,
  PhysicalPropertiesStep,
  SeoMarketingStep,
} from "./add-product-steps";

interface StepRendererProps {
  currentStep: number;
  categories?: CategoryOption[];
  brands?: BrandOption[];
}

export const StepRenderer = ({
  currentStep,
  categories,
  brands,
}: StepRendererProps) => {
  switch (currentStep) {
    case 0:
      return (
        <BasicInformationStep
          categories={categories || []}
          brands={brands || []}
        />
      );
    case 1:
      return <ProductImagesStep />;
    case 2:
      return <PricingStep />;
    case 3:
      return <InventoryStep />;
    case 4:
      return <ProductSettingsStep />;
    case 5:
      return <PhysicalPropertiesStep />;
    case 6:
      return <SeoMarketingStep />;
    default:
      return (
        <BasicInformationStep
          categories={categories || []}
          brands={brands || []}
        />
      );
  }
};
