import type {
  CategoryOption,
  BrandOption,
} from "./add-product.schema";

export interface AddProductMultiStepProps {
  categories?: CategoryOption[];
  brands?: BrandOption[];
  isEditMode?: boolean;
  productId?: string;
  initialData?: any;
}

export interface StepValidationFields {
  [key: string]: string[];
}
