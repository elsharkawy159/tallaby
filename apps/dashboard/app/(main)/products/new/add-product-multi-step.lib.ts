import type { UseFormReturn } from "react-hook-form";
import type { AddProductFormData } from "./add-product.schema";
import { STEP_VALIDATION_FIELDS } from "./add-product-multi-step.constants";

export const isStepValid = async (
  stepIndex: number,
  form: UseFormReturn<AddProductFormData>
): Promise<boolean> => {
  const stepFields = Object.values(STEP_VALIDATION_FIELDS)[stepIndex];
  if (!stepFields) return false;

  try {
    const result = await form.trigger(stepFields as any);
    return result;
  } catch {
    return false;
  }
};

export const getStepFields = (stepId: string): string[] => {
  return STEP_VALIDATION_FIELDS[stepId] || [];
};
