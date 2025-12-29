import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  defaultValues,
  type AddProductFormData,
} from "@/app/(main)/products/add/add-product.schema";

interface AddProductFormState {
  // Form data
  formData: Partial<AddProductFormData>;

  // Actions
  setFormData: (data: Partial<AddProductFormData>) => void;
  updateFormData: (data: Partial<AddProductFormData>) => void;
  resetForm: () => void;
}

export const useAddProductFormStore = create<AddProductFormState>()(
  persist(
    (set, get) => ({
      // Initial state
      formData: defaultValues,

      // Actions
      setFormData: (data: Partial<AddProductFormData>) => {
        set({ formData: { ...defaultValues, ...data } });
      },

      updateFormData: (data: Partial<AddProductFormData>) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
        }));
      },

      resetForm: () => {
        set({ formData: defaultValues });
      },
    }),
    {
      name: "add-product-form-storage",
      partialize: (state) => ({
        formData: state.formData,
      }),
    }
  )
);
