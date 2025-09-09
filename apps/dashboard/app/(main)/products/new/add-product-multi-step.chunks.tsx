import React from "react";
import type { CategoryOption, BrandOption } from "./add-product.schema";
import {
  BasicInformationStep as GeneralStep,
  ListingStep,
  VariantsSeoStep,
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
        <GeneralStep categories={categories || []} brands={brands || []} />
      );
    case 1:
      return <ListingStep />;
    case 2:
      return <VariantsSeoStep />;
    default:
      return (
        <GeneralStep categories={categories || []} brands={brands || []} />
      );
  }
};
