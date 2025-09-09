"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AddProductFormData } from "./add-product.schema";
import { addProductFormSchema, defaultValues } from "./add-product.schema";
import { useAddProductFormStore } from "@/stores";

interface UseAddProductFormProps {
  initialData?: any;
  isEditMode?: boolean;
}

export const useAddProductForm = ({
  initialData,
  isEditMode,
}: UseAddProductFormProps) => {
  const { formData: storedFormData, setFormData } = useAddProductFormStore();
  const [isFormDirty, setIsFormDirty] = useState(false);

  const defaultFormValues = initialData || storedFormData || defaultValues;

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  // Watch form changes to track if form is dirty
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === "change" && isEditMode) {
        setIsFormDirty(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditMode]);

  // Restore form data from Zustand store when component mounts
  useEffect(() => {
    if (storedFormData && !initialData) {
      form.reset(storedFormData);
    }
  }, [form, storedFormData, initialData]);

  return {
    form,
    isFormDirty,
    setFormData,
    defaultValues,
  };
};
